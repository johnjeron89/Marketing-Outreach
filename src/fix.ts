import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const settings = await prisma.workspaceSettings.findFirst();
  console.log("API Keys in DB:", settings?.llmApiKeys);

  const inboundMsg = await prisma.emailMessage.findFirst({
    where: { direction: 'INBOUND' },
    orderBy: { createdAt: 'desc' }
  });

  if (inboundMsg) {
    console.log("Found inbound msg:", inboundMsg.subject);
    console.log("Classification was:", inboundMsg.replyClassification);
    
    // Delete it so it syncs again
    await prisma.emailMessage.delete({ where: { id: inboundMsg.id } });
    console.log("Deleted inbound msg to force re-sync");
  } else {
    console.log("No inbound messages found");
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
