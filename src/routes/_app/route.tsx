import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";
import { useHostedAuthRouteGuard } from "@/client/features/auth/useHostedAuthRouteGuard";
import { FreePlanBanner } from "@/client/features/billing/FreePlanBanner";
import { PageLoading } from "@/client/components/Spinner";
import { AuthenticatedAppLayout } from "@/client/layout/AppShell";
import { useOnboardingRedirect } from "@/client/features/onboarding/useOnboardingRedirect";

export const Route = createFileRoute("/_app")({
  component: AppRouteLayout,
});

// One layout for app pages and project pages (/p/$projectId/...), so the
// drawer, setup modal and GSC nudge keep their state when the user moves
// between the two.
function AppRouteLayout() {
  const authGate = useHostedAuthRouteGuard();
  useOnboardingRedirect();
  const { projectId } = useParams({ strict: false });

  if (!authGate.canRenderAuthenticatedContent) {
    return <PageLoading fullScreen />;
  }

  return (
    <AuthenticatedAppLayout
      projectId={projectId}
      banner={
        projectId && authGate.isHostedMode ? <FreePlanBanner /> : undefined
      }
    >
      <Outlet />
    </AuthenticatedAppLayout>
  );
}
