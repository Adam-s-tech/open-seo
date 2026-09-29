import { ErrorState } from "@/client/components/ErrorState";
import { SkeletonStatGrid } from "@/client/components/SkeletonPresets";
import { Card, CardContent } from "@/client/components/ui/card";
import { Skeleton } from "@/client/components/ui/skeleton";

export function BacklinksLoadingState() {
  return (
    <div className="space-y-3">
      <SkeletonStatGrid
        count={8}
        className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function BacklinksErrorState({
  errorMessage,
  onRetry,
  isRetrying,
}: {
  errorMessage: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <ErrorState
      title="Could not load backlinks"
      message={errorMessage ?? "Please try again in a moment."}
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  );
}
