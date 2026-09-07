"use server";

import { auth } from '@/lib/auth';
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CampaignMode, CampaignStatus } from "@prisma/client";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  mode: z.enum(["DRAFT_ONLY", "REVIEW_BEFORE_SEND", "AUTOMATED"]),
  mailboxId: z.string().optional(),
  filterTags: z.array(z.string()).optional(),
  filterStages: z.array(z.string()).optional(),
  filterGeography: z.array(z.string()).optional(),
  filterThesis: z.array(z.string()).optional(),
  filterFirms: z.array(z.string()).optional(),
  filterRelationship: z.array(z.string()).optional(),
  excludeInvestorIds: z.array(z.string()).optional(),
  dailySendLimit: z.number().min(1).max(100).optional(),
  sendWindowStart: z.string().optional(),
  sendWindowEnd: z.string().optional(),
  sequence: z.array(z.any()).optional(), // Will use sequenceStepSchema for validation later if needed
});

const sequenceStepSchema = z.object({
  order: z.number().min(0),
  name: z.string().min(1),
  templateId: z.string().optional(),
  delayDays: z.number().min(0).max(30),
  requiresApproval: z.boolean(),
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string().optional(),
});

import { requireWorkspace } from '@/lib/auth';

async function getWorkspaceId() {
  const { workspace } = await requireWorkspace();
  return workspace.id;
}

