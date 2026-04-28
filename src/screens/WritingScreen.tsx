import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage } from '../services/aiService';

type WritingMode = 'essay' | 'grammar' | 'outline' | 'citation';

interface ModeConfig {
  key: WritingMode;
  label: string;
  placeholder: string;
  prefix: string;
}

const MODES: ModeConfig[] = [
  {
    key: 'essay',
    label: 'Essay Feedback',
    placeholder: 'Paste your essay here for detailed feedback on structure, argument, and style...',
    prefix: '[ESSAY FEEDBACK MODE] Analyze this essay:',
  },
  {
    key: 'grammar',
    label: 'Grammar Check',
    placeholder: 'Paste your text here to check for grammar, spelling, and punctuation errors...',
    prefix: '[GRAMMAR CHECK MODE] Check grammar:',
  },
  {
    key: 'outline',
    label: 'Outline Help',
    placeholder: 'Describe your essay topic or thesis to get a structured outline...',
    prefix: '[OUTLINE HELP MODE] Create an outline for:',
  },
  {
    key: 'citation',
    label: 'Citation Help',
    placeholder: 'Describe what you need to cite (source type, author, title, date, URL) and the citation style (APA, MLA, Chicago)...',
    prefix: '[CITATION HELP MODE] Help with citations:',
  },
];

export default function WritingScreen() {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<WritingMode>('essay');
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const currentMode = MODES.find((m) => m.key === selectedMode)!;

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    if (!user) return;

    setLoading(true);
    setResponse('');
    try {
      const message = `${currentMode.prefix} ${inputText.trim()}`;
      const result = await sendChatMessage(user.uid, [], message);
      setResponse(result);
    } catch (err: any) {
      setResponse(`Error: ${err?.message ?? 'Something went wrong. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setResponse('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Writing Assistant</Text>
              <Text style={styles.headerSubtitle}>AI-powered feedback for your writing</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="create" size={22} color={Colors.primary} />
            </View>
          </View>

          {/* Mode Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeTabs}
          >
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[styles.modeTab, selectedMode === mode.key && styles.modeTabActive]}
                onPress={() => {
                  setSelectedMode(mode.key);
                  setResponse('');
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    selectedMode === mode.key && styles.modeTabTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Text Input Area */}
          <View style={[styles.inputCard, Shadows.card]}>
            <TextInput
              style={styles.textInput}
              placeholder={currentMode.placeholder}
              placeholderTextColor={Colors.textMuted}
              multiline
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
              autoCorrect={false}
            />
            <Text style={styles.charCount}>{inputText.length} characters</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.analyzeBtn, (!inputText.trim() || loading) && styles.analyzeBtnDisabled]}
              onPress={handleAnalyze}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color={Colors.textOnPrimary} />
              )}
              <Text style={styles.analyzeBtnText}>{loading ? 'Analyzing...' : 'Analyze'}</Text>
            </TouchableOpacity>
          </View>

          {/* Response Area */}
          {(response.length > 0 || loading) && (
            <View style={[styles.responseCard, Shadows.card]}>
              <View style={styles.responseHeader}>
                <View style={styles.responseHeaderLeft}>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                  <Text style={styles.responseHeaderTitle}>
                    {currentMode.label} Results
                  </Text>
                </View>
                {response.length > 0 && (
                  <TouchableOpacity onPress={() => setResponse('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle-outline" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.responseLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.responseLoadingText}>Analyzing your text...</Text>
                </View>
              ) : (
                <Text style={styles.responseText}>{response}</Text>
              )}
            </View>
          )}

          {/* Empty State */}
          {!response && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Ready to help</Text>
              <Text style={styles.emptySubtitle}>
                Select a mode, paste your text, and tap Analyze
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabs: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  modeTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMid,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.textOnPrimary,
  },
  inputCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    minHeight: 160,
    lineHeight: Typography.fontSizeMD * Typography.lineHeightNormal,
  },
  charCount: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  analyzeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  analyzeBtnDisabled: {
    opacity: 0.5,
  },
  analyzeBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
  responseCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  responseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  responseHeaderTitle: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  responseLoading: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  responseLoadingText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
  },
  responseText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSizeMD * Typography.lineHeightRelaxed,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.section,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.fontSizeMD * Typography.lineHeightNormal,
  },
});
