import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export interface FirestoreEvent {
  id: string;
  title: string;
  type: 'class' | 'exam' | 'deadline';
  time: string;
  startTime?: string;
  endTime?: string;
  location: string;
  instructor: string;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
}

type NewEvent = Omit<FirestoreEvent, 'id'>;

export function useSchedule() {
  const { user } = useAuth();
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const scheduleRef = collection(db, 'users', user.uid, 'schedule');

    const unsubscribe = onSnapshot(
      scheduleRef,
      (snapshot) => {
        const data: FirestoreEvent[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          title: docSnap.data().title ?? '',
          type: docSnap.data().type ?? 'class',
          time: docSnap.data().time ?? '',
          startTime: docSnap.data().startTime,
          endTime: docSnap.data().endTime,
          location: docSnap.data().location ?? '',
          instructor: docSnap.data().instructor ?? '',
          dayOfWeek: docSnap.data().dayOfWeek ?? 0,
        }));
        setEvents(data);
        setLoading(false);
      },
      (error) => {
        console.error('useSchedule onSnapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addEvent = async (event: NewEvent) => {
    if (!user) return;
    const scheduleRef = collection(db, 'users', user.uid, 'schedule');
    await addDoc(scheduleRef, {
      ...event,
      createdAt: serverTimestamp(),
    });
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'schedule', id));
  };

  return { events, loading, addEvent, deleteEvent };
}
