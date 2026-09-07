"use server";

import { auth } from '@/lib/auth';
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { requireWorkspace } from '@/lib/auth';
import { encrypt, decrypt } from "@/lib/encryption";
import { gmailProvider } from '@/lib/email/gmail';
import { smtpProvider } from '@/lib/email/smtp';

async function getWorkspaceId() {
  const { workspace } = await requireWorkspace();
  return workspace.id;
}

export async function getEmails(params: {
  investorId?: string;
  campaignId?: string;
  status?: string;
  direction?: string;
  page?: number;
  pageSize?: number;
}) {
  const workspaceId = await getWorkspaceId();

  const where: any = { workspaceId };
  if (params.investorId) where.investorId = params.investorId;
  if (params.status) where.status = params.status;
  if (params.direction) where.direction = params.direction;
  if (params.campaignId) {
    where.campaignInvestor = { campaignId: params.campaignId };
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  const [emails, total] = await Promise.all([
    db.emailMessage.findMany({
      where,
      include: {
        investor: { select: { name: true, firm: true, email: true } },
        sequenceStep: { select: { name: true, order: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.emailMessage.count({ where }),
  ]);

  return { emails, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getEmail(id: string) {
  const workspaceId = await getWorkspaceId();

  const email = await db.emailMessage.findFirst({
    where: { id, workspaceId },
    include: {
      investor: true,
      sequenceStep: true,
      campaignInvestor: { include: { campaign: true } },
    },
  });

  if (!email) throw new Error("Email not found");
  return email;
}

export async function approveEmail(id: string) {
  const workspaceId = await getWorkspaceId();

  const email = await db.emailMessage.findFirst({
    where: { id, workspaceId, status: "PENDING_APPROVAL" },
  });

  if (!email) throw new Error("Email not found or not pending approval");

  await db.emailMessage.update({
    where: { id },
    data: { status: "QUEUED" },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "email_approved",
      entityType: "email",
      entityId: id,
      details: { to: email.toEmail, subject: email.subject },
      performedBy: "user",
    },
  });

  // The native engine will handle queued emails via the UI or cron trigger


  revalidatePath("/campaigns");
  return { success: true };
}

export async function approveAllPending(campaignId?: string) {
  const workspaceId = await getWorkspaceId();

  const where: any = {
    workspaceId,
    status: "PENDING_APPROVAL",
  };

  if (campaignId) {
    where.campaignInvestor = { campaignId };
  }

  const emails = await db.emailMessage.findMany({
    where,
    select: { id: true },
  });

  await db.emailMessage.updateMany({
    where: { id: { in: emails.map((e) => e.id) } },
    data: { status: "QUEUED" },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "emails_bulk_approved",
      entityType: "email",
      entityId: campaignId ?? "all",
      details: { count: emails.length },
      performedBy: "user",
    },
  });

  // The native engine will handle queued emails via the UI or cron trigger


  revalidatePath("/campaigns");
  return { approved: emails.length };
}

export async function rejectEmail(id: string, reason?: string) {
  const workspaceId = await getWorkspaceId();

  await db.emailMessage.update({
    where: { id },
    data: { status: "CANCELLED", failureReason: reason ?? "Rejected by user" },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "email_rejected",
      entityType: "email",
      entityId: id,
      details: { reason },
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function editAndApproveEmail(
  id: string,
  data: { subject: string; body: string; previewText?: string },
) {
  const workspaceId = await getWorkspaceId();

  await db.emailMessage.update({
    where: { id },
    data: {
      ...data,
      status: "QUEUED",
    },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "email_edited_and_approved",
      entityType: "email",
      entityId: id,
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function retryFailedEmail(id: string) {
  const workspaceId = await getWorkspaceId();

  const email = await db.emailMessage.findFirst({
    where: { id, workspaceId, status: "FAILED" },
  });

  if (!email) throw new Error("Email not found or not in failed state");
  if (email.retryCount >= email.maxRetries) {
    throw new Error("Maximum retry attempts reached");
  }

  await db.emailMessage.update({
    where: { id },
    data: {
      status: "QUEUED",
      retryCount: { increment: 1 },
      failureReason: null,
    },
  });

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "email_retry",
      entityType: "email",
      entityId: id,
      details: { retryCount: email.retryCount + 1 },
      performedBy: "user",
    },
  });

  revalidatePath("/campaigns");
  return { success: true };
}

export async function generateEmailContent(params: {
  investorId: string;
  campaignId: string;
  sequenceStepId: string;
}) {
  const workspaceId = await getWorkspaceId();

  // Get all required data
  const [investor, workspace, step] = await Promise.all([
    db.investor.findFirst({
      where: { id: params.investorId, workspaceId },
    }),
    db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        companyProfile: {
          include: { fundraisingBrief: true },
        },
        settings: true,
      },
    }),
    db.sequenceStep.findUnique({
      where: { id: params.sequenceStepId },
    }),
  ]);

  if (!investor || !workspace || !step) {
    throw new Error("Required data not found");
  }

  const profile = workspace.companyProfile;
  const brief = profile?.fundraisingBrief;
  const settings = workspace.settings;

  // Determine if we use AI or template fallback
  let subject: string;
  let body: string;
  let personalizationNotes = "";
  let variablesUsed: Record<string, string> = {};

  // Build merge fields
  const fields: Record<string, string> = {
    investor_name: investor.name,
    firm_name: investor.firm ?? "",
    company_name: profile?.companyName ?? "",
    one_line_pitch: profile?.oneLinePitch ?? "",
    founder_name: profile?.founderBio?.split("\n")[0] ?? "",
    industry: profile?.industry ?? "",
    stage: profile?.stage ?? "",
    amount_raising: profile?.amountRaising ?? "",
    traction: profile?.traction ?? "",
    calendar_link: profile?.calendarLink ?? "",
    email_signature: profile?.emailSignature ?? "",
    investor_thesis: investor.sectorThesis ?? "",
    investor_stage_pref: investor.stagePreference ?? "",
    investor_location: investor.location ?? "",
  };

  // Use template if step has templates, otherwise use defaults
  if (step.subjectTemplate && step.bodyTemplate) {
    subject = step.subjectTemplate;
    body = step.bodyTemplate;
  } else {
    // Find matching default template
    const templateType =
      step.order === 0
        ? "cold_outreach"
        : step.order <= 2
          ? `follow_up_${step.order}`
          : "final_follow_up";

    const template = await db.emailTemplate.findFirst({
      where: { workspaceId, type: templateType, isDefault: true },
    });

    subject = template?.subject ?? `Intro: {{company_name}} — {{one_line_pitch}}`;
    body = template?.body ?? `Hi {{investor_name}},\n\n{{one_line_pitch}}\n\nBest,\n{{founder_name}}`;
  }

  // Replace merge fields
  for (const [key, value] of Object.entries(fields)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    if (subject.includes(`{{${key}}}`) || body.includes(`{{${key}}}`)) {
      variablesUsed[key] = value;
    }
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  personalizationNotes = `Template-based email using merge fields: ${Object.keys(variablesUsed).join(", ")}`;

  // Create the email message
  const idempotencyKey = `${params.campaignId}:${params.investorId}:${step.order}`;

  const email = await db.emailMessage.upsert({
    where: { idempotencyKey },
    update: {
      subject,
      body,
      variablesUsed,
      personalizationNotes,
    },
    create: {
      workspaceId,
      direction: "OUTBOUND",
      status: "DRAFT",
      investorId: params.investorId,
      campaignInvestorId: null,
      sequenceStepId: params.sequenceStepId,
      fromEmail: "",
      toEmail: investor.email ?? "",
      subject,
      body,
      variablesUsed,
      personalizationNotes,
      idempotencyKey,
    },
  });

  return email;
}

export async function sendTestEmail(emailId: string, testAddress: string) {
  const workspaceId = await getWorkspaceId();

  const email = await db.emailMessage.findFirst({
    where: { id: emailId, workspaceId },
  });

  if (!email) throw new Error("Email not found");

  // In mock mode, just log it
  console.log(`[TEST EMAIL] To: ${testAddress}, Subject: ${email.subject}`);

  await db.auditLog.create({
    data: {
      workspaceId,
      action: "test_email_sent",
      entityType: "email",
      entityId: emailId,
      details: { testAddress, subject: email.subject },
      performedBy: "user",
    },
  });

  return { success: true, message: "Test email sent (mock mode)" };
}

export async function getPendingApprovals() {
  const workspaceId = await getWorkspaceId();

  return db.emailMessage.findMany({
    where: { workspaceId, status: "PENDING_APPROVAL" },
    include: {
      investor: { select: { name: true, firm: true, email: true } },
      sequenceStep: { select: { name: true, order: true } },
      campaignInvestor: {
        include: { campaign: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getInvestorThread(investorId: string) {
  const workspaceId = await getWorkspaceId();

  const messages = await db.emailMessage.findMany({
    where: {
      workspaceId,
      investorId,
    },
    select: {
      id: true,
      direction: true,
      status: true,
      subject: true,
      body: true,
      fromEmail: true,
      toEmail: true,
      sentAt: true,
      createdAt: true,
      replyClassification: true,
      suggestedResponse: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

export async function sendManualEmail(investorId: string, subject: string, body: string) {
  const { workspace } = await requireWorkspace();
  const workspaceId = workspace.id;

  // Get the investor
  const investor = await db.investor.findFirst({
    where: { id: investorId, workspaceId },
  });
  if (!investor || !investor.email) throw new Error("Investor not found or no email");

  // Get the company profile for signature
  const companyProfile = await db.companyProfile.findUnique({
    where: { workspaceId }
  });

  // Format the body (no automatic header as requested)
  let formattedBody = body;

  let signature = companyProfile?.emailSignature;
  if (!signature) {
    signature = "Best,\nSahil Ghewari\nCEO, TESSILO\nsahilghewari00@gmail.com\n+91 8356954152";
  }

  if (!body.trim().toLowerCase().includes('best,') && !body.trim().toLowerCase().includes('regards,') && !body.trim().toLowerCase().includes('cheers,')) {
    formattedBody = `${formattedBody}\n\n${signature}`;
  }

  // Get the active mailbox for this workspace
  const mailbox = await db.mailboxConnection.findFirst({
    where: { workspaceId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!mailbox) throw new Error("No active mailbox found. Please connect a mailbox in Settings.");

  // Find the last message in this thread to chain the reply
  const lastMessage = await db.emailMessage.findFirst({
    where: { workspaceId, investorId },
    orderBy: { createdAt: "desc" },
    select: { messageIdHeader: true, gmailThreadId: true, subject: true },
  });

  // Prepare credentials
  const credentials = {
    accessToken: mailbox.accessToken ? decrypt(mailbox.accessToken) : undefined,
    refreshToken: mailbox.refreshToken ? decrypt(mailbox.refreshToken) : undefined,
    smtpHost: mailbox.smtpHost ?? undefined,
    smtpPort: mailbox.smtpPort ?? undefined,
    smtpUsername: mailbox.smtpUsername ?? undefined,
    smtpPassword: mailbox.smtpPassword ? decrypt(mailbox.smtpPassword) : undefined,
  };
  
  let email = await db.emailMessage.create({
    data: {
      workspaceId,
      investorId,
      mailboxId: mailbox.id,
      direction: "OUTBOUND",
      status: "QUEUED",
      fromEmail: mailbox.email,
      toEmail: investor.email,
      subject,
      body: formattedBody,
      inReplyToHeader: lastMessage?.messageIdHeader || null,
      gmailThreadId: lastMessage?.gmailThreadId || null,
    },
  });

  const provider = mailbox.provider === 'smtp' ? smtpProvider : gmailProvider;
  let result;
  
  try {
    result = await provider.sendEmail(credentials, {
      to: investor.email,
      subject: subject || "Update",
      body: formattedBody,
      inReplyTo: lastMessage?.messageIdHeader || undefined,
      threadId: lastMessage?.gmailThreadId || undefined,
      trackingId: email.id,
    });
    
    // Update the message with the sent IDs
    email = await db.emailMessage.update({
      where: { id: email.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        gmailMessageId: result.messageId,
        inReplyToHeader: result.messageIdHeader || lastMessage?.messageIdHeader || null,
        gmailThreadId: result.threadId || lastMessage?.gmailThreadId || null,
      }
    });
  } catch (error: any) {
    console.error("Failed to send manual email:", error);
    // Mark as failed
    await db.emailMessage.update({
      where: { id: email.id },
      data: {
        status: "FAILED",
        failureReason: error.message
      }
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }

  revalidatePath(`/investors/${investorId}`);
  revalidatePath("/inbox");
  return email;
}

export async function getInvestorsWithThreads() {
  const workspaceId = await getWorkspaceId();

  // Get all investors that have at least one email message
  const investors = await db.investor.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      emailMessages: { some: {} },
    },
    select: {
      id: true,
      name: true,
      firm: true,
      email: true,
      pipelineStatus: true,
      emailMessages: {
        select: {
          id: true,
          direction: true,
          status: true,
          subject: true,
          body: true,
          fromEmail: true,
          toEmail: true,
          sentAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return investors;
}
