import { getInvestor } from '@/actions/investors';
import { getInvestorThread } from '@/actions/emails';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Globe, MapPin, Building2, Briefcase, Calendar, Link } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import InvestorChatMini from '@/components/chat/investor-chat-mini';

export default async function InvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const investor = await getInvestor(resolvedParams.id);
  const emailThread = await getInvestorThread(resolvedParams.id);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{investor.name}</h2>
          <p className="text-muted-foreground">{investor.firm}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-lg px-4 py-1">
            {investor.pipelineStatus}
          </Badge>
          <Button variant="outline">Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{investor.email}</span>
              </div>
              {investor.website && (
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={investor.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    Website
                  </a>
                </div>
              )}
              {investor.linkedinUrl && (
                <div className="flex items-center space-x-2 text-sm">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <a href={investor.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {investor.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{investor.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investment Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" /> Sector Thesis
                    </h4>
                    <p className="text-sm text-muted-foreground">{investor.sectorThesis || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Stage Preference</h4>
                    <p className="text-sm text-muted-foreground">{investor.stagePreference || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Check Size</h4>
                    <p className="text-sm text-muted-foreground">{investor.typicalCheckSize || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Portfolio Companies
                    </h4>
                    <p className="text-sm text-muted-foreground">{investor.portfolioCompanies || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="emails">
              <InvestorChatMini
                investorId={investor.id}
                investorName={investor.name}
                investorEmail={investor.email}
                initialMessages={emailThread}
              />
            </TabsContent>
            <TabsContent value="campaigns">
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Campaign enrollment history will appear here.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {investor.tags?.map((t: any) => (
                  <Badge key={t.tag.id} variant="secondary">
                    {t.tag.name}
                  </Badge>
                ))}
                {(!investor.tags || investor.tags.length === 0) && (
                  <span className="text-sm text-muted-foreground">No tags added.</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investor.timelineEvents?.map((event: any) => (
                  <div key={event.id} className="relative pl-4 border-l pb-4 last:border-0 last:pb-0">
                    <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="text-sm font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground mt-1">{event.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
