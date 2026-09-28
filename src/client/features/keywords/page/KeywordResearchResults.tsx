import {
  FileDown,
  Globe,
  RotateCcw,
  Save,
  Sheet,
  SlidersHorizontal,
} from "lucide-react";
import {
  lastTwelveMonths,
  MONTH_SHORT_LABELS,
} from "@/client/features/keywords/utils";
import {
  AreaTrendChart,
  OverviewStats,
  SerpAnalysisCard,
} from "@/client/features/keywords/components";
import type { KeywordResearchRow } from "@/types/keywords";
import type { KeywordResearchControllerState } from "./types";
import {
  FilterIntentSelect,
  FilterRangeInputs,
  FilterTextInput,
} from "./keywordResearchFilters";
import { KeywordResearchTable } from "./KeywordResearchTable";
import {
  KEYWORD_RESEARCH_PAGE_SIZES,
  useKeywordResearchPagination,
} from "./KeywordResearchPagination";
import { TablePagination } from "@/client/components/table/TablePagination";
import {
  TableBulkActionBar,
  TableBulkActionButton,
  TableBulkExportMenu,
  TableExportMenu,
} from "@/client/components/table/TableBulkActionBar";

function formatTrendRangeLabel(trend: KeywordResearchRow["trend"]): string {
  const last12 = lastTwelveMonths(trend);
  if (last12.length === 0) return "Last 12 available months";

  const [startLabel, endLabel] = [last12[0], last12[last12.length - 1]].map(
    (m) => `${MONTH_SHORT_LABELS[m.month - 1] ?? `M${m.month}`} ${m.year}`,
  );
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

type Props = {
  controller: KeywordResearchControllerState;
};

// Below md the page shows one panel at a time behind tabs, and hides the
// overview stats and the trend chart.
export function KeywordResearchResults({ controller }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full">
      <MobileTabs controller={controller} />
      <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden gap-4">
        <KeywordPanel controller={controller} />
        <SerpPanel controller={controller} />
      </div>
    </div>
  );
}

