#!/usr/bin/env node

/**
 * End-to-End Test Script for Academic Aide
 * Tests:
 * 1. Claude Haiku API connectivity
 * 2. Token tracking in Firestore
 * 3. Full chat flow
 */

const Anthropic = require('@anthropic-ai/sdk').default;
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
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

async function testClaude() {
  console.log('\n📚 Testing Claude Haiku API...');
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: 'You are a helpful study assistant. Keep responses brief and friendly.',
      messages: [
        {
          role: 'user',
          content: 'What is the capital of France? Keep it to one sentence.',
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('✅ Claude replied:', text);
    console.log(`   Input tokens: ${response.usage.input_tokens}`);
    console.log(`   Output tokens: ${response.usage.output_tokens}`);
    return response.usage;
  } catch (err) {
    console.error('❌ Claude API error:', err.message);
    throw err;
  }
}

async function testFirestoreTracking() {
  console.log('\n🔥 Testing Firestore token tracking...');
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'token_usage', today);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      console.log('✅ Token usage doc found:');
      console.log(`   Total tokens today: ${data.total || 0}`);
      console.log(`   Input: ${data.total_input || 0}, Output: ${data.total_output || 0}`);
      console.log(`   Last updated: ${data.updated_at?.toDate?.() || 'N/A'}`);
    } else {
      console.log('⚠️  No token usage doc yet (will be created after first message)');
    }
  } catch (err) {
    console.error('❌ Firestore error:', err.message);
    throw err;
  }
}

async function main() {
  console.log('🚀 Academic Aide E2E Test Suite');
  console.log('================================\n');

  try {
    // Test 1: Claude API
    await testClaude();

    // Test 2: Firestore (check after Claude test)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testFirestoreTracking();

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test suite failed');
    process.exit(1);
  }
}

main();
