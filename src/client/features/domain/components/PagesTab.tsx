import { useCallback, useMemo, useState } from "react";
import { Copy, Download, FileSpreadsheet, Sheet } from "lucide-react";
import { QueryError } from "@/client/components/QueryState";
import { TablePagination } from "@/client/components/table/TablePagination";
import { DomainPageLink } from "@/client/features/domain/components/DomainPageLink";
import { DomainFilterPanel } from "@/client/features/domain/components/DomainFilterPanel";
import { DomainPagesTable } from "@/client/features/domain/components/DomainPagesTable";
import { DomainTableTabSurface } from "@/client/features/domain/components/DomainTableTabSurface";
import {
  PAGE_FILTER_FIELDS,
  buildPagesClearSearchUpdate,
  buildPagesSearchUpdate,
  countPageFilterConditions,
} from "@/client/features/domain/domainFilterUtils";
import { useDomainPagesQuery } from "@/client/features/domain/hooks/useDomainPagesQuery";
import { useDomainPageFilterPreferences } from "@/client/features/domain/useDomainFilterPreferences";
import {
  EMPTY_DOMAIN_FILTERS,
  type DomainSortMode,
  type PageRow,
  type PagesFilterValues,
} from "@/client/features/domain/types";
import { pagesToTable } from "@/client/features/domain/utils";
import type { DomainOverviewRouteState } from "@/client/features/domain/domainRouteState";
import { exportRows, type ExportFormat } from "@/client/lib/exportRows";
import {
  DOMAIN_KEYWORDS_PAGE_SIZES,
  MAX_DATAFORSEO_FILTER_CONDITIONS,
  type DomainSearchParams,
} from "@/types/schemas/domain";
import {
  RESEARCH_SCOPE_FILTER_SLOTS,
  type ResearchScope,
} from "@/shared/researchScope";

type SearchUpdate = Partial<DomainSearchParams>;

const EMPTY_PAGES_ROWS: PageRow[] = [];
const PAGE_TEXT_FILTERS = [
  {
    key: "include",
    label: "Include Page Terms",
    placeholder: "pricing, tools, guides",
  },
  {
    key: "exclude",
    label: "Exclude Page Terms",
    placeholder: "blog, tag, archive",
  },
] as const;
const PAGE_RANGE_FILTERS = [
  { title: "Traffic", minKey: "minTraffic", maxKey: "maxTraffic" },
  { title: "Keywords", minKey: "minVol", maxKey: "maxVol" },
] as const;

type Props = {
  projectId: string;
  /** Research target as displayed: hostname, plus the path for URL scopes. */
  target: string;
  /** Hostname only, for resolving relative result URLs. */
  hostname: string;
  scope: ResearchScope;
  routeState: DomainOverviewRouteState;
  setSearchParams: (updates: SearchUpdate) => void;
  onSortClick: (sort: DomainSortMode) => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
};

