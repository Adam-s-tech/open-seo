import { Skeleton } from "@/client/components/Skeleton";

export function DomainOverviewLoadingState() {
  return (
    <div className="space-y-4" aria-busy>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4 space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-44" />
          </div>
        </div>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body p-4 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-60" />
          </div>
          <Skeleton className="h-9 w-64" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-7 gap-3">
                <Skeleton className="h-4 col-span-2" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4 col-span-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
