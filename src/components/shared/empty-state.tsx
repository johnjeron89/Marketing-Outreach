import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center animate-in fade-in duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6 shadow-sm ring-1 ring-border/50">
        <Icon className="h-10 w-10 text-muted-foreground/70" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
        {title}
      </h3>
      <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && (
        <Link href={action.href}>
          <Button size="lg" className="rounded-full shadow-md transition-transform hover:scale-105">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}
