import { db } from './src/lib/db';

const GEMINI_KEYS = [
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

const GROQ_KEYS = [
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

async function run() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    console.log("No workspace found.");
    return;
  }

  // We will store Groq keys in llmApiKeys and set provider to groq
  await db.workspaceSettings.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      llmApiKeys: GROQ_KEYS, // using Groq for optimal performance
      aiEnabled: true,
      llmProvider: "groq",
      llmModel: "llama-3.3-70b-versatile"
    },
    update: {
      llmApiKeys: GROQ_KEYS,
      aiEnabled: true,
      llmProvider: "groq",
      llmModel: "llama-3.3-70b-versatile"
    }
  });

  console.log(`Successfully injected ${GROQ_KEYS.length} Groq API keys into Workspace Settings!`);
}

run();
