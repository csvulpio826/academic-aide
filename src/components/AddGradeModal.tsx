import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { FirestoreGrade } from '../hooks/useGrades';

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];
const CREDIT_OPTIONS = [1, 2, 3, 4];
const GRADE_TYPE_OPTIONS = ['Midterm', 'Quiz', 'Final', 'Homework', 'Project'];

const COLOR_PALETTE = [
  '#6366F1',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
];

interface AddGradeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (grade: Omit<FirestoreGrade, 'id'>) => Promise<void>;
  existingCount: number;
}

export default function AddGradeModal({
  visible,
  onClose,
  onSave,
  existingCount,
}: AddGradeModalProps) {
  const [course, setCourse] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [selectedGradeType, setSelectedGradeType] = useState('Midterm');
  const [selectedGrade, setSelectedGrade] = useState('A');
  const [percentage, setPercentage] = useState('');
  const [selectedCredits, setSelectedCredits] = useState(3);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCourse('');
    setCourseCode('');
    setSelectedGradeType('Midterm');
    setSelectedGrade('A');
    setPercentage('');
    setSelectedCredits(3);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!course.trim()) return;
    setSaving(true);
    try {
      const color = COLOR_PALETTE[existingCount % COLOR_PALETTE.length];
      await onSave({
        course: course.trim(),
        courseCode: courseCode.trim(),
        gradeType: selectedGradeType,
        grade: selectedGrade,
        percentage: parseFloat(percentage) || 0,
        credits: selectedCredits,
        color,
      });
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to save grade:', err);
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

          <Text style={styles.title}>Add Grade</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Course Name */}
            <Text style={styles.label}>Course Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Data Structures"
              placeholderTextColor={Colors.textMuted}
              value={course}
              onChangeText={setCourse}
              returnKeyType="next"
            />

            {/* Course Code */}
            <Text style={styles.label}>Course Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS 201"
              placeholderTextColor={Colors.textMuted}
              value={courseCode}
              onChangeText={setCourseCode}
              returnKeyType="next"
            />

            {/* Grade Type Picker */}
            <Text style={styles.label}>Grade Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {GRADE_TYPE_OPTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionChip,
                    selectedGradeType === type && styles.optionChipSelected,
                  ]}
                  onPress={() => setSelectedGradeType(type)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedGradeType === type && styles.optionChipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Grade Picker */}
            <Text style={styles.label}>Grade</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {GRADE_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.optionChip,
                    selectedGrade === g && styles.optionChipSelected,
                  ]}
                  onPress={() => setSelectedGrade(g)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedGrade === g && styles.optionChipTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Percentage */}
            <Text style={styles.label}>Percentage</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 92"
              placeholderTextColor={Colors.textMuted}
              value={percentage}
              onChangeText={setPercentage}
              keyboardType="numeric"
              returnKeyType="done"
            />

            {/* Credits */}
            <Text style={styles.label}>Credits</Text>
            <View style={styles.optionRow}>
              {CREDIT_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.optionChip,
                    styles.creditChip,
                    selectedCredits === c && styles.optionChipSelected,
                  ]}
                  onPress={() => setSelectedCredits(c)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedCredits === c && styles.optionChipTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!course.trim() || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!course.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Grade</Text>
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
  creditChip: {
    width: 56,
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
