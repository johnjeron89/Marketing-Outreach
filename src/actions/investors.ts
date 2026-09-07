'use server';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { investorSchema } from '@/lib/validations/investors';

import { requireWorkspace } from '@/lib/auth';

async function getWorkspaceId() {
  const { workspace } = await requireWorkspace();
  return workspace.id;
}

export async function getInvestors(params: {
  search?: string;
  status?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  const { search, status, tags, page = 1, pageSize = 50, sortBy = 'createdAt', sortOrder = 'desc' } = params;

  const where: any = { workspaceId, deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { firm: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.pipelineStatus = status;
  }

  if (tags && tags.length > 0) {
    where.tags = {
      some: {
        name: { in: tags },
      },
    };
  }

  const skip = (page - 1) * pageSize;

  const [investors, total] = await Promise.all([
    db.investor.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        tags: true,
      },
    }),
    db.investor.count({ where }),
  ]);

  return { investors, total, page, pageSize };
}

export async function getInvestor(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  const investor = await db.investor.findFirst({
    where: { id, workspaceId, deletedAt: null },
    include: {
      tags: { include: { tag: true } },
      timelineEvents: {
        orderBy: { createdAt: 'desc' },
      },
      emailMessages: {
        orderBy: { createdAt: 'desc' },
      },
      campaignInvestors: true,
    },
  });

  if (!investor) throw new Error('Investor not found');

  return investor;
}

export async function createInvestor(data: z.infer<typeof investorSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  const validated = investorSchema.parse(data);

  // Check for existing email in workspace
  const existing = await db.investor.findFirst({
    where: { email: validated.email, workspaceId },
  });

  if (existing) {
    throw new Error('Investor with this email already exists in the workspace');
  }

  const { tags, ...investorData } = validated;



  const investor = await db.investor.create({
    data: {
      ...investorData,
      workspaceId,
      pipelineStatus: investorData.pipelineStatus || 'DRAFT',
      tags: {
        create: tags?.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { workspaceId_name: { workspaceId, name: tag } },
              create: { name: tag, workspaceId },
            },
          },
        })) || [],
      },
      timelineEvents: {
        create: {
          type: 'CREATED',
          title: 'Investor Added',
          description: 'Investor was added to the workspace.',
          metadata: {},
        },
      },
    },
  });

  await db.auditLog.create({
    data: {
      action: 'INVESTOR_CREATED',
      entityId: investor.id,
      entityType: 'INVESTOR',
      performedBy: userId,
      workspaceId,
      details: { name: investor.name, firm: investor.firm },
    },
  });

  revalidatePath('/investors');
  return investor;
}

export async function updateInvestor(id: string, data: Partial<z.infer<typeof investorSchema>>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  // Verify ownership
  const existing = await db.investor.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new Error('Investor not found');

  const { tags, ...investorData } = data;

  const updateData: any = { ...investorData };

  if (tags) {
    updateData.tags = {
      deleteMany: {},
      create: tags.map((tag) => ({
        tag: {
          connectOrCreate: {
            where: { workspaceId_name: { workspaceId, name: tag } },
            create: { name: tag, workspaceId },
          },
        },
      })),
    };
  }

  const investor = await db.investor.update({
    where: { id },
    data: updateData,
  });

  if (existing.pipelineStatus !== investor.pipelineStatus) {
    await db.timelineEvent.create({
      data: {
        investorId: investor.id,
        type: 'STATUS_CHANGED',
        title: `Status changed to ${investor.pipelineStatus}`,
        metadata: { from: existing.pipelineStatus, to: investor.pipelineStatus },
      },
    });
  }

  await db.auditLog.create({
    data: {
      action: 'INVESTOR_UPDATED',
      entityId: investor.id,
      entityType: 'INVESTOR',
      performedBy: userId,
      workspaceId,
      details: updateData,
    },
  });

  revalidatePath(`/investors/${id}`);
  revalidatePath('/investors');
  return investor;
}

export async function deleteInvestor(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  await db.investor.updateMany({
    where: { id, workspaceId },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      action: 'INVESTOR_DELETED',
      entityId: id,
      entityType: 'INVESTOR',
      performedBy: userId,
      workspaceId,
    },
  });

  revalidatePath('/investors');
}

