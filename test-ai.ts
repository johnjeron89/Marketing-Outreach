import { PrismaClient } from '@prisma/client';
import { generatePersonalizedEmail } from './src/lib/ai/index';

const db = new PrismaClient();

async function main() {
  const ws = await db.workspaceSettings.findFirst();
  const apiKeys = ws?.llmApiKeys as string[];
  
  const context = {
    investorName: "John Doe",
    investorFirm: "Sequoia Capital",
    investorThesis: "B2B SaaS, AI infrastructure",
    investorStagePreference: "Seed",
    investorNotes: "Invested in OpenAI, Anthropic.",
    companyName: "TESSILO",
    oneLinePitch: "AI for embroidery production",
    fundraisingProblem: "Slow manual digitization",
    fundraisingSolution: "AI digitization",
    senderName: "Sahil Ghewari",
    baseSubjectTemplate: "TESSILO | AI for embroidery production",
    baseBodyTemplate: "Hi {{investor_name}},\n\n[AI will generate personalization hook here based on thesis]\n\nWe’re building TESSILO..."
  };

  console.log("Testing API Keys with Groq...");
  try {
    const result = await generatePersonalizedEmail(apiKeys, context, "groq", "openai/gpt-oss-120b");
    console.log("SUCCESS:");
    console.log(result.body);
  } catch (err) {
    console.error("FAILED:");
    console.error(err);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
