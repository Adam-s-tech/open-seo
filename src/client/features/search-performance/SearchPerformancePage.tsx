import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Download, Loader2, Sheet, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { QueryError } from "@/client/components/QueryState";
import { TableExportMenu } from "@/client/components/table/TableBulkActionBar";
import { GoogleConnectionCard } from "@/client/features/integrations/GoogleConnectionCard";
import { DimensionSection } from "@/client/features/search-performance/SearchPerformanceDimensionSection";
import { SearchPerformanceSelects } from "@/client/features/search-performance/SearchPerformanceSelects";
import { SearchPerformanceLoadingState } from "@/client/features/search-performance/SearchPerformanceLoadingState";
import {
  tableQueryOptions,
  type FilterInput,
} from "@/client/features/search-performance/searchPerformanceQueries";
import {
  SearchPerformanceTextFilters,
  type TextFilters,
} from "@/client/features/search-performance/SearchPerformanceTextFilters";
import {
  exportDimensionRows,
  exportStriking,
  StrikingDistanceTable,
  TabButton,
  TotalsCards,
  type ExportTarget,
} from "@/client/features/search-performance/SearchPerformanceParts";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  exportSearchPerformanceTable,
  getSearchPerformanceReport,
} from "@/serverFunctions/searchPerformance";
import {
  SEARCH_PERFORMANCE_DEFAULT_PAGE_SIZE,
  type SearchPerformanceSearch,
  type SearchPerformanceTab,
  type SearchPerformanceTableDimension,
} from "@/types/schemas/search-performance";

function tabDimension(
  tab: SearchPerformanceTab,
): SearchPerformanceTableDimension {
  return tab === "pages" ? "page" : "query";
}

function buildFilterInput({
  range = "last_28_days",
  device,
  country,
}: Pick<SearchPerformanceSearch, "range" | "device" | "country">): FilterInput {
  return {
    dateRange: range,
    ...(device ? { device } : {}),
    ...(country ? { country } : {}),
  };
}

