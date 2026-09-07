'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { bulkImportInvestors } from '@/actions/investors';
import { useRouter } from 'next/navigation';

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const processFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedData = results.data as any[];
        
        if (parsedData.length === 0) {
          toast.error("No valid data found in CSV");
          return;
        }

        try {
          setIsImporting(true);
          
          const mappedInvestors = parsedData.map(row => {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                if (row[k]) return row[k];
                const foundKey = Object.keys(row).find(key => key.toLowerCase() === k.toLowerCase());
                if (foundKey) return row[foundKey];
              }
              return "";
            };

            return {
              name: getVal(["Name", "Investor Name", "First Name"]) + (row["Last Name"] ? " " + row["Last Name"] : ""),
              firm: getVal(["Firm", "Fund", "Company"]),
              email: getVal(["Email", "Email Address"]),
              typicalCheckSize: getVal(["Check Size", "Typical Check Size", "Ticket Size"]),
              stagePreference: getVal(["Stage", "Stage Preference"]),
              location: getVal(["Location", "City"]),
              linkedinUrl: getVal(["LinkedIn", "LinkedIn URL", "Profile"]),
            };
          }).filter(inv => inv.email && inv.name);

          if (mappedInvestors.length === 0) {
            toast.error("Could not find required columns (Name, Email)");
            setIsImporting(false);
            return;
          }

          const result = await bulkImportInvestors(mappedInvestors);
          toast.success(`Successfully imported ${result.count} investors!`);
          onOpenChange(false);
          router.refresh(); // Refresh the list view
        } catch (error) {
          console.error("Import failed:", error);
          toast.error("Failed to import investors");
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Investors</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import investors into your workspace.
          </DialogDescription>
        </DialogHeader>
        
        <label 
          htmlFor="dialog-file-upload"
          className={`mt-4 border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:bg-muted/50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="dialog-file-upload" 
            className="hidden" 
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isImporting}
          />
          
          {isImporting ? (
            <>
              <Loader2 className="h-10 w-10 text-primary mb-4 animate-spin" />
              <h3 className="font-semibold text-lg mb-1">Importing Data...</h3>
              <p className="text-sm text-muted-foreground mb-4">Please wait while we process your file.</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Click or drag file to this area to upload</h3>
              <p className="text-sm text-muted-foreground mb-4">Support for a single CSV upload.</p>
              <Button variant="secondary" type="button" className="pointer-events-none">Select File</Button>
            </>
          )}
        </label>
      </DialogContent>
    </Dialog>
  );
}
