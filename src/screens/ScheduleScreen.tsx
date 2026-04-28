import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useSchedule, FirestoreEvent } from '../hooks/useSchedule';
import AddEventModal from '../components/AddEventModal';
import type { ScheduleItem } from '../types';

type ViewMode = 'day' | 'week' | 'month';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = [31, 1, 2, 3, 4, 5, 6];
const CURRENT_DAY_IDX = 3; // Thursday = "today"

// Fallback mock data used when Firestore is empty
const MOCK_SCHEDULE: Record<number, ScheduleItem[]> = {
  0: [
    { id: 'm1', title: 'Data Structures', course: 'CS 201', location: 'Eng Hall 204', startTime: '9:00 AM', endTime: '10:30 AM', type: 'class', date: 'Mon', color: '#6366F1' },
    { id: 'm2', title: 'Calc II', course: 'MATH 201', location: 'Science Bldg 101', startTime: '2:00 PM', endTime: '3:15 PM', type: 'class', date: 'Mon', color: '#EC4899' },
  ],
  1: [
    { id: 't1', title: 'Technical Writing', course: 'ENG 105', location: 'Lib 302', startTime: '11:00 AM', endTime: '12:15 PM', type: 'class', date: 'Tue', color: '#F59E0B' },
    { id: 't2', title: 'Problem Set 4 Due', course: 'CS 301', location: 'Online', startTime: '11:59 PM', endTime: '11:59 PM', type: 'deadline', date: 'Tue', color: '#EF4444' },
  ],
  2: [
    { id: 'w1', title: 'Algorithms', course: 'CS 301', location: 'Eng Hall 102', startTime: '10:00 AM', endTime: '11:15 AM', type: 'class', date: 'Wed', color: '#10B981' },
    { id: 'w2', title: 'Physics Lab', course: 'PHYS 201', location: 'Sci Lab 3', startTime: '1:00 PM', endTime: '3:00 PM', type: 'class', date: 'Wed', color: '#3B82F6' },
  ],
  3: [
    { id: 'th1', title: 'Data Structures', course: 'CS 201', location: 'Eng Hall 204', startTime: '9:00 AM', endTime: '10:30 AM', type: 'class', date: 'Thu', color: '#6366F1' },
    { id: 'th2', title: 'Prof. Chen Office Hours', course: 'CS 301', location: 'Office 412', startTime: '3:00 PM', endTime: '4:00 PM', type: 'office-hours', date: 'Thu', color: '#8B5CF6' },
    { id: 'th3', title: 'Study Group: Calc', course: 'MATH 201', location: 'Library 2nd Floor', startTime: '6:00 PM', endTime: '8:00 PM', type: 'class', date: 'Thu', color: '#EC4899' },
  ],
  4: [
    { id: 'f1', title: 'Technical Writing', course: 'ENG 105', location: 'Lib 302', startTime: '11:00 AM', endTime: '12:15 PM', type: 'class', date: 'Fri', color: '#F59E0B' },
    { id: 'f2', title: 'MATH 201 Midterm', course: 'MATH 201', location: 'Sci Bldg 200', startTime: '2:00 PM', endTime: '4:00 PM', type: 'exam', date: 'Fri', color: '#EF4444' },
  ],
  5: [],
  6: [
    { id: 's1', title: 'Research Paper Draft Due', course: 'ENG 105', location: 'Online Submission', startTime: '11:59 PM', endTime: '11:59 PM', type: 'deadline', date: 'Sun', color: '#EF4444' },
  ],
};

// Color map for event types from Firestore
const TYPE_COLORS: Record<string, string> = {
  class: '#6366F1',
  exam: '#EF4444',
  deadline: '#F59E0B',
};

const typeIcon: Record<string, any> = {
  class: 'book-outline',
  exam: 'alert-circle-outline',
  'office-hours': 'person-outline',
  deadline: 'flag-outline',
};

const typeLabel: Record<string, string> = {
  class: 'Class',
  exam: 'Exam',
  'office-hours': 'Office Hours',
  deadline: 'Deadline',
};

// Convert a FirestoreEvent to the shape needed for rendering
interface RenderItem {
  id: string;
  title: string;
  course: string;
  location: string;
  startTime: string;
  endTime: string;
  type: string;
  date: string;
  color: string;
}

