import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const steps = await db.sequenceStep.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { campaign: true }
  });
  console.log(JSON.stringify(steps, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
