import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { TableExportMenu } from "@/client/components/table/TableBulkActionBar";
import { TableLoadingRows } from "@/client/features/domain/components/TableLoadingRows";

type DomainTableExportAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

type Props = {
  /** The scope's condition limit when saved filters exceed it, else null. */
  overBudgetLimit: number | null;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  countLabel: string;
  totalCount: number | null;
  fallbackCount: number;
  exportActions: DomainTableExportAction[];
  filterPanel?: ReactNode;
  isLoading: boolean;
  showTableLoading: boolean;
  children: ReactNode;
  pagination: ReactNode;
};

export function DomainTableTabSurface({
  overBudgetLimit,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  countLabel,
  totalCount,
  fallbackCount,
  exportActions,
  filterPanel,
  isLoading,
  showTableLoading,
  children,
  pagination,
}: Props) {
  return (
    <>
      {overBudgetLimit != null ? (
        <div className="alert alert-warning mb-3">
          <span>
            Saved filters exceed this scope&apos;s {overBudgetLimit}-condition
            limit and were not applied. Open Filters to trim them.
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300">
        <button
          className={`btn btn-ghost btn-sm gap-1.5 ${showFilters ? "btn-active" : ""}`}
          onClick={onToggleFilters}
          title="Toggle filters"
          type="button"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="badge badge-xs badge-primary border-0 text-primary-content">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <span className="text-sm text-base-content/60">
          {(totalCount ?? fallbackCount).toLocaleString()} {countLabel}
        </span>
        <div className="flex-1" />
        <TableExportMenu actions={exportActions} />
      </div>

      {filterPanel}

      <div className="p-4">
        <div
          className={
            isLoading && !showTableLoading
              ? "opacity-60 transition-opacity"
              : "transition-opacity"
          }
        >
          {showTableLoading ? <TableLoadingRows /> : children}
        </div>
      </div>

      {pagination}
    </>
  );
}
