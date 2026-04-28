import Anthropic from '@anthropic-ai/sdk';
let Constants: any = null;
try { Constants = require('expo-constants').default; } catch { /* not available */ }
import { db } from '../firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

// ─── Provider Config ──────────────────────────────────────────────────────────

const CLAUDE_MODEL = 'claude-haiku-4-5';
const GLM_MODEL = 'glm-4-flash';
const MAX_TOKENS = 1024;
const DAILY_TOKEN_CAP = 125_000;

const GLM_API_KEY = 'bea09c5e5dd045998a1983a30e1dc322.7XbFpreXPAcjgw6E';
const GLM_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export type AIProvider = 'claude' | 'glm';

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
  switchNotice: string | null; // non-null if auto-switched from Claude to GLM
}

// ─── Claude Client ────────────────────────────────────────────────────────────

let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey =
      process.env.ANTHROPIC_API_KEY ||
      (global as any).__ANTHROPIC_API_KEY ||
      Constants?.expoConfig?.extra?.anthropicApiKey ||
      'YOUR_ANTHROPIC_API_KEY';

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set.');
    }
    claudeClient = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return claudeClient;
}

// ─── Token Tracking ───────────────────────────────────────────────────────────

async function trackTokenUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'token_usage', today);
  try {
    await setDoc(
      docRef,
      {
        total_input: increment(inputTokens),
        total_output: increment(outputTokens),
        total: increment(inputTokens + outputTokens),
        user_count: increment(1),
        updated_at: new Date(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[aiService] Token tracking error:', err);
  }
}

async function checkTokenCap(): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'token_usage', today);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    return (snap.data()?.total || 0) >= DAILY_TOKEN_CAP;
  } catch {
    return false;
  }
}

// ─── GLM Call ─────────────────────────────────────────────────────────────────

async function callGLM(history: ChatMessage[], userMessage: string): Promise<string> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(GLM_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages,
      max_tokens: MAX_TOKENS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GLM error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Claude Call ──────────────────────────────────────────────────────────────

async function callClaude(
  userId: string,
  history: ChatMessage[],
  userMessage: string,
  textbookContext: string[]
): Promise<string> {
  const anthropic = getClaudeClient();

  let userContent: Anthropic.MessageParam['content'] = userMessage;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userContent },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages,
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');

  await trackTokenUsage(userId, response.usage.input_tokens, response.usage.output_tokens);
  return block.text;
}

// ─── Helper: Is this a Claude credits/outage error? ───────────────────────────

function isClaudeUnavailableError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('credit') ||
    msg.includes('billing') ||
    msg.includes('quota') ||
    msg.includes('overloaded') ||
    msg.includes('529') ||
    msg.includes('529') ||
    err?.status === 529 ||
    err?.status === 402 ||
    err?.status === 503
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Send a chat message to AI.
 * PRIMARY: GLM-4-Flash (free, fast, default)
 * BACKUP:  Claude Haiku (auto-fallback if GLM fails)
 * Pass providerOverride to force a specific provider.
 */
export async function sendChatMessage(
  userId: string,
  history: ChatMessage[],
  userMessage: string,
  textbookContext: string[] = [],
  providerOverride?: AIProvider
): Promise<AIResponse> {
  // Inject the semantic chunks directly into the prompt
  let finalUserMessage = userMessage;
  if (textbookContext.length > 0) {
    finalUserMessage = `Relevant textbook content:\n${textbookContext.join('\n\n')}\n\nStudent question: ${userMessage}`;
  }

  // Forced Claude
  if (providerOverride === 'claude') {
    const capReached = await checkTokenCap();
    if (capReached) {
      throw new Error('Daily Claude token limit reached. Please try again tomorrow.');
    }
    const text = await callClaude(userId, history, finalUserMessage, textbookContext);
    return { text, provider: 'claude', switchNotice: null };
  }

  // Forced GLM
  if (providerOverride === 'glm') {
    const text = await callGLM(history, finalUserMessage);
    return { text, provider: 'glm', switchNotice: null };
  }

  // Default: try GLM first
  try {
    const text = await callGLM(history, finalUserMessage);
    return { text, provider: 'glm', switchNotice: null };
  } catch (err: any) {
    // GLM failed — fall back to Claude Haiku
    console.warn('[aiService] GLM unavailable, switching to Claude Haiku:', err?.message);
    try {
      const capReached = await checkTokenCap();
      if (capReached) {
        throw new Error('Daily Claude token limit also reached. Both providers unavailable.');
      }
      const text = await callClaude(userId, history, finalUserMessage, textbookContext);
      return {
        text,
        provider: 'claude',
        switchNotice: 'Switched to Claude Haiku (backup AI). Reason: GLM is temporarily unavailable.',
      };
    } catch (claudeErr: any) {
      throw new Error(`Both AI providers failed. GLM: ${err?.message}. Claude: ${claudeErr?.message}`);
    }
  }
}
