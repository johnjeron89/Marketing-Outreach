"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, FileSpreadsheet, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { bulkImportInvestors } from "@/actions/investors";
import Papa from "papaparse";

export default function ImportInvestorsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const handleDownloadTemplate = () => {
    const headers = ["Name", "Firm", "Email", "LinkedIn", "Check Size", "Stage Preference", "Location"];
    const sampleRow = "Jane Doe,Acme Ventures,jane@acme.com,https://linkedin.com/in/jane,$1M-$5M,Seed,San Francisco";
    const csvContent = headers.join(",") + "\n" + sampleRow;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "investor_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data);
        },
        error: (error) => {
          toast.error("Failed to parse CSV file");
          console.error(error);
        }
      });
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No valid data found in CSV");
      return;
    }

    try {
      setIsImporting(true);
      
      const mappedInvestors = parsedData.map(row => {
        // Fallback matching for common column variations
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            if (row[k]) return row[k];
            // case insensitive match
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
      }).filter(inv => inv.email && inv.name); // Require at least email and name

      if (mappedInvestors.length === 0) {
        toast.error("Could not find required columns (Name, Email)");
        setIsImporting(false);
        return;
      }

      const result = await bulkImportInvestors(mappedInvestors);
      setImportCount(result.count);
      setImportDone(true);
      toast.success(`Successfully imported ${result.count} investors!`);
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import investors");
    } finally {
      setIsImporting(false);
    }
  };

  const handleContinue = () => {
    router.push("/onboarding/review");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Investors</h1>
        <p className="text-muted-foreground">
          Upload a CSV or Excel file containing your target investors.
        </p>
      </div>

      {!importDone ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Need a template?</h3>
                <p className="text-xs text-muted-foreground">Download our pre-formatted CSV template.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" /> Template
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />
            
            {file ? (
              <div className="space-y-4 w-full">
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-500" />
                  <span className="font-medium">{file.name}</span>
                </div>
                
                <div className="border rounded-lg overflow-hidden mt-6 text-left">
                  <div className="bg-muted px-4 py-2 border-b">
                    <h4 className="text-sm font-medium">Data Preview</h4>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Firm</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Stage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.Name || row["First Name"] || "N/A"}</TableCell>
                          <TableCell>{row.Firm || row.Fund || "N/A"}</TableCell>
                          <TableCell>{row.Email || "N/A"}</TableCell>
                          <TableCell>{row["Stage Preference"] || row.Stage || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                      {parsedData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground bg-muted/20">
                            + {parsedData.length - 5} more rows...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">Drop your file here or click to browse</p>
              </label>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleContinue}>
              Skip for Now
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isImporting}
              className="gap-2"
            >
              {isImporting ? "Importing..." : "Import Data"} 
              {!isImporting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center text-center space-y-6">
          <div className="h-20 w-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Import Successful!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We've successfully imported {importCount} new investor{importCount !== 1 ? 's' : ''} from your file. You can manage this list in the CRM later.
            </p>
          </div>

          <Button onClick={handleContinue} className="mt-4" size="lg">
            Continue to Review
          </Button>
        </div>
      )}
    </div>
  );
}
