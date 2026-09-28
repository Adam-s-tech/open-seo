import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRankTrackingConfigs } from "@/serverFunctions/rank-tracking";
import { RankTrackingDomainDetail } from "@/client/features/rank-tracking/RankTrackingDomainDetail";
import { PageLoading } from "@/client/components/Spinner";
import { QueryError } from "@/client/components/QueryState";
import { RankTrackingConfigModal } from "@/client/features/rank-tracking/RankTrackingConfigModal";
import { rankTrackingDetailSearchSchema } from "@/types/schemas/rank-tracking-search";

export const Route = createFileRoute(
  "/_app/p/$projectId/rank-tracking/$configId",
)({
  validateSearch: rankTrackingDetailSearchSchema,
  component: RankTrackingConfigRoute,
});

function RankTrackingConfigRoute() {
  const { projectId, configId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [showConfigModal, setShowConfigModal] = useState(false);

  const configsQuery = useQuery({
    queryKey: ["rankTrackingConfigs", projectId],
    queryFn: () => getRankTrackingConfigs({ data: { projectId } }),
  });

  const config = configsQuery.data?.find((c) => c.id === configId) ?? null;

  const invalidateConfigs = () => {
    void queryClient.invalidateQueries({
      queryKey: ["rankTrackingConfigs", projectId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["rankTrackingConfigSummaries", projectId],
    });
  };

  const handleBack = () => {
    void navigate({
      to: "/p/$projectId/rank-tracking",
      params: { projectId },
    });
  };

  if (configsQuery.isPending) {
    return <PageLoading />;
  }

  if (!configsQuery.data) {
    return (
      <QueryError
        error={configsQuery.error}
        fallback="Failed to load domain configuration"
        onRetry={() => void configsQuery.refetch()}
        isRetrying={configsQuery.isFetching}
      />
    );
  }

  if (!config) {
    return (
      <>
        <p className="text-sm text-base-content/70">
          Domain configuration not found.
        </p>
        <button className="btn btn-ghost btn-sm" onClick={handleBack}>
          Back to domains
        </button>
      </>
    );
  }

  return (
    <>
      <RankTrackingDomainDetail
        key={config.id}
        config={config}
        projectId={projectId}
        search={search}
        onSearchChange={(update) => {
          void navigate({
            from: Route.fullPath,
            search: (prev) => ({ ...prev, ...update }),
            replace: true,
          });
        }}
        onBack={handleBack}
        onEdit={() => setShowConfigModal(true)}
      />

      {showConfigModal && (
        <RankTrackingConfigModal
          projectId={projectId}
          existingConfig={config}
          onClose={() => setShowConfigModal(false)}
          onSaved={() => {
            setShowConfigModal(false);
            invalidateConfigs();
          }}
        />
      )}
    </>
  );
}
