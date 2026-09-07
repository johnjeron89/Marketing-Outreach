import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const emails = await db.emailMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, status: true, subject: true, body: true, sequenceStepId: true }
  });
  console.log(JSON.stringify(emails, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
