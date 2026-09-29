import {
  SkeletonStatGrid,
  SkeletonTableRows,
} from "@/client/components/SkeletonPresets";
import { Card, CardContent } from "@/client/components/ui/card";
import { Skeleton } from "@/client/components/ui/skeleton";

export function DomainOverviewLoadingState() {
  return (
    <div className="space-y-4" aria-busy>
      <SkeletonStatGrid
        count={2}
        className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-60" />
          </div>
          <SkeletonTableRows />
        </CardContent>
      </Card>
    </div>
  );
}
