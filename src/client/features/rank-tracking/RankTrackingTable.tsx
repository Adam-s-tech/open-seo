import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2, Sheet, Trash2 } from "lucide-react";
import { Modal } from "@/client/components/Modal";
import {
  AppDataTable,
  useAppTable,
} from "@/client/components/table/AppDataTable";
import {
  TableBulkActionBar,
  TableBulkActionButton,
  TableBulkExportMenu,
} from "@/client/components/table/TableBulkActionBar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { removeTrackingKeywords } from "@/serverFunctions/rank-tracking";
import type { RankTrackingRow } from "@/types/schemas/rank-tracking";
import { useRankTrackingColumns } from "./RankTrackingColumns";
import { exportRankTracking } from "./RankTrackingTableParts";
import {
  KeywordTrendModal,
  type KeywordTrendTarget,
} from "./KeywordTrendModal";
import type { SelectionAnchor } from "@/client/components/table/tableSelection";

export function RankTrackingTable({
  totalCount,
  rows,
  resultsLoading,
  showDesktop,
  showMobile,
  sorting,
  onSortingChange,
  domain,
  configId,
  projectId,
  locationCode,
  locationName,
  serpDepth,
  canCheck,
}: {
  totalCount: number;
  rows: RankTrackingRow[];
  resultsLoading: boolean;
  showDesktop: boolean;
  showMobile: boolean;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  domain: string;
  configId: string;
  projectId: string;
  locationCode: number;
  locationName?: string | null;
  serpDepth: number;
  canCheck: boolean;
}) {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [trendTarget, setTrendTarget] = useState<KeywordTrendTarget | null>(
    null,
  );
  const selectAnchorRef = useRef<SelectionAnchor | null>(null);

  const handleKeywordClick = useCallback(
    (row: RankTrackingRow) =>
      setTrendTarget({
        trackingKeywordId: row.trackingKeywordId,
        keyword: row.keyword,
      }),
    [],
  );

  const columns = useRankTrackingColumns({
    showDesktop,
    showMobile,
    domain,
    selectAnchorRef,
    onKeywordClick: handleKeywordClick,
    locationName,
  });

  const table = useAppTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: (updater) =>
      onSortingChange(
        typeof updater === "function" ? updater(sorting) : updater,
      ),
    // The URL has no value for "unsorted", so a column stays sorted.
    enableSortingRemoval: false,
    withSorting: true,
    getRowId: (row) => row.trackingKeywordId,
    enableRowSelection: true,
  });

  // Only includes rows that are in the current data (respects parent filtering)
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedRankRows = selectedRows.map((row) => row.original);

  const exportSelection = (format: "csv" | "sheets") =>
    exportRankTracking({
      format,
      rows: selectedRankRows,
      showDesktop,
      showMobile,
      domain,
      locationName,
      scope: "selection",
    });

  const removeMutation = useMutation({
    mutationFn: (keywordIds: string[]) =>
      removeTrackingKeywords({ data: { projectId, configId, keywordIds } }),
    onSuccess: (result) => {
      table.resetRowSelection();
      setShowConfirm(false);
      void queryClient.invalidateQueries({
        queryKey: ["rankTrackingResults", projectId, configId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["rankTrackingCostEstimate", projectId, configId],
      });
      toast.success(
        `${result.removed} keyword${result.removed !== 1 ? "s" : ""} removed`,
      );
    },
  });

  if (resultsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-5 animate-spin text-base-content/50" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-base-300 p-10 text-center text-sm text-base-content/55">
        {totalCount === 0
          ? canCheck
            ? 'No rank data yet. Use "Check rankings" in the More actions menu to run the first check.'
            : "No rank data yet."
          : "No keywords match your search."}
      </div>
    );
  }

  return (
    <>
      <TableBulkActionBar
        selectedCount={selectedCount}
        onClear={() => table.resetRowSelection()}
        actions={
          <div className="flex items-center px-1.5">
            <TableBulkActionButton
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setShowConfirm(true)}
              variant="danger"
            >
              Remove
            </TableBulkActionButton>
            <TableBulkExportMenu
              actions={[
                {
                  label: "Export to Sheets",
                  icon: <Sheet className="size-4" />,
                  onClick: () => exportSelection("sheets"),
                },
                {
                  label: "Export CSV",
                  icon: <FileDown className="size-4" />,
                  onClick: () => exportSelection("csv"),
                },
              ]}
            />
          </div>
        }
      />

      {/* Confirm modal */}
      {showConfirm && (
        <Modal
          onClose={() => setShowConfirm(false)}
          labelledBy="remove-keywords-title"
        >
          <h3 id="remove-keywords-title" className="text-lg font-semibold">
            Remove keywords?
          </h3>
          <p className="text-sm text-base-content/70">
            This will stop tracking {selectedCount} keyword
            {selectedCount !== 1 ? "s" : ""}. Historical ranking data is
            preserved but won't appear in the table.
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-error btn-sm gap-1"
              onClick={() =>
                removeMutation.mutate(selectedRows.map((r) => r.id))
              }
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending && (
                <Loader2 className="size-3 animate-spin" />
              )}
              Remove {selectedCount} keyword
              {selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </Modal>
      )}

      {trendTarget && (
        <KeywordTrendModal
          target={trendTarget}
          projectId={projectId}
          configId={configId}
          domain={domain}
          locationCode={locationCode}
          locationName={locationName ?? undefined}
          serpDepth={serpDepth}
          onClose={() => setTrendTarget(null)}
        />
      )}

      <AppDataTable table={table} getCellClassName={() => "align-top"} />
      <p className="text-xs text-base-content/60 pt-2">
        {rows.length} of {totalCount} keywords
      </p>
    </>
  );
}
