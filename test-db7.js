const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const messages = await prisma.emailMessage.findMany({
    where: { direction: 'INBOUND' },
    select: { id: true, subject: true, inReplyToHeader: true, gmailThreadId: true, body: true }
  });
  console.log("Inbound messages:", messages.length);
  for(const msg of messages) {
    console.log(`- ${msg.id}: ${msg.subject.substring(0,20)}... body length: ${msg.body.length}`);
  }
}
run();