function MobileTabs({ controller }: Props) {
  const tabs = [
    {
      value: "keywords",
      label: `Keywords (${controller.filteredRows.length})`,
    },
    { value: "serp", label: "SERP Analysis" },
  ] as const;

  return (
    <div className="md:hidden shrink-0 flex border-b border-base-300 bg-base-100 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            controller.mobileTab === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60"
          }`}
          onClick={() => controller.setMobileTab(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function KeywordPanel({ controller }: Props) {
  const { mobileTab, searchedKeyword, showApproximateMatchNotice } = controller;

  return (
    <div
      className={`${mobileTab === "keywords" ? "flex" : "hidden md:flex"} order-2 xl:order-1 flex-col min-w-0 gap-2 xl:basis-3/5`}
    >
      {showApproximateMatchNotice ? (
        <div
          className="rounded-lg border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-base-content"
          role="status"
        >
          No exact match for{" "}
          <span className="font-medium">"{searchedKeyword}"</span>. Showing
          closest related keywords instead.
        </div>
      ) : null}
      {controller.overviewKeyword ? (
        <div className="hidden md:block">
          <OverviewStats keyword={controller.overviewKeyword} />
        </div>
      ) : null}
      <TableCard controller={controller} />
    </div>
  );
}

function TableCard({ controller }: Props) {
  const {
    activeFilterCount,
    filteredRows,
    rows,
    selectedKeywordRows,
    showFilters,
  } = controller;
  const { page, pageSize, pageRange, pageRows, setPage, setPageSize } =
    useKeywordResearchPagination(filteredRows);
  const keywordCount = filteredRows.length;

  const keywordCountLabel =
    selectedKeywordRows.length > 0
      ? `${selectedKeywordRows.length} selected`
      : activeFilterCount > 0
        ? `Showing ${keywordCount} of ${rows.length} keywords`
        : `Showing ${keywordCount} keywords`;

  const canExport = filteredRows.length > 0;
  return (
    <div className="flex-1 flex flex-col min-w-0 border border-base-300 rounded-xl bg-base-100 overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-base-300">
        <button
          className={`btn btn-ghost btn-xs md:btn-sm gap-1.5 ${showFilters ? "btn-active" : ""}`}
          onClick={() => controller.setShowFilters((current) => !current)}
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
        <span className="text-xs md:text-sm text-base-content/60">
          {keywordCountLabel}
        </span>
        <div className="flex-1" />
        <TableExportMenu
          buttonClassName={`btn btn-ghost btn-xs md:btn-sm gap-1 ${canExport ? "" : "btn-disabled"}`}
          labelClassName="hidden lg:inline"
          actions={[
            {
              label: "Export to Sheets",
              icon: <Sheet className="size-4" />,
              onClick: () => controller.exportAll("sheets"),
              disabled: !canExport,
            },
            {
              label: "Export CSV",
              icon: <FileDown className="size-4" />,
              onClick: () => controller.exportAll("csv"),
              disabled: !canExport,
            },
          ]}
        />
      </div>

      <TableBulkActionBar
        selectedCount={selectedKeywordRows.length}
        onClear={() => controller.setSelectedRows(new Set())}
        actions={
          <div className="flex items-center px-1.5">
            <TableBulkActionButton
              icon={<Save className="size-3.5" />}
              onClick={controller.handleSaveKeywords}
            >
              Save<span className="hidden md:inline"> Keywords</span>
            </TableBulkActionButton>
            <TableBulkExportMenu
              actions={[
                {
                  label: "Export to Sheets",
                  icon: <Sheet className="size-4" />,
                  onClick: () => controller.exportSelection("sheets"),
                },
                {
                  label: "Export CSV",
                  icon: <FileDown className="size-4" />,
                  onClick: () => controller.exportSelection("csv"),
                },
              ]}
            />
          </div>
        }
      />

      {showFilters ? <TableFilters controller={controller} /> : null}
      <KeywordResearchTable
        filteredRows={pageRows}
        overviewKeyword={controller.overviewKeyword}
        selectedRows={controller.selectedRows}
        setSelectedRows={controller.setSelectedRows}
        sortDir={controller.sortDir}
        sortField={controller.sortField}
        toggleSort={controller.toggleSort}
        resetFilters={controller.resetFilters}
        handleRowClick={controller.handleRowClick}
      />
      {filteredRows.length > 0 ? (
        <TablePagination
          page={page}
          pageSize={pageSize}
          pageSizes={KEYWORD_RESEARCH_PAGE_SIZES}
          pageRange={pageRange}
          totalCount={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}

function TableFilters({ controller }: Props) {
  const { activeFilterCount, filtersForm } = controller;

  return (
    <div className="shrink-0 border-b border-base-300 bg-gradient-to-b from-base-100 to-base-200/30 px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Refine table results</p>
          {activeFilterCount > 0 ? (
            <span className="badge badge-xs badge-primary border-0 text-primary-content">
              {activeFilterCount} active
            </span>
          ) : null}
        </div>
        <button
          className="btn btn-xs btn-ghost gap-1"
          onClick={controller.resetFilters}
          disabled={activeFilterCount === 0}
        >
          <RotateCcw className="size-3" />
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <FilterTextInput
          form={filtersForm}
          name="include"
          label="Include Terms"
          placeholder="audit, checker, template"
        />
        <FilterTextInput
          form={filtersForm}
          name="exclude"
          label="Exclude Terms"
          placeholder="jobs, salary, course"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <FilterRangeInputs
          form={filtersForm}
          title="Search Volume"
          minName="minVol"
          maxName="maxVol"
        />
        <FilterRangeInputs
          form={filtersForm}
          title="CPC (USD)"
          minName="minCpc"
          maxName="maxCpc"
          step="0.01"
        />
        <FilterRangeInputs
          form={filtersForm}
          title="Difficulty"
          minName="minKd"
          maxName="maxKd"
        />
      </div>

      <FilterIntentSelect form={filtersForm} />
    </div>
  );
}

function SerpPanel({ controller }: Props) {
  const { mobileTab, overviewKeyword } = controller;

  return (
    <div
      className={`${mobileTab === "serp" ? "flex" : "hidden md:flex"} order-1 xl:order-2 flex-col min-w-0 gap-2 xl:basis-2/5 xl:overflow-y-auto`}
    >
      {overviewKeyword && overviewKeyword.trend.length > 0 ? (
        <div className="hidden md:block shrink-0 overflow-hidden border border-base-300 rounded-xl bg-base-100 px-4 py-3">
          <h4 className="text-sm font-semibold mb-1">
            Search Trends{" "}
            <span className="font-normal text-base-content/50">
              {formatTrendRangeLabel(overviewKeyword.trend)}
            </span>
          </h4>
          <AreaTrendChart trend={overviewKeyword.trend} />
        </div>
      ) : null}

      <div className="flex flex-col overflow-hidden border border-base-300 rounded-xl bg-base-100">
        <div className="shrink-0 px-4 py-3 border-b border-base-300">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Globe className="size-3.5" />
            SERP Analysis
            {controller.activeSerpKeyword ? (
              <span className="font-normal text-base-content/50 truncate">
                : {controller.activeSerpKeyword}
              </span>
            ) : null}
          </h3>
        </div>
        <div className="p-4">
          <SerpAnalysisCard
            items={controller.serpResults}
            keyword={controller.activeSerpKeyword}
            loading={controller.serpLoading}
            loadingMore={controller.serpLoadingMore}
            canLoadMore={controller.canLoadMoreSerp}
            error={controller.serpError}
            onRetry={controller.retrySerp}
            retrying={controller.serpRetrying}
            deepFetchFailed={controller.deepFetchFailed}
            page={controller.serpPage}
            pageSize={controller.SERP_PAGE_SIZE}
            onPageChange={controller.setSerpPage}
          />
        </div>
      </div>
    </div>
  );
}
