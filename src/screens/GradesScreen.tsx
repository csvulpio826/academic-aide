import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useGrades, FirestoreGrade } from '../hooks/useGrades';
import AddGradeModal from '../components/AddGradeModal';

// Fallback mock data used when Firestore is empty
const MOCK_GRADES: FirestoreGrade[] = [
  { id: '1', course: 'Data Structures', courseCode: 'CS 201', grade: 'A-', percentage: 92, credits: 3, color: '#6366F1' },
  { id: '2', course: 'Calculus II', courseCode: 'MATH 201', grade: 'B+', percentage: 88, credits: 4, color: '#EC4899' },
  { id: '3', course: 'Algorithms', courseCode: 'CS 301', grade: 'A', percentage: 96, credits: 3, color: '#10B981' },
  { id: '4', course: 'Technical Writing', courseCode: 'ENG 105', grade: 'B', percentage: 84, credits: 2, color: '#F59E0B' },
  { id: '5', course: 'Physics I', courseCode: 'PHYS 201', grade: 'B+', percentage: 87, credits: 4, color: '#3B82F6' },
];

const gradeToPoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D': 1.0, 'F': 0.0,
};

function computeGPA(grades: FirestoreGrade[]): string {
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
  const weightedPoints = grades.reduce((sum, g) => sum + (gradeToPoints[g.grade] ?? 0) * g.credits, 0);
  return totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : '0.00';
}

const gradeColor = (pct: number): string => {
  if (pct >= 90) return Colors.success;
  if (pct >= 80) return Colors.primary;
  if (pct >= 70) return Colors.warning;
  return Colors.danger;
};

const SEMESTERS = ['Spring 2026', 'Fall 2025', 'Spring 2025'];

