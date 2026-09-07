import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const ws = await db.workspaceSettings.findFirst();
  console.log("Workspace API Keys set?", ws?.llmApiKey ? true : false, "LLM Keys list length:", (ws?.llmApiKeys as string[])?.length);
}
main().catch(console.error).finally(() => db.$disconnect());
