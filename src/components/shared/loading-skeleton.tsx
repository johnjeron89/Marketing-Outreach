import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full rounded-md border border-border/50 bg-card/50">
      <div className="border-b border-border/50 p-4">
        <Skeleton className="h-6 w-32 bg-muted/60" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center p-4">
            <Skeleton className="mr-4 h-12 w-12 rounded-full bg-muted/60" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3 bg-muted/60" />
              <Skeleton className="h-3 w-1/4 bg-muted/60" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full bg-muted/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-6 shadow-sm">
          <Skeleton className="mb-4 h-10 w-10 rounded-full bg-muted/60" />
          <div className="space-y-2 mb-4">
            <Skeleton className="h-5 w-1/2 bg-muted/60" />
            <Skeleton className="h-4 w-full bg-muted/60" />
          </div>
          <Skeleton className="h-8 w-full rounded-md mt-auto bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-2xl space-y-8 rounded-xl border border-border/50 bg-card/50 p-8">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3 bg-muted/60" />
        <Skeleton className="h-4 w-2/3 bg-muted/60" />
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-muted/60" />
          <Skeleton className="h-10 w-full rounded-md bg-muted/60" />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 bg-muted/60" />
            <Skeleton className="h-10 w-full rounded-md bg-muted/60" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-muted/60" />
            <Skeleton className="h-10 w-full rounded-md bg-muted/60" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-muted/60" />
          <Skeleton className="h-32 w-full rounded-md bg-muted/60" />
        </div>
      </div>
      
      <div className="pt-4 flex justify-end gap-2">
        <Skeleton className="h-10 w-24 rounded-md bg-muted/60" />
        <Skeleton className="h-10 w-32 rounded-md bg-muted/60" />
      </div>
    </div>
  );
}
