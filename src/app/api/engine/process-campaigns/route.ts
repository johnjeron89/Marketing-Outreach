import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePersonalizedEmail } from '@/lib/ai';

export const maxDuration = 300; // Allow 5 minutes on Vercel

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("[Engine] Starting campaign processor...");
    
    // Find active campaigns
    const campaigns = await db.campaign.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null
      },
      include: {
        mailbox: true,
        workspace: {
          include: {
            settings: true,
            companyProfile: {
              include: { fundraisingBrief: true }
            }
          }
        },
        sequenceSteps: { orderBy: { order: "asc" } },
        campaignInvestors: {
          where: {
            status: { in: ["PENDING", "IN_PROGRESS"] },
            // only process those where nextSendAt is null or past
            OR: [
              { nextSendAt: null },
              { nextSendAt: { lte: new Date() } }
            ]
          },
          include: { investor: true }
        }
      }
    });

    console.log(`[Engine] Found ${campaigns.length} active campaigns to process.`);
    let processedCount = 0;

    for (const campaign of campaigns) {
      if (!campaign.mailbox) continue;
      
      const dailyLimit = campaign.dailySendLimit || 20;
      let sentToday = 0;

      for (const campInv of campaign.campaignInvestors) {
        if (sentToday >= dailyLimit) break;

        const currentStepOrder = campInv.currentStepOrder;
        const step = campaign.sequenceSteps.find(s => s.order === currentStepOrder);
        
        if (!step) {
          // Campaign finished for this investor
          await db.campaignInvestor.update({
            where: { id: campInv.id },
            data: { status: "COMPLETED" }
          });
          continue;
        }

        const toEmail = campInv.investor.email;
        if (!toEmail) continue;

        let rawSubject = step.subjectTemplate || "";
        let rawBody = step.bodyTemplate || "";
        let templateAttachments: string[] = [];

        if (step.templateId) {
          const template = await db.emailTemplate.findUnique({ where: { id: step.templateId } });
          if (template) {
            rawSubject = template.subject || rawSubject;
            rawBody = template.body || rawBody;
            templateAttachments = template.attachments || [];
          }
        }

        if (!rawSubject && !rawBody) {
          console.warn(`[Engine] Skipping investor ${campInv.id} - No template found for step ${currentStepOrder}`);
          await db.campaignInvestor.update({
            where: { id: campInv.id },
            data: { 
              status: "ERROR", 
              skipReason: "No template provided for this step" 
            }
          });
          continue;
        }

        // AI Personalization
        const apiKeys = campaign.workspace.settings?.llmApiKeys as string[] || [];
        const provider = campaign.workspace.settings?.llmProvider || "groq";
        const model = campaign.workspace.settings?.llmModel || "llama-3.3-70b-versatile";

        const { subject, body } = await generatePersonalizedEmail(apiKeys, {
          investorName: campInv.investor.name || "",
          investorFirm: campInv.investor.firm || "",
          investorThesis: campInv.investor.sectorThesis || "",
          investorStagePreference: campInv.investor.stagePreference || "",
          investorNotes: campInv.investor.notes || "",
          recentMilestone: campInv.investor.recentMilestone || "",
          personalConnection: campInv.investor.personalConnection || "",
          customIcebreaker: campInv.investor.customIcebreaker || "",
          systemPrompt: campaign.workspace.settings?.customSystemPrompt || undefined,
          companyName: campaign.workspace.companyProfile?.companyName || "Our Startup",
          oneLinePitch: campaign.workspace.companyProfile?.oneLinePitch || "",
          fundraisingProblem: campaign.workspace.companyProfile?.fundraisingBrief?.problem || "",
          fundraisingSolution: campaign.workspace.companyProfile?.fundraisingBrief?.solution || "",
          senderName: campaign.mailbox.displayName || campaign.mailbox.email,
          baseSubjectTemplate: rawSubject,
          baseBodyTemplate: rawBody,
        }, provider, model);

        // Determine if approval required
        const requireApproval = step.requiresApproval || campaign.mode === "REVIEW_BEFORE_SEND";
        
        await db.emailMessage.create({
          data: {
            workspaceId: campaign.workspaceId,
            investorId: campInv.investor.id,
            campaignInvestorId: campInv.id,
            sequenceStepId: step.id,
            mailboxId: campaign.mailboxId,
            direction: "OUTBOUND",
            status: requireApproval ? "PENDING_APPROVAL" : "QUEUED",
            fromEmail: campaign.mailbox.email,
            toEmail,
            subject,
            body,
            attachments: templateAttachments,
          }
        });

        // Determine next send date based on the NEXT step's delay
        const nextStep = campaign.sequenceSteps.find(s => s.order === currentStepOrder + 1);
        
        await db.campaignInvestor.update({
          where: { id: campInv.id },
          data: {
            status: "IN_PROGRESS",
            currentStepOrder: currentStepOrder + 1,
            // If there's a next step, add its delay. If no next step, set to null (finished).
            nextSendAt: nextStep 
              ? new Date(Date.now() + (nextStep.delayDays * 24 * 60 * 60 * 1000))
              : null
          }
        });
        
        processedCount++;
        sentToday++;
      }
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (error: any) {
    console.error("[Engine] process-campaigns error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
