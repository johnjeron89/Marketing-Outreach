"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Building, FileText, Mail, Users, Rocket } from "lucide-react";
import confetti from "canvas-confetti";
import { getOnboardingStatus } from "@/actions/company";

export default function ReviewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch real status
    getOnboardingStatus().then(status => {
      if (status && status.data) {
        setStatusData(status.data);
      }
    });

    // Fire confetti on mount
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2563eb', '#3b82f6', '#60a5fa']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2563eb', '#3b82f6', '#60a5fa']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }, []);

  const steps = [
    { 
      title: "Company Profile", 
      desc: statusData?.companyName ? `${statusData.companyName} configured` : "Skipped / Default", 
      icon: Building 
    },
    { 
      title: "Pitch Deck", 
      desc: statusData?.hasPitchDeck ? "Fundraising brief generated" : "Skipped", 
      icon: FileText 
    },
    { 
      title: "Mailbox", 
      desc: statusData?.mailboxEmail ? `${statusData.mailboxEmail} connected` : "Not connected", 
      icon: Mail 
    },
    { 
      title: "Investors", 
      desc: `${statusData?.investorsCount || 0} contacts imported`, 
      icon: Users 
    },
  ];

  const handleFinish = () => {
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-8">
      <div className="space-y-4">
        <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Rocket className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">You're All Set!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your workspace is fully configured and ready for outreach. Let's start raising your round.
        </p>
      </div>

      <div className="w-full max-w-md bg-card border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-left">Setup Summary</h3>
        <ul className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <li key={idx} className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
                <Icon className="h-4 w-4 text-muted-foreground/50" />
              </li>
            );
          })}
        </ul>
      </div>

      <Button size="lg" onClick={handleFinish} className="w-full max-w-md font-semibold text-base py-6">
        Go to Dashboard
      </Button>
    </div>
  );
}
