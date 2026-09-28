import { useEffect, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import {
  getErrorCode,
  getStandardErrorMessage,
} from "@/client/lib/error-messages";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { getSignInHref, getSignInHrefForLocation } from "@/lib/auth-redirect";

const CLOUDFLARE_SETUP_GUIDE_URL =
  "https://github.com/every-app/open-seo/blob/main/docs/SELF_HOSTING_CLOUDFLARE.md#2-configure-authentication-and-secrets";

type CardProps = {
  message: string;
  onRetry: () => void;
};

/**
 * The card for an auth failure, else `fallback`. The route error boundary and
 * the landing redirect both render errors through this, so each auth error
 * code shows the same card everywhere.
 */
export function AuthErrorCard({
  error,
  onRetry,
  fallback,
}: {
  error: unknown;
  onRetry: () => void;
  fallback: ReactNode;
}) {
  const errorCode = getErrorCode(error);
  if (errorCode !== "AUTH_CONFIG_MISSING" && errorCode !== "UNAUTHENTICATED") {
    return fallback;
  }

  const message = getStandardErrorMessage(
    error,
    "Something went wrong. Please try again.",
  );
  return (
    <div className="flex h-full min-w-0 flex-1 items-center justify-center p-4">
      {errorCode === "AUTH_CONFIG_MISSING" ? (
        <AuthConfigErrorCard message={message} onRetry={onRetry} />
      ) : (
        <UnauthenticatedErrorCard message={message} onRetry={onRetry} />
      )}
    </div>
  );
}

function AuthConfigErrorCard({ message, onRetry }: CardProps) {
  // Only name a mode's settings when the client build names that mode. With
  // AUTH_MODE unset here the server mode is unknown, and the alert above
  // already carries the server's exact message.
  const clientAuthMode = import.meta.env.AUTH_MODE;

  return (
    <div className="card w-full max-w-2xl bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body gap-4">
        <h2 className="card-title gap-2">
          <ShieldAlert className="size-5 text-error" />
          Authentication setup required
        </h2>

        <div className="alert alert-error">
          <span>{message}</span>
        </div>

        {clientAuthMode === "hosted" ? (
          <p className="text-sm text-base-content/70">
            Hosted mode requires{" "}
            <code className="mx-1">BETTER_AUTH_SECRET</code>
            (32+ characters), <code className="mx-1">BETTER_AUTH_URL</code>, and
            Google OAuth credentials on the deployment.
          </p>
        ) : null}
        {clientAuthMode === "cloudflare_access" ? (
          <p className="text-sm text-base-content/70">
            Cloudflare Access mode requires
            <code className="mx-1">TEAM_DOMAIN</code> (a full https URL) and
            <code className="mx-1">POLICY_AUD</code> set on the deployment, with
            an Access application protecting this hostname.
          </p>
        ) : null}

        <div className="card-actions justify-end">
          <button className="btn btn-ghost btn-sm" onClick={onRetry}>
            Try Again
          </button>
          <a
            className="btn btn-primary btn-sm"
            href={CLOUDFLARE_SETUP_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open Setup Guide
          </a>
        </div>
      </div>
    </div>
  );
}

function UnauthenticatedErrorCard({ message, onRetry }: CardProps) {
  const isHostedMode = isHostedClientAuthMode();
  const signInHref =
    typeof window === "undefined"
      ? getSignInHref("/")
      : getSignInHrefForLocation(window.location);

  useEffect(() => {
    if (typeof window === "undefined" || !isHostedMode) {
      return;
    }

    window.location.replace(signInHref);
  }, [isHostedMode, signInHref]);

  if (isHostedMode) {
    return null;
  }

  return (
    <div className="card w-full max-w-md bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body gap-4">
        <h2 className="card-title">Authentication required</h2>
        <p className="text-sm text-base-content/70">{message}</p>
        <p className="text-sm text-base-content/70">
          This deployment uses external authentication. Refresh your access
          session, then try again.
        </p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary btn-sm" onClick={onRetry}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
