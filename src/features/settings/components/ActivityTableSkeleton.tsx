import { Skeleton } from "@/components/ui/skeleton";

export function ActivityTableSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Skeleton className="h-10 md:col-span-2" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>

      <Skeleton className="h-4 w-56" />

      <div className="space-y-3 rounded-lg border border-slate-200 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>

      <div className="flex justify-center gap-2">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-10" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}
