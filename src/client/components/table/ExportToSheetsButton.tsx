import { Sheet } from "lucide-react";
import { useState } from "react";
import type { CsvValue } from "@/client/lib/csv";
import { exportTableToSheets } from "@/client/lib/exportToSheets";
import { Button } from "@/client/components/ui/button";

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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={rows.length === 0}
      pending={busy}
      title="Copy table and open a new Google Sheet"
    >
      {busy ? null : <Sheet data-icon="inline-start" />}
      Export to Sheets
    </Button>
  );
}
