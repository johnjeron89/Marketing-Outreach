import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gmailProvider } from '@/lib/email/gmail';
import { smtpProvider } from '@/lib/email/smtp';
import { decrypt } from '@/lib/encryption';

export const maxDuration = 300; // Allow 5 minutes on Vercel

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("[Engine] Looking for QUEUED emails to send...");
    
    const queuedEmails = await db.emailMessage.findMany({
      where: { status: "QUEUED" },
      include: {
        mailbox: true
      },
      take: 50 // process in batches
    });

    console.log(`[Engine] Found ${queuedEmails.length} queued emails.`);
    let sentCount = 0;

    for (const email of queuedEmails) {
      if (!email.mailbox) {
        await db.emailMessage.update({
          where: { id: email.id },
          data: { status: "FAILED", failureReason: "No mailbox attached" }
        });
        continue;
      }

      try {
        const credentials = {
          accessToken: email.mailbox.accessToken ? decrypt(email.mailbox.accessToken) : undefined,
          refreshToken: email.mailbox.refreshToken ? decrypt(email.mailbox.refreshToken) : undefined,
          smtpHost: email.mailbox.smtpHost ?? undefined,
          smtpPort: email.mailbox.smtpPort ?? undefined,
          smtpUsername: email.mailbox.smtpUsername ?? undefined,
          smtpPassword: email.mailbox.smtpPassword ? decrypt(email.mailbox.smtpPassword) : undefined,
        };
        
        const provider = email.mailbox.provider === 'smtp' ? smtpProvider : gmailProvider;
        const result = await provider.sendEmail(credentials, {
          to: email.toEmail,
          subject: email.subject || "No Subject",
          body: email.body || "",
          inReplyTo: email.inReplyToHeader ?? undefined,
          trackingId: email.id,
          attachments: email.attachments,
        });

        await db.emailMessage.update({
          where: { id: email.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            gmailMessageId: result.messageId,
            gmailThreadId: result.threadId,
            messageIdHeader: result.messageIdHeader
          }
        });

        sentCount++;
      } catch (error: any) {
        console.error(`[Engine] Failed to send email ${email.id}:`, error);
        await db.emailMessage.update({
          where: { id: email.id },
          data: {
            status: "FAILED",
            failureReason: error.message || "Unknown error",
            retryCount: email.retryCount + 1
          }
        });
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    console.error("[Engine] send-emails error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
