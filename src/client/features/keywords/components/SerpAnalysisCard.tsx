import { ExternalLink } from "lucide-react";
import { ExportToSheetsButton } from "@/client/components/table/ExportToSheetsButton";
import { TablePagination } from "@/client/components/table/TablePagination";
import type { SerpResultItem } from "@/types/keywords";

export function SerpAnalysisCard({
  items,
  keyword,
  loading,
  loadingMore,
  canLoadMore,
  error,
  onRetry,
  deepFetchFailed,
  page,
  pageSize,
  onPageChange,
}: {
  items: SerpResultItem[];
  keyword?: string | null;
  loading: boolean;
  /** A deeper snapshot is being fetched; `items` is still the shallow one. */
  loadingMore: boolean;
  /** Paging past the loaded results can buy a deeper snapshot. */
  canLoadMore: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** The failure was the deeper crawl, so retrying restores the shallow one. */
  deepFetchFailed: boolean;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(items.length / pageSize);
  const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) return <SerpAnalysisLoadingState />;
  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error space-y-2">
        <p>{error}</p>
        {onRetry ? (
          <button className="btn btn-xs" onClick={onRetry}>
            {deepFetchFailed ? "Show top 20" : "Retry"}
          </button>
        ) : null}
      </div>
    );
  }
  if (items.length === 0) return <SerpAnalysisEmptyState keyword={keyword} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-base-content/50">
          {items.length} organic results
        </div>
        <ExportToSheetsButton
          headers={["Rank", "Title", "URL", "Domain"]}
          rows={items.map((item) => [
            item.rank,
            item.title ?? "",
            item.url,
            item.domain,
          ])}
          feature="serp_analysis"
        />
      </div>
      {pageItems.length === 0 && loadingMore ? (
        <SerpAnalysisLoadingState />
      ) : (
        <SerpAnalysisTable items={pageItems} />
      )}
      {totalPages > 1 || canLoadMore ? (
        <TablePagination
          page={page + 1}
          pageSize={pageSize}
          totalCount={items.length}
          isLoading={loadingMore}
          // Past the loaded results, "Next" buys a deeper crawl. The button
          // says so rather than spending silently.
          loadMoreLabel={canLoadMore ? "Load top 100" : undefined}
          onPageChange={(nextPage) => onPageChange(nextPage - 1)}
        />
      ) : null}
    </div>
  );
}

function SerpAnalysisTable({ items }: { items: SerpResultItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-xs w-full">
        <thead>
          <tr className="text-xs text-base-content/60">
            <th className="w-8">#</th>
            <th>Page</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={`${item.rank}-${item.url}`}
              className="hover:bg-base-200/50"
            >
              <td className="font-mono text-base-content/50 text-xs">
                {item.rank}
              </td>
              <td className="min-w-0 max-w-0">
                <div className="flex flex-col gap-0.5">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline truncate flex items-center gap-1"
                    title={item.title}
                  >
                    {item.title || item.url}
                    <ExternalLink className="size-3 shrink-0 opacity-40" />
                  </a>
                  <span className="text-xs text-base-content/40 truncate">
                    {item.domain}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SerpAnalysisLoadingState() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-8 rounded bg-base-200 animate-pulse"
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
}

function SerpAnalysisEmptyState({ keyword }: { keyword?: string | null }) {
  return (
    <div className="text-sm text-base-content/50 text-center py-8">
      <p>No SERP details available for this keyword yet.</p>
      {keyword ? (
        <p className="mt-1">Try clicking another keyword to load data.</p>
      ) : null}
    </div>
  );
}
