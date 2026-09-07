"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Play, Pause, Edit, Trash2 } from 'lucide-react';
import { pauseCampaign, resumeCampaign, deleteCampaign } from '@/actions/campaigns';
import { toast } from 'sonner';

export function CampaignActions({ 
  campaignId, 
  status 
}: { 
  campaignId: string, 
  status: string 
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isRunning = status === 'ACTIVE';

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      if (isRunning) {
        await pauseCampaign(campaignId);
        toast.success("Campaign paused");
      } else {
        await resumeCampaign(campaignId);
        toast.success("Campaign resumed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update campaign status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
    
    setIsLoading(true);
    try {
      await deleteCampaign(campaignId);
      toast.success("Campaign deleted");
      router.push('/campaigns');
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        onClick={handleToggleStatus}
        disabled={isLoading}
        className={isRunning 
          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 border-amber-500/20"
          : "text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
        }
      >
        {isRunning ? (
          <><Pause className="w-4 h-4 mr-2" /> Pause</>
        ) : (
          <><Play className="w-4 h-4 mr-2" /> Resume</>
        )}
      </Button>
      <Button variant="outline" disabled={true} title="Editing coming soon">
        <Edit className="w-4 h-4 mr-2" /> Edit
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleDelete}
        disabled={isLoading}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
