import { Suspense } from 'react';
import Link from 'next/link';
import { getCampaign } from '@/actions/campaigns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, Play, Pause, Edit, Trash2, Users, Mail, Reply, Calendar, LayoutGrid, Clock, Settings, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow, format } from 'date-fns';
import { db } from '@/lib/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SequenceBuilder } from '@/components/campaigns/sequence-builder';
import { CampaignActions } from '@/components/campaigns/campaign-actions';
import { EmailActions } from '@/components/campaigns/email-actions';

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const campaign = await getCampaign(resolvedParams.id);

  if (!campaign) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-5xl text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Campaign not found</h2>
        <Link href="/campaigns">
          <Button>Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const isRunning = campaign.status === 'ACTIVE';
  const recentLogs = await db.auditLog.findMany({
    where: { entityId: campaign.id, entityType: 'Campaign' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const funnelStats = {
    pending: campaign.campaignInvestors?.filter(ci => ci.status === 'PENDING').length || 0,
    contacted: campaign.campaignInvestors?.filter(ci => ci.status === 'IN_PROGRESS' || ci.status === 'COMPLETED').length || 0,
    replied: campaign.campaignInvestors?.filter(ci => ci.status === 'REPLIED').length || 0,
    meetings: campaign.campaignInvestors?.filter(ci => ci.investor?.pipelineStatus === 'MEETING_BOOKED').length || 0,
  };
  const total = Math.max(funnelStats.pending + funnelStats.contacted + funnelStats.replied + funnelStats.meetings, 1);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Campaigns
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <StatusBadge status={campaign.status} type="campaign" />
          </div>
          <p className="text-muted-foreground">{campaign.description || "No description provided."}</p>
        </div>

        <CampaignActions campaignId={campaign.id} status={campaign.status} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-background/50 border border-border/50 p-1 w-full md:w-auto h-auto flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4"><LayoutGrid className="w-4 h-4 mr-2"/>Overview</TabsTrigger>
          <TabsTrigger value="investors" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4"><Users className="w-4 h-4 mr-2"/>Investors</TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4"><Mail className="w-4 h-4 mr-2"/>Messages</TabsTrigger>
          <TabsTrigger value="sequence" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4"><Clock className="w-4 h-4 mr-2"/>Sequence</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2 px-4"><Settings className="w-4 h-4 mr-2"/>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Total Investors</p>
                <h3 className="text-3xl font-bold mt-1">{campaign.campaignInvestors?.length || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Sent Emails</p>
                <h3 className="text-3xl font-bold mt-1">{
                  campaign.campaignInvestors?.reduce((acc, ci) => acc + ci.emailMessages.filter(m => m.status === 'SENT').length, 0) || 0
                }</h3>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                    <Reply className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Replies</p>
                <h3 className="text-3xl font-bold mt-1">{
                  campaign.campaignInvestors?.filter(ci => ci.status === 'REPLIED').length || 0
                }</h3>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Meetings Booked</p>
                <h3 className="text-3xl font-bold mt-1">{funnelStats.meetings}</h3>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>Sequence Progress</CardTitle>
                <CardDescription>How investors are flowing through your sequence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm"><span>Pending ({funnelStats.pending})</span><span>{Math.round((funnelStats.pending/total)*100)}%</span></div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden"><div className="h-full bg-slate-500" style={{ width: `${(funnelStats.pending/total)*100}%` }}></div></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm"><span>Contacted ({funnelStats.contacted})</span><span>{Math.round((funnelStats.contacted/total)*100)}%</span></div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(funnelStats.contacted/total)*100}%` }}></div></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm"><span>Replied ({funnelStats.replied})</span><span>{Math.round((funnelStats.replied/total)*100)}%</span></div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${(funnelStats.replied/total)*100}%` }}></div></div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm"><span>Meetings ({funnelStats.meetings})</span><span>{Math.round((funnelStats.meetings/total)*100)}%</span></div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${(funnelStats.meetings/total)*100}%` }}></div></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions in this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                        <RefreshCcw className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-sm"><span className="font-medium text-foreground">{log.action}</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(log.createdAt, { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                  {recentLogs.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No recent activity.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investors" className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Target Investors</CardTitle>
                <CardDescription>Manage who receives emails in this campaign</CardDescription>
              </div>
              <Button size="sm">
                <Users className="w-4 h-4 mr-2" /> Add Investors
              </Button>
            </CardHeader>
            <CardContent>
              {campaign.campaignInvestors && campaign.campaignInvestors.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Investor</TableHead>
                        <TableHead>Firm</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaign.campaignInvestors.map((ci) => (
                        <TableRow key={ci.id}>
                          <TableCell className="font-medium">{ci.investor.name}</TableCell>
                          <TableCell>{ci.investor.firm}</TableCell>
                          <TableCell>{ci.investor.email}</TableCell>
                          <TableCell><Badge variant="outline">{ci.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No investors added yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
             <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Review and manage all campaign messages</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.campaignInvestors?.flatMap(ci => ci.emailMessages).length ? (
                      campaign.campaignInvestors.flatMap(ci => ci.emailMessages).map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-medium">{msg.toEmail}</TableCell>
                          <TableCell>{msg.subject}</TableCell>
                          <TableCell><StatusBadge status={msg.status} type="email" /></TableCell>
                          <TableCell>{msg.sentAt ? format(new Date(msg.sentAt), "MMM d, yyyy") : '-'}</TableCell>
                          <TableCell className="text-right">
                            <EmailActions emailId={msg.id} status={msg.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No messages generated yet. Make sure Trigger.dev is running to process the campaign!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sequence" className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
             <CardHeader>
                <CardTitle>Sequence Steps</CardTitle>
                <CardDescription>Configure the email flow and delays</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="opacity-80 pointer-events-none">
                <SequenceBuilder sequence={campaign.sequenceSteps || []} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6 animate-in fade-in duration-500">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 max-w-2xl">
             <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
                <CardDescription>Configure sending limits and mode</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Campaign Mode</p>
                  <p className="font-medium">{campaign.mode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="font-medium">{campaign.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Daily Send Limit</p>
                  <p className="font-medium">{campaign.dailySendLimit || 'Workspace Default'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Send Window</p>
                  <p className="font-medium">{campaign.sendWindowStart || '09:00'} - {campaign.sendWindowEnd || '17:00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
