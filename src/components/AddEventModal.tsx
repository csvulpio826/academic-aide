import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { FirestoreEvent } from '../hooks/useSchedule';

const TYPE_OPTIONS: Array<{ label: string; value: 'class' | 'exam' | 'deadline' }> = [
  { label: 'Class', value: 'class' },
  { label: 'Exam', value: 'exam' },
  { label: 'Deadline', value: 'deadline' },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Drum-roll picker constants ────────────────────────────────────────────────
const ITEM_HEIGHT = 56;
const PICKER_HEIGHT = ITEM_HEIGHT * 3; // show 3 items (prev / selected / next)

const HOURS: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES: string[] = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
);
const PERIODS: string[] = ['AM', 'PM'];

// ─── Drum column ───────────────────────────────────────────────────────────────
interface DrumColumnProps {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  columnWidth: number;
}

function DrumColumn({ data, selectedIndex, onSelect, columnWidth }: DrumColumnProps) {
  const listRef = useRef<ScrollView>(null);
  const isMounted = useRef(false);

  // Scroll to the initial selected item once layout is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []); // intentionally only on mount

  // When selectedIndex changes externally, scroll to it (e.g., reset)
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    listRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: true,
    });
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const rawIndex = e.nativeEvent.contentOffset.y / ITEM_HEIGHT;
      const index = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      onSelect(clamped);
    },
    [data.length, onSelect],
  );

  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Handle slow drags that don't produce momentum
      const rawIndex = e.nativeEvent.contentOffset.y / ITEM_HEIGHT;
      const index = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      onSelect(clamped);
    },
    [data.length, onSelect],
  );

  return (
    <View style={[drumStyles.column, { width: columnWidth }]}>
      {/* Highlight bar behind selected row */}
      <View style={drumStyles.highlightBar} pointerEvents="none" />
      <ScrollView
        ref={listRef}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        style={{ height: PICKER_HEIGHT }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={`${item}-${index}`} style={[drumStyles.item, { height: ITEM_HEIGHT }]}>
              <Text
                style={[
                  drumStyles.itemText,
                  isSelected ? drumStyles.itemTextSelected : drumStyles.itemTextUnselected,
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const drumStyles = StyleSheet.create({
  column: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  highlightBar: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    zIndex: 0,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    textAlign: 'center',
  },
  itemTextSelected: {
    fontSize: 28,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  itemTextUnselected: {
    fontSize: 18,
    fontWeight: Typography.fontWeightRegular,
    color: Colors.textMuted,
  },
});

// ─── Drum-roll time picker ─────────────────────────────────────────────────────
interface TimeState {
  hourIndex: number;   // 0-11 → "1"-"12"
  minuteIndex: number; // 0-11 → "00","05"..."55"
  periodIndex: number; // 0-1  → "AM","PM"
}

function formatTimeState(ts: TimeState): string {
  return `${HOURS[ts.hourIndex]}:${MINUTES[ts.minuteIndex]} ${PERIODS[ts.periodIndex]}`;
}

interface DrumRollTimePickerProps {
  label: string;
  state: TimeState;
  onChange: (next: TimeState) => void;
}

function DrumRollTimePicker({ label, state, onChange }: DrumRollTimePickerProps) {
  const setHour = useCallback(
    (hourIndex: number) => onChange({ ...state, hourIndex }),
    [state, onChange],
  );
  const setMinute = useCallback(
    (minuteIndex: number) => onChange({ ...state, minuteIndex }),
    [state, onChange],
  );
  const setPeriod = useCallback(
    (periodIndex: number) => onChange({ ...state, periodIndex }),
    [state, onChange],
  );

  return (
    <View style={pickerStyles.wrapper}>
      <Text style={pickerStyles.pickerLabel}>{label}</Text>

      {/* Column header labels */}
      <View style={pickerStyles.headerRow}>
        <Text style={[pickerStyles.colHeader, { width: 64 }]}>Hour</Text>
        <View style={{ width: 20 }} />
        <Text style={[pickerStyles.colHeader, { width: 64 }]}>Min</Text>
        <Text style={[pickerStyles.colHeader, { width: 64 }]}>AM/PM</Text>
      </View>

      {/* Columns */}
      <View style={pickerStyles.columnsRow}>
        <DrumColumn
          data={HOURS}
          selectedIndex={state.hourIndex}
          onSelect={setHour}
          columnWidth={64}
        />
        <Text style={pickerStyles.colon}>:</Text>
        <DrumColumn
          data={MINUTES}
          selectedIndex={state.minuteIndex}
          onSelect={setMinute}
          columnWidth={64}
        />
        <DrumColumn
          data={PERIODS}
          selectedIndex={state.periodIndex}
          onSelect={setPeriod}
          columnWidth={64}
        />
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  pickerLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  colHeader: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  colon: {
    fontSize: 28,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    width: 20,
    textAlign: 'center',
    marginTop: -4, // optical alignment
  },
});

// ─── AddEventModal ─────────────────────────────────────────────────────────────
interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Omit<FirestoreEvent, 'id'>) => Promise<void>;
}

const DEFAULT_TIME_STATE: TimeState = {
  hourIndex: 7,   // "8" (8 AM default)
  minuteIndex: 0, // "00"
  periodIndex: 0, // "AM"
};

export default function AddEventModal({ visible, onClose, onSave }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<'class' | 'exam' | 'deadline'>('class');
  const [startTimeState, setStartTimeState] = useState<TimeState>({ ...DEFAULT_TIME_STATE });
  const [endTimeState, setEndTimeState] = useState<TimeState>({
    hourIndex: 9,   // "10"
    minuteIndex: 0, // "00"
    periodIndex: 0, // "AM"
  });
  const [location, setLocation] = useState('');
  const [instructor, setInstructor] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setSelectedType('class');
    setStartTimeState({ ...DEFAULT_TIME_STATE });
    setEndTimeState({ hourIndex: 9, minuteIndex: 0, periodIndex: 0 });
    setLocation('');
    setInstructor('');
    setSelectedDay(0);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const startTime = formatTimeState(startTimeState);
      const endTime = formatTimeState(endTimeState);
      await onSave({
        title: title.trim(),
        type: selectedType,
        // Keep `time` for backward compat; also send startTime/endTime
        time: `${startTime} – ${endTime}`,
        startTime,
        endTime,
        location: location.trim(),
        instructor: instructor.trim(),
        dayOfWeek: selectedDay,
      } as Omit<FirestoreEvent, 'id'>);
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to save event:', err);
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>Add Event</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Data Structures"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />

            {/* Type */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.optionRow}>
              {TYPE_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.optionChip,
                    styles.typeChip,
                    selectedType === t.value && styles.optionChipSelected,
                  ]}
                  onPress={() => setSelectedType(t.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedType === t.value && styles.optionChipTextSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Start Time */}
            <Text style={styles.label}>Start Time</Text>
            <DrumRollTimePicker
              label="Start"
              state={startTimeState}
              onChange={setStartTimeState}
            />

            {/* End Time */}
            <Text style={[styles.label, { marginTop: 16 }]}>End Time</Text>
            <DrumRollTimePicker
              label="End"
              state={endTimeState}
              onChange={setEndTimeState}
            />

            {/* Location (optional) */}
            <Text style={styles.label}>
              Location <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Eng Hall 204"
              placeholderTextColor={Colors.textMuted}
              value={location}
              onChangeText={setLocation}
              returnKeyType="next"
            />

            {/* Instructor (optional) */}
            <Text style={styles.label}>
              Instructor <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Prof. Smith"
              placeholderTextColor={Colors.textMuted}
              value={instructor}
              onChangeText={setInstructor}
              returnKeyType="done"
            />

            {/* Day of Week */}
            <Text style={styles.label}>Day of Week</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
              nestedScrollEnabled
            >
              {DAYS_OF_WEEK.map((day, idx) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.optionChip,
                    styles.dayChip,
                    selectedDay === idx && styles.optionChipSelected,
                  ]}
                  onPress={() => setSelectedDay(idx)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedDay === idx && styles.optionChipTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!title.trim() || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!title.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Event</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: Spacing.lg,
    maxHeight: '90%',
    ...Shadows.cardHeavy,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceDark,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    letterSpacing: -0.4,
  },
  label: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  optional: {
    fontWeight: Typography.fontWeightRegular,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChip: {
    flex: 1,
  },
  dayChip: {
    minWidth: 52,
  },
  optionChipSelected: {
    backgroundColor: Colors.primary,
  },
  optionChipText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  optionChipTextSelected: {
    color: Colors.textOnPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
});
