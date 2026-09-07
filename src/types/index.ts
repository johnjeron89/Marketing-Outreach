import type {
  PipelineStatus,
  CampaignMode,
  CampaignStatus,
  EmailDirection,
  EmailStatus,
  ReplyClassification,
  CampaignInvestorStatus,
} from "@prisma/client";

// Re-export Prisma enums for use in components
export type {
  PipelineStatus,
  CampaignMode,
  CampaignStatus,
  EmailDirection,
  EmailStatus,
  ReplyClassification,
  CampaignInvestorStatus,
};

// ─── Pipeline Status Labels & Colors ───
export const PIPELINE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  READY_TO_SEND: {
    label: "Ready to Send",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  SENT: {
    label: "Sent",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  REPLIED: {
    label: "Replied",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  INTERESTED: {
    label: "Interested",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  MEETING_BOOKED: {
    label: "Meeting Booked",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  PASSED: {
    label: "Passed",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  NO_RESPONSE: {
    label: "No Response",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  FOLLOW_UP_DUE: {
    label: "Follow-up Due",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  DO_NOT_CONTACT: {
    label: "Do Not Contact",
    color: "text-red-800 dark:text-red-300",
    bgColor: "bg-red-200 dark:bg-red-900/50",
  },
};

// ─── Campaign Status Config ───
export const CAMPAIGN_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  ACTIVE: {
    label: "Active",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  PAUSED: {
    label: "Paused",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

// ─── Campaign Mode Config ───
export const CAMPAIGN_MODE_CONFIG: Record<
  string,
  { label: string; description: string; icon: string }
> = {
  DRAFT_ONLY: {
    label: "Draft Only",
    description: "Generate messages but never send them automatically.",
    icon: "FileEdit",
  },
  REVIEW_BEFORE_SEND: {
    label: "Review Before Send",
    description: "You approve each message or batch before sending.",
    icon: "Eye",
  },
  AUTOMATED: {
    label: "Automated",
    description:
      "Send according to configured rules after explicit confirmation.",
    icon: "Zap",
  },
};

// ─── Reply Classification Config ───
export const REPLY_CLASSIFICATION_CONFIG: Record<
  string,
  { label: string; color: string; action: string }
> = {
  INTERESTED: {
    label: "Interested",
    color: "text-green-600",
    action: "Draft response with more details",
  },
  WANTS_DECK: {
    label: "Wants Deck",
    color: "text-green-500",
    action: "Send pitch deck",
  },
  WANTS_MEETING: {
    label: "Wants Meeting",
    color: "text-emerald-600",
    action: "Share calendar link",
  },
  PASS: {
    label: "Pass",
    color: "text-red-500",
    action: "Thank and close",
  },
  NOT_NOW: {
    label: "Not Now",
    color: "text-amber-500",
    action: "Set reminder to follow up later",
  },
  FORWARDED_TO_COLLEAGUE: {
    label: "Forwarded",
    color: "text-blue-500",
    action: "Watch for new thread",
  },
  NEEDS_FOLLOW_UP: {
    label: "Needs Follow-up",
    color: "text-orange-500",
    action: "Review and respond manually",
  },
  OUT_OF_OFFICE: {
    label: "Out of Office",
    color: "text-muted-foreground",
    action: "Reschedule follow-up",
  },
  BOUNCE: {
    label: "Bounced",
    color: "text-red-600",
    action: "Mark email invalid",
  },
  UNSUBSCRIBE: {
    label: "Unsubscribe",
    color: "text-red-800",
    action: "Do Not Contact",
  },
  UNKNOWN: {
    label: "Unknown",
    color: "text-muted-foreground",
    action: "Review manually",
  },
};

// ─── Template Types ───
export const TEMPLATE_TYPES = [
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "warm_intro_followup", label: "Warm Intro Follow-up" },
  { value: "meeting_followup", label: "Meeting Follow-up" },
  { value: "follow_up_1", label: "Follow-up 1" },
  { value: "follow_up_2", label: "Follow-up 2" },
  { value: "final_follow_up", label: "Final Follow-up" },
  { value: "reply_send_deck", label: "Reply: Send Deck" },
  { value: "reply_not_fit", label: "Reply: Not a Fit" },
] as const;

// ─── Onboarding Steps ───
export const ONBOARDING_STEPS = [
  { id: "company", label: "Company Profile", path: "/onboarding/company" },
  { id: "pitch-deck", label: "Pitch Deck", path: "/onboarding/pitch-deck" },
  { id: "gmail", label: "Connect Gmail", path: "/onboarding/connect-gmail" },
  {
    id: "investors",
    label: "Import Investors",
    path: "/onboarding/import-investors",
  },
  { id: "review", label: "Review", path: "/onboarding/review" },
] as const;

// ─── Merge Field Definitions ───
export const AVAILABLE_MERGE_FIELDS = [
  {
    key: "investor_name",
    label: "Investor Name",
    example: "Sarah Chen",
    category: "investor",
  },
  {
    key: "firm_name",
    label: "Firm Name",
    example: "Sequoia Capital",
    category: "investor",
  },
  {
    key: "investor_thesis",
    label: "Investment Thesis",
    example: "AI/ML infrastructure",
    category: "investor",
  },
  {
    key: "investor_stage_pref",
    label: "Stage Preference",
    example: "Seed",
    category: "investor",
  },
  {
    key: "investor_location",
    label: "Investor Location",
    example: "San Francisco, CA",
    category: "investor",
  },
  {
    key: "company_name",
    label: "Company Name",
    example: "NeuralFlow AI",
    category: "company",
  },
  {
    key: "one_line_pitch",
    label: "One-Line Pitch",
    example: "AI-powered workflow automation",
    category: "company",
  },
  {
    key: "founder_name",
    label: "Founder Name",
    example: "Alex Johnson",
    category: "company",
  },
  {
    key: "industry",
    label: "Industry",
    example: "Enterprise SaaS",
    category: "company",
  },
  { key: "stage", label: "Stage", example: "Seed", category: "company" },
  {
    key: "amount_raising",
    label: "Amount Raising",
    example: "$3M",
    category: "company",
  },
  {
    key: "traction",
    label: "Traction",
    example: "$500K ARR, 40% MoM growth",
    category: "company",
  },
  {
    key: "calendar_link",
    label: "Calendar Link",
    example: "https://cal.com/alex",
    category: "company",
  },
  {
    key: "email_signature",
    label: "Email Signature",
    example: "Alex Johnson, CEO",
    category: "company",
  },
] as const;
