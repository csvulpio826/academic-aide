# Academic Aide — Deployment Guide

## Cloud Functions Setup

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Google Cloud project linked to your Firebase project
- Admin access to the project

### Deploy PDF Processing Function

```bash
cd functions
firebase deploy --only functions
```

This deploys:
- **processPdfUpload** — Triggered when PDFs upload to Storage, extracts text and chunks it
- **searchTextbookChunks** — HTTP endpoint for searching PDF chunks in chat

### What It Does

1. **PDF Upload Trigger**
   - Watches: `gs://academic-aide.firebasestorage.app/users/{userId}/textbooks/{filename}.pdf`
   - Extracts text from PDF using pdf.js
   - Chunks text into ~2000-char pieces
   - Saves chunks to Firestore: `textbooks/{bookId}/chunks/{chunk_id}`
   - Updates book metadata with `extraction_status: "completed"`

2. **Search Endpoint**
   - Called from ChatScreen when user sends a message
   - Searches all user's PDF chunks for query keywords
   - Returns top 10 matching chunks (first 500 chars each)
   - Used as RAG context in Claude responses

### Local Testing (Emulator)

```bash
# Terminal 1: Start Firebase emulator
firebase emulators:start

# Terminal 2: In your app, uncomment the connectFunctionsEmulator line in src/firebase.ts
# Rebuild and run the app against the emulator
```

### Firestore Structure

```
textbooks/{bookId}/
  ├─ title: string
  ├─ authors: string[]
  ├─ description: string
  ├─ extraction_status: "pending" | "completed" | "failed"
  ├─ chunks_count: number
  ├─ extracted_at: timestamp
  └─ chunks/{chunkId}/
     ├─ text: string (the actual chunk)
     ├─ page: number (rough estimate)
     └─ created_at: timestamp
```

### Troubleshooting

**Function not triggering?**
- Check Cloud Functions logs: `firebase functions:log`
- Verify Storage path matches: `users/{userId}/textbooks/*.pdf`
- Ensure PDF is actually uploading (check Storage console)

**Search returns no results?**
- Wait 10-30s after PDF upload (extraction is async)
- Check Firestore console for chunks under `textbooks/{bookId}/chunks`
- Verify `extraction_status` is "completed"

**Token limit exceeded?**
- Each PDF extraction uses ~1K-5K tokens (depending on PDF size)
- Each search query uses ~200-500 tokens
- Monitor daily spend in Firestore's `token_usage` collection

### Costs

- **Cloud Storage**: Free tier includes 5GB/month
- **Cloud Functions**: Free tier includes 2M invocations/month, 400K GB-seconds/month
- **Firestore**: Free tier includes 50K reads, 20K writes, 20K deletes/day

For 10 beta testers with light usage, you'll stay well under free tier limits.

---

## Next Steps

1. Deploy functions: `firebase deploy --only functions`
2. Test PDF upload in the app
3. Send a chat message mentioning the PDF
4. Verify chunks appear in chat context

Once verified, the PDF feature is ready for beta testing.
