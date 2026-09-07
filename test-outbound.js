const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const messages = await prisma.emailMessage.findMany({
    where: { direction: 'OUTBOUND' },
    select: { id: true, subject: true, messageIdHeader: true, gmailThreadId: true, status: true }
  });
  console.log(messages);
}
run();
