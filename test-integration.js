#!/usr/bin/env node

/**
 * Integration Test: Full chat flow with token tracking
 * Simulates what happens when a user sends a message in the app
 */

const Anthropic = require('@anthropic-ai/sdk').default;
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  increment,
} = require('firebase/firestore');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TEST_USER_ID = 'test-user-' + Date.now();

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: 'AIzaSyB1n3D7OduhzA-EAHg9xrICay1k7DTCVwc',
  authDomain: 'academic-aide.firebaseapp.com',
  projectId: 'academic-aide',
  storageBucket: 'academic-aide.firebasestorage.app',
  messagingSenderId: '861423624712',
  appId: '1:861423624712:android:3b9c133e29ee95dee3e7bd',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Academic Aide, a friendly and knowledgeable AI study assistant for students.
Your job is to help students understand concepts, answer homework questions, explain topics clearly, and keep them on track.
Be concise but thorough. Use bullet points and structure when helpful. Adapt to the student's level.`;

async function sendMessage(userId, message, history = []) {
  console.log(`\n💬 Sending: "${message}"`);

  const messages = [
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log(`🤖 Claude replied: ${text.substring(0, 100)}...`);

  // Track in Firestore
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'token_usage', today);
  await setDoc(
    docRef,
    {
      total_input: increment(response.usage.input_tokens),
      total_output: increment(response.usage.output_tokens),
      total: increment(response.usage.input_tokens + response.usage.output_tokens),
      updated_at: new Date(),
    },
    { merge: true }
  );

  console.log(
    `📊 Tokens tracked: +${response.usage.input_tokens} input, +${response.usage.output_tokens} output`
  );

  return {
    text,
    tokens: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

async function main() {
  console.log('🚀 Academic Aide Integration Test');
  console.log('==================================');
  console.log(`Test User ID: ${TEST_USER_ID}`);

  try {
    // Simulate a multi-turn conversation
    const history = [];

    // Message 1
    const msg1 = await sendMessage(
      TEST_USER_ID,
      'Explain photosynthesis in simple terms'
    );
    history.push({ role: 'user', content: 'Explain photosynthesis in simple terms' });
    history.push({ role: 'assistant', content: msg1.text });

    // Message 2 (follow-up)
    await new Promise((resolve) => setTimeout(resolve, 500));
    const msg2 = await sendMessage(
      TEST_USER_ID,
      'What is the difference between photosynthesis and respiration?',
      history
    );
    history.push({ role: 'user', content: 'What is the difference between photosynthesis and respiration?' });
    history.push({ role: 'assistant', content: msg2.text });

    // Check Firestore
    console.log('\n🔥 Checking Firestore token_usage...');
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'token_usage', today);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      console.log('✅ Token usage tracked:');
      console.log(`   Total input: ${data.total_input}`);
      console.log(`   Total output: ${data.total_output}`);
      console.log(`   Grand total: ${data.total}`);
      console.log(`   Last updated: ${data.updated_at.toDate()}`);
    } else {
      console.error('❌ Token usage doc not found!');
      process.exit(1);
    }

    console.log('\n✅ Integration test passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Integration test failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();