export default function GradesScreen() {
  const [selectedSemester, setSelectedSemester] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { grades: firestoreGrades, loading, addGrade, deleteGrade } = useGrades();

  // Use real data if available, fallback to mock when empty
  const grades = firestoreGrades.length > 0 ? firestoreGrades : MOCK_GRADES;
  const isUsingMock = firestoreGrades.length === 0 && !loading;

  const gpa = computeGPA(grades);
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grades</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="filter-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Semester Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.semesterTabs}
        >
          {SEMESTERS.map((sem, idx) => (
            <TouchableOpacity
              key={sem}
              style={[styles.semesterTab, idx === selectedSemester && styles.semesterTabActive]}
              onPress={() => setSelectedSemester(idx)}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.semesterTabText, idx === selectedSemester && styles.semesterTabTextActive]}
              >
                {sem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading grades...</Text>
          </View>
        )}

        {/* GPA Summary Card */}
        {!loading && (
          <>
            <View style={[styles.gpaCard, Shadows.cardHeavy]}>
              <View style={styles.gpaLeft}>
                <Text style={styles.gpaLabel}>Semester GPA</Text>
                <Text style={styles.gpaValue}>{gpa}</Text>
                <View style={styles.gpaTrend}>
                  <Ionicons name="trending-up" size={14} color={Colors.success} />
                  <Text style={styles.gpaTrendText}>+0.12 from last semester</Text>
                </View>
              </View>
              <View style={styles.gpaDivider} />
              <View style={styles.gpaRight}>
                <View style={styles.gpaStatItem}>
                  <Text style={styles.gpaStatValue}>{totalCredits}</Text>
                  <Text style={styles.gpaStatLabel}>Credits</Text>
                </View>
                <View style={styles.gpaStatItem}>
                  <Text style={styles.gpaStatValue}>{grades.length}</Text>
                  <Text style={styles.gpaStatLabel}>Courses</Text>
                </View>
                <View style={styles.gpaStatItem}>
                  <Text style={styles.gpaStatValue}>3.68</Text>
                  <Text style={styles.gpaStatLabel}>Cum. GPA</Text>
                </View>
              </View>
            </View>

            {/* Progress Overview */}
            {grades.length > 0 && (
              <View style={styles.progressSection}>
                <Text style={styles.progressTitle}>Grade Distribution</Text>
                <View style={styles.progressBar}>
                  {grades.map((g, i) => (
                    <View
                      key={g.id}
                      style={[
                        styles.progressSegment,
                        {
                          flex: g.credits,
                          backgroundColor: g.color,
                          borderTopLeftRadius: i === 0 ? BorderRadius.full : 0,
                          borderBottomLeftRadius: i === 0 ? BorderRadius.full : 0,
                          borderTopRightRadius: i === grades.length - 1 ? BorderRadius.full : 0,
                          borderBottomRightRadius: i === grades.length - 1 ? BorderRadius.full : 0,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.progressLegend}>
                  {grades.map((g) => (
                    <View key={g.id} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: g.color }]} />
                      <Text style={styles.legendText}>{g.courseCode}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Course Grade Cards */}
            <Text style={styles.sectionTitle}>Course Grades</Text>

            {/* Empty state */}
            {grades.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={52} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No grades yet</Text>
                <Text style={styles.emptyBody}>Tap + to add your first course grade.</Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="add" size={20} color={Colors.textOnPrimary} />
                  <Text style={styles.emptyAddBtnText}>Add Grade</Text>
                </TouchableOpacity>
              </View>
            ) : (
              grades.map((g) => {
                const isExpanded = expandedId === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.85}
                    onPress={() => setExpandedId(isExpanded ? null : g.id)}
                    onLongPress={() => {
                      // Only allow delete on real Firestore data
                      if (!isUsingMock) {
                        deleteGrade(g.id);
                      }
                    }}
                  >
                    <View style={[styles.gradeCard, Shadows.card]}>
                      {/* Top Row */}
                      <View style={styles.gradeCardTop}>
                        <View style={[styles.courseColorDot, { backgroundColor: g.color }]} />
                        <View style={styles.gradeCardInfo}>
                          <Text style={styles.courseName}>{g.course}</Text>
                          <Text style={styles.courseCode}>{g.courseCode} · {g.credits} credits</Text>
                          {g.gradeType ? (
                            <View style={styles.gradeTypeTag}>
                              <Text style={styles.gradeTypeTagText}>{g.gradeType}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.gradeRight}>
                          <Text style={[styles.gradeLetterBig, { color: gradeColor(g.percentage) }]}>
                            {g.grade}
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.gradeProgress}>
                        <View style={styles.gradeProgressBg}>
                          <View
                            style={[
                              styles.gradeProgressFill,
                              { width: `${g.percentage}%`, backgroundColor: g.color },
                            ]}
                          />
                        </View>
                        <Text style={[styles.gradePercent, { color: gradeColor(g.percentage) }]}>
                          {g.percentage}%
                        </Text>
                      </View>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <View style={styles.expandedDetail}>
                          <View style={styles.expandedDivider} />
                          <View style={styles.expandedRow}>
                            {[
                              { label: 'Midterm', value: '91%' },
                              { label: 'Homework', value: '95%' },
                              { label: 'Quizzes', value: '88%' },
                              { label: 'Final', value: 'TBD' },
                            ].map((item) => (
                              <View key={item.label} style={styles.expandedItem}>
                                <Text style={styles.expandedItemValue}>{item.value}</Text>
                                <Text style={styles.expandedItemLabel}>{item.label}</Text>
                              </View>
                            ))}
                          </View>
                          {!isUsingMock && (
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={() => deleteGrade(g.id)}
                            >
                              <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                              <Text style={styles.deleteBtnText}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      <View style={styles.expandChevron}>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={Colors.textMuted}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      {!loading && (
        <TouchableOpacity
          style={[styles.fab, Shadows.cardHeavy]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
        </TouchableOpacity>
      )}

      <AddGradeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addGrade}
        existingCount={firestoreGrades.length}
      />
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semesterTabs: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  semesterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMid,
  },
  semesterTabActive: {
    backgroundColor: Colors.primary,
  },
  semesterTabText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  semesterTabTextActive: {
    color: Colors.textOnPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
  },
  gpaCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpaLeft: {
    flex: 1,
  },
  gpaLabel: {
    fontSize: Typography.fontSizeSM,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: Typography.fontWeightMedium,
    marginBottom: 4,
  },
  gpaValue: {
    fontSize: 48,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    letterSpacing: -2,
    lineHeight: 56,
  },
  gpaTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  gpaTrendText: {
    fontSize: Typography.fontSizeXS,
    color: Colors.success,
    fontWeight: Typography.fontWeightMedium,
  },
  gpaDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
  },
  gpaRight: {
    gap: 12,
  },
  gpaStatItem: {
    alignItems: 'center',
  },
  gpaStatValue: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
  },
  gpaStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: Typography.fontWeightMedium,
    marginTop: 1,
  },
  progressSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  progressBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    gap: 2,
  },
  progressSegment: {
    height: '100%',
  },
  progressLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  sectionTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
  gradeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    overflow: 'hidden',
  },
  gradeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gradeCardInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  courseCode: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gradeTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceMid,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  gradeTypeTagText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  gradeRight: {
    alignItems: 'center',
    gap: 2,
  },
  gradeLetterBig: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: -0.5,
  },
  gradeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  gradeProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceMid,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  gradeProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  gradePercent: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    width: 34,
    textAlign: 'right',
  },
  expandedDetail: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 12,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  expandedItem: {
    alignItems: 'center',
  },
  expandedItemValue: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  expandedItemLabel: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  deleteBtnText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.danger,
    fontWeight: Typography.fontWeightMedium,
  },
  expandChevron: {
    alignItems: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
