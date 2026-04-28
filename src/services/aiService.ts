import { db } from '../firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import Constants from 'expo-constants';

// ─── Provider Config ──────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_TOKENS = 1024;
const DAILY_USER_TOKEN_CAP = 2_000_000; // ~ 2 million tokens per user per day (approx $0.30/day)

export type AIProvider = 'gemini';

const SYSTEM_PROMPT = `You are Academic Aide, a friendly AI study assistant for students.
Help students understand concepts, answer questions, and stay on track.
Be concise and clear. Use plain text only — no markdown, no bold, no asterisks, no symbols.
Use simple dashes for lists. Adapt to the student's level. Never make up facts.`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  switchNotice: string | null;
}

// ─── Token Tracking ───────────────────────────────────────────────────────────

async function trackTokenUsage(userId: string, totalTokens: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'token_usage', `${userId}_${today}`);
  try {
    await setDoc(
      docRef,
      {
        total: increment(totalTokens),
        updated_at: new Date(),
        userId: userId,
        date: today
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[aiService] Token tracking error:', err);
  }
}

async function checkTokenCap(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'token_usage', `${userId}_${today}`);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    return (snap.data()?.total || 0) >= DAILY_USER_TOKEN_CAP;
  } catch {
    return false;
  }
}

// ─── Gemini Call ──────────────────────────────────────────────────────────────

async function callGemini(
  userId: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (global as any).__GEMINI_API_KEY ||
    Constants?.expoConfig?.extra?.geminiApiKey ||
    'YOUR_GEMINI_API_KEY';

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  // Convert generic chat history to Gemini format
  const contents = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  // Add the current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
      }
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Track tokens if provided by the API
  const tokenUsage = data.usageMetadata?.totalTokenCount || 0;
  if (tokenUsage > 0) {
    await trackTokenUsage(userId, tokenUsage);
  }

  return text;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function sendChatMessage(
  userId: string,
  history: ChatMessage[],
  userMessage: string,
  textbookContext: string[] = [],
  scheduleContext: string = '',
  providerOverride?: AIProvider
): Promise<AIResponse> {
  // Inject context if any
  let finalUserMessage = userMessage;
  
  const contextParts = [];
  if (textbookContext.length > 0) {
    contextParts.push(`Relevant textbook content:\n${textbookContext.join('\n\n')}`);
  }
  if (scheduleContext) {
    contextParts.push(`Student's schedule:\n${scheduleContext}`);
  }

  if (contextParts.length > 0) {
    finalUserMessage = `${contextParts.join('\n\n')}\n\nStudent question: ${userMessage}`;
  }

  const capReached = await checkTokenCap(userId);
  if (capReached) {
    throw new Error('You have reached your daily AI usage limit. Please try again tomorrow.');
  }

  const text = await callGemini(userId, history, finalUserMessage);
  
  return { text, provider: 'gemini', switchNotice: null };
}