export function PagesTab({
  projectId,
  target,
  hostname,
  scope,
  routeState,
  setSearchParams,
  onSortClick,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  // Scope filters consume part of DataForSEO's fixed filter budget.
  const maxConditions =
    MAX_DATAFORSEO_FILTER_CONDITIONS - RESEARCH_SCOPE_FILTER_SLOTS.pages[scope];
  const filterPreferences = useDomainPageFilterPreferences(
    `${projectId}:${target}`,
  );
  const {
    filters: preferredFilters,
    save: savePreferredFilters,
    clear: clearPreferredFilters,
  } = filterPreferences;
  const restoredFilters = useMemo(
    () =>
      routeState.hasAppliedPageFilters
        ? routeState.appliedPageFilters
        : preferredFilters,
    [
      preferredFilters,
      routeState.appliedPageFilters,
      routeState.hasAppliedPageFilters,
    ],
  );
  // Filters restored from the URL or saved preferences can exceed this
  // scope's tighter budget; sending them would make the server reject the
  // whole query, so hold them back and let the panel explain.
  const filtersOverBudget =
    countPageFilterConditions(restoredFilters) > maxConditions;
  const appliedPagesFilters = filtersOverBudget
    ? EMPTY_DOMAIN_FILTERS
    : restoredFilters;

  const query = useDomainPagesQuery({
    projectId,
    domain: target,
    scope,
    locationCode: routeState.sentLocationCode,
    page: routeState.page,
    pageSize: routeState.pageSize,
    sortMode: routeState.sort,
    sortOrder: routeState.order,
    appliedFilters: appliedPagesFilters,
    enabled: Boolean(target),
  });

  const rows = query.data?.pages ?? EMPTY_PAGES_ROWS;
  const totalCount = query.data?.totalCount ?? null;
  const hasNextPage = query.data?.hasMore ?? false;
  const isLoading = query.isFetching;
  const showTableLoading = isLoading && (showFilters || rows.length === 0);

  const applyFilters = useCallback(
    (values: PagesFilterValues) => {
      if (countPageFilterConditions(values) > maxConditions) return;
      savePreferredFilters(values);
      setSearchParams(buildPagesSearchUpdate(values));
    },
    [maxConditions, savePreferredFilters, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    clearPreferredFilters();
    setSearchParams(buildPagesClearSearchUpdate());
  }, [clearPreferredFilters, setSearchParams]);

  const activeFilterCount = useMemo(
    () =>
      PAGE_FILTER_FIELDS.filter((k) => restoredFilters[k].trim() !== "").length,
    [restoredFilters],
  );

  const exportTable = useMemo(() => pagesToTable(rows), [rows]);
  const fileNamePrefix = target.replaceAll("/", "-");

  const exportAll = (format: ExportFormat) =>
    void exportRows({
      format,
      feature: "domain_overview",
      ...exportTable,
      filename: `${fileNamePrefix}-pages`,
      records: rows,
    });

  return (
    <DomainTableTabSurface
      overBudgetLimit={filtersOverBudget ? maxConditions : null}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters((prev) => !prev)}
      activeFilterCount={activeFilterCount}
      countLabel="pages"
      totalCount={totalCount}
      fallbackCount={rows.length}
      isLoading={isLoading}
      showTableLoading={showTableLoading}
      exportActions={[
        {
          label: "Export to Sheets",
          icon: <Sheet className="size-4" />,
          onClick: () => exportAll("sheets"),
        },
        {
          label: "Copy data (JSON)",
          icon: <Copy className="size-4" />,
          onClick: () => exportAll("copy-json"),
        },
        {
          label: "Download CSV",
          icon: <Download className="size-4" />,
          onClick: () => exportAll("csv"),
        },
        {
          label: "Download Excel",
          icon: <FileSpreadsheet className="size-4" />,
          onClick: () => exportAll("excel"),
        },
      ]}
      filterPanel={
        showFilters ? (
          <DomainFilterPanel
            activeFilterCount={activeFilterCount}
            appliedFilters={restoredFilters}
            fields={PAGE_FILTER_FIELDS}
            textFields={PAGE_TEXT_FILTERS}
            rangeFields={PAGE_RANGE_FILTERS}
            countConditions={countPageFilterConditions}
            maxConditions={maxConditions}
            onApply={applyFilters}
            onClear={resetFilters}
          />
        ) : null
      }
      pagination={
        <TablePagination
          page={routeState.page}
          pageSize={routeState.pageSize}
          pageSizes={DOMAIN_KEYWORDS_PAGE_SIZES}
          totalCount={totalCount}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          renderPageButton={DomainPageLink}
        />
      }
    >
      <div className="space-y-3">
        {query.isError ? (
          <QueryError
            error={query.error}
            fallback="Failed to load pages."
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : null}
        {query.isError && !query.data ? null : (
          <DomainPagesTable
            domain={hostname}
            rows={rows}
            sortMode={routeState.sort}
            currentSortOrder={routeState.order}
            onSortClick={onSortClick}
          />
        )}
      </div>
    </DomainTableTabSurface>
  );
}
