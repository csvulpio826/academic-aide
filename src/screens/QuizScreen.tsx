import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage } from '../services/aiService';

// ── Types ─────────────────────────────────────────────────────────────────────

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type QuizPhase = 'setup' | 'loading' | 'question' | 'summary';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10, 15];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: Colors.success,
  Medium: Colors.warning,
  Hard: Colors.danger,
};

const ENCOURAGEMENT: Record<string, string> = {
  perfect: "Perfect score! You've mastered this topic! 🏆",
  great: "Great work! You really know your stuff! ⭐",
  good: "Good effort! Keep reviewing and you'll get there! 📚",
  keep_going: "Keep studying — practice makes perfect! 💪",
};

function getEncouragement(correct: number, total: number): string {
  const pct = correct / total;
  if (pct === 1) return ENCOURAGEMENT.perfect;
  if (pct >= 0.8) return ENCOURAGEMENT.great;
  if (pct >= 0.6) return ENCOURAGEMENT.good;
  return ENCOURAGEMENT.keep_going;
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function parseQuizResponse(raw: string): QuizQuestion[] {
  const cleaned = stripMarkdownFences(raw);
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Not an array');
  return parsed as QuizQuestion[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuizScreen() {
  const { user } = useAuth();

  // Setup state
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [questionCount, setQuestionCount] = useState(5);

  // Quiz state
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = isAnswered && selectedAnswer === currentQuestion?.correct;

  // ── Actions ────────────────────────────────────────────────────────────────

  const generateQuiz = async () => {
    if (!topic.trim() || !user) return;
    setPhase('loading');
    setErrorMsg('');

    try {
      const message =
        `Generate exactly ${questionCount} multiple choice questions about '${topic.trim()}' at ${difficulty} difficulty. ` +
        `Return ONLY a JSON array: [{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct": "A", "explanation": "..."}]. ` +
        `No markdown, no other text, just the JSON array.`;

      const raw = await sendChatMessage(user.uid, [], message);
      const parsed = parseQuizResponse(raw);

      if (parsed.length === 0) throw new Error('No questions returned');

      setQuestions(parsed);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setPhase('question');
    } catch (err: any) {
      setErrorMsg(
        err?.message?.includes('JSON')
          ? 'Could not parse quiz. Try a different topic or try again.'
          : err?.message ?? 'Something went wrong. Please try again.'
      );
      setPhase('setup');
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (isAnswered) return;
    const letter = option.charAt(0); // "A", "B", "C", "D"
    setSelectedAnswer(letter);
    if (letter === currentQuestion.correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('summary');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  const handleTryAgain = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setPhase('question');
  };

  const handleNewQuiz = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setTopic('');
  };

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const getOptionStyle = (option: string) => {
    if (!isAnswered) return styles.optionChip;
    const letter = option.charAt(0);
    if (letter === currentQuestion.correct) return [styles.optionChip, styles.optionCorrect];
    if (letter === selectedAnswer) return [styles.optionChip, styles.optionWrong];
    return [styles.optionChip, styles.optionDimmed];
  };

  const getOptionTextStyle = (option: string) => {
    if (!isAnswered) return styles.optionText;
    const letter = option.charAt(0);
    if (letter === currentQuestion.correct) return [styles.optionText, styles.optionTextCorrect];
    if (letter === selectedAnswer) return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, styles.optionTextDimmed];
  };

  // ── Phases ─────────────────────────────────────────────────────────────────

  const renderSetup = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quiz Me</Text>
          <Text style={styles.headerSubtitle}>Test your knowledge on any topic</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="help-circle" size={22} color={Colors.primary} />
        </View>
      </View>

      {/* Topic Input */}
      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.sectionLabel}>Topic</Text>
        <TextInput
          style={styles.topicInput}
          placeholder="What topic should I quiz you on?"
          placeholderTextColor={Colors.textMuted}
          value={topic}
          onChangeText={setTopic}
          returnKeyType="done"
        />
      </View>

      {/* Difficulty */}
      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.sectionLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                difficulty === d && { backgroundColor: DIFFICULTY_COLORS[d] },
              ]}
              onPress={() => setDifficulty(d)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  difficulty === d && styles.chipTextActive,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Question Count */}
      <View style={[styles.card, Shadows.card]}>
        <Text style={styles.sectionLabel}>Number of Questions</Text>
        <View style={styles.chipRow}>
          {QUESTION_COUNTS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.chip,
                questionCount === count && styles.chipActive,
              ]}
              onPress={() => setQuestionCount(count)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  questionCount === count && styles.chipTextActive,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Error */}
      {errorMsg.length > 0 && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateBtn, !topic.trim() && styles.generateBtnDisabled]}
        onPress={generateQuiz}
        disabled={!topic.trim()}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles-outline" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.generateBtnText}>Generate Quiz</Text>
      </TouchableOpacity>

      {/* Empty Hint */}
      <View style={styles.emptyState}>
        <Ionicons name="school-outline" size={52} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Ready to quiz you</Text>
        <Text style={styles.emptySubtitle}>
          Enter any topic and choose your difficulty level to get started
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderLoading = () => (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingTitle}>Generating your quiz...</Text>
      <Text style={styles.loadingSubtitle}>
        Creating {questionCount} {difficulty.toLowerCase()} questions about "{topic}"
      </Text>
    </View>
  );

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const progress = (currentIndex + 1) / questions.length;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quiz Me</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: DIFFICULTY_COLORS[difficulty] + '20' }]}>
            <Text style={[styles.difficultyBadgeText, { color: DIFFICULTY_COLORS[difficulty] }]}>
              {difficulty}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.scoreLabel}>Score: {score}/{currentIndex + (isAnswered ? 1 : 0)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Question Card */}
        <View style={[styles.questionCard, Shadows.card]}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={getOptionStyle(option)}
              onPress={() => handleSelectAnswer(option)}
              disabled={isAnswered}
              activeOpacity={0.8}
            >
              <Text style={getOptionTextStyle(option)}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback */}
        {isAnswered && (
          <View
            style={[
              styles.feedbackCard,
              isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={isCorrect ? Colors.success : Colors.danger}
              />
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: isCorrect ? Colors.success : Colors.danger },
                ]}
              >
                {isCorrect ? 'Correct!' : `Incorrect — Answer: ${currentQuestion.correct}`}
              </Text>
            </View>
            <Text style={styles.feedbackExplanation}>{currentQuestion.explanation}</Text>
          </View>
        )}

        {/* Next Button */}
        {isAnswered && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderSummary = () => {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Results</Text>
        </View>

        {/* Score Card */}
        <View style={[styles.scoreCard, Shadows.cardHeavy]}>
          <Text style={styles.scorePct}>{pct}%</Text>
          <Text style={styles.scoreFraction}>
            {score} / {questions.length} correct
          </Text>
          <View style={styles.scoreProgressTrack}>
            <View
              style={[
                styles.scoreProgressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: pct >= 80 ? Colors.success : pct >= 60 ? Colors.warning : Colors.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.encouragement}>{getEncouragement(score, questions.length)}</Text>
        </View>

        {/* Topic Info */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.summaryRow}>
            <Ionicons name="book-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.summaryLabel}>Topic</Text>
            <Text style={styles.summaryValue}>{topic}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="bar-chart-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.summaryLabel}>Difficulty</Text>
            <Text style={[styles.summaryValue, { color: DIFFICULTY_COLORS[difficulty] }]}>
              {difficulty}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="help-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.summaryLabel}>Questions</Text>
            <Text style={styles.summaryValue}>{questions.length}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.summaryButtons}>
          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={handleTryAgain}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
            <Text style={styles.tryAgainBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newQuizBtn}
            onPress={handleNewQuiz}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.textOnPrimary} />
            <Text style={styles.newQuizBtnText}>New Quiz</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      {phase === 'setup' && renderSetup()}
      {phase === 'loading' && renderLoading()}
      {phase === 'question' && renderQuestion()}
      {phase === 'summary' && renderSummary()}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
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
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicInput: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMid,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSizeSM,
    color: Colors.danger,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.lg,
  },
  loadingTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  difficultyBadgeText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  scoreLabel: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  progressTrack: {
    marginHorizontal: Spacing.lg,
    height: 6,
    backgroundColor: Colors.surfaceMid,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  questionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  questionText: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSizeLG * Typography.lineHeightNormal,
  },
  optionsContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  optionChip: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionCorrect: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  optionWrong: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  optionDimmed: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightMedium,
  },
  optionTextCorrect: {
    color: Colors.success,
    fontWeight: Typography.fontWeightSemiBold,
  },
  optionTextWrong: {
    color: Colors.danger,
    fontWeight: Typography.fontWeightSemiBold,
  },
  optionTextDimmed: {
    color: Colors.textMuted,
  },
  feedbackCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  feedbackCorrect: {
    backgroundColor: Colors.successLight,
  },
  feedbackWrong: {
    backgroundColor: Colors.dangerLight,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  feedbackTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
  },
  feedbackExplanation: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSizeMD * Typography.lineHeightNormal,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  nextBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
  scoreCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scorePct: {
    fontSize: 64,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    letterSpacing: -2,
  },
  scoreFraction: {
    fontSize: Typography.fontSizeLG,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: Typography.fontWeightMedium,
  },
  scoreProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  encouragement: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: Typography.fontWeightMedium,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLabel: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  summaryButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  tryAgainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.cardBackground,
  },
  tryAgainBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
  },
  newQuizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  newQuizBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
});
