const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const mailbox = await prisma.mailboxConnection.findFirst();
  console.log("Mailbox:", mailbox.email);
  console.log("Has accessToken:", !!mailbox.accessToken);
  console.log("Has refreshToken:", !!mailbox.refreshToken);
  
  if (mailbox.refreshToken) {
    const crypto = require('crypto');
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-123';
    const decrypt = (text) => {
      let textParts = text.split(':');
      let iv = Buffer.from(textParts.shift(), 'hex');
      let encryptedText = Buffer.from(textParts.join(':'), 'hex');
      let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    }
    console.log("Decrypted refresh token:", decrypt(mailbox.refreshToken));
  }
}
run();
