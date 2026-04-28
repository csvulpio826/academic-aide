const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdfjsLib = require('pdfjs-dist');
const { Storage } = require('@google-cloud/storage');
const { FieldValue } = require('firebase-admin/firestore');
const { GoogleGenAI } = require('@google/genai');

admin.initializeApp();

const db = admin.firestore();
const storage = new Storage();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Helper to chunk text with overlap
 */
function chunkTextWithOverlap(text, chunkSize = 2000, overlap = 400) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += (chunkSize - overlap);
  }
  return chunks;
}

exports.processPdfUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = object.bucket;

  if (!filePath.includes('/textbooks/') || !filePath.endsWith('.pdf')) {
    console.log(`Skipping non-textbook file: ${filePath}`);
    return;
  }

  const [userId, , , filename] = filePath.split('/');
  const bookId = filename.replace('.pdf', '');

  console.log(`Processing PDF: userId=${userId}, bookId=${bookId}`);

  try {
    const file = storage.bucket(bucket).file(filePath);
    const [pdfBuffer] = await file.download();

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += `[Page ${i}] ${pageText}\n`;
    }

    const chunks = chunkTextWithOverlap(fullText, 2000, 400);
    const batchSize = 100; // smaller batch for embedding calls to avoid rate limits

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const batch = db.batch();

      for (let j = 0; j < batchChunks.length; j++) {
        const text = batchChunks[j];
        
        // Generate embedding using Gemini
        const response = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: text,
          config: {
            outputDimensionality: 256,
          }
        });
        const embedding = response.embeddings[0].values;

        const chunkRef = db.collection('textbooks').doc(bookId).collection('chunks').doc(`chunk_${i + j}`);
        batch.set(chunkRef, {
          text: text,
          embedding: FieldValue.vector(embedding),
          created_at: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      console.log(`Committed batch ${Math.floor(i / batchSize) + 1}`);
    }

    await db.collection('textbooks').doc(bookId).update({
      extraction_status: 'completed',
      chunks_count: chunks.length,
      extracted_at: FieldValue.serverTimestamp(),
    });

    console.log(`✅ PDF processing complete for ${bookId}`);
  } catch (err) {
    console.error(`❌ PDF processing error for ${bookId}:`, err);
    try {
      await db.collection('textbooks').doc(bookId).update({
        extraction_status: 'failed',
        error: err.message,
        failed_at: FieldValue.serverTimestamp(),
      });
    } catch (updateErr) {
      console.error('Failed to update book status:', updateErr);
    }
    throw err;
  }
});

exports.searchTextbookChunks = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { query, bookId } = data;
  if (!query || query.trim().length === 0) return [];

  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: query,
      config: {
        outputDimensionality: 256,
      }
    });
    const queryVector = response.embeddings[0].values;

    let chunksRef;
    if (bookId) {
      chunksRef = db.collection('textbooks').doc(bookId).collection('chunks');
    } else {
      // In a real scenario, you'd filter by userId if searching across all books
      chunksRef = db.collectionGroup('chunks'); 
    }

    // Vector Search (requires Firestore vector index)
    const vectorQuery = chunksRef.findNearest('embedding', FieldValue.vector(queryVector), {
      limit: 10,
      distanceMeasure: 'COSINE'
    });

    const resultsSnap = await vectorQuery.get();
    
    const results = resultsSnap.docs.map(doc => {
      const docData = doc.data();
      return {
        chunk_id: doc.id,
        text: docData.text.substring(0, 500), // Return first 500 chars
      };
    });

    console.log(`Found ${results.length} matching chunks for query: "${query}"`);
    return results;

  } catch (err) {
    console.error('Search error:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});
