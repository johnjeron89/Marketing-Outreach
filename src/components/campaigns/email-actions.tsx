"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { approveEmail, rejectEmail } from '@/actions/emails';
import { toast } from 'sonner';

export function EmailActions({ 
  emailId, 
  status 
}: { 
  emailId: string, 
  status: string 
}) {
  const [isLoading, setIsLoading] = useState(false);

  if (status !== 'PENDING_APPROVAL') {
    return null; // Only show actions for pending emails
  }

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveEmail(emailId);
      toast.success("Email approved and queued for sending");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectEmail(emailId);
      toast.success("Email rejected and cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleReject}
        disabled={isLoading}
        className="h-8 text-destructive hover:bg-destructive/10"
      >
        <X className="w-3.5 h-3.5 mr-1" /> Reject
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleApprove}
        disabled={isLoading}
        className="h-8 text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
      >
        <Check className="w-3.5 h-3.5 mr-1" /> Approve
      </Button>
    </div>
  );
}
