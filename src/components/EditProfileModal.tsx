import React, { useState, useEffect } from 'react';
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
import type { UserProfile } from '../hooks/useProfile';

const YEAR_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];
const GPA_TARGET_OPTIONS = ['3.0', '3.2', '3.5', '3.7', '3.8', '4.0'];

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (patch: Partial<UserProfile>) => Promise<void>;
}

export default function EditProfileModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [university, setUniversity] = useState('');
  const [gpaTarget, setGpaTarget] = useState('3.8');
  const [saving, setSaving] = useState(false);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setDisplayName(profile.displayName || '');
      setMajor(profile.major || '');
      setYear(profile.year || '');
      setUniversity(profile.university || '');
      setGpaTarget(profile.gpaTarget || '3.8');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        major: major.trim(),
        year,
        university: university.trim(),
        gpaTarget,
      });
      onClose();
    } catch (err) {
      console.error('[EditProfileModal] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Edit Profile</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Display Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex Johnson"
              placeholderTextColor={Colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* Major */}
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science"
              placeholderTextColor={Colors.textMuted}
              value={major}
              onChangeText={setMajor}
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* Year */}
            <Text style={styles.label}>Year</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
              nestedScrollEnabled
            >
              {YEAR_OPTIONS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.chip, year === y && styles.chipSelected]}
                  onPress={() => setYear(y)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, year === y && styles.chipTextSelected]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* University */}
            <Text style={styles.label}>University</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. State University"
              placeholderTextColor={Colors.textMuted}
              value={university}
              onChangeText={setUniversity}
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* GPA Target */}
            <Text style={styles.label}>GPA Target</Text>
            <View style={styles.optionRow}>
              {GPA_TARGET_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, styles.gpaChip, gpaTarget === g && styles.chipSelected]}
                  onPress={() => setGpaTarget(g)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, gpaTarget === g && styles.chipTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!displayName.trim() || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!displayName.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
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
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMid,
  },
  gpaChip: {
    flex: 1,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
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
