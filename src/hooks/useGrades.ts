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

export interface FirestoreGrade {
  id: string;
  course: string;
  courseCode: string;
  gradeType?: string;
  grade: string;
  percentage: number;
  credits: number;
  color: string;
}

type NewGrade = Omit<FirestoreGrade, 'id'>;

export function useGrades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<FirestoreGrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGrades([]);
      setLoading(false);
      return;
    }

    const gradesRef = collection(db, 'users', user.uid, 'grades');

    const unsubscribe = onSnapshot(
      gradesRef,
      (snapshot) => {
        const data: FirestoreGrade[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          course: docSnap.data().course ?? '',
          courseCode: docSnap.data().courseCode ?? '',
          gradeType: docSnap.data().gradeType ?? undefined,
          grade: docSnap.data().grade ?? 'A',
          percentage: docSnap.data().percentage ?? 0,
          credits: docSnap.data().credits ?? 3,
          color: docSnap.data().color ?? '#6366F1',
        }));
        setGrades(data);
        setLoading(false);
      },
      (error) => {
        console.error('useGrades onSnapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addGrade = async (grade: NewGrade) => {
    if (!user) return;
    const gradesRef = collection(db, 'users', user.uid, 'grades');
    await addDoc(gradesRef, {
      ...grade,
      createdAt: serverTimestamp(),
    });
  };

  const deleteGrade = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'grades', id));
  };

  return { grades, loading, addGrade, deleteGrade };
}
