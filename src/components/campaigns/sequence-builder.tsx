"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight, Mail, Clock, ShieldCheck, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTemplates } from '@/actions/templates';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SequenceBuilder({ sequence, onChange }: { sequence: any[], onChange?: (seq: any[]) => void }) {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    getTemplates().then(setTemplates).catch(console.error);
  }, []);
  const addStep = () => {
    if (!onChange) return;
    onChange([
      ...sequence,
      { 
        id: Math.random().toString(36).substr(2, 9), 
        type: 'FOLLOW_UP', 
        delay: 3, 
        templateId: null, 
        requireApproval: true 
      }
    ]);
  };

  const removeStep = (index: number) => {
    if (!onChange) return;
    if (index === 0) return; // Cannot remove initial step
    const newSeq = [...sequence];
    newSeq.splice(index, 1);
    onChange(newSeq);
  };

  const updateStep = (index: number, updates: any) => {
    if (!onChange) return;
    const newSeq = [...sequence];
    newSeq[index] = { ...newSeq[index], ...updates };
    onChange(newSeq);
  };

  return (
    <div className="relative flex flex-col items-center gap-6 py-8 min-w-full overflow-x-auto">
      {/* Vertical line connecting steps */}
      <div className="absolute top-12 bottom-12 left-1/2 w-0.5 bg-border/50 -translate-x-1/2 z-0 hidden md:block"></div>
      
      <div className="flex flex-col md:flex-row gap-6 md:gap-4 items-center z-10 w-full px-4 overflow-x-auto pb-4 custom-scrollbar">
        {sequence.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4 shrink-0">
            <Card className="w-[280px] bg-card/60 backdrop-blur-sm border-white/10 relative group hover:border-primary/40 transition-colors">
              {index > 0 && !!onChange && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-destructive/20"
                  onClick={() => removeStep(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10 rounded-t-lg"></div>
              
              <CardContent className="p-5 pt-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-sm">
                      {index === 0 ? 'Initial Email' : 'Follow Up'}
                    </span>
                  </div>
                  {step.requireApproval ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-1.5 py-0">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Review
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] px-1.5 py-0">
                      Auto
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {index > 0 && (
                    <div className="flex items-center text-xs text-muted-foreground bg-background/50 p-2 rounded-md border border-border/50">
                      <Clock className="w-3.5 h-3.5 mr-2" />
                      Wait <span className="font-medium text-foreground mx-1">{step.delay}</span> days
                    </div>
                  )}

                  <div className="bg-background/50 p-2 rounded-md border border-border/50">
                    <Select
                      value={step.templateId || "custom"}
                      onValueChange={(val) => updateStep(index, { templateId: val === "custom" ? null : val })}
                      disabled={!onChange}
                    >
                      <SelectTrigger className="w-full h-8 border-none bg-transparent shadow-none px-2 text-sm focus:ring-0 truncate">
                        <div className="flex items-center text-muted-foreground truncate">
                          <Mail className="w-3.5 h-3.5 mr-2 shrink-0" />
                          <span className="truncate">
                            {step.templateId 
                              ? templates.find(t => t.id === step.templateId)?.name || 'Loading...' 
                              : 'Custom Message'}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Message (No Template)</SelectItem>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {index < sequence.length - 1 && (
              <div className="text-muted-foreground shrink-0 hidden md:flex items-center">
                <ArrowRight className="w-5 h-5 opacity-50" />
              </div>
            )}
            {index < sequence.length - 1 && (
              <div className="text-muted-foreground md:hidden flex justify-center w-full h-8">
                <div className="w-0.5 h-full bg-border/50"></div>
              </div>
            )}
          </div>
        ))}

        {!!onChange && (
          <div className="flex items-center shrink-0 ml-2">
            <Button 
              variant="outline" 
              className="w-12 h-[180px] rounded-xl border-dashed bg-background/30 hover:bg-background/50 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all"
              onClick={addStep}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
