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
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../theme';

export interface TextbookInfo {
  title: string;
  course: string;
  instructor: string;
  edition: string;
  isbn: string;
  asset: DocumentPicker.DocumentPickerAsset;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (info: TextbookInfo) => Promise<void>;
  existingTitles: string[]; // for duplicate detection
}

export default function AddTextbookModal({ visible, onClose, onSubmit, existingTitles }: Props) {
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [instructor, setInstructor] = useState('');
  const [edition, setEdition] = useState('');
  const [isbn, setIsbn] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setCourse('');
    setInstructor('');
    setEdition('');
    setIsbn('');
    setSelectedFile(null);
    setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        // Auto-fill title from filename if empty
        if (!title.trim()) {
          setTitle(asset.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '));
        }
        setSelectedFile(asset);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open file picker.');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !selectedFile) return;

    // Duplicate check — case-insensitive
    const dup = existingTitles.find(
      (t) => t.toLowerCase() === title.trim().toLowerCase()
    );
    if (dup) {
      Alert.alert(
        'Already in Library',
        `"${dup}" is already saved. Find it under Textbooks in the + menu.`,
        [{ text: 'Go to Library', onPress: handleClose }, { text: 'Cancel', style: 'cancel' }]
      );
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        course: course.trim(),
        instructor: instructor.trim(),
        edition: edition.trim(),
        isbn: isbn.trim(),
        asset: selectedFile,
      });
      reset();
      onClose();
    } catch (err) {
      console.error('[AddTextbookModal] save error:', err);
      Alert.alert('Error', 'Could not save textbook. Please try again.');
      setSaving(false);
    }
  };

  const canSave = title.trim().length > 0 && selectedFile !== null && !saving;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, Shadows.cardHeavy]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Textbook</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* PDF file picker */}
            <Text style={styles.label}>PDF File <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity style={styles.filePicker} onPress={handlePickFile} activeOpacity={0.8}>
              <Ionicons
                name={selectedFile ? 'document-text' : 'cloud-upload-outline'}
                size={22}
                color={selectedFile ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.filePickerText, selectedFile && styles.filePickerTextSelected]} numberOfLines={1}>
                {selectedFile ? selectedFile.name : 'Tap to select PDF'}
              </Text>
              {selectedFile && (
                <TouchableOpacity onPress={() => setSelectedFile(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.label}>Textbook Title <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction to Algorithms"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* Course */}
            <Text style={styles.label}>Course <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS 301"
              placeholderTextColor={Colors.textMuted}
              value={course}
              onChangeText={setCourse}
              returnKeyType="next"
              autoCapitalize="characters"
            />

            {/* Instructor */}
            <Text style={styles.label}>Instructor <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Prof. Smith"
              placeholderTextColor={Colors.textMuted}
              value={instructor}
              onChangeText={setInstructor}
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* Edition */}
            <Text style={styles.label}>Edition <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3rd Edition"
              placeholderTextColor={Colors.textMuted}
              value={edition}
              onChangeText={setEdition}
              returnKeyType="next"
            />

            {/* ISBN */}
            <Text style={styles.label}>ISBN <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 978-0-262-03384-8"
              placeholderTextColor={Colors.textMuted}
              value={isbn}
              onChangeText={setIsbn}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Textbook</Text>
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: Spacing.lg,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.surfaceDark,
    alignSelf: 'center', marginBottom: 16,
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
  required: { color: Colors.danger },
  optional: { fontWeight: Typography.fontWeightRegular, color: Colors.textMuted },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    padding: 14,
  },
  filePickerText: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    color: Colors.textMuted,
  },
  filePickerTextSelected: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeightMedium,
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
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14,
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
    flex: 2, paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
});
