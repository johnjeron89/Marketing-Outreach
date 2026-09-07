'use client';

import { useEffect, useState } from 'react';
import { getInvestors, updatePipelineStatus } from '@/actions/investors';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = [
  { id: 'NEW', title: 'New' },
  { id: 'CONTACTED', title: 'Contacted' },
  { id: 'REPLIED', title: 'Replied' },
  { id: 'MEETING_SCHEDULED', title: 'Meeting Scheduled' },
  { id: 'DUE_DILIGENCE', title: 'Due Diligence' },
  { id: 'PASSED', title: 'Passed' },
  { id: 'INVESTED', title: 'Invested' },
];

export function InvestorKanbanView({ search }: { search: string }) {
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getInvestors({ search, pageSize: 500 });
      setInvestors(res.investors);
      setLoading(false);
    }
    load();
  }, [search]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const columns = COLUMNS.map(col => ({
    ...col,
    items: investors.filter(i => (i.pipelineStatus || 'NEW') === col.id)
  }));

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map(col => (
        <div key={col.id} className="min-w-[300px] flex-shrink-0 bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{col.title}</h3>
            <Badge variant="secondary">{col.items.length}</Badge>
          </div>
          <div className="space-y-3">
            {col.items.map(item => (
              <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-colors group">
                <CardContent className="p-4 relative">
                  <div className="font-medium pr-8">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.firm}</div>
                  <div className="text-xs text-muted-foreground mt-2 truncate">{item.email}</div>
                  
                  <Link href={`/inbox?investorId=${item.id}`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
