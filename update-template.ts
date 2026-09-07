import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const bodyTemplate = `Hi {{investor_name}},

[AI will generate personalization hook here based on thesis]

We’re building TESSILO, an AI system that turns a customer’s WhatsApp JPG into a machine-ready embroidery file in minutes, replacing a manual 3–5 hour digitization process.

After speaking with 20+ factories, we kept hearing the same bottleneck: digitization is too slow, and skilled operators are difficult to find. We now have 10,000+ historical designs, an active pilot discussion, and a team with direct manufacturing, AI/software, and production experience.

We’re raising ₹1.25 Cr pre-seed to build the AI digitizer, run pilots, and reach 50 paying B2B customers.

Would this fit your current investment focus?

Best,
Sahil Ghewari
CEO, TESSILO
sahil@nexaworks.tech
+91 8356954152`;

  await db.emailTemplate.updateMany({
    where: { name: "TESSILO - Initial Outreach (Thesis-Fit)" },
    data: { body: bodyTemplate }
  });

  console.log("Template updated to the 9/10 version.");
}

main().catch(console.error).finally(() => db.$disconnect());
