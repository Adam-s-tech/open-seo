import { createFileRoute } from "@tanstack/react-router";
// Aliased: `SavedKeywordsPage` has a local `sort` const (the saved-keyword
// sort key) that would otherwise shadow this import at the call site.
import { sort as sortArray } from "remeda";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  OnChangeFn,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TablePagination } from "@/client/components/table/TablePagination";
import { SavedKeywordsBulkActionBar } from "@/client/features/saved-keywords/SavedKeywordsBulkActionBar";
import { SavedKeywordsBulkTagsModal } from "@/client/features/saved-keywords/SavedKeywordsBulkTagsModal";
import { SavedKeywordsFilters } from "@/client/features/saved-keywords/SavedKeywordsFilters";
import { SavedKeywordsHeader } from "@/client/features/saved-keywords/SavedKeywordsHeader";
import {
  DeleteSavedKeywordsModal,
  RemoveSavedKeywordsError,
} from "@/client/features/saved-keywords/SavedKeywordsModals";
import { SavedKeywordsTable } from "@/client/features/saved-keywords/SavedKeywordsTable";
import { compileSavedKeywordsFilters } from "@/client/features/saved-keywords/savedKeywordsFilterTypes";
import {
  SAVED_KEYWORD_PAGE_SIZES,
  toSavedKeywordSort,
} from "@/client/features/saved-keywords/savedKeywordsUtils";
import { useSavedKeywordsExport } from "@/client/features/saved-keywords/useSavedKeywordsExport";
import { useSavedKeywordsFilters } from "@/client/features/saved-keywords/useSavedKeywordsFilters";
import { useTagManage } from "@/client/features/saved-keywords/useTagManage";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import {
  getSavedKeywords,
  refreshSavedKeywordMetrics,
  removeSavedKeywords,
  updateSavedKeywordTags,
} from "@/serverFunctions/keywords";
import type { SavedKeywordTag } from "@/types/keywords";

export const Route = createFileRoute("/_project/p/$projectId/saved")({
  component: SavedKeywordsPage,
});

const FILTER_DEBOUNCE_MS = 350;

function SavedKeywordsPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState<(typeof SAVED_KEYWORD_PAGE_SIZES)[number]>(50);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fetchedAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  const filters = useSavedKeywordsFilters();
  const [committedFilterValues, setCommittedFilterValues] = useState(
    filters.values,
  );
  const [committedTagIds, setCommittedTagIds] = useState(selectedTagIds);

  // Field edits and tag toggles share one debounce, so a burst of changes
  // sends one query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCommittedFilterValues(filters.values);
      setCommittedTagIds(selectedTagIds);
      setPage(1);
    }, FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters.values, selectedTagIds]);

  const appliedFilters = useMemo(
    () => compileSavedKeywordsFilters(committedFilterValues),
    [committedFilterValues],
  );
  const visibleFilters = useMemo(
    () => compileSavedKeywordsFilters(filters.values),
    [filters.values],
  );

  const sortState = sorting[0];
  const sort = toSavedKeywordSort(sortState?.id);
  const order: "asc" | "desc" = sortState
    ? sortState.desc
      ? "desc"
      : "asc"
    : "desc";
  const tagFilterKey = committedTagIds.join("|");
  const hasActiveFilters =
    filters.activeFilterCount > 0 || selectedTagIds.length > 0;

  const queryInput = useMemo(
    () => ({
      projectId,
      ...appliedFilters,
      tagIds: committedTagIds.length > 0 ? committedTagIds : undefined,
      page,
      pageSize,
      sort,
      order,
    }),
    [appliedFilters, committedTagIds, order, page, pageSize, projectId, sort],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["savedKeywords", projectId, queryInput],
    queryFn: () => getSavedKeywords({ data: queryInput }),
    placeholderData: keepPreviousData,
  });

  const savedKeywords = data?.rows ?? [];
  const availableTags = data?.tags ?? [];
  const totalCount = data?.totalCount ?? 0;
  const selectedRows = savedKeywords.filter((row) => rowSelection[row.id]);
  const selectedIds = selectedRows.map((row) => row.id);
  const selectedCount = selectedIds.length;

  const selectedRowTags = useMemo<SavedKeywordTag[]>(() => {
    const map = new Map<string, SavedKeywordTag>();
    for (const row of selectedRows) {
      for (const tag of row.tags) {
        if (!map.has(tag.id)) map.set(tag.id, tag);
      }
    }
    return sortArray([...map.values()], (a, b) =>
      a.normalizedName.localeCompare(b.normalizedName),
    );
  }, [selectedRows]);

  useEffect(() => {
    setRowSelection({});
  }, [page, pageSize, appliedFilters, tagFilterKey, sort, order]);

  const invalidateSavedKeywords = () =>
    queryClient.invalidateQueries({ queryKey: ["savedKeywords", projectId] });

  const removeMutation = useMutation({
    mutationFn: (savedKeywordIds: string[]) =>
      removeSavedKeywords({ data: { projectId, savedKeywordIds } }),
    onSuccess: (result) => {
      setRowSelection({});
      setShowConfirm(false);
      setRemoveError(null);
      void invalidateSavedKeywords();
      captureClientEvent("saved_keywords:bulk_remove", {
        count: result.deletedCount,
      });
      toast.success(
        `${result.deletedCount} keyword${result.deletedCount !== 1 ? "s" : ""} removed`,
      );
    },
    onError: (error) => {
      setRemoveError(getStandardErrorMessage(error, "Remove failed."));
    },
  });

  const tagMutation = useMutation({
    mutationFn: (input: {
      savedKeywordIds: string[];
      addTags?: string[];
      removeTagIds?: string[];
    }) =>
      updateSavedKeywordTags({
        data: {
          projectId,
          savedKeywordIds: input.savedKeywordIds,
          addTags: input.addTags,
          removeTagIds: input.removeTagIds,
        },
      }),
    onSuccess: (result) => {
      setRowSelection({});
      setShowTagModal(false);
      void invalidateSavedKeywords();
      toast.success(
        `Updated tags for ${result.taggedCount} keyword${result.taggedCount !== 1 ? "s" : ""}`,
      );
    },
  });

  const refreshMetricsMutation = useMutation({
    mutationFn: () => refreshSavedKeywordMetrics({ data: { projectId } }),
    onSuccess: (result) => {
      void invalidateSavedKeywords();
      toast.success(
        `Updated stats for ${result.updated} keyword${result.updated !== 1 ? "s" : ""}`,
      );
    },
  });

  const tagManage = useTagManage(projectId);
  const exporter = useSavedKeywordsExport({
    projectId,
    // The visible filters, so an export started inside the debounce window
    // still matches what the user picked.
    appliedFilters: visibleFilters,
    selectedTagIds,
    sort,
    order,
  });

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((current) =>
      typeof updater === "function" ? updater(current) : updater,
    );
    setPage(1);
  };

  const handleDeleteTag = async (tagId: string) => {
    const ok = await tagManage.deleteTag(tagId);
    if (ok) {
      setSelectedTagIds((current) => current.filter((id) => id !== tagId));
    }
  };

  return (
    <div className="overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <SavedKeywordsHeader
          totalCount={totalCount}
          exporting={exporter.exporting}
          metricsRefreshing={refreshMetricsMutation.isPending}
          onExportCsv={() => void exporter.exportFiltered("csv")}
          onExportSheets={() => void exporter.exportFiltered("sheets")}
          onRefreshMetrics={() => refreshMetricsMutation.mutate()}
        />

        <div className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
          <SavedKeywordsFilters
            filtersForm={filters.filtersForm}
            activeFilterCount={filters.activeFilterCount}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((v) => !v)}
            onResetFilters={filters.resetFilters}
            availableTags={availableTags}
            selectedTagIds={selectedTagIds}
            busyTagIds={tagManage.busyTagIds}
            onToggleTagFilter={(tagId) => {
              setSelectedTagIds((current) =>
                current.includes(tagId)
                  ? current.filter((id) => id !== tagId)
                  : [...current, tagId],
              );
            }}
            onClearTagSelection={() => setSelectedTagIds([])}
            onUpdateTag={(input) => void tagManage.updateTag(input)}
            onDeleteTag={(tagId) => void handleDeleteTag(tagId)}
          />

          <div className="space-y-3 p-4">
            {removeError ? (
              <RemoveSavedKeywordsError message={removeError} />
            ) : null}
            <SavedKeywordsTable
              rows={savedKeywords}
              rowSelection={rowSelection}
              sorting={sorting}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onRowSelectionChange={setRowSelection}
              onSortingChange={handleSortingChange}
            />
          </div>

          <TablePagination
            page={page}
            pageSize={pageSize}
            pageSizes={SAVED_KEYWORD_PAGE_SIZES}
            totalCount={totalCount}
            isLoading={isFetching}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
          />
        </div>

        <SavedKeywordsBulkActionBar
          selectedCount={selectedCount}
          exportingSelection={exporter.exportingSelection}
          onCopy={() => {
            navigator.clipboard
              .writeText(selectedRows.map((row) => row.keyword).join("\n"))
              .then(
                () =>
                  toast.success(
                    `${selectedCount} keyword${selectedCount !== 1 ? "s" : ""} copied`,
                  ),
                () => toast.error("Could not copy to clipboard"),
              );
          }}
          onOpenTags={() => setShowTagModal(true)}
          onExportCsv={() => void exporter.exportSelection("csv", selectedRows)}
          onExportSheets={() =>
            void exporter.exportSelection("sheets", selectedRows)
          }
          onDelete={() => setShowConfirm(true)}
          onClear={() => setRowSelection({})}
        />

        {showConfirm ? (
          <DeleteSavedKeywordsModal
            selectedCount={selectedCount}
            isPending={removeMutation.isPending}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => removeMutation.mutate(selectedIds)}
          />
        ) : null}

        {showTagModal ? (
          <SavedKeywordsBulkTagsModal
            availableTags={availableTags}
            selectedCount={selectedCount}
            selectedRowTags={selectedRowTags}
            isPending={tagMutation.isPending}
            onClose={() => setShowTagModal(false)}
            onApply={({ addTags, removeTagIds }) =>
              tagMutation.mutate({
                savedKeywordIds: selectedIds,
                addTags,
                removeTagIds,
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}
