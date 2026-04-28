import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onTextbooks: () => void;
  onUploadNew: () => void;
}

export default function AttachmentMenu({ visible, onClose, onTextbooks, onUploadNew }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.menu}>
        <Text style={styles.menuTitle}>Add to Chat</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => { onClose(); onTextbooks(); }}
          activeOpacity={0.8}
        >
          <View style={[styles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="library" size={22} color={Colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Textbooks</Text>
            <Text style={styles.optionSub}>Load from your saved library</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => { onClose(); onUploadNew(); }}
          activeOpacity={0.8}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="cloud-upload-outline" size={22} color="#22C55E" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Upload New Textbook</Text>
            <Text style={styles.optionSub}>Add a PDF to your library</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menu: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    width: 300,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    ...Shadows.cardHeavy,
  },
  menuTitle: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  optionSub: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
