"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: "company", title: "Company", href: "/onboarding/company" },
  { id: "pitch-deck", title: "Pitch Deck", href: "/onboarding/pitch-deck" },
  { id: "connect-gmail", title: "Connect Gmail", href: "/onboarding/connect-gmail" },
  { id: "import-investors", title: "Import Investors", href: "/onboarding/import-investors" },
  { id: "review", title: "Review", href: "/onboarding/review" },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStepIndex = steps.findIndex((step) => pathname.includes(step.id));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-8 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="font-bold text-xl">Investor Outreach OS</div>
          
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -z-10 -translate-y-1/2" />
            <ol className="flex justify-between items-center w-full relative z-10">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <li key={step.id} className="flex flex-col items-center gap-2">
                    <Link
                      href={step.href}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors bg-background",
                        isActive
                          ? "border-primary text-primary"
                          : isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                    </Link>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </header>

        <main className="w-full bg-card rounded-xl border shadow-sm p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
