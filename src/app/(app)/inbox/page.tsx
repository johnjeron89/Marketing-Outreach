import { getInvestorsWithThreads } from '@/actions/emails';
import InvestorChat from '@/components/chat/investor-chat';

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ investorId?: string }> }) {
  const investors = await getInvestorsWithThreads();
  const params = await searchParams;

  // Build the initial threads map
  const initialThreads: Record<string, any[]> = {};
  for (const inv of investors) {
    initialThreads[inv.id] = inv.emailMessages;
  }

  // Strip emailMessages from investors for the sidebar prop
  const investorList = investors.map(({ emailMessages, ...rest }) => rest);

  return (
    <div className="flex-1 -m-6 md:-m-8">
      <InvestorChat
        investors={investorList}
        initialThreads={initialThreads}
        selectedInvestorId={params.investorId}
      />
    </div>
  );
}
