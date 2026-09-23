import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthPageShell } from "@/client/features/auth/AuthPage";
import { useHostedAuthRouteGuard } from "@/client/features/auth/useHostedAuthRouteGuard";
import { PageLoading } from "@/client/components/Spinner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedShellLayout,
});

function AuthenticatedShellLayout() {
  const authGate = useHostedAuthRouteGuard();

  // Every page under this layout is hosted-only.
  if (!authGate.isHostedMode) {
    return null;
  }

  if (!authGate.canRenderAuthenticatedContent) {
    return <PageLoading fullScreen />;
  }

  return (
    <AuthPageShell>
      <Outlet />
    </AuthPageShell>
  );
}
