"use server";

import { auth } from '@/lib/auth';
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  url: z.string().url().optional().or(z.literal("")),
  oneLinePitch: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  amountRaising: z.string().optional(),
  valuationTarget: z.string().optional(),
  location: z.string().optional(),
  traction: z.string().optional(),
  founderBio: z.string().optional(),
  calendarLink: z.string().url().optional().or(z.literal("")),
  emailSignature: z.string().optional(),
  keyLinks: z
    .object({
      dataRoom: z.string().optional(),
      demo: z.string().optional(),
      website: z.string().optional(),
      other: z.string().optional(),
    })
    .optional(),
});

export async function getOrCreateWorkspace() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
    include: {
      companyProfile: {
        include: { pitchDeck: true, fundraisingBrief: true },
      },
      settings: true,
      mailboxConnections: true,
    },
  });

  if (!workspace) {
    workspace = await db.workspace.create({
      data: {
        supabaseUserId: userId,
        name: "My Workspace",
        settings: {
          create: {
            dailySendLimit: 20,
            sendWindowStart: "09:00",
            sendWindowEnd: "17:00",
          },
        },
      },
      include: {
        companyProfile: {
          include: { pitchDeck: true, fundraisingBrief: true },
        },
        settings: true,
        mailboxConnections: true,
      },
    });
  }

  return workspace;
}

export async function saveCompanyProfile(
  data: z.infer<typeof companyProfileSchema>,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
    include: { companyProfile: true },
  });

  if (!workspace) throw new Error("Workspace not found");

  const validated = companyProfileSchema.parse(data);

  if (workspace.companyProfile) {
    await db.companyProfile.update({
      where: { id: workspace.companyProfile.id },
      data: {
        ...validated,
        keyLinks: validated.keyLinks as Record<string, string> | undefined,
      },
    });
  } else {
    await db.companyProfile.create({
      data: {
        workspaceId: workspace.id,
        ...validated,
        keyLinks: validated.keyLinks as Record<string, string> | undefined,
      },
    });
  }

  await db.auditLog.create({
    data: {
      workspaceId: workspace.id,
      action: "company_profile_updated",
      entityType: "company_profile",
      entityId: workspace.id,
      details: { fields: Object.keys(validated) },
      performedBy: "user",
    },
  });

  revalidatePath("/onboarding");
  revalidatePath("/settings/company");
  return { success: true };
}

export async function saveFundraisingBrief(data: {
  problem?: string;
  solution?: string;
  market?: string;
  traction?: string;
  team?: string;
  roundDetails?: string;
  keyProofPoints?: Array<{ point: string; confirmed: boolean }>;
  missingInfo?: string[];
  isConfirmed?: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
    include: { companyProfile: true },
  });

  if (!workspace?.companyProfile) {
    throw new Error("Company profile required first");
  }

  const existing = await db.fundraisingBrief.findUnique({
    where: { companyProfileId: workspace.companyProfile.id },
  });

  if (existing) {
    await db.fundraisingBrief.update({
      where: { id: existing.id },
      data: {
        ...data,
        keyProofPoints: data.keyProofPoints as any,
        missingInfo: data.missingInfo as any,
      },
    });
  } else {
    await db.fundraisingBrief.create({
      data: {
        companyProfileId: workspace.companyProfile.id,
        ...data,
        keyProofPoints: data.keyProofPoints as any,
        missingInfo: data.missingInfo as any,
      },
    });
  }

  revalidatePath("/onboarding");
  revalidatePath("/settings/company");
  return { success: true };
}

export async function updateWorkspaceSettings(data: {
  dailySendLimit?: number;
  sendWindowStart?: string;
  sendWindowEnd?: string;
  sendOnWeekends?: boolean;
  aiEnabled?: boolean;
  llmProvider?: string;
  llmApiKey?: string;
  llmModel?: string;
  dailySummaryEnabled?: boolean;
  dailySummaryTime?: string;
  complianceFooter?: string;
  outreachType?: string;
  customSystemPrompt?: string | null;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
  });

  if (!workspace) throw new Error("Workspace not found");

  await db.workspaceSettings.upsert({
    where: { workspaceId: workspace.id },
    update: data,
    create: {
      workspaceId: workspace.id,
      ...data,
    },
  });

  await db.auditLog.create({
    data: {
      workspaceId: workspace.id,
      action: "settings_updated",
      entityType: "workspace_settings",
      entityId: workspace.id,
      details: { fields: Object.keys(data) },
      performedBy: "user",
    },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function getOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const workspace = await db.workspace.findUnique({
      where: { supabaseUserId: userId },
      include: {
        companyProfile: {
          include: { pitchDeck: true, fundraisingBrief: true },
        },
        mailboxConnections: true,
        _count: { select: { investors: true } },
      },
    });

    if (!workspace) return { step: "company" as const, completed: [] };

    const completed: string[] = [];
    if (workspace.companyProfile) completed.push("company");
    if (workspace.companyProfile?.pitchDeck) completed.push("pitch-deck");
    if (workspace.mailboxConnections.length > 0) completed.push("gmail");
    if (workspace._count.investors > 0) completed.push("investors");

    const steps = ["company", "pitch-deck", "gmail", "investors", "review"];
    const nextStep =
      steps.find((s) => !completed.includes(s)) || "review";

    return { 
      step: nextStep, 
      completed,
      data: {
        companyName: workspace.companyProfile?.companyName || null,
        hasPitchDeck: !!workspace.companyProfile?.pitchDeck,
        mailboxEmail: workspace.mailboxConnections[0]?.email || null,
        investorsCount: workspace._count.investors || 0
      }
    };
  } catch {
    return { step: "company" as const, completed: [], data: null };
  }
}

export async function getWorkspaceSettings() {
  const { userId } = await auth();
  if (!userId) return null;

  const workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
    include: { settings: true }
  });

  return workspace?.settings || null;
}
