"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTemplate, updateTemplate } from "@/actions/templates";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Paperclip, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Mock available fields
const AVAILABLE_MERGE_FIELDS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{fundName}}",
  "{{companyName}}",
  "{{oneLinePitch}}",
  "{{recentInvestment}}",
  "{{senderName}}"
];

const MOCK_DATA = {
  firstName: "Marc",
  lastName: "Andreessen",
  fundName: "a16z",
  companyName: "Acme Inc",
  oneLinePitch: "an AI-powered CRM for fundraising",
  recentInvestment: "Stripe",
  senderName: "Sahil"
};

export function TemplateEditor({
  initialData,
  onCancel,
  onSaveSuccess
}: {
  initialData?: any;
  onCancel?: () => void;
  onSaveSuccess?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "Cold Outreach - Standard");
  const [type, setType] = useState(initialData?.type || "initial");
  const [subject, setSubject] = useState(initialData?.subject || "Introduction: {{companyName}} - {{oneLinePitch}}");
  const [body, setBody] = useState(initialData?.body || "Hi {{firstName}},\n\nI saw your recent investment in {{recentInvestment}} and thought you might be interested in what we're building at {{companyName}}.\n\nWe are {{oneLinePitch}}.\n\nWould you be open to a brief chat next week?\n\nBest,\n{{senderName}}");
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setSubject(initialData.subject);
      setBody(initialData.body);
      setAttachments(initialData.attachments || []);
    } else {
      setName("Cold Outreach - Standard");
      setType("initial");
      setSubject("Introduction: {{companyName}} - {{oneLinePitch}}");
      setBody("Hi {{firstName}},\n\nI saw your recent investment in {{recentInvestment}} and thought you might be interested in what we're building at {{companyName}}.\n\nWe are {{oneLinePitch}}.\n\nWould you be open to a brief chat next week?\n\nBest,\n{{senderName}}");
      setAttachments([]);
    }
  }, [initialData]);

  const insertField = (field: string, target: "subject" | "body") => {
    if (target === "subject") {
      setSubject((prev: string) => prev + field);
    } else {
      setBody((prev: string) => prev + field);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('email-attachments')
        .upload(fileName, file);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('email-attachments')
        .getPublicUrl(data.path);

      setAttachments(prev => [...prev, publicUrl]);
      toast.success("File attached");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!name || !subject || !body) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSaving(true);
    try {
      if (initialData?.id) {
        await updateTemplate(initialData.id, {
          name,
          type,
          subject,
          body,
          attachments
        });
        toast.success("Template updated successfully");
      } else {
        await createTemplate({
          name,
          type,
          subject,
          body,
          attachments
        });
        toast.success("Template saved successfully");
      }
      
      if (onSaveSuccess) onSaveSuccess();
      router.refresh();
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPreview = (text: string) => {
    let preview = text;
    Object.entries(MOCK_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      preview = preview.replace(regex, `<span class="bg-primary/20 text-primary font-medium px-1 rounded">${value}</span>`);
    });
    return preview;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* Editor Panel */}
      <div className="flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
          <h2 className="font-semibold">{initialData ? "Edit Template" : "Create Template"}</h2>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {initialData ? "Update Template" : "Save Template"}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Cold Outreach - Standard" />
          </div>
          
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(val) => setType(val || "initial")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Initial Outreach</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="nurture">Nurture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Subject Line</Label>
            </div>
            <Input 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <Label>Email Body</Label>
            <Textarea 
              value={body}
              onChange={e => setBody(e.target.value)}
              className="min-h-[250px] resize-none flex-1 font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                  {isUploading ? "Uploading..." : "Attach File"}
                </Button>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {attachments.map((url, i) => {
                  let fileName = url.split('/').pop() || `Attachment ${i + 1}`;
                  fileName = fileName.replace(/^\d+-/, '');
                  return (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded border">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Label className="mb-2 block">Variables</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MERGE_FIELDS.map(field => (
                <Badge 
                  key={field} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                  onClick={() => insertField(field, "body")}
                >
                  <Plus className="h-3 w-3 mr-1" /> {field}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold text-muted-foreground flex items-center gap-2">
            Live Preview
          </h2>
        </div>
        
        <div className="p-6 bg-background m-4 rounded-lg border shadow-sm flex-1">
          <div className="mb-6 pb-4 border-b space-y-2">
            <div className="text-sm flex gap-4">
              <span className="text-muted-foreground w-12">To:</span>
              <span>marc@a16z.com</span>
            </div>
            <div className="text-sm flex gap-4">
              <span className="text-muted-foreground w-12">Subject:</span>
              <span className="font-medium" dangerouslySetInnerHTML={{ __html: getPreview(subject) }} />
            </div>
          </div>
          
          <div 
            className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: getPreview(body) }}
          />
        </div>
      </div>
    </div>
  );
}
