import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase';
import {
  searchTextbook,
  saveTextbookToFirestore,

  searchTextbookChunks,
  TextbookResult,
} from '../services/textbookService';
import { sendChatMessage, ChatMessage, AIProvider } from '../services/aiService';
import TextbookLibraryPicker from '../components/TextbookLibraryPicker';
import AttachmentMenu from '../components/AttachmentMenu';
import AddTextbookModal from '../components/AddTextbookModal';
import type { TextbookInfo } from '../components/AddTextbookModal';
import { useTextbooks } from '../hooks/useTextbooks';
import type { Message } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TextbookConfirmMessage {
  id: string;
  type: 'textbook-confirm';
  book: TextbookResult;
  timestamp: string;
  dismissed: boolean;
}

type ChatItem = Message | TextbookConfirmMessage;

function isTextbookConfirm(item: ChatItem): item is TextbookConfirmMessage {
  return (item as TextbookConfirmMessage).type === 'textbook-confirm';
}

// ── Constants ─────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hi! I'm your Academic Aide. Ask me anything — concepts, homework, test prep, or study tips.",
    sender: 'assistant',
    timestamp: '',
    isRead: true,
  },
];

const QUICK_REPLIES = [
  "Explain merge sort",
  "Quiz me on this",
  "What's on my schedule?",
  "Help with homework",
];

// Phrases that suggest the user is mentioning a textbook
const TEXTBOOK_TRIGGERS = [
  "i am using",
  "i'm using",
  "my textbook is",
  "we use",
  "the book is",
  "using the book",
];

