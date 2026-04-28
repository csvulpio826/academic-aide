const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const fetch = require('node-fetch'); // Ensure we can use fetch

// Set emulator environment variables
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Initialize Admin SDK with a demo project ID
admin.initializeApp({
  projectId: 'demo-no-project', // Will use the project ID from firebaserc if needed, but demo-project is standard for emulators
  storageBucket: 'demo-no-project.appspot.com',
});

const textContent = `The French Revolution was a period of radical political and societal change in France that began with the Estates General of 1789 and ended with the formation of the French Consulate in November 1799.

One of the primary causes of the French Revolution was the severe economic crisis. France was deeply in debt due to its involvement in various wars, including the American Revolution. The taxation system was highly regressive, placing the burden almost entirely on the Third Estate, while the nobility and clergy were largely exempt. Poor harvests further exacerbated the crisis, leading to food shortages and soaring bread prices. This widespread economic hardship created immense resentment and desperation among the populace.`;

async function runTest() {
  try {
    console.log('1. Connecting to emulators and initializing Storage...');
    const bucket = getStorage().bucket();
    const filePath = 'users/testuser123/textbooks/history_book.pdf';
    const file = bucket.file(filePath);

    console.log('2. Uploading mock PDF (text file) to Storage...');
    await file.save(textContent, {
      contentType: 'application/pdf', 
    });
    console.log('Upload successful.');

    console.log('3. Waiting 10 seconds for processPdfUpload function to trigger and process...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('4. Calling searchTextbookChunks...');
    const projectId = admin.app().options.projectId;
    const region = 'us-central1';
    const functionName = 'searchTextbookChunks';
    const url = `http://127.0.0.1:5001/${projectId}/${region}/${functionName}`;

    const query = 'What were the economic causes?';
    console.log(`Searching with query: "${query}" to ${url}`);

    // Fetch may be available globally in modern node, but just in case
    const globalFetch = typeof fetch === 'undefined' ? global.fetch : fetch;
    
    if (!globalFetch) {
        console.error("fetch is not available. Please ensure node version is 18+ or install node-fetch.");
    }

    const response = await globalFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer owner'
      },
      body: JSON.stringify({
        data: {
          query: query,
          userId: 'testuser123',
          k: 3
        }
      })
    });

    const result = await response.json();
    console.log('5. Search Results:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTest();
