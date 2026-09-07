import { EngineTrigger } from "@/components/campaigns/engine-trigger";
import { Suspense } from 'react';
import Link from 'next/link';
import { getCampaigns } from '@/actions/campaigns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Target, Plus, Users, Mail, Clock, MoreHorizontal, Play, Pause, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CAMPAIGN_MODE_CONFIG, CAMPAIGN_STATUS_CONFIG } from '@/types';

function CampaignSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse bg-white/5 border-white/10">
          <CardHeader className="h-24"></CardHeader>
          <CardContent className="h-32"></CardContent>
        </Card>
      ))}
    </div>
  );
}

async function CampaignList() {
  const campaigns = await getCampaigns();

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed bg-white/5 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">No campaigns yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Create your first campaign to start reaching out to investors. You can automate sequences or review every message.
        </p>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign: any) => {
        const modeConfig = CAMPAIGN_MODE_CONFIG[campaign.mode as keyof typeof CAMPAIGN_MODE_CONFIG];
        return (
          <Link href={`/campaigns/${campaign.id}`} key={campaign.id} className="group block h-full">
            <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <StatusBadge status={campaign.status} type="campaign" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                  {campaign.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-10 text-xs">
                  {campaign.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col justify-end relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      Investors
                    </div>
                    <span className="font-medium text-foreground">{campaign.campaignInvestors?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="w-4 h-4 mr-2" />
                      Sent Emails
                    </div>
                    <span className="font-medium text-foreground">{
                      campaign.campaignInvestors?.reduce((acc: any, ci: any) => acc + (ci.emailMessages?.filter((m: any) => m.status === 'SENT').length || 0), 0) || 0
                    }</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Updated
                    </div>
                    <span className="text-foreground">
                      {formatDistanceToNow(new Date(campaign.updatedAt || campaign.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <Badge variant="outline" className="bg-background/50 font-normal text-xs text-muted-foreground">
                    {modeConfig?.label || campaign.mode}
                  </Badge>
                  
                  <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your investor outreach campaigns and sequences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EngineTrigger />
          <Link href="/campaigns/new">
            <Button className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<CampaignSkeleton />}>
        <CampaignList />
      </Suspense>
    </div>
  );
}