function extractBookTitle(text: string): string | null {
  const lower = text.toLowerCase();
  for (const trigger of TEXTBOOK_TRIGGERS) {
    const idx = lower.indexOf(trigger);
    if (idx !== -1) {
      const after = text.slice(idx + trigger.length).trim();
      // Take the first ~60 chars or until a sentence boundary
      const match = after.match(/^([^.!?\n]{3,60})/);
      return match ? match[1].trim() : null;
    }
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatItem[]>(INITIAL_MESSAGES);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchingBook, setSearchingBook] = useState(false);
  // Replace pdfBase64 and pdfName with:
  const [activeBookId, setActiveBookId] = useState<string | undefined>(undefined);
  const [activeBookName, setActiveBookName] = useState<string>('');
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider | undefined>(undefined); // undefined = auto
  const { textbooks } = useTextbooks();
  const listRef = useRef<FlatList>(null);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const appendMessage = (msg: ChatItem) =>
    setMessages((prev) => [...prev, msg]);

  // ── Textbook Detector ──────────────────────────────────────────────────────
  const detectAndSearchTextbook = async (text: string) => {
    const title = extractBookTitle(text);
    if (!title) return;

    setSearchingBook(true);
    try {
      const book = await searchTextbook(title);
      if (book) {
        const confirmMsg: TextbookConfirmMessage = {
          id: `tb-confirm-${Date.now()}`,
          type: 'textbook-confirm',
          book,
          timestamp: now(),
          dismissed: false,
        };
        appendMessage(confirmMsg);
      }
    } catch (err) {
      console.error('[ChatScreen] textbook detect error:', err);
    } finally {
      setSearchingBook(false);
    }
  };

  // ── Confirm / dismiss textbook card ───────────────────────────────────────
  const handleTextbookYes = async (confirmId: string, book: TextbookResult) => {
    // Mark card as dismissed first
    setMessages((prev) =>
      prev.map((m) =>
        m.id === confirmId && isTextbookConfirm(m)
          ? { ...m, dismissed: true }
          : m
      )
    );

    if (!user) return;

    try {
      await saveTextbookToFirestore(user.uid, book);
      const successMsg: Message = {
        id: `tb-success-${Date.now()}`,
        text: "Textbook added! I'll use this to help with your course work. 📚",
        sender: 'assistant',
        timestamp: now(),
        isRead: true,
      };
      appendMessage(successMsg);
    } catch (err) {
      console.error('[ChatScreen] saveTextbook error:', err);
      const errMsg: Message = {
        id: `tb-err-${Date.now()}`,
        text: "Hmm, I couldn't save that textbook. Please try again.",
        sender: 'assistant',
        timestamp: now(),
        isRead: true,
      };
      appendMessage(errMsg);
    }
  };

  const handleTextbookNo = (confirmId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === confirmId && isTextbookConfirm(m)
          ? { ...m, dismissed: true }
          : m
      )
    );
  };

  // ── Upload new textbook with metadata ─────────────────────────────────────
  const handleUploadNewTextbook = async (info: TextbookInfo) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const asset = info.asset;
      const safeFilename = info.title.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
      const safeId = info.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const storagePath = `users/${user.uid}/textbooks/${safeFilename}`;

      let downloadUrl = '';
      try {
        const storageRef = ref(storage, storagePath);
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        downloadUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        console.warn('[ChatScreen] Storage upload skipped:', uploadErr);
      }

      const { setDoc, doc: fsDoc, onSnapshot } = await import('firebase/firestore');
      const { db: fsDb } = await import('../firebase');
      
      const docRef = fsDoc(fsDb, 'users', user.uid, 'textbooks', safeId);
      await setDoc(docRef, {
        id: safeId,
        title: info.title,
        course: info.course,
        instructor: info.instructor,
        edition: info.edition,
        isbn: info.isbn,
        authors: info.instructor ? [info.instructor] : [],
        description: '',
        thumbnail: '',
        previewText: '',
        infoLink: downloadUrl,
        storageUrl: downloadUrl,
        storagePath,
        isPdf: true,
        addedAt: new Date().toISOString(),
        extraction_status: 'processing'
      }, { merge: true });

      appendMessage({
        id: `pdf-upload-${Date.now()}`,
        text: `"${info.title}" is being processed. This may take a few moments.`,
        sender: 'assistant',
        timestamp: now(),
        isRead: true,
      });

      // Listen for extraction_status === 'completed'
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.extraction_status === 'completed') {
            unsubscribe();
            setActiveBookId(safeId);
            setActiveBookName(info.title);
            appendMessage({
              id: `pdf-success-${Date.now()}`,
              text: `"${info.title}" processing complete. Ready to use.`,
              sender: 'assistant',
              timestamp: now(),
              isRead: true,
            });
          } else if (data.extraction_status === 'failed') {
            unsubscribe();
            appendMessage({
              id: `pdf-err-${Date.now()}`,
              text: "Sorry, couldn't process that textbook. Please try again.",
              sender: 'assistant',
              timestamp: now(),
              isRead: true,
            });
          }
        }
      }, (err) => {
        console.warn('[ChatScreen] Snapshot listener error:', err);
        unsubscribe();
      });
    } catch (err) {
      console.error('[ChatScreen] upload error:', err);
      appendMessage({
        id: `pdf-err-${Date.now()}`,
        text: "Sorry, couldn't save that textbook. Please try again.",
        sender: 'assistant',
        timestamp: now(),
        isRead: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: now(),
      isRead: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Detect textbook mention in parallel (non-blocking)
    detectAndSearchTextbook(text);

    // Search textbook chunks for relevant context
    let textbookContext: string[] = [];
    if (user && activeBookId) {
      try {
        textbookContext = await searchTextbookChunks(user.uid, activeBookId, text.trim());
      } catch {
        // Silently ignore chunk search errors
      }
    }

    // Call Claude Haiku via aiService
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      // Call AI — Claude by default, GLM if overridden or auto-fallback
      const aiResponse = await sendChatMessage(
        user.uid,
        chatHistory,
        text.trim(),
        textbookContext,
        aiProvider
      );

      // If auto-switched provider, inject a system notice and lock for the session
      if (aiResponse.switchNotice) {
        const noticeMsg: Message = {
          id: (Date.now() + 0.5).toString(),
          text: aiResponse.switchNotice,
          sender: 'assistant',
          timestamp: now(),
          isRead: true,
          isSystemNotice: true,
        };
        setMessages((prev) => [...prev, noticeMsg]);
        // Lock to whichever provider took over so we don't retry the failed one each message
        setAiProvider(aiResponse.provider);
      }

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        sender: 'assistant',
        timestamp: now(),
        isRead: false,
      };
      setMessages((prev) => [...prev, reply]);

      // Update conversation history for context
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: text.trim() },
        { role: 'assistant', content: aiResponse.text },
      ]);
    } catch (err) {
      console.error('[ChatScreen] Claude API error:', err);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        sender: 'assistant',
        timestamp: now(),
        isRead: false,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Render textbook confirmation card ──────────────────────────────────────
  const renderTextbookConfirm = (item: TextbookConfirmMessage) => {
    if (item.dismissed) return null;

    return (
      <View style={styles.tbCardWrapper}>
        <View style={[styles.tbCard, Shadows.card]}>
          <Text style={styles.tbCardHeading}>📚 Found a textbook!</Text>
          <View style={styles.tbCardBody}>
            {item.book.thumbnail ? (
              <Image
                source={{ uri: item.book.thumbnail }}
                style={styles.tbThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.tbThumb, styles.tbThumbPlaceholder]}>
                <Ionicons name="book" size={28} color={Colors.primary} />
              </View>
            )}
            <View style={styles.tbCardInfo}>
              <Text style={styles.tbCardTitle} numberOfLines={3}>
                {item.book.title}
              </Text>
              {item.book.authors.length > 0 && (
                <Text style={styles.tbCardAuthors} numberOfLines={1}>
                  {item.book.authors.join(', ')}
                </Text>
              )}
              <Text style={styles.tbCardPrompt}>Add this textbook?</Text>
              <View style={styles.tbCardActions}>
                <TouchableOpacity
                  style={styles.tbBtnYes}
                  onPress={() => handleTextbookYes(item.id, item.book)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.tbBtnYesText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tbBtnNo}
                  onPress={() => handleTextbookNo(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.tbBtnNoText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {item.book.description ? (
            <Text style={styles.tbCardDesc} numberOfLines={2}>
              {item.book.description}
            </Text>
          ) : null}
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  // ── Render single chat item ────────────────────────────────────────────────
  const renderItem = ({ item }: { item: ChatItem }) => {
    if (isTextbookConfirm(item)) {
      return renderTextbookConfirm(item);
    }

    const msg = item as Message;
    const isUser = msg.sender === 'user';

    // System notice (AI provider switch)
    if (msg.isSystemNotice) {
      return (
        <View style={styles.systemNoticeWrapper}>
          <Ionicons name="swap-horizontal" size={13} color="#f59e0b" />
          <Text style={styles.systemNoticeText}>{msg.text}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.messageWrapperRight : styles.messageWrapperLeft,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Ionicons name="school" size={14} color={Colors.textOnPrimary} />
          </View>
        )}
        <View style={styles.bubbleColumn}>
          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
              ]}
            >
              {msg.text}
            </Text>
          </View>
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.timestampRight : styles.timestampLeft,
            ]}
          >
            {msg.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Ionicons name="school" size={18} color={Colors.textOnPrimary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Academic Aide</Text>
          <Text style={styles.headerSub}>Your AI study assistant</Text>
        </View>
        {/* AI Provider Toggle */}
        <TouchableOpacity
          style={styles.providerToggle}
        >
          <Text style={styles.providerToggleText}>Gemini</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.messageWrapperLeft, { marginBottom: 8 }]}>
                <View style={styles.assistantAvatar}>
                  <Ionicons
                    name="school"
                    size={14}
                    color={Colors.textOnPrimary}
                  />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAssistant,
                    styles.typingBubble,
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            ) : searchingBook ? (
              <View style={[styles.messageWrapperLeft, { marginBottom: 8 }]}>
                <View style={styles.assistantAvatar}>
                  <Ionicons
                    name="search"
                    size={14}
                    color={Colors.textOnPrimary}
                  />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAssistant,
                    styles.typingBubble,
                  ]}
                >
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Looking up textbook...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* PDF loaded indicator */}
        {activeBookId && (
          <View style={styles.pdfIndicator}>
            <Ionicons name="document-text" size={14} color={Colors.primary} />
            <Text style={styles.pdfIndicatorText} numberOfLines={1}>
              Active Book: {activeBookName || 'document'}
            </Text>
            <TouchableOpacity onPress={() => { setActiveBookId(undefined); setActiveBookName(''); }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Replies */}
        <View style={styles.quickReplies}>
          <FlatList
            horizontal
            data={QUICK_REPLIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickReplyChip}
                onPress={() => sendMessage(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickReplyText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Attachment menu */}
        <AttachmentMenu
          visible={attachMenuVisible}
          onClose={() => setAttachMenuVisible(false)}
          onTextbooks={() => setLibraryVisible(true)}
          onUploadNew={() => setUploadModalVisible(true)}
        />

        {/* Textbook Library Picker */}
        <TextbookLibraryPicker
          visible={libraryVisible}
          onClose={() => setLibraryVisible(false)}
          onSelect={(base64, title) => {
            // Note: In the RAG model, we don't load base64. We just need the bookId.
            // Assuming the LibraryPicker passes back an ID if we adapt it later,
            // but for now, we just use the safe title as the ID for consistency.
            const safeId = title.replace(/[^a-zA-Z0-9_-]/g, '_');
            setActiveBookId(safeId);
            setActiveBookName(title);
            appendMessage({
              id: `lib-loaded-${Date.now()}`,
              text: `"${title}" loaded. Ask me anything about it.`,
              sender: 'assistant',
              timestamp: now(),
              isRead: true,
            });
          }}
        />

        {/* Upload new textbook modal */}
        <AddTextbookModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          onSubmit={handleUploadNewTextbook}
          existingTitles={textbooks.map((t) => t.title)}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          {/* + button */}
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => setAttachMenuVisible(true)}
            disabled={isUploading}
            activeOpacity={0.75}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="add-circle" size={32} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={
                inputText.trim() ? Colors.textOnPrimary : Colors.textMuted
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerAction: {
    padding: 4,
  },
  providerToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
  },
  providerToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  systemNoticeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
    marginHorizontal: 24,
    gap: 6,
  },
  systemNoticeText: {
    fontSize: 12,
    color: '#92400e',
    flexShrink: 1,
  },
  messageList: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '82%',
    gap: 8,
  },
  messageWrapperLeft: {
    alignSelf: 'flex-start',
  },
  messageWrapperRight: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  bubbleColumn: {
    flex: 1,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: Colors.bubbleOutgoing,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.bubbleIncoming,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: Typography.fontSizeMD,
    lineHeight: Typography.fontSizeMD * 1.5,
  },
  bubbleTextUser: {
    color: Colors.bubbleTextOutgoing,
  },
  bubbleTextAssistant: {
    color: Colors.bubbleTextIncoming,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  timestampLeft: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  timestampRight: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
  },
  pdfIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pdfIndicatorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as any,
  },
  quickReplies: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  quickReplyText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightMedium,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
    backgroundColor: Colors.background,
  },
  plusButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceMid,
  },

  // ── Textbook confirm card ──────────────────────────────────────────────────
  tbCardWrapper: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginBottom: 16,
    marginLeft: 4,
  },
  tbCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  tbCardHeading: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
    marginBottom: 8,
  },
  tbCardBody: {
    flexDirection: 'row',
    gap: 12,
  },
  tbThumb: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceMid,
    flexShrink: 0,
  },
  tbThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbCardInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  tbCardTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSizeMD * 1.4,
    marginBottom: 3,
  },
  tbCardAuthors: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tbCardPrompt: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tbCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tbBtnYes: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tbBtnYesText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  tbBtnNo: {
    backgroundColor: Colors.surfaceMid,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tbBtnNoText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
  },
  tbCardDesc: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 8,
    lineHeight: Typography.fontSizeXS * 1.5,
  },
});
