import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  getErrorCode,
  getStandardErrorMessage,
} from "@/client/lib/error-messages";
import { BILLING_ROUTE } from "@/shared/billing";
import { PageLoading } from "./Spinner";

/**
 * A load failure with a retry button. The message goes through
 * `getStandardErrorMessage`. Out of credits, a retry can't succeed, so the
 * button goes to Billing instead.
 */
export function QueryError({
  error,
  cause,
  fallback,
  onRetry,
  isRetrying = false,
}: {
  /** Omit to always show `fallback`, for errors the page words itself. */
  error?: unknown;
  /** The error behind a `fallback` the page words itself; picks the button. */
  cause?: unknown;
  /** Shown when the error has no message of its own. */
  fallback: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div role="alert" className="alert alert-error">
      <span className="text-sm">
        {getStandardErrorMessage(error, fallback)}
      </span>
      {getErrorCode(error ?? cause) === "INSUFFICIENT_CREDITS" ? (
        <Link to={BILLING_ROUTE} className="btn btn-sm">
          Go to Billing
        </Link>
      ) : onRetry ? (
        <button
          type="button"
          className="btn btn-sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying…" : "Try again"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Loading, error with retry, or content for one query. A failed refetch keeps
 * the loaded content on screen, with the error above it.
 */
export function QueryState<TData>({
  query,
  errorFallback,
  loading = <PageLoading />,
  children,
}: {
  query: UseQueryResult<TData>;
  errorFallback: string;
  loading?: ReactNode;
  children: (data: TData) => ReactNode;
}) {
  if (query.isPending) return loading;

  const error = query.isError ? (
    <QueryError
      error={query.error}
      fallback={errorFallback}
      onRetry={() => void query.refetch()}
      isRetrying={query.isFetching}
    />
  ) : null;

  if (query.data === undefined) return error;

  return (
    <>
      {error}
      {children(query.data)}
    </>
  );
}
