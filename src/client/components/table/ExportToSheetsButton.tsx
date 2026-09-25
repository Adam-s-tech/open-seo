import { Sheet } from "lucide-react";
import { useState } from "react";
import type { CsvValue } from "@/client/lib/csv";
import { exportTableToSheets } from "@/client/lib/exportToSheets";

type Props = {
  headers: string[];
  /**
   * Full filtered/sorted dataset (not a UI-paginated slice). Emit raw numeric
   * values (not formatted strings) so Sheets parses them as numbers.
   */
  rows: CsvValue[][];
  /** PostHog `source_feature` for the `data:export_sheets` event. */
  feature: string;
};

export function ExportToSheetsButton({ headers, rows, feature }: Props) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportTableToSheets({ headers, rows, feature });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs gap-1"
      onClick={handleClick}
      disabled={rows.length === 0 || busy}
      title="Copy table and open a new Google Sheet"
    >
      <Sheet className="size-3.5" />
      Export to Sheets
    </button>
  );
}
