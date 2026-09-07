import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function check() {
  try {
    const workspaceId = 'cmtn27b8i0047it1ckcy54f34';

    // Get counts for each pipeline status
    const pipelineCounts = await db.investor.groupBy({
      by: ['pipelineStatus'],
      where: { workspaceId, deletedAt: null },
      _count: true,
    });
    console.log("pipelineCounts:", pipelineCounts);
    
    // Get email stats
    const totalSent = await db.emailMessage.count({
      where: { workspaceId, direction: 'OUTBOUND', status: 'SENT' },
    });
    console.log("totalSent:", totalSent);
    
    const recentActivity = await db.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    console.log("recentActivity count:", recentActivity.length);
    
    console.log("All DB queries succeeded.");
  } catch (error) {
    console.error("DB Query Error:", error);
  }
  process.exit(0);
}
check();
