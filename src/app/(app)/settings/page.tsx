"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building, Mail, Sliders, Cpu, Shield, Save, CheckCircle2, Plus } from "lucide-react";
import { getMailboxes, disconnectMailbox, getGoogleAuthUrl } from "@/actions/mailbox";
import { SmtpConnectDialog } from "@/components/mailboxes/smtp-connect-dialog";
import { AISettings } from "@/components/settings/ai-settings";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadMailboxes();
  }, []);

  const loadMailboxes = async () => {
    try {
      const data = await getMailboxes();
      setMailboxes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      const url = await getGoogleAuthUrl("settings");
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to generate connect URL");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectMailbox(id);
      toast.success("Mailbox disconnected");
      loadMailboxes();
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect mailbox");
    }
  };
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace preferences and configurations.</p>
      </div>

      <Tabs defaultValue="sending" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-5 h-auto md:h-12">
          <TabsTrigger value="company" className="gap-2 py-2 md:py-0"><Building className="h-4 w-4" /> <span className="hidden md:inline">Company</span></TabsTrigger>
          <TabsTrigger value="mailboxes" className="gap-2 py-2 md:py-0"><Mail className="h-4 w-4" /> <span className="hidden md:inline">Mailboxes</span></TabsTrigger>
          <TabsTrigger value="sending" className="gap-2 py-2 md:py-0"><Sliders className="h-4 w-4" /> <span className="hidden md:inline">Sending</span></TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 py-2 md:py-0"><Cpu className="h-4 w-4" /> <span className="hidden md:inline">AI Settings</span></TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2 py-2 md:py-0"><Shield className="h-4 w-4" /> <span className="hidden md:inline">Compliance</span></TabsTrigger>
        </TabsList>

        <div className="mt-8 bg-card border rounded-xl p-6">
          <TabsContent value="sending" className="m-0 space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-medium">Sending Limits</h3>
              <p className="text-sm text-muted-foreground">Configure how many emails you send per day to protect your domain reputation.</p>
            </div>
            
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Max Emails per Day (per mailbox)</Label>
                <Input type="number" defaultValue={50} />
              </div>
              <div className="space-y-2">
                <Label>Minimum Delay Between Emails (minutes)</Label>
                <Input type="number" defaultValue={5} />
              </div>
            </div>

            <div className="border-b pb-4 pt-6">
              <h3 className="text-lg font-medium">Sending Schedule</h3>
              <p className="text-sm text-muted-foreground">When should emails be sent out.</p>
            </div>

            <div className="space-y-6 max-w-md">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Send on Weekends</Label>
                  <p className="text-sm text-muted-foreground">Allow campaigns to run on Saturday and Sunday.</p>
                </div>
                <Switch />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" defaultValue="17:00" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button className="gap-2">
                <Save className="h-4 w-4" /> Save Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="company">
             <div className="text-center py-10 text-muted-foreground">
               Company Profile settings goes here. (Reusing Onboarding Form)
             </div>
          </TabsContent>

          <TabsContent value="mailboxes" className="space-y-6 m-0">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Connected Mailboxes</h3>
                <p className="text-sm text-muted-foreground">Manage your email accounts used for sending campaigns.</p>
              </div>
              <div className="flex gap-2">
                <SmtpConnectDialog onConnect={loadMailboxes} />
                <Button onClick={handleConnectGoogle} disabled={isConnecting} className="gap-2">
                  <Plus className="h-4 w-4" /> {isConnecting ? "Redirecting..." : "Connect Google Workspace"}
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading mailboxes...</div>
            ) : mailboxes.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 border rounded-lg">
                <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h4 className="font-medium">No mailboxes connected</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Connect a mailbox to start sending outreach campaigns.</p>
                <Button onClick={handleConnectGoogle} disabled={isConnecting} variant="outline">
                  Connect Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {mailboxes.map((mailbox) => (
                  <div key={mailbox.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{mailbox.email}</p>
                        <p className="text-xs text-muted-foreground">{mailbox.provider === 'smtp' ? 'Zoho / SMTP' : 'Google Workspace'} • Connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDisconnect(mailbox.id)}>
                      Disconnect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai">
            <div className="py-4">
               <AISettings />
             </div>
          </TabsContent>
          
          <TabsContent value="compliance">
            <div className="text-center py-10 text-muted-foreground">
               Compliance settings goes here.
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
