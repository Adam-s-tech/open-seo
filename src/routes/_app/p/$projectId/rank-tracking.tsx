import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageHeader } from "@/client/components/PageHeader";

export const Route = createFileRoute("/_app/p/$projectId/rank-tracking")({
  component: RankTrackingLayout,
});

function RankTrackingLayout() {
  return (
    <div className="px-4 py-4 pb-24 overflow-auto md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader
          title="Rank Tracking"
          description="Track keyword positions across domains"
        />

        <Outlet />
      </div>
    </div>
  );
}
