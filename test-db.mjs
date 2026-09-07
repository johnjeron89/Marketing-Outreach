import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:NexaWorks%402004@db.oqbifyyknwfagxybdoen.supabase.co:5432/postgres"
    }
  }
})

async function check() {
  try {
    const res = await db.$queryRaw`SELECT 1`;
    console.log("Success! Connected.", res);
  } catch (e) {
    console.error("Failed to connect:", e);
  }
  process.exit(0);
}
check();
