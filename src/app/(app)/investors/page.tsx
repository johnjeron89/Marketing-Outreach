'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Download, Upload, Search, LayoutList, KanbanSquare } from 'lucide-react';
import { AddInvestorDialog } from '@/components/investors/add-investor-dialog';
import { ImportDialog } from '@/components/investors/import-dialog';
import { InvestorListView } from '@/components/investors/investor-list-view';
import { InvestorKanbanView } from '@/components/investors/investor-kanban-view';

function InvestorsContent() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<'list' | 'kanban'>(
    (searchParams.get('view') as 'list' | 'kanban') || 'list'
  );
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(searchParams.get('action') === 'import');

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Investors</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investor
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investors..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex border rounded-md">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('list')}
            className="rounded-none rounded-l-md"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('kanban')}
            className="rounded-none rounded-r-md"
          >
            <KanbanSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <InvestorListView search={search} />
      ) : (
        <InvestorKanbanView search={search} />
      )}

      <AddInvestorDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <ImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <Suspense fallback={<div className="p-8 pt-6">Loading...</div>}>
      <InvestorsContent />
    </Suspense>
  );
}
