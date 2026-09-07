import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const msg = await db.emailMessage.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, subject: true, body: true, status: true }
  });
  console.log(JSON.stringify(msg, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
