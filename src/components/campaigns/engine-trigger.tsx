'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { toast } from 'sonner';

export function EngineTrigger() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRunEngine = async () => {
    setIsLoading(true);
    try {
      // Run processor
      const processRes = await fetch('/api/engine/process-campaigns', { method: 'POST' });
      const processData = await processRes.json();
      
      // Run sender
      const sendRes = await fetch('/api/engine/send-emails', { method: 'POST' });
      const sendData = await sendRes.json();

      if (processData.success && sendData.success) {
        toast.success(`Engine cycle complete!`, {
          description: `Processed ${processData.processedCount || 0} investors, sent ${sendData.sentCount || 0} emails.`
        });
      } else {
        toast.error('Engine error', {
          description: processData.error || sendData.error || 'Unknown error occurred'
        });
      }
    } catch (error: any) {
      toast.error('Failed to trigger engine', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleRunEngine} 
      disabled={isLoading}
      className="border-primary/20 hover:border-primary/50 text-primary"
    >
      <Play className={`w-4 h-4 mr-2 ${isLoading ? 'animate-pulse text-muted-foreground' : ''}`} />
      {isLoading ? 'Running Engine...' : 'Run Engine (Manual Trigger)'}
    </Button>
  );
}
