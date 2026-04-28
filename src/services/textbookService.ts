import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';

export interface TextbookResult {
  id: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail: string;
  previewText: string;
  infoLink: string;
}

// ── Search Google Books API ────────────────────────────────────────────────────
export async function searchTextbook(query: string): Promise<TextbookResult | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=3`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;

    const item = data.items[0];
    const volumeInfo = item.volumeInfo || {};
    const searchInfo = item.searchInfo || {};
    const imageLinks = volumeInfo.imageLinks || {};

    return {
      id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors || [],
      description: volumeInfo.description || '',
      thumbnail:
        (imageLinks.thumbnail || imageLinks.smallThumbnail || '').replace(
          'http://',
          'https://'
        ),
      previewText: searchInfo.textSnippet || '',
      infoLink: volumeInfo.infoLink || '',
    };
  } catch (error) {
    console.error('[textbookService] searchTextbook error:', error);
    return null;
  }
}

// ── Chunk helper ───────────────────────────────────────────────────────────────
function chunkText(text: string, chunkSize = 500): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    // Try to break on a sentence boundary near the chunk size
    let end = Math.min(i + chunkSize, text.length);
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > i + chunkSize / 2) end = lastPeriod + 1;
    }
    const chunk = text.slice(i, end).trim();
    if (chunk) chunks.push(chunk);
    i = end;
  }
  return chunks;
}

// ── Save book + chunks to Firestore ───────────────────────────────────────────
export async function saveTextbookToFirestore(
  userId: string,
  book: TextbookResult,
  courseId?: string
): Promise<string> {
  const bookRef = doc(db, 'users', userId, 'textbooks', book.id);

  await setDoc(bookRef, {
    id: book.id,
    title: book.title,
    authors: book.authors,
    description: book.description,
    thumbnail: book.thumbnail,
    previewText: book.previewText,
    infoLink: book.infoLink,
    courseId: courseId || null,
    addedAt: new Date().toISOString(),
  });

  // Chunk description + preview text and store for later retrieval
  const fullText = [book.description, book.previewText]
    .filter(Boolean)
    .join('\n\n');
  const chunks = chunkText(fullText);

  for (let i = 0; i < chunks.length; i++) {
    const chunkRef = doc(
      db,
      'users',
      userId,
      'textbooks',
      book.id,
      'chunks',
      `chunk_${i}`
    );
    await setDoc(chunkRef, { text: chunks[i], index: i });
  }

  return book.id;
}

// ── Save PDF metadata with storage path for re-download ──────────────────────
export async function savePdfMetadataToFirestore(
  userId: string,
  filename: string,
  storageUrl: string,
  storagePath?: string,
  courseId?: string
): Promise<string> {
  const safeId = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const bookRef = doc(db, 'users', userId, 'textbooks', safeId);

  await setDoc(bookRef, {
    id: safeId,
    title: filename.replace(/\.pdf$/i, ''),
    authors: [],
    description: '',
    thumbnail: '',
    previewText: '',
    infoLink: storageUrl,
    storagePath: storagePath || null,   // path in Firebase Storage for re-download
    storageUrl: storageUrl || null,     // public download URL
    courseId: courseId || null,
    isPdf: true,
    addedAt: new Date().toISOString(),
  }, { merge: true });

  return safeId;
}

// ── Delete textbook ────────────────────────────────────────────────────────────
export async function deleteTextbookFromFirestore(
  userId: string,
  bookId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'textbooks', bookId));
}

// ── Search chunks via Cloud Function (handles PDFs) ────────────────────────────
export async function searchTextbookChunks(
  userId: string,
  bookId: string,
  query: string
): Promise<string[]> {
  try {
    if (!query || query.trim().length === 0) return [];

    const functions = getFunctions();
    const searchFunc = httpsCallable(functions, 'searchTextbookChunks');

    const result = await searchFunc({ userId, bookId, query });
    const resultsData = (result.data as any) || {};
    const chunks = resultsData.results || [];

    // Return the text from the top chunks
    return chunks.map((c: any) => c.text);
  } catch (error: any) {
    // Silently ignore — Cloud Function not deployed yet or no textbooks
    if (error?.code !== 'not-found') {
      console.warn('[textbookService] searchTextbookChunks:', error?.message);
    }
    return [];
  }
}
