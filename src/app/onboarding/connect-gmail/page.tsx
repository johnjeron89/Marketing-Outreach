"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getGoogleAuthUrl, getMailboxes } from "@/actions/mailbox";

export default function ConnectGmailPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkMailbox() {
      try {
        const mailboxes = await getMailboxes();
        if (mailboxes && mailboxes.length > 0) {
          setIsConnected(true);
          setConnectedEmail(mailboxes[0].email);
        }
      } catch (error) {
        console.error("Failed to check mailbox", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkMailbox();
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const url = await getGoogleAuthUrl("onboarding");
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to generate connect URL");
      setIsConnecting(false);
    }
  };

  const handleContinue = () => {
    router.push("/onboarding/import-investors");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connect your Mailbox</h1>
        <p className="text-muted-foreground">
          Connect your Google Workspace or Gmail account to send outreach emails directly from your own domain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-1">Google Workspace</h3>
              <p className="text-sm text-muted-foreground">
                Connect your custom domain email
              </p>
            </div>

            {isConnected ? (
              <div className="flex flex-col items-center w-full space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium bg-green-50 dark:bg-green-900/10 px-4 py-2 rounded-full w-full justify-center border border-green-200 dark:border-green-900/50 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  Connected as {connectedEmail}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsConnected(false)}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2" 
                onClick={handleConnect}
                disabled={isConnecting || isLoading}
              >
                {isConnecting || isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> {isLoading ? "Checking status..." : "Redirecting..."}</> : "Sign in with Google"}
              </Button>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-6 border space-y-6">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Why we need access
          </h3>
          
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <span className="font-medium block">Send emails on your behalf</span>
                <span className="text-muted-foreground">So your outreach comes directly from your email address.</span>
              </div>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <span className="font-medium block">Read replies only</span>
                <span className="text-muted-foreground">We monitor for replies to automatically stop follow-up sequences.</span>
              </div>
            </li>
          </ul>

          <div className="bg-background border rounded-lg p-3 text-xs text-muted-foreground">
            <strong>Privacy Notice:</strong> Your emails are never stored permanently. We only read replies to your outreach messages.
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={handleContinue}>
          Skip for Now
        </Button>
        <Button onClick={handleContinue}>
          {isConnected ? "Continue" : "I'll do this later"}
        </Button>
      </div>
    </div>
  );
}
