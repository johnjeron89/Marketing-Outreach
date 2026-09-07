"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Loader2, Server } from "lucide-react";
import { saveSmtpConnection } from "@/actions/mailbox";
import { toast } from "sonner";

export function SmtpConnectDialog({ onConnect }: { onConnect: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    smtpHost: "smtp.zoho.in",
    smtpPort: "465",
    smtpUsername: "",
    smtpPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-fill smtp username if email is typed and username is empty
    if (name === 'email' && !formData.smtpUsername) {
      setFormData((prev) => ({ ...prev, smtpUsername: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const imapHost = formData.smtpHost.replace('smtp', 'imap');
      const imapPort = 993; // standard IMAPS port
      
      await saveSmtpConnection({
        email: formData.email,
        displayName: formData.displayName,
        smtpHost: formData.smtpHost,
        smtpPort: parseInt(formData.smtpPort),
        smtpUsername: formData.smtpUsername || formData.email,
        smtpPassword: formData.smtpPassword,
        imapHost,
        imapPort,
        imapUsername: formData.smtpUsername || formData.email,
        imapPassword: formData.smtpPassword
      });

      toast.success("Mailbox connected successfully!");
      setIsOpen(false);
      onConnect();
    } catch (error: any) {
      toast.error(error.message || "Failed to connect mailbox");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" className="gap-2" onClick={() => setIsOpen(true)}>
        <Server className="h-4 w-4" /> Connect Zoho / SMTP
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Mailbox (SMTP)</DialogTitle>
            <DialogDescription>
              Connect your Zoho or custom email provider. You must use an App Password, not your main login password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="sahil@nexaworks.tech" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" name="displayName" placeholder="Sahil Ghewari" required value={formData.displayName} onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" name="smtpHost" placeholder="smtp.zoho.in" required value={formData.smtpHost} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" name="smtpPort" type="number" placeholder="465" required value={formData.smtpPort} onChange={handleChange} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtpUsername">SMTP Username</Label>
              <Input id="smtpUsername" name="smtpUsername" placeholder="Usually your email" required value={formData.smtpUsername} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPassword">App Password</Label>
              <Input id="smtpPassword" name="smtpPassword" type="password" required value={formData.smtpPassword} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
