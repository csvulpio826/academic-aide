import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  useGroups,
  useGroupNotes,
  createGroup,
  addNote,
  deleteNote,
  StudyGroup,
} from '../hooks/useCollaboration';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(ts: any): string {
  if (!ts) return '';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CollabScreen() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const displayName = user?.displayName ?? user?.email ?? 'Student';

  // Navigation state: null = groups list, string = group detail
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);

  // Modals
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [addNoteModalVisible, setAddNoteModalVisible] = useState(false);

  // Create group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Add note form
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Firestore hooks
  const { groups, loading: groupsLoading } = useGroups(userId);
  const { notes, loading: notesLoading } = useGroupNotes(activeGroupId);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupSubject.trim()) return;
    setCreatingGroup(true);
    try {
      await createGroup(newGroupName, newGroupSubject, userId);
      setNewGroupName('');
      setNewGroupSubject('');
      setCreateGroupModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not create group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !activeGroupId) return;
    setAddingNote(true);
    try {
      await addNote(activeGroupId, newNoteContent, userId, displayName);
      setNewNoteContent('');
      setAddNoteModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not add note.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = (noteId: string, authorId: string) => {
    if (authorId !== userId) return;
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(activeGroupId!, noteId);
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not delete note.');
          }
        },
      },
    ]);
  };

  const handleOpenGroup = (group: StudyGroup) => {
    setActiveGroup(group);
    setActiveGroupId(group.id);
  };

  const handleBack = () => {
    setActiveGroupId(null);
    setActiveGroup(null);
  };

  // ── Group List View ──────────────────────────────────────────────────────────

  const renderGroupsList = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Study Groups</Text>
          <Text style={styles.headerSubtitle}>Collaborate and share notes</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => setCreateGroupModalVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Loading */}
        {groupsLoading && (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        )}

        {/* Empty state */}
        {!groupsLoading && groups.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No study groups yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a group to start collaborating with classmates. Tap the + button to get started.
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => setCreateGroupModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={Colors.textOnPrimary} />
              <Text style={styles.emptyCreateBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Group Cards */}
        {!groupsLoading &&
          groups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[styles.groupCard, Shadows.card]}
              onPress={() => handleOpenGroup(group)}
              activeOpacity={0.85}
            >
              <View style={styles.groupCardLeft}>
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupAvatarText}>
                    {group.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupSubject}>{group.subject}</Text>
                  <View style={styles.groupMeta}>
                    <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.groupMetaText}>
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadows.cardHeavy]}
        onPress={() => setCreateGroupModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Create Group Modal */}
      <Modal
        visible={createGroupModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, Shadows.cardHeavy]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Study Group</Text>
              <TouchableOpacity
                onPress={() => setCreateGroupModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Group Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. CS 301 Study Squad"
              placeholderTextColor={Colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.modalLabel}>Subject</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Algorithms, Organic Chemistry"
              placeholderTextColor={Colors.textMuted}
              value={newGroupSubject}
              onChangeText={setNewGroupSubject}
            />

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                (!newGroupName.trim() || !newGroupSubject.trim() || creatingGroup) &&
                  styles.modalSubmitDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={!newGroupName.trim() || !newGroupSubject.trim() || creatingGroup}
              activeOpacity={0.85}
            >
              {creatingGroup ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.modalSubmitText}>Create Group</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );

  // ── Group Detail View ────────────────────────────────────────────────────────

  const renderGroupDetail = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.detailHeaderLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeGroup?.name ?? ''}
            </Text>
            <Text style={styles.headerSubtitle}>{activeGroup?.subject ?? ''}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Loading */}
        {notesLoading && (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading notes...</Text>
          </View>
        )}

        {/* Empty state */}
        {!notesLoading && notes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>
              Add the first note to this group. Tap the + button below.
            </Text>
          </View>
        )}

        {/* Notes */}
        {!notesLoading &&
          notes.map((note) => {
            const isOwn = note.authorId === userId;
            return (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, Shadows.card]}
                onLongPress={() => isOwn && handleDeleteNote(note.id, note.authorId)}
                activeOpacity={isOwn ? 0.8 : 1}
                delayLongPress={500}
              >
                <View style={styles.noteHeader}>
                  <View style={styles.noteAuthorRow}>
                    <View style={styles.noteAvatar}>
                      <Text style={styles.noteAvatarText}>
                        {note.authorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.noteAuthorName}>{note.authorName}</Text>
                      <Text style={styles.noteTimestamp}>
                        {formatTimestamp(note.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {isOwn && (
                    <View style={styles.ownBadge}>
                      <Text style={styles.ownBadgeText}>You</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
                {isOwn && (
                  <Text style={styles.longPressHint}>Long press to delete</Text>
                )}
              </TouchableOpacity>
            );
          })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadows.cardHeavy]}
        onPress={() => setAddNoteModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Add Note Modal */}
      <Modal
        visible={addNoteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, Shadows.cardHeavy]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Note</Text>
              <TouchableOpacity
                onPress={() => {
                  setAddNoteModalVisible(false);
                  setNewNoteContent('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Note Content</Text>
            <TextInput
              style={[styles.modalInput, styles.noteInput]}
              placeholder="Share study notes, summaries, questions..."
              placeholderTextColor={Colors.textMuted}
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              textAlignVertical="top"
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                (!newNoteContent.trim() || addingNote) && styles.modalSubmitDisabled,
              ]}
              onPress={handleAddNote}
              disabled={!newNoteContent.trim() || addingNote}
              activeOpacity={0.85}
            >
              {addingNote ? (
                <ActivityIndicator size="small" color={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.modalSubmitText}>Add Note</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );

  // ── Root Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      {activeGroupId ? renderGroupDetail() : renderGroupsList()}
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
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPad: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
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
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  emptyCreateBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
  groupCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.primary,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  groupSubject: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  groupMetaText: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
  },
  noteCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  noteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  noteAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteAvatarText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textSecondary,
  },
  noteAuthorName: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textPrimary,
  },
  noteTimestamp: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 1,
  },
  ownBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  ownBadgeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.primary,
  },
  noteContent: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSizeMD * Typography.lineHeightNormal,
    marginBottom: Spacing.xs,
  },
  longPressHint: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textPrimary,
  },
  modalLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    marginBottom: Spacing.lg,
  },
  noteInput: {
    minHeight: 120,
  },
  modalSubmitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.textOnPrimary,
  },
});
