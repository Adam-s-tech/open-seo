import {
  ChevronDown,
  Download,
  FileDown,
  RotateCcw,
  Save,
  Sheet,
  SlidersHorizontal,
} from "lucide-react";
import { SerpAnalysisCard } from "@/client/features/keywords/components";
import { FilterIntentSelect } from "./keywordResearchFilters";
import { KeywordResearchDesktopTable } from "./KeywordResearchDesktopTable";
import {
  KEYWORD_RESEARCH_PAGE_SIZES,
  useKeywordResearchPagination,
} from "./KeywordResearchPagination";
import { TablePagination } from "@/client/components/table/TablePagination";
import type { KeywordResearchControllerState } from "./types";
import {
  TableBulkActionBar,
  TableBulkActionButton,
  TableBulkExportMenu,
} from "@/client/components/table/TableBulkActionBar";

type Props = {
  controller: KeywordResearchControllerState;
};

export function KeywordResearchMobileResults({ controller }: Props) {
  const { filteredRows, mobileTab } = controller;

  return (
    <div className="flex-1 flex flex-col overflow-hidden md:hidden">
      <div className="shrink-0 flex border-b border-base-300 bg-base-100">
        <button
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            mobileTab === "keywords"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60"
          }`}
          onClick={() => controller.setMobileTab("keywords")}
        >
          Keywords ({filteredRows.length})
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            mobileTab === "serp"
              ? "border-primary text-primary"
              : "border-transparent text-base-content/60"
          }`}
          onClick={() => controller.setMobileTab("serp")}
        >
          SERP Analysis
        </button>
      </div>

      {mobileTab === "keywords" ? (
        <MobileKeywordResults controller={controller} />
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <SerpAnalysisCard
            items={controller.serpResults}
            keyword={controller.activeSerpKeyword}
            loading={controller.serpLoading}
            loadingMore={controller.serpLoadingMore}
            canLoadMore={controller.canLoadMoreSerp}
            error={controller.serpError}
            onRetry={controller.retrySerp}
            deepFetchFailed={controller.deepFetchFailed}
            page={controller.serpPage}
            pageSize={controller.SERP_PAGE_SIZE}
            onPageChange={controller.setSerpPage}
          />
        </div>
      )}
    </div>
  );
}

function MobileKeywordResults({ controller }: Props) {
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
        ? `Showing ${keywordCount} of ${rows.length}`
        : `Showing ${keywordCount} keywords`;

  const canExport = filteredRows.length > 0;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {controller.showApproximateMatchNotice ? (
        <div
          className="mx-4 mt-2 rounded-lg border border-warning/40 bg-warning/15 px-3 py-2 text-xs text-base-content"
          role="status"
        >
          No exact match for{" "}
          <span className="font-medium">"{controller.searchedKeyword}"</span>.
          Showing closest related keywords.
        </div>
      ) : null}

      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-base-300 bg-base-100">
        <button
          className={`btn btn-ghost btn-xs gap-1 ${showFilters ? "btn-active" : ""}`}
          onClick={() => controller.setShowFilters((current) => !current)}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="badge badge-xs badge-primary border-0 text-primary-content">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <span className="text-xs text-base-content/60">
          {keywordCountLabel}
        </span>
        <div className="flex-1" />
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className={`btn btn-ghost btn-xs gap-1 ${!canExport ? "btn-disabled" : ""}`}
            aria-label="Export"
          >
            <Download className="size-3.5" />
            <ChevronDown className="size-3 opacity-60" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-box w-56"
          >
            <li>
              <button
                onClick={() => controller.exportAll("sheets")}
                disabled={!canExport}
              >
                <Sheet className="size-4" />
                Export to Sheets
              </button>
            </li>
            <li>
              <button
                onClick={() => controller.exportAll("csv")}
                disabled={!canExport}
              >
                <FileDown className="size-4" />
                Export CSV
              </button>
            </li>
          </ul>
        </div>
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
              Save
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

      {showFilters ? <MobileFilters controller={controller} /> : null}

      <KeywordResearchDesktopTable
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

function MobileFilters({ controller }: Props) {
  const { activeFilterCount, filtersForm } = controller;

  return (
    <div className="shrink-0 border-b border-base-300 bg-gradient-to-b from-base-100 to-base-200/30 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold">Refine table results</p>
          {activeFilterCount > 0 ? (
            <span className="badge badge-xs badge-primary border-0 text-primary-content">
              {activeFilterCount}
            </span>
          ) : null}
        </div>
        <button
          className="btn btn-xs btn-ghost gap-1"
          onClick={controller.resetFilters}
          disabled={activeFilterCount === 0}
        >
          <RotateCcw className="size-3" />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <filtersForm.Field name="include">
          {(field) => (
            <input
              className="input input-bordered input-sm bg-base-100"
              placeholder="Include terms (audit, checker)"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </filtersForm.Field>
        <filtersForm.Field name="exclude">
          {(field) => (
            <input
              className="input input-bordered input-sm bg-base-100"
              placeholder="Exclude terms (jobs, course)"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </filtersForm.Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MobileRangeInput
          form={filtersForm}
          name="minVol"
          placeholder="Min volume"
        />
        <MobileRangeInput
          form={filtersForm}
          name="maxVol"
          placeholder="Max volume"
        />
        <MobileRangeInput
          form={filtersForm}
          name="minCpc"
          placeholder="Min CPC"
          step="0.01"
        />
        <MobileRangeInput
          form={filtersForm}
          name="maxCpc"
          placeholder="Max CPC"
          step="0.01"
        />
        <MobileRangeInput
          form={filtersForm}
          name="minKd"
          placeholder="Min difficulty"
        />
        <MobileRangeInput
          form={filtersForm}
          name="maxKd"
          placeholder="Max difficulty"
        />
      </div>

      <FilterIntentSelect form={filtersForm} />
    </div>
  );
}

function MobileRangeInput({
  form,
  name,
  placeholder,
  step,
}: {
  form: KeywordResearchControllerState["filtersForm"];
  name: "minVol" | "maxVol" | "minCpc" | "maxCpc" | "minKd" | "maxKd";
  placeholder: string;
  step?: string;
}) {
  return (
    <form.Field name={name}>
      {(field) => (
        <input
          className="input input-bordered input-sm bg-base-100"
          placeholder={placeholder}
          type="number"
          step={step}
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      )}
    </form.Field>
  );
}
