const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msg = await prisma.emailMessage.findFirst({
    where: { direction: 'OUTBOUND', subject: 'Update' },
    orderBy: { createdAt: 'desc' }
  });
  console.log(msg);
}
run();
