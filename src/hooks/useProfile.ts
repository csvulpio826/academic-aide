import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export interface UserProfile {
  displayName: string;
  major: string;
  year: string;
  university: string;
  semester: string;
  gpaTarget: string;
  // Notification toggles
  notifDeadlines: boolean;
  notifGrades: boolean;
  notifStudy: boolean;
  // Appearance
  darkMode: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  major: '',
  year: '',
  university: '',
  semester: 'Spring 2026',
  gpaTarget: '3.8',
  notifDeadlines: true,
  notifGrades: true,
  notifStudy: false,
  darkMode: false,
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }

    const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');

    const unsubscribe = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          setProfile({ ...DEFAULT_PROFILE, ...(snap.data() as Partial<UserProfile>) });
        } else {
          setProfile(DEFAULT_PROFILE);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useProfile] onSnapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const updateProfile = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
    await setDoc(
      profileRef,
      { ...patch, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return { profile, loading, updateProfile };
}
