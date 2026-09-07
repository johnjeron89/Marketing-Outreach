"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, File, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PitchDeckPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a PDF file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerateBrief = async () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setShowEditor(true);
      toast.success("Fundraising brief generated!");
    }, 2500);
  };

  const handleSaveAndContinue = () => {
    router.push("/onboarding/connect-gmail");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Pitch Deck</h1>
        <p className="text-muted-foreground">
          Upload your deck and our AI will extract key points for your outreach templates.
        </p>
      </div>

      {!showEditor ? (
        <div className="space-y-6">
          <div 
            className={cn(
              "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
              file ? "bg-muted/50" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              className="hidden" 
            />
            
            {file ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="flex items-center space-x-3 bg-background p-4 rounded-lg border shadow-sm w-full max-w-sm">
                  <File className="h-8 w-8 text-blue-500" />
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Click or drag and drop</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your pitch deck (PDF, max 10MB)
                </p>
                <Button variant="outline">Browse Files</Button>
              </>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handleSaveAndContinue}>
              Skip for Now
            </Button>
            <Button 
              disabled={!file || isGenerating} 
              onClick={handleGenerateBrief}
              className="gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Deck...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Brief</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" /> AI Generated Brief
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Review and edit the extracted information. Badges indicate fields the AI wasn't 100% confident about.
            </p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Problem Statement</label>
                </div>
                <Textarea defaultValue="Companies struggle to personalize investor outreach at scale, leading to low conversion rates and wasted time managing spreadsheets." rows={2} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Solution</label>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Needs Confirmation</Badge>
                </div>
                <Textarea defaultValue="An AI-powered CRM that automates personalized email sequences for founders raising capital." rows={2} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Traction & Key Proof Points</label>
                </div>
                <Textarea defaultValue="- $15k MRR growing 20% MoM&#10;- 50 active paying customers&#10;- Backed by Y Combinator (W24)" rows={4} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditor(false)}>Back</Button>
            <Button onClick={handleSaveAndContinue}>Save & Continue</Button>
          </div>
        </div>
      )}
    </div>
  );
}
