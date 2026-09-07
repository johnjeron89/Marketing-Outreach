import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Rocket, Users, Mail, Settings, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface CampaignLaunchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  campaign: any;
  isLoading?: boolean;
}

export function CampaignLaunchDialog({ open, onOpenChange, onConfirm, campaign, isLoading }: CampaignLaunchDialogProps) {
  const isAutomated = campaign?.mode === 'AUTOMATED';
  const [confirmedRisk, setConfirmedRisk] = useState(false);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const isLaunchDisabled = isLoading || (isAutomated && !confirmedRisk);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-card border-white/10 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-xl gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Launch Campaign
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground mt-1.5">
              Review your campaign settings before launching.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Summary</h4>
            <div className="bg-background/50 rounded-lg p-3 border border-border/50 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2"><Settings className="w-4 h-4"/> Mode</span>
                <Badge variant={isAutomated ? "destructive" : "secondary"} className="font-normal">
                  {campaign?.mode?.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4"/> Targeting</span>
                <span className="font-medium">{campaign?.investorCount || 0} Investors</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4"/> Sequence</span>
                <span className="font-medium">{campaign?.sequence?.length || 0} Steps</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Safety Rules Active
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                Emails sent Mon-Fri, 9:00 AM - 5:00 PM local time
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                Maximum {campaign?.dailyLimit || 20} emails per day
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                Follow-ups stop automatically on reply
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                "Do Not Contact" investors skipped
              </li>
            </ul>
          </div>

          {isAutomated && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
              <div className="flex gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">Automated sending is enabled</p>
              </div>
              <p className="text-xs text-destructive/80">
                Messages will be generated and sent immediately according to the schedule without manual review.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="confirm-risk" 
                  checked={confirmedRisk} 
                  onCheckedChange={(c) => setConfirmedRisk(c as boolean)} 
                  className="border-destructive data-[state=checked]:bg-destructive"
                />
                <Label htmlFor="confirm-risk" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer">
                  I understand, launch campaign
                </Label>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="p-4 border-t border-border/50 bg-muted/20">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isLaunchDisabled}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching...</>
            ) : (
              <><Rocket className="w-4 h-4 mr-2" /> Launch Campaign</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
