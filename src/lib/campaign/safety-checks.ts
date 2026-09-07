import { db } from '../db';
import { PipelineStatus } from '@prisma/client';

export async function canSendToInvestor(investorId: string, campaignId: string): Promise<{ allowed: boolean; reason?: string }> {
  const investor = await db.investor.findUnique({ where: { id: investorId } });
  if (!investor) return { allowed: false, reason: 'Investor not found' };

  if (investor.pipelineStatus === 'DO_NOT_CONTACT' || investor.pipelineStatus === 'PASSED') {
    return { allowed: false, reason: `Investor status is ${investor.pipelineStatus}` };
  }

  if (investor.isBounced) return { allowed: false, reason: 'Previous email bounced' };
  
  const campaignInvestor = await db.campaignInvestor.findFirst({
    where: { investorId, campaignId }
  });

  if (investor.isOptedOut || (campaignInvestor && campaignInvestor.status === 'OPTED_OUT')) {
    return { allowed: false, reason: 'Investor opted out' };
  }

  return { allowed: true };
}

export async function canSendFromMailbox(mailboxId: string): Promise<{ allowed: boolean; reason?: string }> {
  const mailbox = await db.mailboxConnection.findUnique({ where: { id: mailboxId } });
  if (!mailbox) return { allowed: false, reason: 'Mailbox not found' };

  if (!mailbox.isActive) {
    return { allowed: false, reason: 'Mailbox is not active' };
  }

  return { allowed: true };
}

export async function checkDailyVolume(workspaceId: string, mailboxId: string): Promise<{ allowed: boolean; sent: number; limit: number }> {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, include: { settings: true } });
  const limit = workspace?.settings?.dailySendLimit || 20;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sentCount = await db.emailMessage.count({
    where: {
      mailboxId,
      sentAt: { gte: today },
    }
  });

  return { allowed: sentCount < limit, sent: sentCount, limit };
}

export async function isDuplicateSend(campaignInvestorId: string, sequenceStepId: string): Promise<boolean> {
  const log = await db.emailMessage.findFirst({
    where: {
      campaignInvestorId,
      sequenceStepId,
    }
  });
  return !!log;
}

export async function validateCampaignLimits(campaignId: string): Promise<{ valid: boolean; errors: string[] }> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: {
      mailbox: true,
      workspace: { include: { settings: true } }
    }
  });

  const errors: string[] = [];

  if (!campaign) {
    return { valid: false, errors: ['Campaign not found'] };
  }

  if (!campaign.mailboxId) {
    errors.push('No mailbox configured for campaign');
  }

  if (campaign.mailbox && !campaign.mailbox.isActive) {
    errors.push('Configured mailbox is disconnected or inactive');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
