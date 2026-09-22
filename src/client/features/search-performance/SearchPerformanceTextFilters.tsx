import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { z } from "zod";
import type { searchPerformanceInputSchema } from "@/types/schemas/search-performance";

export type TextFilters = Pick<
  z.infer<typeof searchPerformanceInputSchema>,
  "pageFilter" | "queryFilter"
>;

export function SearchPerformanceTextFilters({
  value,
  activeFilterCount,
  onApply,
  onReset,
}: {
  value: TextFilters;
  activeFilterCount: number;
  onApply: (filters: TextFilters) => void;
  onReset: () => void;
}) {
  const [page, setPage] = useState(value.pageFilter?.expression ?? "");
  const [query, setQuery] = useState(value.queryFilter?.expression ?? "");
  const [pageOperator, setPageOperator] = useState<"contains" | "equals">(
    value.pageFilter?.operator ?? "contains",
  );
  const [queryOperator, setQueryOperator] = useState<"contains" | "equals">(
    value.queryFilter?.operator ?? "contains",
  );
  const dirtyCount =
    Number(
      page.trim() !== (value.pageFilter?.expression ?? "") ||
        pageOperator !== (value.pageFilter?.operator ?? "contains"),
    ) +
    Number(
      query.trim() !== (value.queryFilter?.expression ?? "") ||
        queryOperator !== (value.queryFilter?.operator ?? "contains"),
    );
  const cancel = () => {
    setPage(value.pageFilter?.expression ?? "");
    setQuery(value.queryFilter?.expression ?? "");
    setPageOperator(value.pageFilter?.operator ?? "contains");
    setQueryOperator(value.queryFilter?.operator ?? "contains");
  };
  return (
    <form
      id="search-performance-filters"
      className="border-b border-base-300 bg-gradient-to-b from-base-100 to-base-200/30 px-4 py-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setPage(page.trim());
        setQuery(query.trim());
        if (!page.trim()) setPageOperator("contains");
        if (!query.trim()) setQueryOperator("contains");
        onApply({
          pageFilter: page.trim()
            ? { operator: pageOperator, expression: page.trim() }
            : undefined,
          queryFilter: query.trim()
            ? { operator: queryOperator, expression: query.trim() }
            : undefined,
        });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Refine table results</p>
          {activeFilterCount > 0 ? (
            <span className="badge badge-xs badge-primary border-0 text-primary-content">
              {activeFilterCount} active
            </span>
          ) : null}
          {dirtyCount > 0 ? (
            <span className="badge badge-xs badge-warning border-0">
              {dirtyCount} unapplied
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-xs btn-ghost gap-1"
          disabled={activeFilterCount === 0 && dirtyCount === 0}
          onClick={() => {
            setPage("");
            setQuery("");
            setPageOperator("contains");
            setQueryOperator("contains");
            onReset();
          }}
        >
          <RotateCcw className="size-3" />
          Clear all
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
            Page URL
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              aria-label="Page match"
              className="select select-bordered select-sm bg-base-100 w-full sm:w-44 sm:shrink-0"
              value={pageOperator}
              onChange={(event) =>
                setPageOperator(
                  event.target.value === "equals" ? "equals" : "contains",
                )
              }
            >
              <option value="contains">Contains</option>
              <option value="equals">Exactly matches</option>
            </select>
            <input
              className="input input-bordered input-sm bg-base-100 w-full min-w-0 sm:flex-1"
              aria-label="Page URL filter"
              value={page}
              maxLength={4096}
              onChange={(event) => setPage(event.target.value)}
              placeholder="URL or subfolder"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
            Query
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              aria-label="Query match"
              className="select select-bordered select-sm bg-base-100 w-full sm:w-44 sm:shrink-0"
              value={queryOperator}
              onChange={(event) =>
                setQueryOperator(
                  event.target.value === "equals" ? "equals" : "contains",
                )
              }
            >
              <option value="contains">Contains</option>
              <option value="equals">Exactly matches</option>
            </select>
            <input
              className="input input-bordered input-sm bg-base-100 w-full min-w-0 sm:flex-1"
              aria-label="Query filter"
              value={query}
              maxLength={4096}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search term"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-base-content/70">
        All filters must match. Contains ignores case and matches text anywhere,
        including a subfolder. Exactly matches compares the full URL or query,
        including case.
      </p>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={cancel}
          disabled={dirtyCount === 0}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={dirtyCount === 0}
        >
          Apply filters
          {dirtyCount > 0 ? (
            <span className="badge badge-xs ml-1 border-0 bg-primary-content/20">
              {dirtyCount}
            </span>
          ) : null}
        </button>
      </div>
    </form>
  );
}
