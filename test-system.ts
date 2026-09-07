import { db } from './src/lib/db';
import { gmailProvider } from './src/lib/email/gmail';
import { decrypt } from './src/lib/encryption';

async function run() {
  console.log("=== SYSTEM CHECK ===");
  
  // 1. Mailbox Status
  const mailbox = await db.mailboxConnection.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`\n1. Active Mailbox: ${mailbox?.email || 'None'}`);
  console.log(`   Has Credentials: ${!!mailbox?.accessToken && !!mailbox?.refreshToken}`);
  console.log(`   Last Sync: ${mailbox?.lastSyncAt}`);
  console.log(`   Sync Error: ${mailbox?.syncError || 'None'}`);

  // 2. Outbound Messages
  const outbound = await db.emailMessage.findMany({
    where: { direction: 'OUTBOUND', status: 'SENT' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, toEmail: true, subject: true, sentAt: true }
  });
  
  console.log(`\n2. Recent Outbound Messages (Sent): ${outbound.length}`);
  outbound.forEach(msg => {
    console.log(`   - To: ${msg.toEmail} | Subject: ${msg.subject} | Sent: ${msg.sentAt}`);
  });

  // 3. Inbound Messages
  const inbound = await db.emailMessage.findMany({
    where: { direction: 'INBOUND' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, fromEmail: true, subject: true, sentAt: true }
  });
  
  console.log(`\n3. Recent Inbound Messages (Received): ${inbound.length}`);
  inbound.forEach(msg => {
    console.log(`   - From: ${msg.fromEmail} | Subject: ${msg.subject} | Received: ${msg.sentAt}`);
  });
}
run();
