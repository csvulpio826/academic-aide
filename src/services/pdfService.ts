import * as FileSystem from 'expo-file-system/legacy';

/**
 * Extract plain text from a PDF file URI using a simple binary parser.
 * This is a lightweight client-side extractor that works without Cloud Functions.
 * It reads raw PDF text streams — works for most text-based PDFs.
 */
export async function extractTextFromPdf(fileUri: string): Promise<string> {
  try {
    // Read PDF as base64 then convert to string for text extraction
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to binary string
    const binary = atob(base64);

    // Extract text from PDF content streams using regex
    // PDF text objects are enclosed in BT...ET blocks
    const textChunks: string[] = [];

    // Match text inside parentheses in BT/ET blocks (Tj, TJ operators)
    const btEtRegex = /BT[\s\S]*?ET/g;
    const btEtMatches = binary.match(btEtRegex) || [];

    for (const block of btEtMatches) {
      // Extract text from Tj operator: (text)Tj
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      for (const m of tjMatches) {
        const text = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
        if (text.trim()) textChunks.push(decodeURIComponent(text.replace(/\\n/g, '\n').replace(/\\r/g, '')));
      }

      // Extract text from TJ operator: [(text) ... ]TJ
      const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
      for (const m of tjArrayMatches) {
        const inner = m.replace(/^\[/, '').replace(/\]\s*TJ$/, '');
        const parts = inner.match(/\(([^)]*)\)/g) || [];
        for (const p of parts) {
          const text = p.slice(1, -1);
          if (text.trim()) textChunks.push(text);
        }
      }
    }

    // Also try extracting from stream objects (for compressed PDFs)
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(binary)) !== null) {
      const stream = streamMatch[1];
      // Look for readable ASCII text in streams
      const readable = stream.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      const words = readable.match(/[A-Za-z]{3,}/g) || [];
      if (words.length > 5) {
        textChunks.push(readable.substring(0, 500));
      }
    }

    const extracted = textChunks.join(' ').replace(/\s+/g, ' ').trim();

    if (!extracted || extracted.length < 50) {
      return '';
    }

    // Return up to 8000 chars (enough for a good summary)
    return extracted.substring(0, 8000);
  } catch (err) {
    console.warn('[pdfService] Text extraction error:', err);
    return '';
  }
}
