import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock configurations until types are properly set up
const PIPELINE_STATUS_CONFIG: Record<string, { label: string, color: string }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  contacted: { label: "Contacted", color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  meeting: { label: "Meeting Scheduled", color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  diligence: { label: "Due Diligence", color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" },
  committed: { label: "Committed", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  passed: { label: "Passed", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
};

const CAMPAIGN_STATUS_CONFIG: Record<string, { label: string, color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20" },
  active: { label: "Active", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  paused: { label: "Paused", color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
  completed: { label: "Completed", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
};

const EMAIL_STATUS_CONFIG: Record<string, { label: string, color: string }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
  sent: { label: "Sent", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
  opened: { label: "Opened", color: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" },
  clicked: { label: "Clicked", color: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20" },
  replied: { label: "Replied", color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" },
  bounced: { label: "Bounced", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
};

interface StatusBadgeProps {
  status: string;
  type: 'pipeline' | 'campaign' | 'email';
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let config;
  
  if (type === 'pipeline') config = PIPELINE_STATUS_CONFIG[status.toLowerCase()];
  else if (type === 'campaign') config = CAMPAIGN_STATUS_CONFIG[status.toLowerCase()];
  else if (type === 'email') config = EMAIL_STATUS_CONFIG[status.toLowerCase()];

  if (!config) {
    return (
      <Badge variant="outline" className={cn("font-medium transition-colors rounded-full", className)}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-medium border-transparent transition-colors rounded-full px-2.5 py-0.5", 
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
