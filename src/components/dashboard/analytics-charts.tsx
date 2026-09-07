"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DailyStat {
  date: string;
  sent: number;
  opens: number;
  replies: number;
}

interface CampaignMetric {
  id: string;
  name: string;
  sent: number;
  opens: number;
  replies: number;
  openRate: number;
  replyRate: number;
}

interface AnalyticsChartsProps {
  dailyStats: DailyStat[];
  campaignMetrics: CampaignMetric[];
}

export function AnalyticsCharts({ dailyStats, campaignMetrics }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
      {/* Activity Timeline */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Activity Timeline (14 Days)</CardTitle>
          <CardDescription>Emails sent vs opened vs replied</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                  itemStyle={{ fontSize: '14px' }} 
                />
                <Area type="monotone" dataKey="sent" name="Sent" stroke="#71717a" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="opens" name="Opened" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorOpens)" />
                <Area type="monotone" dataKey="replies" name="Replied" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Comparison */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Comparing Open and Reply rates across campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {campaignMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} 
                    itemStyle={{ fontSize: '14px' }}
                    formatter={(value: any) => [`${value}%`, undefined]}
                  />
                  <Bar dataKey="openRate" name="Open Rate" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="replyRate" name="Reply Rate" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg">
                No active campaigns yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
