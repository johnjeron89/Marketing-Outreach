const { db } = require('./src/lib/db');
const { gmailProvider } = require('./src/lib/email/gmail');
const { decrypt } = require('./src/lib/encryption');
async function run() {
  const mailbox = await db.mailboxConnection.findFirst();
  const credentials = {
    accessToken: decrypt(mailbox.accessToken),
    refreshToken: decrypt(mailbox.refreshToken)
  };
  try {
    const res = await gmailProvider.getNewMessages(credentials, "");
    console.log("Success!", res);
  } catch (err) {
    console.error("Error!", err.message);
  }
}
run();
