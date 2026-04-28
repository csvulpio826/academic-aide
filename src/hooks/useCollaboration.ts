import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  createdBy: string;
  members: string[];
  createdAt: any;
}

export interface GroupNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  updatedAt: any;
}

// ── useGroups ─────────────────────────────────────────────────────────────────

export function useGroups(userId: string) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'studyGroups'),
      where('members', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StudyGroup, 'id'>),
        }));
        setGroups(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[useGroups] onSnapshot error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  return { groups, loading };
}

// ── useGroupNotes ─────────────────────────────────────────────────────────────

export function useGroupNotes(groupId: string | null) {
  const [notes, setNotes] = useState<GroupNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) {
      setNotes([]);
      return;
    }

    setLoading(true);

    const notesRef = collection(db, 'studyGroups', groupId, 'notes');
    const q = query(notesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<GroupNote, 'id'>),
        }));
        setNotes(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[useGroupNotes] onSnapshot error:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [groupId]);

  return { notes, loading };
}

// ── createGroup ───────────────────────────────────────────────────────────────

export async function createGroup(
  name: string,
  subject: string,
  userId: string
): Promise<void> {
  await addDoc(collection(db, 'studyGroups'), {
    name: name.trim(),
    subject: subject.trim(),
    createdBy: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  });
}

// ── addNote ───────────────────────────────────────────────────────────────────

export async function addNote(
  groupId: string,
  content: string,
  userId: string,
  authorName: string
): Promise<void> {
  const notesRef = collection(db, 'studyGroups', groupId, 'notes');
  await addDoc(notesRef, {
    content: content.trim(),
    authorId: userId,
    authorName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── deleteNote ────────────────────────────────────────────────────────────────

export async function deleteNote(groupId: string, noteId: string): Promise<void> {
  const noteRef = doc(db, 'studyGroups', groupId, 'notes', noteId);
  await deleteDoc(noteRef);
}
