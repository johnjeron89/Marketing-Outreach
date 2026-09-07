'use client';

import { useEffect, useState } from 'react';
import { getInvestors } from '@/actions/investors';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function InvestorListView({ search }: { search: string }) {
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getInvestors({ search });
      setInvestors(res.investors);
      setLoading(false);
    }
    load();
  }, [search]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (investors.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No investors found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You haven't added any investors yet. Start by adding one or importing a CSV.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"><Checkbox /></TableHead>
            <TableHead>Name / Firm</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investors.map((inv) => (
            <TableRow 
              key={inv.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/investors/${inv.id}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div className="font-medium">{inv.name}</div>
                <div className="text-xs text-muted-foreground">{inv.firm}</div>
              </TableCell>
              <TableCell className="text-sm">{inv.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{inv.pipelineStatus}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {inv.tags?.map((t: any) => (
                    <Badge key={t.id} variant="secondary" className="text-[10px]">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{inv.location || '-'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Link href={`/inbox?investorId=${inv.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
