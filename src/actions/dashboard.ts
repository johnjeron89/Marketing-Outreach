'use server';

import { db } from '@/lib/db';
import { requireWorkspace } from '@/lib/auth';

export async function getDashboardData() {
  const { workspace } = await requireWorkspace();
  const workspaceId = workspace.id;
  
  // Get counts for each pipeline status
  const pipelineCounts = await db.investor.groupBy({
    by: ['pipelineStatus'],
    where: { workspaceId, deletedAt: null },
    _count: true,
  });
  
  // Get email stats
  const totalSent = await db.emailMessage.count({
    where: { workspaceId, direction: 'OUTBOUND', status: 'SENT' },
  });
  
  const totalReplies = await db.emailMessage.count({
    where: { workspaceId, direction: 'INBOUND' },
  });
  
  const bounces = await db.emailMessage.count({
    where: { workspaceId, status: 'BOUNCED' },
  });
  
  const totalOpens = await db.emailMessage.count({
    where: { workspaceId, direction: 'OUTBOUND', openCount: { gt: 0 } },
  });

  // Active campaigns
  const activeCampaigns = await db.campaign.count({
    where: { workspaceId, status: 'ACTIVE', deletedAt: null },
  });
  
  // Pending approvals
  const pendingApprovals = await db.emailMessage.count({
    where: { workspaceId, status: 'PENDING_APPROVAL' },
  });
  
  // Investors needing response
  const tasksNeedingAction = await db.task.count({
    where: { workspaceId, status: 'pending' },
  });
  
  // Total investors
  const totalInvestors = await db.investor.count({
    where: { workspaceId, deletedAt: null },
  });
  
  // Recent activity (timeline events)
  const recentActivity = await db.auditLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  // Upcoming follow-ups
  const upcomingFollowUps = await db.campaignInvestor.findMany({
    where: {
      campaign: { workspaceId },
      status: 'IN_PROGRESS',
      nextSendAt: { not: null },
    },
    include: { investor: true, campaign: true },
    orderBy: { nextSendAt: 'asc' },
    take: 5,
  });

  // Campaign specific metrics
  const activeCampaignList = await db.campaign.findMany({
    where: { workspaceId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, name: true }
  });

  const campaignMetrics = await Promise.all(activeCampaignList.map(async (c) => {
    const sent = await db.emailMessage.count({
      where: { workspaceId, direction: 'OUTBOUND', status: 'SENT', campaignInvestor: { campaignId: c.id } }
    });
    const opens = await db.emailMessage.count({
      where: { workspaceId, direction: 'OUTBOUND', openCount: { gt: 0 }, campaignInvestor: { campaignId: c.id } }
    });
    const replies = await db.emailMessage.count({
      where: { workspaceId, direction: 'INBOUND', campaignInvestor: { campaignId: c.id } }
    });
    
    return {
      id: c.id,
      name: c.name,
      sent,
      opens,
      replies,
      openRate: sent > 0 ? Math.round((opens / sent) * 100) : 0,
      replyRate: sent > 0 ? Math.round((replies / sent) * 100) : 0,
    };
  }));
  
  // Calculate Daily Stats (Timeline) for the last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const recentMessages = await db.emailMessage.findMany({
    where: { 
      workspaceId,
      createdAt: { gte: fourteenDaysAgo }
    },
    select: {
      direction: true,
      status: true,
      openCount: true,
      createdAt: true
    }
  });

  const dailyStatsMap: Record<string, { date: string; sent: number; opens: number; replies: number }> = {};
  
  // Initialize the last 14 days with 0
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyStatsMap[dateStr] = { date: dateStr, sent: 0, opens: 0, replies: 0 };
  }

  // Populate actual data
  recentMessages.forEach(msg => {
    const dateStr = msg.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyStatsMap[dateStr]) {
      if (msg.direction === 'OUTBOUND' && msg.status === 'SENT') {
        dailyStatsMap[dateStr].sent += 1;
        if (msg.openCount > 0) dailyStatsMap[dateStr].opens += 1;
      }
      if (msg.direction === 'INBOUND') {
        dailyStatsMap[dateStr].replies += 1;
      }
    }
  });

  const dailyStats = Object.values(dailyStatsMap);

  return {
    metrics: {
      totalInvestors,
      totalSent,
      totalOpens,
      totalReplies,
      openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
      replyRate: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0,
      bounceRate: totalSent > 0 ? Math.round((bounces / totalSent) * 100) : 0,
      activeCampaigns,
      pendingApprovals,
      tasksNeedingAction,
      passes: pipelineCounts.find(p => p.pipelineStatus === 'PASSED')?._count ?? 0,
    },
    pipelineCounts: pipelineCounts.map(p => ({
      status: p.pipelineStatus,
      count: p._count,
    })),
    recentActivity,
    upcomingFollowUps,
    campaignMetrics,
    dailyStats,
  };
}