function firestoreEventToRender(ev: FirestoreEvent): RenderItem {
  return {
    id: ev.id,
    title: ev.title,
    course: ev.instructor || '',
    location: ev.location || '',
    startTime: ev.startTime || ev.time || '',
    endTime: ev.endTime || ev.time || '',
    type: ev.type,
    date: DAYS[ev.dayOfWeek] ?? '',
    color: TYPE_COLORS[ev.type] ?? '#6366F1',
  };
}

// Convert JS getDay() (0=Sun) to our model index (0=Mon, 6=Sun)
function jsToModelDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Get the Monday of the week containing `date`
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get Mon–Sun dates for the week containing `referenceDate`
function getWeekDates(referenceDate: Date): Date[] {
  const monday = getMondayOfWeek(referenceDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sortByTime(items: RenderItem[]): RenderItem[] {
  const toMinutes = (t: string) => {
    if (!t) return 0;
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return h * 60 + m;
  };
  return items.slice().sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

// Month header day labels (Sun–Sat for calendar grid)
const MONTH_DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(CURRENT_DAY_IDX);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const [detailEvent, setDetailEvent] = useState<RenderItem | null>(null);

  const { events: firestoreEvents, loading, addEvent, deleteEvent } = useSchedule();

  const isUsingMock = firestoreEvents.length === 0 && !loading;

  // Build a day-indexed map from Firestore events
  const firestoreByDay: Record<number, RenderItem[]> = {};
  firestoreEvents.forEach((ev) => {
    const day = ev.dayOfWeek;
    if (!firestoreByDay[day]) firestoreByDay[day] = [];
    firestoreByDay[day].push(firestoreEventToRender(ev));
  });

  // Decide which data source to use
  const getItemsForDay = (dayIdx: number): RenderItem[] => {
    if (!isUsingMock) {
      return firestoreByDay[dayIdx] ?? [];
    }
    return (MOCK_SCHEDULE[dayIdx] ?? []) as unknown as RenderItem[];
  };

  const items = sortByTime(getItemsForDay(selectedDay));

  const hasItemsForDay = (dayIdx: number): boolean => {
    if (!isUsingMock) return (firestoreByDay[dayIdx] ?? []).length > 0;
    return (MOCK_SCHEDULE[dayIdx] ?? []).length > 0;
  };

  // ─── Date Helpers ──────────────────────────────────────────────────────────

  const today = new Date();

  // Week view
  const refWeekDate = new Date(today);
  refWeekDate.setDate(today.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(refWeekDate);
  const weekNavLabel =
    weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' – ' +
    weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Month view
  const viewMonthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthYearLabel = viewMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const firstDayJS = viewMonthDate.getDay(); // 0=Sun
  const daysInMonth = new Date(
    viewMonthDate.getFullYear(),
    viewMonthDate.getMonth() + 1,
    0,
  ).getDate();

  // Build flat array of calendar cells (null = empty padding)
  const totalCells = Math.ceil((firstDayJS + daysInMonth) / 7) * 7;
  const calendarCells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDayJS + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  // Chunk into weeks
  const calendarWeeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    calendarWeeks.push(calendarCells.slice(i, i + 7));
  }

  // Events for the selected date in month view
  const selectedMonthDayItems = (() => {
    const jsDay = selectedMonthDate.getDay();
    const modelDay = jsToModelDay(jsDay);
    return sortByTime(getItemsForDay(modelDay));
  })();

  // ─── Event Detail Modal ────────────────────────────────────────────────────

  const renderDetailModal = () => (
    <Modal
      visible={detailEvent !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setDetailEvent(null)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setDetailEvent(null)}
      >
        <View style={[styles.detailSheet, Shadows.cardHeavy]}>
          {detailEvent !== null && (
            <>
              <View style={[styles.detailColorBar, { backgroundColor: detailEvent.color }]} />
              <View style={styles.detailContent}>
                <View style={styles.detailTypeRow}>
                  <Ionicons
                    name={typeIcon[detailEvent.type] ?? 'calendar-outline'}
                    size={14}
                    color={detailEvent.color}
                  />
                  <Text style={[styles.detailTypeText, { color: detailEvent.color }]}>
                    {typeLabel[detailEvent.type] ?? detailEvent.type}
                  </Text>
                </View>
                <Text style={styles.detailTitle}>{detailEvent.title}</Text>
                {!!detailEvent.startTime && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {detailEvent.startTime}
                      {detailEvent.startTime !== detailEvent.endTime
                        ? ` – ${detailEvent.endTime}`
                        : ''}
                    </Text>
                  </View>
                )}
                {!!detailEvent.location && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{detailEvent.location}</Text>
                  </View>
                )}
                {!!detailEvent.course && (
                  <View style={styles.detailRow}>
                    <Ionicons name="book-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{detailEvent.course}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setDetailEvent(null)}
                >
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ─── Week View ─────────────────────────────────────────────────────────────

  const renderWeekView = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.weekScrollOuter}
      contentContainerStyle={styles.weekScrollContent}
    >
      <View style={styles.weekGrid}>
        {weekDates.map((date, idx) => {
          const isToday = isSameDay(date, today);
          const dayLabel = DAYS[idx];
          const dayEvents = sortByTime(getItemsForDay(idx));
          return (
            <View key={idx} style={styles.weekColumn}>
              {/* Column header */}
              <View style={[styles.weekColHeader, isToday && styles.weekColHeaderToday]}>
                <Text style={[styles.weekColDayName, isToday && styles.weekColTextToday]}>
                  {dayLabel}
                </Text>
                <Text style={[styles.weekColDate, isToday && styles.weekColTextToday]}>
                  {date.getDate()}
                </Text>
              </View>

              {/* Event pills */}
              <ScrollView
                style={styles.weekColBody}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {dayEvents.length === 0 ? (
                  <View style={styles.weekEmptyCol}>
                    <Text style={styles.weekEmptyText}>—</Text>
                  </View>
                ) : (
                  dayEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.weekEventPill, { backgroundColor: event.color }]}
                      onPress={() => setDetailEvent(event)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.weekEventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      {!!event.startTime && (
                        <Text style={styles.weekEventTime} numberOfLines={1}>
                          {event.startTime}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  // ─── Month View ────────────────────────────────────────────────────────────

  const renderMonthView = () => (
    <ScrollView style={styles.monthScroll} showsVerticalScrollIndicator={false}>
      {/* Day-of-week headers */}
      <View style={styles.monthDayHeaders}>
        {MONTH_DAY_HEADERS.map((h) => (
          <View key={h} style={styles.monthDayHeaderCell}>
            <Text style={styles.monthDayHeaderText}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid rows */}
      {calendarWeeks.map((week, wIdx) => (
        <View key={wIdx} style={styles.monthWeekRow}>
          {week.map((day, dIdx) => {
            if (day === null) {
              return <View key={dIdx} style={styles.monthCell} />;
            }

            const cellDate = new Date(
              viewMonthDate.getFullYear(),
              viewMonthDate.getMonth(),
              day,
            );
            const isToday = isSameDay(cellDate, today);
            const isSelected = isSameDay(cellDate, selectedMonthDate);
            const modelDay = jsToModelDay(cellDate.getDay());
            const dayEvents = getItemsForDay(modelDay);
            const shownDots = dayEvents.slice(0, 2);
            const extraCount = dayEvents.length - 2;

            return (
              <TouchableOpacity
                key={dIdx}
                style={[styles.monthCell, isSelected && !isToday && styles.monthCellSelected]}
                onPress={() => setSelectedMonthDate(cellDate)}
                activeOpacity={0.7}
              >
                <View style={[styles.monthDateCircle, isToday && styles.monthDateCircleToday]}>
                  <Text
                    style={[
                      styles.monthDateText,
                      isToday && styles.monthDateTextToday,
                      isSelected && !isToday && styles.monthDateTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </View>

                {/* Event dots */}
                <View style={styles.monthDots}>
                  {shownDots.map((ev, dotIdx) => (
                    <View
                      key={`${ev.id}-${dotIdx}`}
                      style={[styles.monthDot, { backgroundColor: ev.color }]}
                    />
                  ))}
                </View>

                {extraCount > 0 && (
                  <Text style={styles.monthExtra}>+{extraCount}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Selected date event list */}
      <View style={styles.monthSelectedSection}>
        <Text style={styles.monthSelectedLabel}>
          {selectedMonthDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {selectedMonthDayItems.length === 0 ? (
          <Text style={styles.monthNoEvents}>No events scheduled</Text>
        ) : (
          selectedMonthDayItems.map((item) => (
            <View key={item.id} style={[styles.monthEventCard, Shadows.card]}>
              <View style={[styles.monthEventStrip, { backgroundColor: item.color }]} />
              <View style={styles.monthEventInfo}>
                <View style={styles.monthEventTopRow}>
                  <Ionicons
                    name={typeIcon[item.type] ?? 'calendar-outline'}
                    size={12}
                    color={item.color}
                  />
                  <Text style={[styles.monthEventTypeText, { color: item.color }]}>
                    {typeLabel[item.type] ?? item.type}
                  </Text>
                </View>
                <Text style={styles.monthEventTitle}>{item.title}</Text>
                {!!item.startTime && (
                  <Text style={styles.monthEventTime}>
                    {item.startTime}
                    {item.startTime !== item.endTime ? ` – ${item.endTime}` : ''}
                  </Text>
                )}
                {!!item.location && (
                  <Text style={styles.monthEventLocation} numberOfLines={1}>
                    {item.location}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleRow}>
        {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewTogglePill,
              viewMode === mode && styles.viewTogglePillActive,
            ]}
            onPress={() => setViewMode(mode)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === mode && styles.viewToggleTextActive,
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── DAY VIEW ── */}
      {viewMode === 'day' && (
        <>
          {/* Month label */}
          <View style={styles.monthRow}>
            <TouchableOpacity>
              <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>April 2026</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Day Selector */}
          <View style={styles.daySelector}>
            {DAYS.map((day, idx) => {
              const isSelected = idx === selectedDay;
              const isToday = idx === CURRENT_DAY_IDX;
              const hasDot = hasItemsForDay(idx);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelectedDay(idx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isSelected && styles.dayNameSelected,
                      isToday && !isSelected && styles.dayNameToday,
                    ]}
                  >
                    {day}
                  </Text>
                  <Text
                    style={[
                      styles.dayDate,
                      isSelected && styles.dayDateSelected,
                      isToday && !isSelected && styles.dayDateToday,
                    ]}
                  >
                    {DATES[idx]}
                  </Text>
                  {hasDot && (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isSelected
                            ? Colors.textOnPrimary
                            : Colors.primary,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Event Count */}
          <View style={styles.eventsHeader}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.eventsCount}>
                {items.length === 0
                  ? 'No events'
                  : `${items.length} event${items.length > 1 ? 's' : ''}`}
              </Text>
            )}
            <Text style={styles.eventsDay}>
              {DAYS[selectedDay]}, Apr {DATES[selectedDay]}
            </Text>
          </View>

          {/* Event List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading schedule...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={52} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No events</Text>
                <Text style={styles.emptyBody}>Tap + to add an event for this day.</Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="add" size={20} color={Colors.textOnPrimary} />
                  <Text style={styles.emptyAddBtnText}>Add Event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={item.id} style={styles.eventRow}>
                  {/* Timeline */}
                  <View style={styles.timeline}>
                    <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
                    {index < items.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Card */}
                  <TouchableOpacity
                    style={[styles.eventCard, Shadows.card]}
                    activeOpacity={0.85}
                    onLongPress={() => {
                      if (!isUsingMock) deleteEvent(item.id);
                    }}
                  >
                    <View style={styles.eventCardInner}>
                      <View style={[styles.eventColorStrip, { backgroundColor: item.color }]} />
                      <View style={styles.eventContent}>
                        <View style={styles.eventTopRow}>
                          <View style={styles.eventTypeTag}>
                            <Ionicons
                              name={typeIcon[item.type] ?? 'calendar-outline'}
                              size={12}
                              color={item.color}
                            />
                            <Text style={[styles.eventTypeLabel, { color: item.color }]}>
                              {typeLabel[item.type] ?? item.type}
                            </Text>
                          </View>
                          <Text style={styles.eventTime}>
                            {item.startTime}
                            {item.startTime !== item.endTime ? ` – ${item.endTime}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <View style={styles.eventMeta}>
                          {item.course ? (
                            <>
                              <Ionicons name="book-outline" size={12} color={Colors.textMuted} />
                              <Text style={styles.eventCourse}>{item.course}</Text>
                              <View style={styles.dot2} />
                            </>
                          ) : null}
                          {item.location ? (
                            <>
                              <Ionicons
                                name="location-outline"
                                size={12}
                                color={Colors.textMuted}
                              />
                              <Text style={styles.eventLocation} numberOfLines={1}>
                                {item.location}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        </>
      )}

      {/* ── WEEK VIEW ── */}
      {viewMode === 'week' && (
        <View style={styles.flex1}>
          {/* Week navigation */}
          <View style={styles.weekNavRow}>
            <TouchableOpacity
              onPress={() => setWeekOffset(weekOffset - 1)}
              style={styles.navArrow}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.weekNavLabel}>{weekNavLabel}</Text>
            <TouchableOpacity
              onPress={() => setWeekOffset(weekOffset + 1)}
              style={styles.navArrow}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : (
            renderWeekView()
          )}
        </View>
      )}

      {/* ── MONTH VIEW ── */}
      {viewMode === 'month' && (
        <View style={styles.flex1}>
          {/* Month navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={() => setMonthOffset(monthOffset - 1)}
              style={styles.navArrow}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthNavLabel}>{monthYearLabel}</Text>
            <TouchableOpacity
              onPress={() => setMonthOffset(monthOffset + 1)}
              style={styles.navArrow}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : (
            renderMonthView()
          )}
        </View>
      )}

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

      {/* Event detail modal (used by week view) */}
      {renderDetailModal()}

      <AddEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addEvent}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex1: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── View Toggle ──────────────────────────────────────────────────────────────
  viewToggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  viewTogglePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  viewTogglePillActive: {
    backgroundColor: Colors.primary,
  },
  viewToggleText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  viewToggleTextActive: {
    color: Colors.textOnPrimary,
  },

  // ── Day View ─────────────────────────────────────────────────────────────────
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  monthLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: Colors.textOnPrimary,
  },
  dayNameToday: {
    color: Colors.primary,
  },
  dayDate: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  dayDateSelected: {
    color: Colors.textOnPrimary,
  },
  dayDateToday: {
    color: Colors.primary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  eventsCount: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  eventsDay: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
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
  eventRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeline: {
    width: 20,
    alignItems: 'center',
    paddingTop: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: -12,
  },
  eventCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  eventCardInner: {
    flexDirection: 'row',
  },
  eventColorStrip: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTypeLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeightSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eventTime: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  eventTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  eventCourse: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
  },
  dot2: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 2,
  },
  eventLocation: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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

  // ── FAB ──────────────────────────────────────────────────────────────────────
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

  // ── Event Detail Modal ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  detailColorBar: {
    height: 5,
    width: '100%',
  },
  detailContent: {
    padding: 20,
    paddingBottom: 36,
  },
  detailTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailTypeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailCloseBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  detailCloseBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
  },

  // ── Week View ─────────────────────────────────────────────────────────────────
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  weekNavLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  navArrow: {
    padding: 4,
  },
  weekScrollOuter: {
    flex: 1,
  },
  weekScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 80,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  weekColumn: {
    width: 110,
    flexDirection: 'column',
  },
  weekColHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
    backgroundColor: Colors.borderLight,
  },
  weekColHeaderToday: {
    backgroundColor: Colors.primary,
  },
  weekColDayName: {
    fontSize: 11,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  weekColDate: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  weekColTextToday: {
    color: Colors.textOnPrimary,
  },
  weekColBody: {
    flex: 1,
  },
  weekEventPill: {
    borderRadius: BorderRadius.md,
    padding: 6,
    marginBottom: 6,
  },
  weekEventTitle: {
    fontSize: 11,
    fontWeight: Typography.fontWeightSemiBold,
    color: '#FFFFFF',
    lineHeight: 15,
  },
  weekEventTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  weekEmptyCol: {
    alignItems: 'center',
    paddingTop: 16,
  },
  weekEmptyText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
  },

  // ── Month View ────────────────────────────────────────────────────────────────
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  monthNavLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  monthScroll: {
    flex: 1,
  },
  monthDayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  monthDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  monthDayHeaderText: {
    fontSize: 11,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  monthWeekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  monthCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    minHeight: 52,
  },
  monthCellSelected: {
    backgroundColor: Colors.primaryLight,
  },
  monthDateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDateCircleToday: {
    backgroundColor: Colors.primary,
  },
  monthDateText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightMedium,
    color: Colors.textPrimary,
  },
  monthDateTextToday: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeightBold,
  },
  monthDateTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  monthDots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  monthExtra: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 1,
  },
  monthSelectedSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
  },
  monthSelectedLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  monthNoEvents: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  monthEventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: 10,
  },
  monthEventStrip: {
    width: 4,
  },
  monthEventInfo: {
    flex: 1,
    padding: 12,
  },
  monthEventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  monthEventTypeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  monthEventTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  monthEventTime: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  monthEventLocation: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
  },
});