export async function getCampaigns() {
  const workspaceId = await getWorkspaceId();

  const campaigns = await db.campaign.findMany({
    where: { workspaceId, deletedAt: null },
    include: {
      _count: {
        select: { campaignInvestors: true, sequenceSteps: true },
      },
      mailbox: { select: { email: true, displayName: true } },
      sequenceSteps: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns;
}

export async function getCampaign(id: string) {
  const workspaceId = await getWorkspaceId();

  const campaign = await db.campaign.findFirst({
    where: { id, workspaceId, deletedAt: null },
    include: {
      sequenceSteps: { orderBy: { order: "asc" } },
      mailbox: true,
      campaignInvestors: {
        include: {
          investor: true,
          emailMessages: { orderBy: { createdAt: "desc" } },
        },
      },
      _count: {
        select: { campaignInvestors: true },
      },
    },
  });

  if (!campaign) throw new Error("Campaign not found");
  return campaign;
}

export async function createCampaign(data: z.infer<typeof campaignSchema>) {
  const workspaceId = await getWorkspaceId();
  const validated = campaignSchema.parse(data);
  const { sequence, mailboxId, ...campaignData } = validated;
  
  const createData: any = {
    workspaceId,
    ...campaignData,
    filterTags: validated.filterTags ?? [],
    filterStages: validated.filterStages ?? [],
    filterGeography: validated.filterGeography ?? [],
    filterThesis: validated.filterThesis ?? [],
    filterFirms: validated.filterFirms ?? [],
    filterRelationship: validated.filterRelationship ?? [],
    excludeInvestorIds: validated.excludeInvestorIds ?? [],
  };

  if (mailboxId && mailboxId !== "none" && mailboxId !== "") {
    createData.mailboxId = mailboxId;
  }

  const campaign = await db.campaign.create({
    data: createData,
  });

  if (validated.sequence && validated.sequence.length > 0) {
    await db.sequenceStep.createMany({
      data: validated.sequence.map((step: any, index: number) => ({
        campaignId: campaign.id,
        order: step.order ?? index,
        name: step.name || `Step ${index + 1}`,
        delayDays: step.delayDays ?? (index === 0 ? 0 : 3),
        requiresApproval: step.requiresApproval ?? (validated.mode === "REVIEW_BEFORE_SEND"),
        bodyTemplate: step.bodyTemplate || "",
        subjectTemplate: step.subjectTemplate || "",
        templateId: step.templateId || null,
      })),
    });
  } else {
    // Create default sequence steps
    await db.sequenceStep.createMany({
      data: [
        {
          campaignId: campaign.id,
          order: 0,
          name: "Initial Email",
          delayDays: 0,
          requiresApproval: validated.mode === "REVIEW_BEFORE_SEND",
          bodyTemplate: "",
        },
        {
          campaignId: campaign.id,
          order: 1,
          name: "Follow-up 1",
          delayDays: 3,
          requiresApproval: validated.mode === "REVIEW_BEFORE_SEND",
          bodyTemplate: "",
        },
      ],
    });
  }

  // Find matching investors and attach them to the campaign
  const whereArgs: any = { workspaceId, deletedAt: null };
  if (validated.filterTags && validated.filterTags.length > 0) {
    whereArgs.tags = { some: { name: { in: validated.filterTags } } };
  }
  if (validated.filterStages && validated.filterStages.length > 0) {
    whereArgs.stagePreference = { in: validated.filterStages };
  }

  const matchingInvestors = await db.investor.findMany({
    where: whereArgs,
    select: { id: true }
  });

  if (matchingInvestors.length > 0) {
    await db.campaignInvestor.createMany({
      data: matchingInvestors.map(inv => ({
        campaignId: campaign.id,
        investorId: inv.id,
        status: "PENDING",
      }))
    });
  }

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "campaign_created",
      entityType: "campaign",
      entityId: campaign.id,
      details: { name: campaign.name, mode: campaign.mode },
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  return campaign;
}

export async function getTargetingCount(filters: {
  filterTags?: string[];
  filterStages?: string[];
  filterGeography?: string[];
  filterThesis?: string[];
}) {
  const workspaceId = await getWorkspaceId();
  
  const whereArgs: any = { workspaceId, deletedAt: null };
  if (filters.filterTags && filters.filterTags.length > 0) {
    whereArgs.tags = { some: { name: { in: filters.filterTags } } };
  }
  if (filters.filterStages && filters.filterStages.length > 0) {
    whereArgs.stagePreference = { in: filters.filterStages };
  }
  // Other filters can be added here

  const count = await db.investor.count({
    where: whereArgs
  });
  
  return count;
}

export async function updateCampaign(
  id: string,
  data: Partial<z.infer<typeof campaignSchema>>,
) {
  const workspaceId = await getWorkspaceId();

  const campaign = await db.campaign.findFirst({
    where: { id, workspaceId, deletedAt: null },
  });
  if (!campaign) throw new Error("Campaign not found");

  if (campaign.status === "ACTIVE" && data.mode === "AUTOMATED") {
    throw new Error(
      "Cannot switch to automated mode while campaign is active",
    );
  }

  const updated = await db.campaign.update({
    where: { id },
    data,
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "campaign_updated",
      entityType: "campaign",
      entityId: id,
      details: { fields: Object.keys(data) },
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  return updated;
}

export async function updateSequenceStep(
  stepId: string,
  data: Partial<z.infer<typeof sequenceStepSchema>>,
) {
  const workspaceId = await getWorkspaceId();

  const step = await db.sequenceStep.findUnique({
    where: { id: stepId },
    include: { campaign: true },
  });

  if (!step || step.campaign.workspaceId !== workspaceId) {
    throw new Error("Step not found");
  }

  await db.sequenceStep.update({
    where: { id: stepId },
    data,
  });

  revalidatePath(`/campaigns/${step.campaignId}`);
  return { success: true };
}

export async function addInvestorsToCampaign(
  campaignId: string,
  investorIds: string[],
) {
  const workspaceId = await getWorkspaceId();

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, workspaceId, deletedAt: null },
  });
  if (!campaign) throw new Error("Campaign not found");

  // Filter out investors already in campaign
  const existing = await db.campaignInvestor.findMany({
    where: {
      campaignId,
      investorId: { in: investorIds },
    },
    select: { investorId: true },
  });

  const existingIds = new Set(existing.map((e) => e.investorId));
  const newIds = investorIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    return { added: 0, skipped: investorIds.length };
  }

  // Check for do-not-contact, bounced, opted-out investors
  const ineligible = await db.investor.findMany({
    where: {
      id: { in: newIds },
      workspaceId,
      OR: [
        { pipelineStatus: "DO_NOT_CONTACT" },
        { isBounced: true },
        { isOptedOut: true },
      ],
    },
    select: { id: true },
  });

  const ineligibleIds = new Set(ineligible.map((i) => i.id));
  const eligible = newIds.filter((id) => !ineligibleIds.has(id));

  await db.campaignInvestor.createMany({
    data: eligible.map((investorId) => ({
      campaignId,
      investorId,
      status: "PENDING" as const,
    })),
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "investors_added_to_campaign",
      entityType: "campaign",
      entityId: campaignId,
      details: {
        added: eligible.length,
        skipped: existingIds.size,
        ineligible: ineligibleIds.size,
      },
      performedBy: "user",
    },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return {
    added: eligible.length,
    skipped: existingIds.size,
    ineligible: ineligibleIds.size,
  };
}

export async function launchCampaign(campaignId: string) {
  const workspaceId = await getWorkspaceId();

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, workspaceId, deletedAt: null },
    include: {
      sequenceSteps: true,
      mailbox: true,
      _count: { select: { campaignInvestors: true } },
    },
  });

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "DRAFT") {
    throw new Error("Campaign must be in draft status to launch");
  }
  if (!campaign.mailbox) {
    throw new Error("Campaign must have a connected mailbox");
  }
  if (campaign.sequenceSteps.length === 0) {
    throw new Error("Campaign must have at least one sequence step");
  }
  if (campaign._count.campaignInvestors === 0) {
    throw new Error("Campaign must have at least one investor");
  }

  if (campaign.mode === "AUTOMATED") {
    // Require explicit confirmation
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: "ACTIVE",
        confirmedAt: new Date(),
      },
    });
  } else {
    await db.campaign.update({
      where: { id: campaignId },
      data: { status: "ACTIVE" },
    });
  }

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "campaign_launched",
      entityType: "campaign",
      entityId: campaignId,
      details: {
        mode: campaign.mode,
        investorCount: campaign._count.campaignInvestors,
        stepCount: campaign.sequenceSteps.length,
      },
      performedBy: "user",
    },
  });

  // The engine can now be manually triggered from the UI, or picked up by Vercel Cron.

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

