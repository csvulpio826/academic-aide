import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { TextbookResult } from '../services/textbookService';

export interface StoredTextbook extends TextbookResult {
  courseId: string | null;
  addedAt: string;
  isPdf?: boolean;
  storageUrl?: string;
  storagePath?: string;
}

export function useTextbooks() {
  const { user } = useAuth();
  const [textbooks, setTextbooks] = useState<StoredTextbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTextbooks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'textbooks'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const books: StoredTextbook[] = snapshot.docs.map((d) => ({
          ...(d.data() as StoredTextbook),
          id: d.id,
        }));
        setTextbooks(books);
        setLoading(false);
      },
      (error) => {
        console.error('[useTextbooks] listener error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  return { textbooks, loading };
}
