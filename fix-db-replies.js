const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const stripEmailReply = (body) => {
  const lines = body.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^On\s.+?wrote:\s*$/i.test(trimmed)) break;
    if (/^On\s.+?,?$/i.test(trimmed) && i + 1 < lines.length && /.*wrote:\s*$/i.test(lines[i+1].trim())) break;
    if (/^-{3,}\s*Original Message\s*-{3,}/i.test(trimmed) || /^-{3,}\s*Forwarded message\s*-{3,}/i.test(trimmed)) break;
    if (/^From:\s.+@.+/i.test(trimmed) && i + 1 < lines.length && /^Date:\s/i.test(lines[i+1].trim())) break;
    result.push(line);
  }

  while (result.length > 0) {
    const lastLine = result[result.length - 1].trim();
    if (lastLine.startsWith('>') || lastLine === '') {
      result.pop();
    } else {
      break;
    }
  }
  return result.join('\n').trim();
};

async function run() {
  const messages = await prisma.emailMessage.findMany({
    where: { direction: 'INBOUND' }
  });
  
  for (const msg of messages) {
    const newBody = stripEmailReply(msg.body);
    if (newBody !== msg.body) {
      await prisma.emailMessage.update({
        where: { id: msg.id },
        data: { body: newBody }
      });
      console.log(`Updated message ${msg.id}`);
    }
  }
}
run();
