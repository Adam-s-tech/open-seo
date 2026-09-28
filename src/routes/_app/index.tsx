import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  clearLastProjectId,
  getLastProjectId,
} from "@/client/lib/active-project";
import { getErrorCode } from "@/client/lib/error-messages";
import { AuthErrorCard } from "@/client/components/AuthErrorCard";
import { QueryError } from "@/client/components/QueryState";
import { Spinner } from "@/client/components/Spinner";
import { SUBSCRIBE_ROUTE } from "@/shared/billing";

export const Route = createFileRoute("/_app/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  const { data, error, isError, isFetching, refetch } = useQuery({
    ...projectsQueryOptions(),
    retry: false,
  });

  useEffect(() => {
    // getProjects always returns at least one project.
    if (!data) return;

    // localStorage is untrusted — only honor the remembered project if it's
    // actually in the org's list; otherwise fall back to the most recent and
    // clear the stale id.
    const lastProjectId = getLastProjectId();
    const target = data.find((project) => project.id === lastProjectId);
    if (lastProjectId && !target) {
      clearLastProjectId();
    }

    void navigate({
      to: "/p/$projectId",
      params: { projectId: (target ?? data[0]).id },
    });
  }, [data, navigate]);

  useEffect(() => {
    if (getErrorCode(error) !== "PAYMENT_REQUIRED") {
      return;
    }

    void navigate({ href: SUBSCRIBE_ROUTE });
  }, [error, navigate]);

  if (isError) {
    const errorCode = getErrorCode(error);

    if (errorCode === "PAYMENT_REQUIRED") {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="flex flex-col items-center gap-3 max-w-xl text-center">
            <p className="text-base-content/80">
              Redirecting you to billing so you can start a hosted subscription.
            </p>
          </div>
        </div>
      );
    }

    return (
      <AuthErrorCard
        error={error}
        onRetry={() => void refetch()}
        fallback={
          <div className="flex items-center justify-center h-full p-4">
            <div className="w-full max-w-xl">
              <QueryError
                error={error}
                fallback="An unexpected error occurred. Please check server logs."
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            </div>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Spinner />
    </div>
  );
}
