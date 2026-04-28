const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    console.log("Fetching available models...");
    let response = await ai.models.list();
    
    console.log("\nAvailable Embedding Models:");
    // @google/genai list() returns an async iterable usually, or an object with an array.
    // Let's just log the whole response or iterate if it's iterable.
    
    let hasEmbeddings = false;
    for await (const model of response) {
        if (model.name.includes("embed")) {
            console.log(`- ${model.name} (Supported Methods: ${model.supportedGenerationMethods.join(', ')})`);
            hasEmbeddings = true;
        }
    }
    
    if (!hasEmbeddings) {
       console.log("No models containing 'embed' found in the list.");
    }
  } catch (e) {
    console.error(e);
  }
}

listModels();