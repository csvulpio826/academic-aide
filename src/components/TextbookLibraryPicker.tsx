import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../firebase';
import { useTextbooks } from '../hooks/useTextbooks';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../theme';
import type { StoredTextbook } from '../hooks/useTextbooks';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (base64: string, title: string) => void;
}

export default function TextbookLibraryPicker({ visible, onClose, onSelect }: Props) {
  const { textbooks, loading } = useTextbooks();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pdfBooks = textbooks.filter((b) => b.isPdf && (b.storageUrl || b.storagePath));

  const readBase64FromUri = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleReupload = async (book: StoredTextbook) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      setLoadingId(book.id);
      const base64 = await readBase64FromUri(result.assets[0].uri);
      onSelect(base64, book.title);
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Could not read PDF file.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSelect = async (book: StoredTextbook) => {
    if (loadingId) return;
    setLoadingId(book.id);

    try {
      // Try Storage URL first
      let downloadUrl = book.storageUrl || book.infoLink;

      if (!downloadUrl && book.storagePath) {
        try {
          const ref = storageRef(storage, book.storagePath);
          downloadUrl = await getDownloadURL(ref);
        } catch {
          downloadUrl = '';
        }
      }

      if (downloadUrl) {
        try {
          const base64 = await readBase64FromUri(downloadUrl);
          onSelect(base64, book.title);
          onClose();
          return;
        } catch {
          // Fall through to re-upload prompt
        }
      }

      // Storage not available (Expo Go CORS) — ask user to pick file locally
      setLoadingId(null);
      Alert.alert(
        'Pick File Locally',
        `Storage isn't accessible in Expo Go. Pick "${book.title}" from your device to load it.`,
        [
          { text: 'Pick File', onPress: () => handleReupload(book) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      console.warn('[TextbookLibraryPicker] load error:', err);
      setLoadingId(null);
      Alert.alert(
        'Pick File Locally',
        `Pick "${book.title}" from your device to load it.`,
        [
          { text: 'Pick File', onPress: () => handleReupload(book) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>My Textbook Library</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : pdfBooks.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="library-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No textbooks saved yet</Text>
            <Text style={styles.emptyBody}>
              Upload a PDF in chat and it will appear here for future sessions.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pdfBooks}
            keyExtractor={(b) => b.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.bookCard, Shadows.card]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
                disabled={!!loadingId}
              >
                <View style={styles.bookIcon}>
                  <Ionicons name="document-text" size={24} color={Colors.primary} />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.bookMeta}>
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </Text>
                </View>
                {loadingId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceDark,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  emptyBody: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: 14,
    gap: 12,
  },
  bookIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  bookMeta: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
