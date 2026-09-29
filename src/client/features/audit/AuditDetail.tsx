import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { QueryError, QueryState } from "@/client/components/QueryState";
import { PageLoading } from "@/client/components/Spinner";
import { Badge } from "@/client/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/client/components/ui/progress";
import { Spinner } from "@/client/components/ui/spinner";
import {
  getAuditResults,
  getAuditStatus,
  getCrawlProgress,
} from "@/serverFunctions/audit";
import { ResultsView } from "@/client/features/audit/results/ResultsView";
import {
  extractHostname,
  extractPathname,
  formatStartedAt,
  HttpStatusBadge,
  StatusBadge,
} from "@/client/features/audit/shared";
import { SUPPORT_EMAIL } from "@/client/lib/support";

export function AuditDetail({
  projectId,
  auditId,
  tab,
  onBack,
  onTabChange,
}: {
  projectId: string;
  auditId: string;
  tab: string;
  onBack: () => void;
  onTabChange: (tab: "issues" | "pages" | "performance") => void;
}) {
  const statusQuery = useQuery({
    queryKey: ["audit-status", projectId, auditId],
    queryFn: () => getAuditStatus({ data: { projectId, auditId } }),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "running" ? 3000 : false;
    },
  });

  const isComplete = statusQuery.data?.status === "completed";
  const isFailed = statusQuery.data?.status === "failed";
  const isRunning = statusQuery.data?.status === "running";

  // Failed audits keep whatever pages were crawled before the failure
  // (persistence is per-batch), so fetch results for them too and show the
  // partial crawl instead of a dead end.
  const resultsQuery = useQuery({
    queryKey: ["audit-results", projectId, auditId],
    queryFn: () => getAuditResults({ data: { projectId, auditId } }),
    enabled: isComplete || isFailed,
  });

  // isPending (not isLoading) also covers a fetch paused while offline, so
  // past these two returns the status is always loaded.
  if (statusQuery.isPending) {
    return <PageLoading />;
  }

  if (statusQuery.isError) {
    return (
      <div className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <QueryError
            fallback="We could not load this audit. It may have been deleted."
            onRetry={() => void statusQuery.refetch()}
            isRetrying={statusQuery.isFetching}
          />
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            &larr; Back to audits
          </button>
        </div>
      </div>
    );
  }

  const status = statusQuery.data;
  const partialPageCount = isFailed
    ? (resultsQuery.data?.pages.length ?? 0)
    : 0;
  const failedWithResults = isFailed && partialPageCount > 0;
  // Wait for the results fetch before choosing between the "partial results"
  // banner and the zero-page banner, so the zero-page banner doesn't flash.
  const failedWithoutResults =
    isFailed && resultsQuery.isSuccess && !failedWithResults;
  // A completed crawl that reached one page or none was blocked by the site.
  // A failed audit stopped on our side, so it gets the error code instead.
  const showBlockedCta = isComplete && status.pagesCrawled <= 1;

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 pb-24 md:pb-8 overflow-auto">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="space-y-1">
          <button className="btn btn-ghost btn-sm px-0" onClick={onBack}>
            &larr; All audits
          </button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold">
              {extractHostname(status.startUrl)}
            </h1>
            {!isRunning && <StatusBadge status={status.status} />}
          </div>
          <p className="text-sm text-base-content/60">
            Site audit &middot; Started {formatStartedAt(status.startedAt)}
          </p>
        </div>

        {isRunning && (
          <ProgressCard
            projectId={projectId}
            auditId={auditId}
            status={status}
          />
        )}

        {failedWithoutResults && (
          <div className="alert alert-error">
            <AlertCircle className="size-5" />
            <div className="space-y-1">
              <p className="font-medium">
                This audit stopped before it crawled any pages.
              </p>
              <p>
                Run a new audit to try again, or email{" "}
                <a
                  className="link link-primary"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                if this keeps happening.
              </p>
              {status.errorCode ? (
                <p className="font-mono text-xs opacity-70">
                  Code: {status.errorCode}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {showBlockedCta && (
          <div className="alert alert-warning">
            <AlertCircle className="size-5" />
            <div className="space-y-1">
              <p className="font-medium">
                Site audit couldn't fully crawl this website.
              </p>
              <p>
                Sorry! This site's bot protection blocked our crawler. We don't
                have a workaround for this yet. Desktop crawlers run from your
                own machine and usually get past it: try{" "}
                <a
                  className="link link-primary"
                  href="https://github.com/PhialsBasement/LibreCrawl"
                  target="_blank"
                  rel="noreferrer"
                >
                  LibreCrawl
                </a>{" "}
                (free, open source) or{" "}
                <a
                  className="link link-primary"
                  href="https://www.screamingfrog.co.uk/seo-spider/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Screaming Frog
                </a>{" "}
                (free up to 500 URLs).
              </p>
            </div>
          </div>
        )}

        {failedWithResults && (
          <div className="alert alert-warning">
            <AlertCircle className="size-5" />
            <div className="space-y-1">
              <p className="font-medium">
                This audit stopped early after {partialPageCount} page
                {partialPageCount === 1 ? "" : "s"}.
              </p>
              <p>
                The results below cover everything crawled before it stopped.
                Run a new audit to try again, or email{" "}
                <a
                  className="link link-primary"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                if this keeps happening.
              </p>
            </div>
          </div>
        )}

        {(isComplete || isFailed) && (
          <QueryState
            query={resultsQuery}
            errorFallback="Failed to load the audit results"
          >
            {(data) =>
              (isComplete || failedWithResults) && (
                <ResultsView
                  projectId={projectId}
                  data={data}
                  tab={tab}
                  onTabChange={onTabChange}
                />
              )
            }
          </QueryState>
        )}
      </div>
    </div>
  );
}

function ProgressCard({
  projectId,
  auditId,
  status,
}: {
  projectId: string;
  auditId: string;
  status: {
    pagesCrawled: number;
    pagesTotal: number;
    lighthouseTotal: number;
    lighthouseCompleted: number;
    lighthouseFailed: number;
    currentPhase: string | null;
  };
}) {
  const crawlProgress =
    status.pagesTotal > 0
      ? Math.round((status.pagesCrawled / status.pagesTotal) * 100)
      : 0;
  const lighthouseDone = status.lighthouseCompleted + status.lighthouseFailed;
  const lighthouseProgress =
    status.lighthouseTotal > 0
      ? Math.round((lighthouseDone / status.lighthouseTotal) * 100)
      : 0;
  const isLighthousePhase = status.currentPhase === "lighthouse";
  const phaseLabel =
    status.currentPhase === "discovery"
      ? "Discovery"
      : status.currentPhase === "crawling"
        ? "Crawling"
        : status.currentPhase === "lighthouse"
          ? "Lighthouse"
          : status.currentPhase === "finalizing"
            ? "Finalizing"
            : "Running";
  const progress = isLighthousePhase ? lighthouseProgress : crawlProgress;

  const crawlProgressQuery = useQuery({
    queryKey: ["audit-crawl-progress", projectId, auditId],
    queryFn: () => getCrawlProgress({ data: { projectId, auditId } }),
    refetchInterval: 1500,
  });

  const crawledUrls = crawlProgressQuery.data ?? [];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-medium">
            <Spinner className="text-primary" aria-hidden />
            {isLighthousePhase ? "Running Lighthouse checks" : "Crawling pages"}
          </CardTitle>
          <CardAction>
            <Badge variant="secondary">{phaseLabel}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Progress value={progress}>
            <ProgressLabel className="font-normal">
              {isLighthousePhase
                ? `${lighthouseDone} / ${status.lighthouseTotal} checks${
                    status.lighthouseFailed > 0
                      ? ` (${status.lighthouseFailed} failed)`
                      : ""
                  }`
                : `${status.pagesCrawled} / ${status.pagesTotal} pages`}
            </ProgressLabel>
            <ProgressValue />
          </Progress>
        </CardContent>
      </Card>

      {crawledUrls.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground">
              Crawled Pages ({crawledUrls.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Updated {new Date(crawledUrls[0].crawledAt).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {crawledUrls.map((entry, i) => (
              <ProgressRow
                key={`${entry.url}-${entry.crawledAt}`}
                entry={entry}
                index={i}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProgressRow({
  entry,
  index,
}: {
  entry: {
    url: string;
    statusCode: number | null;
    title: string | null;
    crawledAt: number;
  };
  index: number;
}) {
  const pathname = extractPathname(entry.url);

  return (
    <div
      className={`flex items-center justify-between gap-3 px-2 py-1.5 rounded text-sm ${
        index === 0
          ? "bg-primary/5 animate-in fade-in slide-in-from-top-1 duration-300"
          : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HttpStatusBadge code={entry.statusCode} />
        <span className="truncate text-base-content/80" title={entry.url}>
          {pathname}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {entry.title && (
          <span
            className="text-xs text-base-content/40 truncate max-w-[260px] hidden md:block"
            title={entry.title}
          >
            {entry.title}
          </span>
        )}
      </div>
    </div>
  );
}
