import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    console.log("No workspace found. Please log in first.");
    return;
  }

  // Update Company Profile for TESSILO
  await db.companyProfile.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      companyName: "TESSILO",
      oneLinePitch: "An AI system that turns a customer's WhatsApp JPG into a machine-ready embroidery file in minutes.",
      industry: "AI / Manufacturing",
      stage: "Pre-seed",
      amountRaising: "₹1.25 Cr",
      valuationTarget: "",
      location: "India",
      traction: "20+ factories consulted, 10,000+ historical designs, ₹25L of prior software revenue, an active pilot discussion.",
      founderBio: "Direct experience across textile manufacturing, AI/software, and production.",
    },
    update: {
      companyName: "TESSILO",
      oneLinePitch: "An AI system that turns a customer's WhatsApp JPG into a machine-ready embroidery file in minutes.",
      industry: "AI / Manufacturing",
      stage: "Pre-seed",
      amountRaising: "₹1.25 Cr",
      traction: "20+ factories consulted, 10,000+ historical designs, ₹25L of prior software revenue, an active pilot discussion.",
      founderBio: "Direct experience across textile manufacturing, AI/software, and production.",
    }
  });

  // Create TESSILO Email Template
  const bodyTemplate = `Hi {{investor_name}},

[AI will generate personalization hook here based on thesis]

We’re building TESSILO, an AI system that turns a customer’s WhatsApp JPG into a machine-ready embroidery file in minutes, replacing a manual 3–5 hour digitization process.

We’ve already spoken with 20+ factories, have 10,000+ historical designs, an active pilot discussion, and a team with direct experience across textile manufacturing, AI/software, and production.

We’re raising ₹1.25 Cr pre-seed to build the AI digitizer, run pilots, and reach 50 paying B2B customers over the next 12 months.

I’ve attached the deck. Would TESSILO be relevant to your current investment focus?

Best, 
Sahil Ghewari 
CEO, TESSILO 
sahil@nexaworks.tech 
+91 8356954152`;

  await db.emailTemplate.create({
    data: {
      workspaceId: workspace.id,
      name: "TESSILO - Initial Outreach (Thesis-Fit)",
      type: "initial",
      subject: "TESSILO | AI for embroidery production",
      body: bodyTemplate,
      variables: ["investor_name"],
    }
  });

  console.log("TESSILO Company Profile and Thesis-Fit Template successfully created in your workspace!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
