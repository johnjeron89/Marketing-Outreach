import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function check() {
  const users = await db.workspace.findMany();
  console.log("Workspaces:", users);
  
  process.exit(0);
}
check();
