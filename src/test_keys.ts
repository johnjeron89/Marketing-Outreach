import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

const googleKeys = [
  "AIzaSyDemslMNz8dd9l-nrxs2O3UuJxUnlxGCg8",
  "AIzaSyCtm1ZyONsCv1Lh9aerBe41W7Skv9ePjsU",
  "AIzaSyBKtVc2R9S-Rq3FM-Tk65isd2MmJdwydD8",
  "AIzaSyDjVfDDg68JLmH96NmK8OxUzAHeyOTE2b8",
  "AIzaSyDPxf2W0qZEYATM0UhzPCxyritIPxnIkI8",
  "AIzaSyAW950YRv-6Bomke5X57cHQERS9RurVh4Y",
  "AIzaSyD0CzyNHtOH5ePkXIWjirB96UodjuCL0OQ",
  "AIzaSyC9sRbKG6PW9CTrTLqdYSHehKk4su5zCN0",
  "AIzaSyAJwxkcs7B8vBTs33MYnfP5arAIWdUn3NM"
];

const groqKeys = [
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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",
  "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"
];

async function testGroq() {
  console.log("Testing Groq Keys...");
  const validGroqKeys = [];
  for (const key of groqKeys) {
    try {
      const openai = new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
      const res = await openai.models.list();
      if (res.data) {
        console.log(`✅ Groq Key ${key.substring(0, 8)}... is valid`);
        validGroqKeys.push(key);
      }
    } catch (e: any) {
      console.error(`❌ Groq Key ${key.substring(0, 8)}... failed: ${e.message}`);
    }
  }
  return validGroqKeys;
}

async function testGoogle() {
  console.log("\\nTesting Google Keys...");
  const validGoogleKeys = [];
  for (const key of googleKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      // perform a lightweight request
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Say hi"
      });
      if (res.text) {
        console.log(`✅ Google Key ${key.substring(0, 15)}... is valid`);
        validGoogleKeys.push(key);
      }
    } catch (e: any) {
      console.error(`❌ Google Key ${key.substring(0, 15)}... failed: ${e.message}`);
    }
  }
  return validGoogleKeys;
}

async function run() {
  await testGroq();
  await testGoogle();
}

run();
