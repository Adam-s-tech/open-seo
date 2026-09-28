import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { ExportMenu } from "@/client/components/ExportMenu";
import { Button } from "@/client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";

export function SavedKeywordsHeader({
  totalCount,
  exporting,
  metricsRefreshing,
  onExportCsv,
  onExportSheets,
  onRefreshMetrics,
}: {
  totalCount: number;
  exporting: "csv" | "sheets" | null;
  metricsRefreshing: boolean;
  onExportCsv: () => void;
  onExportSheets: () => void;
  onRefreshMetrics: () => void;
}) {
  const [confirmingRefresh, setConfirmingRefresh] = useState(false);
  const disabled = totalCount === 0 || exporting != null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Saved Keywords</h1>
        <p className="text-sm text-base-content/70">
          Save keyword ideas from research, organize them with tags, and revisit
          when you&apos;re ready to act.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled || metricsRefreshing}
              />
            }
          >
            <RefreshCw
              data-icon="inline-start"
              className={metricsRefreshing ? "animate-spin" : ""}
            />
            {metricsRefreshing ? "Updating..." : "Actions"}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={() => setConfirmingRefresh(true)}>
              <RefreshCw />
              <span className="flex flex-col">
                <span>Update keyword stats</span>
                <span className="text-xs text-muted-foreground">
                  Volume, difficulty &amp; CPC
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ExportMenu
          actions={["sheets", "csv"]}
          busy={exporting != null}
          disabled={disabled}
          onExport={(action) =>
            action === "sheets" ? onExportSheets() : onExportCsv()
          }
        />
      </div>

      {confirmingRefresh ? (
        <ConfirmDialog
          title="Update keyword stats?"
          confirmLabel="Update stats"
          onConfirm={() => {
            setConfirmingRefresh(false);
            onRefreshMetrics();
          }}
          onClose={() => setConfirmingRefresh(false)}
        >
          This fetches new volume, difficulty, and CPC for every saved keyword
          in this project. Each keyword uses credits.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
