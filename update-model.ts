import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  await db.workspaceSettings.updateMany({
    data: { llmModel: 'openai/gpt-oss-120b' }
  });
  console.log("Updated AI model to openai/gpt-oss-120b for best hook generation.");
}
main().catch(console.error).finally(() => db.$disconnect());