export function SearchPerformancePage({
  projectId,
  search,
  onSearchChange,
}: {
  projectId: string;
  search: SearchPerformanceSearch;
  onSearchChange: (update: Partial<SearchPerformanceSearch>) => void;
}) {
  const queryClient = useQueryClient();
  const { range, device, country } = search;
  const textFilters = useMemo<TextFilters>(
    () => ({
      pageFilter: search.pageText
        ? {
            operator: search.pageMatch ?? "contains",
            expression: search.pageText,
          }
        : undefined,
      queryFilter: search.queryText
        ? {
            operator: search.queryMatch ?? "contains",
            expression: search.queryText,
          }
        : undefined,
    }),
    [search.pageText, search.pageMatch, search.queryText, search.queryMatch],
  );
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    Number(Boolean(textFilters.pageFilter)) +
    Number(Boolean(textFilters.queryFilter)) +
    Number(Boolean(country)) +
    Number(Boolean(device)) +
    Number(range !== undefined && range !== "last_28_days");
  const tab = search.tab ?? "striking";
  const page = search.page ?? 1;
  const pageSize = search.size ?? SEARCH_PERFORMANCE_DEFAULT_PAGE_SIZE;

  const filterInput = {
    ...buildFilterInput({ range, device, country }),
    ...textFilters,
  };

  const reportQuery = useQuery({
    queryKey: ["searchPerformance", projectId, filterInput],
    queryFn: () =>
      getSearchPerformanceReport({ data: { projectId, ...filterInput } }),
    placeholderData: keepPreviousData,
  });
  const report = reportQuery.data;

  const isTableTab = tab === "queries" || tab === "pages";
  const dimension = tabDimension(tab);
  const tableQuery = useQuery({
    ...tableQueryOptions(projectId, dimension, page, pageSize, filterInput),
    enabled: report?.connected === true && isTableTab,
    // Hold the current rows while paging or filtering, but not across a tab
    // or project change: Query rows must not render under the Pages header.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === projectId &&
      previousQuery.queryKey[2] === dimension
        ? previous
        : undefined,
  });

  // Warm the Queries tab (first page) as soon as the report connects so the tab
  // opens instantly instead of showing a spinner. Free first-party GSC data.
  useEffect(() => {
    if (report?.connected !== true) return;
    void queryClient.prefetchQuery(
      tableQueryOptions(
        projectId,
        "query",
        1,
        SEARCH_PERFORMANCE_DEFAULT_PAGE_SIZE,
        { ...buildFilterInput({ range, device, country }), ...textFilters },
      ),
    );
  }, [
    report?.connected,
    projectId,
    range,
    device,
    country,
    textFilters,
    queryClient,
  ]);

  const handleExport = async (target: ExportTarget) => {
    if (!report?.connected || reportQuery.isPlaceholderData) return;
    try {
      if (tab === "striking") {
        exportStriking(report, target);
        return;
      }
      const data = await exportSearchPerformanceTable({
        data: { projectId, dimension, ...filterInput },
      });
      exportDimensionRows(dimension, data.rows, report.range, target);
    } catch (error) {
      toast.error(getStandardErrorMessage(error, "Export failed"));
    }
  };

  const reportError = (
    <QueryError
      error={reportQuery.error}
      fallback="Failed to load Search Console data"
      onRetry={() => void reportQuery.refetch()}
      isRetrying={reportQuery.isFetching}
    />
  );

  const filtersPanel = (
    <SearchPerformanceTextFilters
      // Remount on URL changes (back/forward) so the draft matches.
      key={JSON.stringify(textFilters)}
      value={textFilters}
      activeFilterCount={activeFilterCount}
      onApply={(filters) => {
        onSearchChange({
          page: undefined,
          pageText: filters.pageFilter?.expression,
          pageMatch: filters.pageFilter?.operator,
          queryText: filters.queryFilter?.expression,
          queryMatch: filters.queryFilter?.operator,
        });
      }}
      onReset={() => {
        onSearchChange({
          page: undefined,
          pageText: undefined,
          pageMatch: undefined,
          queryText: undefined,
          queryMatch: undefined,
          country: undefined,
          device: undefined,
          range: undefined,
        });
      }}
    />
  );

  return (
    <div className="px-4 py-4 pb-24 overflow-auto md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Search Performance</h1>
            <p className="text-sm text-base-content/70">
              See your site&apos;s clicks, impressions, CTR, and position from
              Google Search Console.
            </p>
          </div>
          {report?.connected ? (
            <Link
              to="/p/$projectId/settings/integrations"
              params={{ projectId }}
              className="link link-hover shrink-0 self-start text-sm font-medium text-base-content/60 transition-colors hover:text-base-content sm:mt-1"
            >
              Change property
            </Link>
          ) : null}
        </div>

        {reportQuery.isPending ? (
          <SearchPerformanceLoadingState />
        ) : !report ? (
          <>
            {filtersPanel}
            {reportError}
          </>
        ) : !report.connected ? (
          <div className="max-w-2xl">
            <GoogleConnectionCard provider="gsc" projectId={projectId} />
          </div>
        ) : (
          <>
            {reportQuery.isError ? reportError : null}
            {reportQuery.isPlaceholderData ? (
              <SearchPerformanceLoadingState />
            ) : (
              <TotalsCards report={report} />
            )}
            <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100">
              <div className="flex flex-col gap-3 border-b border-base-300 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div role="tablist" className="tabs tabs-border w-fit">
                  <TabButton
                    active={tab === "striking"}
                    onClick={() =>
                      onSearchChange({ tab: "striking", page: undefined })
                    }
                    label={
                      reportQuery.isPlaceholderData
                        ? "Striking distance"
                        : `Striking distance (${report.strikingDistance.length})`
                    }
                  />
                  <TabButton
                    active={tab === "queries"}
                    onClick={() =>
                      onSearchChange({ tab: "queries", page: undefined })
                    }
                    label="Queries"
                  />
                  <TabButton
                    active={tab === "pages"}
                    onClick={() =>
                      onSearchChange({ tab: "pages", page: undefined })
                    }
                    label="Pages"
                  />
                </div>
                <TableExportMenu
                  buttonClassName="btn btn-ghost btn-sm gap-1"
                  actions={[
                    {
                      label: "Export to Sheets",
                      disabled: reportQuery.isPlaceholderData,
                      icon: <Sheet className="size-4" />,
                      onClick: () => void handleExport("sheets"),
                    },
                    {
                      label: "Download CSV",
                      disabled: reportQuery.isPlaceholderData,
                      icon: <Download className="size-4" />,
                      onClick: () => void handleExport("csv"),
                    },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-base-300">
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm gap-1.5 ${showFilters ? "btn-active" : ""}`}
                  aria-expanded={showFilters}
                  aria-controls="search-performance-filters"
                  onClick={() => setShowFilters((current) => !current)}
                  title="Toggle table filters"
                >
                  <SlidersHorizontal className="size-3.5" />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="badge badge-xs badge-primary border-0 text-primary-content">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
                {reportQuery.isFetching && !reportQuery.isPending ? (
                  <Loader2 className="size-4 animate-spin text-base-content/40" />
                ) : null}
                <SearchPerformanceSelects
                  search={search}
                  countries={report.countries}
                  onSearchChange={onSearchChange}
                />
              </div>

              {showFilters ? filtersPanel : null}
              {reportQuery.isPlaceholderData ? (
                <div className="p-8 text-sm" role="status">
                  Loading matching results…
                </div>
              ) : tab === "striking" ? (
                <StrikingDistanceTable
                  projectId={projectId}
                  rows={report.strikingDistance}
                />
              ) : (
                <DimensionSection
                  projectId={projectId}
                  tableQuery={tableQuery}
                  keyLabel={tab === "queries" ? "Query" : "Page"}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={(nextPage) =>
                    onSearchChange({ page: nextPage })
                  }
                  onPageSizeChange={(size) =>
                    onSearchChange({ page: undefined, size })
                  }
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
