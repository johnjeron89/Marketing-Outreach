import { getDashboardData } from '@/actions/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, Send, MessageSquare, Calendar, Target, AlertCircle, TrendingUp, ArrowUpRight, Plus, FileUp, Eye, CalendarClock, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { PIPELINE_STATUS_CONFIG } from '@/types';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';

// Utility for animating children with staggered delays
const staggerClass = (index: number) => `animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 delay-[${index * 100}ms]`;

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    const { metrics, pipelineCounts, recentActivity, upcomingFollowUps, campaignMetrics } = data;

    const cards = [
      { label: 'Total Investors', value: metrics.totalInvestors, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Emails Sent', value: metrics.totalSent, icon: Send, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
      { label: 'Open Rate', value: `${metrics.openRate}%`, icon: Eye, color: 'text-sky-500', bg: 'bg-sky-500/10' },
      { label: 'Reply Rate', value: `${metrics.replyRate}%`, icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
      { label: 'Active Campaigns', value: metrics.activeCampaigns, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { label: 'Pending Approvals', value: metrics.pendingApprovals, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ];

    // Build funnel bars
    const totalPipelineInvestors = pipelineCounts.reduce((acc, curr) => acc + curr.count, 0) || 1;
    const sortedPipeline = [...pipelineCounts].sort((a, b) => b.count - a.count);

    return (
      <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground mt-1">Your fundraising performance at a glance.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/investors?action=import">
              <Button variant="outline" className="group">
                <FileUp className="mr-2 h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                Import Investors
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button className="group bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                Create Campaign
              </Button>
            </Link>
            {metrics.pendingApprovals > 0 && (
              <Link href="/approvals">
                <Button variant="destructive">
                  <Eye className="mr-2 h-4 w-4" />
                  Review Pending
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <Card key={card.label} className={`group hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 bg-card/50 backdrop-blur-sm ${staggerClass(i)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bg} ${card.color} ring-1 ring-inset ring-current/10`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts 
          dailyStats={data.dailyStats} 
          campaignMetrics={data.campaignMetrics} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          {/* Pipeline Funnel */}
          <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Investors across all stages of your pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPipeline.map((stage, i) => {
                  const config = PIPELINE_STATUS_CONFIG[stage.status as keyof typeof PIPELINE_STATUS_CONFIG];
                  const percentage = Math.max((stage.count / totalPipelineInvestors) * 100, 2); // Minimum 2% width for visibility
                  const StatusIcon = Target;
                  
                  return (
                    <div key={stage.status} className="flex items-center gap-4">
                      <div className="w-40 text-sm font-medium flex flex-col">
                        <span className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4 text-muted-foreground" />
                          {config?.label || stage.status}
                        </span>
                        <span className="text-muted-foreground text-xs">{stage.count} investors</span>
                      </div>
                      <div className="flex-1 h-8 bg-secondary/50 rounded-md overflow-hidden relative group">
                        <div 
                          className="h-full rounded-md transition-all duration-1000 ease-out group-hover:brightness-110"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: config?.color || 'hsl(var(--primary))' 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {sortedPipeline.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    No pipeline data available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Follow-ups */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Upcoming Follow-ups
              </CardTitle>
              <CardDescription>Next actions for active campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {upcomingFollowUps.map((followUp) => (
                    <div key={followUp.id} className="flex flex-col gap-2 p-3 rounded-lg border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm">{followUp.investor.name}</div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {followUp.nextSendAt ? formatDistanceToNow(new Date(followUp.nextSendAt), { addSuffix: true }) : 'Soon'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {followUp.investor.firm && <span>{followUp.investor.firm} &bull; </span>}
                        {followUp.campaign.name}
                      </div>
                      <Link href={`/investors/${followUp.investorId}`}>
                        <Button variant="ghost" size="sm" className="w-full h-7 text-xs mt-1 justify-between text-muted-foreground hover:text-foreground">
                          View Investor <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {upcomingFollowUps.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No upcoming follow-ups.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance */}
        {campaignMetrics && campaignMetrics.length > 0 && (
          <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400 fill-mode-both bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Campaign Performance
              </CardTitle>
              <CardDescription>Track conversion metrics across your active sequences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {campaignMetrics.map((campaign) => (
                  <div key={campaign.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{campaign.name}</span>
                      <span className="text-muted-foreground">{campaign.sent} sent</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Open Rate Bar */}
                      <div className="space-y-1 relative group cursor-default">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Opens</span>
                          <span className="font-medium text-foreground">{campaign.openRate}%</span>
                        </div>
                        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.max(campaign.openRate, 2)}%` }}
                          />
                        </div>
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                          {campaign.opens} / {campaign.sent} opened
                        </div>
                      </div>
                      
                      {/* Reply Rate Bar */}
                      <div className="space-y-1 relative group cursor-default">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Replies</span>
                          <span className="font-medium text-foreground">{campaign.replyRate}%</span>
                        </div>
                        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.max(campaign.replyRate, 2)}%` }}
                          />
                        </div>
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-zinc-100 text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                          {campaign.replies} / {campaign.sent} replied
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l border-border/50 ml-2 space-y-8 py-2">
              {recentActivity.map((log, i) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                    <span className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">{log.entityType}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error: any) {
    console.error("Dashboard error:", error);
    // Fallback/Setup State
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Target className="h-10 w-10 text-primary" />
        </div>
        <div className="text-red-500 mb-4">{error.message || String(error)}</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to Investor OS</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Your workspace is almost ready. Let's get started by importing your target investors or connecting your email.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/investors?action=import">
            <Button size="lg" className="w-full sm:w-auto">
              Import Investors
            </Button>
          </Link>
          <Link href="/settings">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Connect Email
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}
