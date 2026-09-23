import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useHostedAuthRouteGuard } from "@/client/features/auth/useHostedAuthRouteGuard";
import { PageLoading } from "@/client/components/Spinner";
import { AuthenticatedAppLayout } from "@/client/layout/AppShell";
import { useOnboardingRedirect } from "@/client/features/onboarding/useOnboardingRedirect";

export const Route = createFileRoute("/_app")({
  component: AppRouteLayout,
});

function AppRouteLayout() {
  const authGate = useHostedAuthRouteGuard();
  useOnboardingRedirect();

  if (!authGate.canRenderAuthenticatedContent) {
    return <PageLoading fullScreen />;
  }

  return (
    <AuthenticatedAppLayout>
      <Outlet />
    </AuthenticatedAppLayout>
  );
}