export async function pauseCampaign(campaignId: string) {
  const workspaceId = await getWorkspaceId();

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "PAUSED" },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "campaign_paused",
      entityType: "campaign",
      entityId: campaignId,
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

export async function resumeCampaign(campaignId: string) {
  const workspaceId = await getWorkspaceId();

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE" },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "campaign_resumed",
      entityType: "campaign",
      entityId: campaignId,
      performedBy: "user",
    },
  });
  // The engine can now be manually triggered from the UI, or picked up by Vercel Cron.

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

export async function deleteCampaign(campaignId: string) {
  const workspaceId = await getWorkspaceId();

  await db.campaign.update({
    where: { id: campaignId },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "campaign_deleted",
      entityType: "campaign",
      entityId: campaignId,
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function getMatchingInvestors(campaignId: string) {
  const workspaceId = await getWorkspaceId();

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, workspaceId, deletedAt: null },
  });
  if (!campaign) throw new Error("Campaign not found");

  // Build filter query from campaign filters
  const where: any = {
    workspaceId,
    deletedAt: null,
    pipelineStatus: { not: "DO_NOT_CONTACT" },
    isBounced: false,
    isOptedOut: false,
  };

  if (campaign.filterStages.length > 0) {
    where.stagePreference = { in: campaign.filterStages };
  }

  if (campaign.filterGeography.length > 0) {
    where.location = { in: campaign.filterGeography };
  }

  if (campaign.excludeInvestorIds.length > 0) {
    where.id = { notIn: campaign.excludeInvestorIds };
  }

  if (campaign.filterFirms.length > 0) {
    where.firm = { in: campaign.filterFirms };
  }

  const investors = await db.investor.findMany({
    where,
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { name: "asc" },
  });

  // Additional tag filtering (requires join)
  if (campaign.filterTags.length > 0) {
    return investors.filter((inv) =>
      inv.tags.some((t) => campaign.filterTags.includes(t.tag.name)),
    );
  }

  return investors;
}
