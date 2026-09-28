import { useState } from "react";
import { Gauge, MoreHorizontal } from "lucide-react";
import { ExportMenu } from "@/client/components/ExportMenu";
import type { CsvValue } from "@/client/lib/csv";
import { exportRows } from "@/client/lib/exportRows";
import type { BacklinksSearchState } from "./backlinksPageTypes";
import { buildBacklinksTabFilename } from "./export";

export function BacklinksExportMenu({
  activeTab,
  exportTarget,
  headers,
  rows,
}: {
  activeTab: BacklinksSearchState["tab"];
  exportTarget: string;
  headers: string[];
  rows: CsvValue[][];
}) {
  const [isExportingSheets, setIsExportingSheets] = useState(false);

  const runExport = async (format: "csv" | "sheets") => {
    setIsExportingSheets(format === "sheets");
    try {
      await exportRows({
        format,
        feature: `backlinks_${activeTab}`,
        headers,
        rows,
        filename: buildBacklinksTabFilename(activeTab, exportTarget),
      });
    } finally {
      setIsExportingSheets(false);
    }
  };

  return (
    <ExportMenu
      actions={["sheets", "csv"]}
      scopes={[{ id: "page", label: "Current page · selected view" }]}
      busy={isExportingSheets}
      disabled={rows.length === 0}
      onExport={(action) => void runExport(action)}
    />
  );
}

export function BacklinksActionsMenu({
  isLoadingRatings,
  loadRatings,
  ratableDomains,
}: {
  isLoadingRatings: boolean;
  loadRatings: (domains: string[]) => void | Promise<void>;
  ratableDomains: string[];
}) {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-ghost btn-square"
        aria-label="Backlinks table actions"
        title="Backlinks table actions"
      >
        <MoreHorizontal className="size-4" />
      </div>
      <ul
        tabIndex={0}
        role="menu"
        className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-box w-52"
      >
        <li>
          <button
            type="button"
            onClick={() => void loadRatings(ratableDomains)}
            disabled={isLoadingRatings}
            title="Look up Ahrefs Domain Rating for each domain in the table"
          >
            {isLoadingRatings ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Gauge className="size-4" />
            )}
            Ahrefs DR
          </button>
        </li>
      </ul>
    </div>
  );
}
