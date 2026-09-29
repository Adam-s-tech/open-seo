import * as React from "react";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import {
  MissingSeoSetupModal,
  MobileSidebarDrawer,
  SeoApiStatusBanners,
} from "@/client/layout/AppShellParts";
import { GscReEngagementModal } from "@/client/features/gsc/GscReEngagementModal";
import { Sidebar } from "@/client/components/Sidebar";
import { BILLING_ROUTE } from "@/shared/billing";
import { getSeoApiKeyStatus } from "@/serverFunctions/config";
import { getLastProjectId } from "@/client/lib/active-project";
import { dataforseoHelpLinkOptions } from "@/client/navigation/items";

export function AuthenticatedAppLayout({
  children,
  projectId,
  banner,
}: {
  children: React.ReactNode;
  projectId?: string;
  banner?: React.ReactNode;
}) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [showMissingSeoApiKeyModal, setShowMissingSeoApiKeyModal] =
    React.useState(false);
  // On non-project pages (e.g. /settings) there's no projectId in the URL, so
  // derive one for the nav/switcher: prefer the last-visited project, else the
  // most recent. The whole app tree is client-only (see root ClientOnly), so we
  // can read localStorage synchronously during render — this lets the sidebar
  // show the full project nav on the very first paint instead of briefly
  // flashing only the always-visible Connect group while projects load. It is
  // read on every render, not once: the shell stays mounted across project
  // pages, which update the remembered project as the user moves between them.
  const projectsQuery = useQuery({
    ...projectsQueryOptions(),
    enabled: !projectId,
  });
  const rememberedProjectId = getLastProjectId();
  const fallbackProjects = projectsQuery.data ?? [];
  const fallbackProjectId =
    fallbackProjects.find((project) => project.id === rememberedProjectId)
      ?.id ??
    fallbackProjects[0]?.id ??
    null;
  // Once the projects list loads, fallbackProjectId is the validated choice
  // (remembered-if-valid, else most recent). Before it loads, fall back to the
  // remembered id so the project nav renders immediately; a stale id here only
  // builds links that self-correct via the route guard once data arrives.
  const sidebarProjectId =
    projectId ?? fallbackProjectId ?? rememberedProjectId;
  // The setup guide is where the modal and banners send the user, so it shows
  // neither: a banner there would link to the page the user is already on.
  const shouldCheckSeoApiKeyStatus =
    location.pathname !== BILLING_ROUTE &&
    location.pathname !== dataforseoHelpLinkOptions.to;
  const seoApiKeyStatusQuery = useQuery({
    queryKey: ["seoApiKeyStatus"],
    queryFn: () => getSeoApiKeyStatus(),
    enabled: shouldCheckSeoApiKeyStatus,
  });
  const isSeoApiKeyConfigured = shouldCheckSeoApiKeyStatus
    ? (seoApiKeyStatusQuery.data?.configured ?? null)
    : null;
  const seoApiKeyStatusError =
    shouldCheckSeoApiKeyStatus && seoApiKeyStatusQuery.isError;

  React.useEffect(() => {
    if (!shouldCheckSeoApiKeyStatus) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (seoApiKeyStatusQuery.isError) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (!seoApiKeyStatusQuery.isSuccess) return;
    setShowMissingSeoApiKeyModal(!seoApiKeyStatusQuery.data.configured);
  }, [
    location.pathname,
    seoApiKeyStatusQuery.data,
    seoApiKeyStatusQuery.isError,
    seoApiKeyStatusQuery.isSuccess,
    shouldCheckSeoApiKeyStatus,
  ]);

  const shouldShowSeoApiWarning =
    !seoApiKeyStatusError &&
    isSeoApiKeyConfigured === false &&
    !showMissingSeoApiKeyModal;

  return (
    <div className="flex h-[100dvh] bg-sidebar">
      <div className="hidden shrink-0 md:block">
        <Sidebar projectId={sidebarProjectId} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar
          drawerOpen={drawerOpen}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        {/* PostHog-style cutout: the main content sits on an inset panel with a
            thin strip of the sidebar background above it and a hairline border.
            Cards inside the panel use bg-base-100 to stand out from it. */}
        <div className="flex min-h-0 flex-1 flex-col md:pt-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-lg md:border-l md:border-t md:border-sidebar-border">
            <SeoApiStatusBanners
              shouldShowSeoApiWarning={shouldShowSeoApiWarning}
              seoApiKeyStatusError={seoApiKeyStatusError}
            />

            {banner}

            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </div>

      <MobileSidebarDrawer
        open={drawerOpen}
        projectId={sidebarProjectId}
        onClose={() => setDrawerOpen(false)}
      />

      {showMissingSeoApiKeyModal ? (
        <MissingSeoSetupModal
          onClose={() => setShowMissingSeoApiKeyModal(false)}
        />
      ) : null}

      <GscReEngagementModal
        projectId={sidebarProjectId}
        suppressed={showMissingSeoApiKeyModal}
      />
    </div>
  );
}

function MobileTopBar({
  drawerOpen,
  onOpenDrawer,
}: {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-base-300 bg-base-100 px-2 py-1.5 md:hidden">
      <button
        type="button"
        className="btn btn-square btn-ghost btn-sm"
        aria-label="Toggle sidebar"
        aria-expanded={drawerOpen}
        onClick={onOpenDrawer}
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link to="/" className="ml-1 font-semibold text-base-content">
        OpenSEO
      </Link>
    </div>
  );
}