export async function restoreInvestor(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  await db.investor.updateMany({
    where: { id, workspaceId },
    data: { deletedAt: null },
  });

  revalidatePath('/investors');
}

export async function updatePipelineStatus(id: string, newStatus: string) {
  return updateInvestor(id, { pipelineStatus: newStatus as any });
}

export async function bulkUpdateStatus(ids: string[], newStatus: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  await db.investor.updateMany({
    where: { id: { in: ids }, workspaceId },
    data: { pipelineStatus: newStatus as any },
  });

  // Create timeline events for each
  const events = ids.map((id) => ({
    investorId: id,
    type: 'STATUS_CHANGED',
    title: `Status bulk updated to ${newStatus}`,
  }));

  await db.timelineEvent.createMany({ data: events as any });

  revalidatePath('/investors');
}

export async function addNote(investorId: string, note: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  await db.timelineEvent.create({
    data: {
      investorId,
      type: 'NOTE_ADDED',
      title: 'Note added',
      description: note,
    },
  });

  revalidatePath(`/investors/${investorId}`);
}

export async function exportInvestorsToCSV() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  const investors = await db.investor.findMany({
    where: { workspaceId, deletedAt: null },
    include: { tags: { include: { tag: true } } },
  });

  if (investors.length === 0) return '';

  const headers = ['Name', 'Firm', 'Email', 'Pipeline Status', 'Tags', 'Location', 'Stage Preference'];
  const rows = investors.map((inv) => [
    inv.name,
    inv.firm,
    inv.email,
    inv.pipelineStatus || '',
    inv.tags.map((t: any) => t.name).join(', '),
    inv.location || '',
    inv.stagePreference || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

export async function bulkImportInvestors(investors: {
  name: string;
  firm: string;
  email: string;
  typicalCheckSize?: string;
  stagePreference?: string;
  location?: string;
  linkedinUrl?: string;
  partnerTitle?: string;
  website?: string;
  sectorThesis?: string;
  portfolioCompanies?: string;
  relationshipStatus?: string;
  warmIntroSource?: string;
  notes?: string;
  recentMilestone?: string;
  personalConnection?: string;
  customIcebreaker?: string;
}[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const workspaceId = await getWorkspaceId();

  const emails = investors.map(i => i.email).filter(Boolean);
  const existing = await db.investor.findMany({
    where: { workspaceId, email: { in: emails } },
    select: { email: true }
  });
  
  const existingEmails = new Set(existing.map(i => i.email?.toLowerCase()));
  const newInvestors = investors.filter(i => i.email && !existingEmails.has(i.email.toLowerCase()));

  if (newInvestors.length === 0) return { count: 0 };

  const data = newInvestors.map(i => ({
    workspaceId,
    name: i.name || 'Unknown',
    firm: i.firm || 'Unknown',
    email: i.email.toLowerCase(),
    typicalCheckSize: i.typicalCheckSize || null,
    stagePreference: i.stagePreference || null,
    location: i.location || null,
    linkedinUrl: i.linkedinUrl || null,
    partnerTitle: i.partnerTitle || null,
    website: i.website || null,
    sectorThesis: i.sectorThesis || null,
    portfolioCompanies: i.portfolioCompanies || null,
    relationshipStatus: i.relationshipStatus || null,
    warmIntroSource: i.warmIntroSource || null,
    notes: i.notes || null,
    recentMilestone: i.recentMilestone || null,
    personalConnection: i.personalConnection || null,
    customIcebreaker: i.customIcebreaker || null,
    pipelineStatus: 'DRAFT' as any
  }));

  const result = await db.investor.createMany({
    data,
    skipDuplicates: true
  });

  await db.auditLog.create({
    data: {
      action: 'INVESTORS_BULK_IMPORTED',
      entityId: workspaceId,
      entityType: 'WORKSPACE',
      performedBy: userId,
      workspaceId,
      details: { count: result.count }
    }
  });

  revalidatePath('/investors');
  return { count: result.count };
}
