"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useForm } from 'react-hook-form';
import { createCampaign, getTargetingCount, launchCampaign } from '@/actions/campaigns';
import { getMailboxes } from '@/actions/mailbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileEdit, Eye, Zap, ArrowLeft, ArrowRight, Plus, Trash2, Clock, Mail, Users, Check, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SequenceBuilder } from '@/components/campaigns/sequence-builder';
import { CampaignLaunchDialog } from '@/components/campaigns/campaign-launch-dialog';

const STEPS = [
  { id: 1, name: 'Basic Info' },
  { id: 2, name: 'Targeting' },
  { id: 3, name: 'Sequence' },
  { id: 4, name: 'Settings' },
  { id: 5, name: 'Review' }
];

const MODES = [
  {
    id: 'DRAFT_ONLY',
    name: 'Draft Only',
    description: 'Generate messages but never send',
    icon: FileEdit,
    color: 'border-blue-500/50',
    bg: 'bg-blue-500/10',
    iconColor: 'text-blue-500'
  },
  {
    id: 'REVIEW_BEFORE_SEND',
    name: 'Review Before Send',
    description: 'Approve each message before sending',
    icon: Eye,
    color: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    recommended: true
  },
  {
    id: 'AUTOMATED',
    name: 'Automated',
    description: 'Send automatically with configured rules',
    icon: Zap,
    color: 'border-red-500/50',
    bg: 'bg-red-500/10',
    iconColor: 'text-red-500'
  }
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);
  const [mailboxes, setMailboxes] = useState<any[]>([]);

  useEffect(() => {
    getMailboxes().then(setMailboxes).catch(console.error);
  }, []);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'REVIEW_BEFORE_SEND',
    investorCount: 0, // Mock for targeting step
    sequence: [
      { id: '1', type: 'INITIAL', delay: 0, templateId: null, requireApproval: true }
    ],
    mailboxId: '',
    dailyLimit: 20
  });

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleLaunch = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        sequence: formData.sequence.map(s => ({
          ...s,
          requireApproval: formData.mode === 'AUTOMATED' ? false : s.requireApproval
        })),
        dailySendLimit: formData.dailyLimit,
      };
      const res = await createCampaign(payload as any);
      
      if (!res || !res.id) {
        toast.error('Failed to create campaign');
        return;
      }

      await launchCampaign(res.id);
      
      toast.success('Campaign launched successfully');
      router.push(`/campaigns/${res.id}`); // Real routing
    } catch (error: any) {
      console.error("Launch Error:", error);
      toast.error(`Failed to launch campaign: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setIsLaunchDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Campaign</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new automated outreach campaign for your investors.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2 bg-background z-10",
                  currentStep === step.id ? "border-primary text-primary" : 
                  currentStep > step.id ? "border-primary bg-primary text-primary-foreground" : 
                  "border-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={cn(
                "mt-2 text-xs font-medium absolute -bottom-6 w-20 text-center",
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 bg-card/40 backdrop-blur-md border border-white/10 rounded-xl p-6 min-h-[500px] flex flex-col">
        <div className="flex-1">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Q3 Seed Round Outreach" 
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Brief description of this campaign's goal..."
                    value={formData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    className="bg-background/50 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label>Campaign Mode <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MODES.map((mode) => (
                    <div 
                      key={mode.id}
                      onClick={() => updateForm('mode', mode.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-3",
                        formData.mode === mode.id 
                          ? cn(mode.color, mode.bg) 
                          : "border-border/50 hover:border-border bg-background/30 hover:bg-background/50"
                      )}
                    >
                      {mode.recommended && (
                        <Badge className="absolute -top-3 -right-2 px-2 py-0.5 bg-amber-500 text-amber-950 font-semibold border-none">
                          RECOMMENDED
                        </Badge>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", formData.mode === mode.id ? "bg-background/50" : "bg-muted")}>
                          <mode.icon className={cn("w-5 h-5", formData.mode === mode.id ? mode.iconColor : "text-muted-foreground")} />
                        </div>
                        <h4 className={cn("font-semibold", formData.mode === mode.id ? "text-foreground" : "text-foreground/80")}>
                          {mode.name}
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{mode.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center p-8 border border-dashed border-border rounded-xl bg-background/20">
                <Target className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                <h3 className="text-lg font-medium mb-2">Select Target Investors</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Choose which investors to include in this campaign based on tags, stages, or lists.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary/80">
                    <Plus className="w-3 h-3 mr-1" /> Add Tag Filter
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary/80">
                    <Plus className="w-3 h-3 mr-1" /> Add Stage Filter
                  </Badge>
                </div>
                
                <div className="mt-8 pt-8 border-t border-border/50 flex flex-col items-center">
                  <div className="text-4xl font-bold text-foreground">
                    {formData.investorCount || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> Investors Match Criteria
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    disabled={isCalculating}
                    onClick={async () => {
                      setIsCalculating(true);
                      try {
                        // Pass empty filters for now to get all workspace investors
                        const count = await getTargetingCount({});
                        updateForm('investorCount', count);
                        toast.success(`Found ${count} matching investors`);
                      } catch (error) {
                        toast.error('Failed to calculate targeting');
                      } finally {
                        setIsCalculating(false);
                      }
                    }}
                  >
                    {isCalculating ? "Calculating..." : "Calculate Matching Investors"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Sequence */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-lg font-medium">Outreach Sequence</h3>
                  <p className="text-sm text-muted-foreground">Design your email flow and follow-ups.</p>
                </div>
              </div>
              <div className="h-full min-h-[300px]">
                <SequenceBuilder 
                  sequence={formData.sequence} 
                  onChange={(seq) => updateForm('sequence', seq)} 
                />
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Sender Mailbox <span className="text-destructive">*</span></Label>
                  <Select value={formData.mailboxId} onValueChange={(v) => updateForm('mailboxId', v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select a connected mailbox" />
                    </SelectTrigger>
                    <SelectContent>
                      {mailboxes.length === 0 ? (
                        <SelectItem value="none" disabled>No mailboxes connected</SelectItem>
                      ) : (
                        mailboxes.map((mb) => (
                          <SelectItem key={mb.id} value={mb.id}>
                            {mb.email} ({mb.provider === 'google' ? 'Google Workspace' : mb.provider})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="bg-border/50" />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Sending Limits</h4>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Daily Email Limit (per day)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        type="number" 
                        min="1" 
                        max="500" 
                        value={formData.dailyLimit}
                        onChange={(e) => updateForm('dailyLimit', parseInt(e.target.value) || 20)}
                        className="w-24 bg-background/50"
                      />
                      <span className="text-sm text-muted-foreground">emails</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      To protect your sender reputation, we recommend keeping this under 50.
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium">Sending Schedule</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      Emails are sent Monday through Friday, 9:00 AM to 5:00 PM based on the investor's inferred timezone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-w-3xl mx-auto">
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border/50">
                  <h3 className="text-xl font-semibold mb-1">{formData.name || 'Unnamed Campaign'}</h3>
                  <p className="text-sm text-muted-foreground">{formData.description || 'No description'}</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Mode</div>
                      <Badge variant="outline" className="bg-background font-normal">
                        {MODES.find(m => m.id === formData.mode)?.name}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Targeting</div>
                      <div className="font-medium flex items-center">
                        <Users className="w-4 h-4 mr-2 text-primary" />
                        {formData.investorCount || 0} Investors Selected
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Sequence</div>
                      <div className="font-medium flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-primary" />
                        {formData.sequence.length} Steps configured
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Mailbox & Limits</div>
                      <div className="font-medium">
                        {formData.mailboxId ? 'Mailbox Selected' : 'No Mailbox'} • {formData.dailyLimit} / day
                      </div>
                    </div>
                  </div>
                </div>
                
                {formData.mode === 'AUTOMATED' && (
                  <div className="p-4 m-6 mt-0 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-red-500">Automated Mode Active</h5>
                      <p className="text-sm text-red-500/80 mt-1">
                        Emails will be sent automatically without manual approval. Ensure your templates and targeting are correct.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/campaigns')} disabled={isSubmitting}>
              Cancel
            </Button>
            
            {currentStep < 5 ? (
              <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => setIsLaunchDialogOpen(true)}
                disabled={!formData.name || !formData.mailboxId}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                Launch Campaign
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <CampaignLaunchDialog 
        open={isLaunchDialogOpen} 
        onOpenChange={setIsLaunchDialogOpen}
        onConfirm={handleLaunch}
        campaign={formData}
        isLoading={isSubmitting}
      />
    </div>
  );
}
