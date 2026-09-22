import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { KeywordResearchDisplayRow } from "../groupSharedVolumeRows";

const KEYWORD_RESEARCH_PAGE_SIZES = [50, 100, 300, 500] as const;
const DEFAULT_KEYWORD_RESEARCH_PAGE_SIZE = 50;
const KEYWORD_RESEARCH_PAGE_SIZE_STORAGE_KEY =
  "keyword-research-table-page-size";

type KeywordResearchPageSize = (typeof KEYWORD_RESEARCH_PAGE_SIZES)[number];

type Props = {
  page: number;
  pageSize: KeywordResearchPageSize;
  totalCount: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: KeywordResearchPageSize) => void;
};

export function KeywordResearchPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  start,
  end,
  onPageChange,
  onPageSizeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-base-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm tabular-nums text-base-content/70">
        {start.toLocaleString()}-{end.toLocaleString()} of{" "}
        {totalCount.toLocaleString()}
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            className="select select-bordered select-sm w-20"
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(parseKeywordResearchPageSize(event.target.value))
            }
          >
            {KEYWORD_RESEARCH_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm tabular-nums text-base-content/70">
            Page {page.toLocaleString()} of {totalPages.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseKeywordResearchPageSize(value: string): KeywordResearchPageSize {
  const parsed = Number(value);
  return (
    KEYWORD_RESEARCH_PAGE_SIZES.find((size) => size === parsed) ??
    DEFAULT_KEYWORD_RESEARCH_PAGE_SIZE
  );
}

export function keywordResearchPageEnds(
  rows: KeywordResearchDisplayRow[],
  pageSize: number,
) {
  const ends: number[] = [];
  for (let start = 0; start < rows.length; ) {
    let end = Math.min(start + pageSize, rows.length);
    // Finish the last family before starting the next page.
    while (end < rows.length && rows[end].parentKeyword !== null) end++;
    ends.push(end);
    start = end;
  }
  return ends;
}

export function useKeywordResearchPagination(
  rows: KeywordResearchDisplayRow[],
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<KeywordResearchPageSize>(() =>
    getStoredKeywordResearchPageSize(),
  );
  const pageEnds = useMemo(
    () => keywordResearchPageEnds(rows, pageSize),
    [rows, pageSize],
  );
  const totalPages = Math.max(1, pageEnds.length);
  const currentPage = Math.min(page, totalPages);
  const start = pageEnds[currentPage - 2] ?? 0;
  const end = pageEnds[currentPage - 1] ?? 0;

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(() => rows.slice(start, end), [start, end, rows]);

  return {
    page: currentPage,
    start: rows.length === 0 ? 0 : start + 1,
    end,
    pageSize,
    pageRows,
    setPage,
    setPageSize: (nextPageSize: KeywordResearchPageSize) => {
      setPageSize(nextPageSize);
      persistKeywordResearchPageSize(nextPageSize);
      setPage(1);
    },
    totalPages,
  };
}

function getStoredKeywordResearchPageSize(): KeywordResearchPageSize {
  if (typeof window === "undefined") return DEFAULT_KEYWORD_RESEARCH_PAGE_SIZE;
  try {
    const stored = window.localStorage.getItem(
      KEYWORD_RESEARCH_PAGE_SIZE_STORAGE_KEY,
    );
    return stored
      ? parseKeywordResearchPageSize(stored)
      : DEFAULT_KEYWORD_RESEARCH_PAGE_SIZE;
  } catch {
    return DEFAULT_KEYWORD_RESEARCH_PAGE_SIZE;
  }
}

function persistKeywordResearchPageSize(pageSize: KeywordResearchPageSize) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEYWORD_RESEARCH_PAGE_SIZE_STORAGE_KEY,
      String(pageSize),
    );
  } catch {
    // localStorage can be unavailable; keep the in-memory selection working.
  }
}
