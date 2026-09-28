import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Modal } from "@/client/components/Modal";
import { Sidebar } from "@/client/components/Sidebar";
import { AppBanner } from "@/client/layout/AppBanner";
import { dataforseoHelpLinkOptions } from "@/client/navigation/items";

function SeoApiStatusBanners({
  shouldShowSeoApiWarning,
  seoApiKeyStatusError,
}: {
  shouldShowSeoApiWarning: boolean;
  seoApiKeyStatusError: boolean;
}) {
  const icon = <AlertTriangle className="size-4 shrink-0" />;
  const helpLink = (
    <Link
      {...dataforseoHelpLinkOptions}
      className="link link-primary font-medium"
    >
      help page
    </Link>
  );
  return (
    <>
      {shouldShowSeoApiWarning ? (
        <AppBanner variant="warning" icon={icon}>
          Setup needed: add your DataForSEO API key to use OpenSEO features. See
          the quick steps on the {helpLink}.
        </AppBanner>
      ) : null}

      {seoApiKeyStatusError ? (
        <AppBanner variant="info" icon={icon}>
          We could not verify your DataForSEO setup. If features are not
          working, check the setup steps on the {helpLink}.
        </AppBanner>
      ) : null}
    </>
  );
}

function MobileSidebarDrawer({
  open,
  projectId,
  onClose,
}: {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close sidebar"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 h-full shadow-xl">
        <Sidebar projectId={projectId} onNavigate={onClose} onClose={onClose} />
      </div>
    </div>
  );
}

function MissingSeoSetupModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      maxWidth="max-w-lg"
      onClose={onClose}
      labelledBy="dataforseo-setup-title"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-warning/20 p-2 text-warning">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-2">
          <h2
            id="dataforseo-setup-title"
            className="text-lg font-semibold text-base-content"
          >
            One quick setup step
          </h2>
          <p className="text-sm text-base-content/75">
            Add your DataForSEO API key to start using OpenSEO.
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Dismiss
        </button>
        <Link
          {...dataforseoHelpLinkOptions}
          className="btn btn-primary"
          onClick={onClose}
        >
          Open setup guide
          <ExternalLink className="size-4" />
        </Link>
      </div>
    </Modal>
  );
}

export { MissingSeoSetupModal, MobileSidebarDrawer, SeoApiStatusBanners };
