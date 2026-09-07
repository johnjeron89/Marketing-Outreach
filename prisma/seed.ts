import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.campaignInvestor.deleteMany();
  await prisma.sequenceStep.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.task.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.investorTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.mailboxConnection.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.fundraisingBrief.deleteMany();
  await prisma.pitchDeck.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.workspaceSettings.deleteMany();
  await prisma.workspace.deleteMany();

  console.log('Cleared existing data.');

  // Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      supabaseUserId: 'user_demo_123',
      name: 'Demo Workspace',
      settings: {
        create: {
          dailySendLimit: 50,
          aiEnabled: true,
          dailySummaryEnabled: true,
        },
      },
    },
  });

  console.log(`Created workspace: ${workspace.name}`);

  // Create Company Profile
  const companyProfile = await prisma.companyProfile.create({
    data: {
      workspaceId: workspace.id,
      companyName: 'NeuralFlow AI',
      url: 'https://neuralflow.example.com',
      oneLinePitch: 'Automating complex workflows with adaptive intelligence.',
      industry: 'B2B SaaS / AI',
      stage: 'Seed',
      amountRaising: '$2.5M',
      valuationTarget: '$15M Post-Money',
      location: 'San Francisco, CA',
      founderBio: 'Jane Doe, previously VP of Eng at TechCorp. John Smith, previously AI Research Scientist at AI Labs.',
      calendarLink: 'https://calendly.com/neuralflow-founder',
      emailSignature: '--\nJane Doe\nCEO, NeuralFlow AI',
      fundraisingBrief: {
        create: {
          problem: 'Enterprises spend millions on manual workflow design.',
          solution: 'An AI engine that designs and optimizes enterprise workflows dynamically.',
          market: '$15B Enterprise automation market.',
          traction: '$15k MRR, 10 early design partners.',
          team: '2 technical founders with deep enterprise and AI background.',
          roundDetails: 'Raising $2.5M on a $15M post.',
          isConfirmed: true,
        },
      },
    },
  });

  console.log(`Created company profile: ${companyProfile.companyName}`);

  // Create Tags
  const tagNames = ['AI/ML', 'Fintech', 'SaaS', 'Seed Stage', 'Series A', 'Top Tier', 'Warm Lead'];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.create({
        data: {
          workspaceId: workspace.id,
          name,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        },
      })
    )
  );

  console.log('Created tags.');

  // Create Email Templates
  const templates = [
    {
      name: 'Cold Outreach',
      type: 'cold_outreach',
      subject: '{{company_name}} <> {{firm_name}} / AI Automation',
      body: 'Hi {{investor_name}},\n\nI saw your recent investment in the AI space and thought {{company_name}} might be up your alley.\n\nWe are {{one_line_pitch}}.\n\nAre you open to a brief chat next week? Here is my calendar: {{calendar_link}}\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'one_line_pitch', 'calendar_link', 'founder_name'],
    },
    {
      name: 'Warm Intro Follow-up',
      type: 'warm_intro_followup',
      subject: 'Intro: {{company_name}} / {{firm_name}}',
      body: 'Hi {{investor_name}},\n\nGreat to meet you! Thanks for the intro.\n\nAs mentioned, {{company_name}} is building the future of automation. Would love to share our deck and find some time to chat.\n\n{{calendar_link}}\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'calendar_link', 'founder_name'],
    },
    {
      name: 'Meeting Follow-up',
      type: 'meeting_followup',
      subject: 'Following up on our chat',
      body: 'Hi {{investor_name}},\n\nGreat chatting with you today. I\'ve attached our deck and the data room link below.\n\nLet me know if you have any questions as you dig in.\n\nBest,\n{{founder_name}}',
      variables: ['investor_name', 'founder_name'],
    },
    {
      name: 'Follow up 1',
      type: 'follow_up_1',
      subject: 'Re: {{company_name}} <> {{firm_name}} / AI Automation',
      body: 'Hi {{investor_name}},\n\nJust floating this to the top of your inbox. Let me know if you have a moment to connect.\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'founder_name'],
    },
    {
      name: 'Follow up 2',
      type: 'follow_up_2',
      subject: 'Re: {{company_name}} <> {{firm_name}} / AI Automation',
      body: 'Hi {{investor_name}},\n\nQuick update: we just hit $20k MRR this month. Would love to chat if you are still looking at Seed stage AI deals.\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'founder_name'],
    },
    {
      name: 'Final Follow up',
      type: 'final_follow_up',
      subject: 'Re: {{company_name}} <> {{firm_name}} / AI Automation',
      body: 'Hi {{investor_name}},\n\nI assume this isn\'t a priority for you right now, so I\'ll stop reaching out. Keep in touch!\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'founder_name'],
    },
    {
      name: 'Reply - Send Deck',
      type: 'reply_send_deck',
      subject: 'Re: {{company_name}} <> {{firm_name}}',
      body: 'Hi {{investor_name}},\n\nThanks for getting back to me. Here is a link to our deck: [Link]\n\nLet me know your thoughts.\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'founder_name'],
    },
    {
      name: 'Reply - Not a Fit',
      type: 'reply_not_fit',
      subject: 'Re: {{company_name}} <> {{firm_name}}',
      body: 'Hi {{investor_name}},\n\nNo worries, appreciate the quick response. We will keep you updated on our progress for the next round!\n\nBest,\n{{founder_name}}',
      variables: ['company_name', 'firm_name', 'investor_name', 'founder_name'],
    },
  ];

  await Promise.all(
    templates.map((t) =>
      prisma.emailTemplate.create({
        data: {
          workspaceId: workspace.id,
          name: t.name,
          type: t.type,
          subject: t.subject,
          body: t.body,
          variables: t.variables,
          isDefault: true,
        },
      })
    )
  );

  console.log('Created email templates.');

  // Create Fictional Investors
  const investorNames = [
    { name: 'Alice Waverly', firm: 'Apex Ventures', title: 'Partner' },
    { name: 'Bob Thorton', firm: 'Horizon Capital', title: 'Managing Director' },
    { name: 'Charlie Kim', firm: 'NextGen Partners', title: 'Principal' },
    { name: 'Diana Ross', firm: 'Starlight Ventures', title: 'Partner' },
    { name: 'Evan Mitchell', firm: 'Blue Ocean Capital', title: 'Associate' },
    { name: 'Fiona Gallagher', firm: 'Summit Partners', title: 'Partner' },
    { name: 'George Huang', firm: 'Pioneer Fund', title: 'Managing Partner' },
    { name: 'Hannah Abbott', firm: 'Riverbed Ventures', title: 'Principal' },
    { name: 'Ian Wright', firm: 'Frontier Capital', title: 'Partner' },
    { name: 'Julia Roberts', firm: 'Evergreen Ventures', title: 'Partner' },
    { name: 'Kevin Lee', firm: 'Silicon Fund', title: 'Principal' },
    { name: 'Laura Martinez', firm: 'Golden Gate Capital', title: 'Partner' },
    { name: 'Mike Johnson', firm: 'Silver Lake Partners', title: 'Managing Director' },
    { name: 'Nina Patel', firm: 'Bessemer Venture Partners', title: 'Partner' },
    { name: 'Oscar Isaac', firm: 'Sequoia Capital', title: 'Partner' },
    { name: 'Paul Rudd', firm: 'Andreessen Horowitz', title: 'Partner' },
    { name: 'Quinn Fabray', firm: 'Lightspeed Venture Partners', title: 'Partner' },
    { name: 'Rachel Green', firm: 'Index Ventures', title: 'Partner' },
    { name: 'Steve Rogers', firm: 'Founders Fund', title: 'Partner' },
    { name: 'Tony Stark', firm: 'Khosla Ventures', title: 'Partner' },
    { name: 'Uma Thurman', firm: 'Benchmark', title: 'Partner' },
    { name: 'Victor Von Doom', firm: 'Greylock Partners', title: 'Partner' },
    { name: 'Wanda Maximoff', firm: 'Accel', title: 'Partner' },
    { name: 'Xavier Charles', firm: 'Kleiner Perkins', title: 'Partner' },
    { name: 'Yvonne Strahovski', firm: 'First Round Capital', title: 'Partner' }
  ];

  const statuses = ['DRAFT', 'READY_TO_SEND', 'SENT', 'REPLIED', 'INTERESTED', 'MEETING_BOOKED', 'PASSED', 'NO_RESPONSE', 'FOLLOW_UP_DUE', 'DO_NOT_CONTACT'];

  for (let i = 0; i < 25; i++) {
    const inv = investorNames[i];
    const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
    
    await prisma.investor.create({
      data: {
        workspaceId: workspace.id,
        name: inv.name,
        email: `${inv.name.toLowerCase().replace(' ', '.')}@example.com`,
        firm: inv.firm,
        partnerTitle: inv.title,
        pipelineStatus: status,
        location: 'San Francisco, CA',
        stagePreference: 'Seed, Series A',
        notes: 'Generated fictional investor data.',
        tags: {
          create: [
            {
              tagId: tags[Math.floor(Math.random() * tags.length)].id,
            }
          ]
        }
      },
    });
  }

  console.log('Created 25 fictional investors.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
