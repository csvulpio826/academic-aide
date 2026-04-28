import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useGrades } from '../hooks/useGrades';
import { useSchedule } from '../hooks/useSchedule';
import { useProfile } from '../hooks/useProfile';
import ProfileModal from '../components/ProfileModal';
import type { StudyTip } from '../types';
// Note: Deadline, GradeEntry types removed — data now comes from Firestore hooks

const { width } = Dimensions.get('window');

const STUDY_TIPS: StudyTip[] = [
  {
    id: '1',
    title: 'Pomodoro Technique',
    body: '25 min focus + 5 min break. Repeat 4x then take a longer break.',
    icon: 'timer-outline',
    category: 'Productivity',
  },
  {
    id: '2',
    title: 'Active Recall',
    body: 'Test yourself after each reading session instead of re-reading notes.',
    icon: 'bulb-outline',
    category: 'Memory',
  },
];

const priorityColor: Record<string, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

const typeIcon: Record<string, any> = {
  assignment: 'document-text-outline',
  exam: 'school-outline',
  project: 'folder-outline',
  quiz: 'help-circle-outline',
};

const gradeToPoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D': 1.0, 'F': 0.0,
};

const deadlineTypeIcon: Record<string, any> = {
  exam: 'school-outline',
  deadline: 'flag-outline',
  class: 'book-outline',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

export default function HomeScreen() {
  const { grades } = useGrades();
  const { events } = useSchedule();
  const { profile } = useProfile();
  const [profileVisible, setProfileVisible] = useState(false);

  // Compute live GPA
  const { gpa, totalCredits } = useMemo(() => {
    const tc = grades.reduce((s, g) => s + g.credits, 0);
    const wp = grades.reduce((s, g) => s + (gradeToPoints[g.grade] ?? 0) * g.credits, 0);
    return { gpa: tc > 0 ? (wp / tc).toFixed(2) : '—', totalCredits: tc };
  }, [grades]);

  // Upcoming deadlines = exam/deadline type events in schedule
  const upcomingDeadlines = useMemo(() => {
    return events
      .filter((e) => e.type === 'exam' || e.type === 'deadline')
      .slice(0, 3);
  }, [events]);

  // Class count
  const classCount = useMemo(() => events.filter((e) => e.type === 'class').length, [events]);

  const displayName = profile.displayName || 'Student';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <TouchableOpacity onPress={() => setProfileVisible(true)} activeOpacity={0.8}>
            <Avatar initials={initials} size={42} />
          </TouchableOpacity>
        </View>

        <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />

        {/* Stats Row — live */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{gpa}</Text>
            <Text style={styles.statLabel}>Current GPA</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.dangerLight }]}>
            <Text style={[styles.statValue, { color: Colors.danger }]}>{upcomingDeadlines.length}</Text>
            <Text style={styles.statLabel}>Due Soon</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{classCount}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
        </View>

        {/* Upcoming Deadlines — live from schedule */}
        <SectionHeader title="Upcoming Deadlines" actionLabel="See all" />
        {upcomingDeadlines.length === 0 ? (
          <Card style={styles.deadlineCard}>
            <Text style={styles.emptyText}>No upcoming deadlines. Nice work! 🎉</Text>
          </Card>
        ) : (
          upcomingDeadlines.map((d) => (
            <TouchableOpacity key={d.id} activeOpacity={0.85}>
              <Card style={styles.deadlineCard}>
                <View style={styles.deadlineRow}>
                  <View style={[styles.deadlineIconBox, { backgroundColor: Colors.dangerLight }]}>
                    <Ionicons name={deadlineTypeIcon[d.type] ?? 'flag-outline'} size={20} color={Colors.danger} />
                  </View>
                  <View style={styles.deadlineInfo}>
                    <Text style={styles.deadlineTitle} numberOfLines={1}>{d.title}</Text>
                    <Text style={styles.deadlineCourse}>
                      {d.instructor || d.location || d.type}
                    </Text>
                  </View>
                  <View style={styles.deadlineMeta}>
                    <Text style={[styles.daysLeft, { color: Colors.danger }]}>
                      {d.startTime || '—'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Grades — live from Firestore */}
        <SectionHeader title="Recent Grades" actionLabel="See all" />
        {grades.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No grades logged yet. Add them in the Grades tab.</Text>
          </Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gradesScroll}
          >
            {grades.slice(0, 5).map((g) => (
              <TouchableOpacity key={g.id} activeOpacity={0.85}>
                <View style={[styles.gradeChip, Shadows.card]}>
                  <View style={[styles.gradeChipTop, { backgroundColor: g.color }]}>
                    <Text style={styles.gradeChipGrade}>{g.grade}</Text>
                    <Text style={styles.gradeChipPct}>{g.percentage}%</Text>
                  </View>
                  <View style={styles.gradeChipBottom}>
                    <Text style={styles.gradeChipCourse} numberOfLines={1}>{g.course}</Text>
                    <Text style={styles.gradeChipCode}>{g.courseCode}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {grades.length > 5 && (
              <TouchableOpacity activeOpacity={0.85}>
                <View style={[styles.gradeChipMore, Shadows.card]}>
                  <Ionicons name="arrow-forward" size={22} color={Colors.primary} />
                  <Text style={styles.gradeChipMoreText}>All grades</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Study Tips */}
        <SectionHeader title="Study Tips" />
        {STUDY_TIPS.map((tip) => (
          <Card key={tip.id} style={styles.tipCard}>
            <View style={styles.tipRow}>
              <View style={styles.tipIconBox}>
                <Ionicons name={tip.icon as any} size={22} color={Colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <View style={styles.tipTitleRow}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Badge label={tip.category} variant="primary" />
                </View>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
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
  greeting: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  name: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
    marginTop: 2,
  },
  emptyText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  deadlineCard: {
    paddingBottom: 12,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deadlineIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  deadlineCourse: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: Typography.fontWeightMedium,
  },
  deadlineMeta: {
    alignItems: 'flex-end',
  },
  daysLeft: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  dueDate: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 1,
  },
  priorityBar: {
    height: 3,
    backgroundColor: Colors.surfaceMid,
    borderRadius: BorderRadius.full,
    marginTop: 12,
    overflow: 'hidden',
  },
  priorityFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  gradesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
  gradeChip: {
    width: 140,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
  },
  gradeChipTop: {
    padding: 14,
    alignItems: 'center',
  },
  gradeChipGrade: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
  },
  gradeChipPct: {
    fontSize: Typography.fontSizeSM,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.fontWeightMedium,
    marginTop: 2,
  },
  gradeChipBottom: {
    padding: 10,
  },
  gradeChipCourse: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  gradeChipCode: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 1,
  },
  gradeChipMore: {
    width: 100,
    height: '100%',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gradeChipMoreText: {
    fontSize: Typography.fontSizeXS,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  tipCard: {},
  tipRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tipIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  tipBody: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    lineHeight: Typography.fontSizeSM * Typography.lineHeightNormal,
  },
});
