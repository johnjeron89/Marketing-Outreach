const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const messages = await prisma.emailMessage.findMany({
    where: { direction: 'INBOUND' },
    select: { id: true, subject: true, inReplyToHeader: true, gmailThreadId: true }
  });
  console.log(messages);
}
run();
