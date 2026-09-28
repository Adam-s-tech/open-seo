import { queryClient } from "@/client/tanstack-db/queryClient";
import { googleConnectionOptions } from "@/client/features/integrations/googleProviders";
import { createFileRoute } from "@tanstack/react-router";
import { GoogleConnectionCard } from "@/client/features/integrations/GoogleConnectionCard";
import { CrawlerAccessSettings } from "@/client/features/settings/CrawlerAccessSettings";

export const Route = createFileRoute(
  "/_project/p/$projectId/settings/integrations",
)({
  loader: ({ params }) => {
    // Start both database checks on link intent without holding up navigation.
    void queryClient.prefetchQuery(
      googleConnectionOptions("gsc", params.projectId),
    );
    void queryClient.prefetchQuery(
      googleConnectionOptions("ga4", params.projectId),
    );
  },
  component: ProjectIntegrationsRoute,
});

function ProjectIntegrationsRoute() {
  const { projectId } = Route.useParams();

  return (
    <div className="space-y-8">
      {/* The ids are the targets old #search-console / #google-analytics deep
          links are redirected to from the settings index. */}
      <section id="search-console" className="scroll-mt-6 space-y-3">
        <h2 className="text-sm font-medium text-base-content/50">
          Search Console
        </h2>
        <GoogleConnectionCard provider="gsc" projectId={projectId} />
      </section>

      <section id="google-analytics" className="scroll-mt-6 space-y-3">
        <h2 className="text-sm font-medium text-base-content/50">Analytics</h2>
        <GoogleConnectionCard provider="ga4" projectId={projectId} />
      </section>

      <CrawlerAccessSettings projectId={projectId} />
    </div>
  );
}
