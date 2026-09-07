const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msg = await prisma.emailMessage.findFirst({
    where: { body: { contains: 'okay we can schedule' } },
    orderBy: { createdAt: 'desc' }
  });
  console.log(msg);
}
run();
