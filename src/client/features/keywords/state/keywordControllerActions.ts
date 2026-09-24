import { useMemo } from "react";
import { toast } from "sonner";
import { buildCsv, type CsvValue, downloadCsv } from "@/client/lib/csv";
import { captureClientEvent } from "@/client/lib/posthog";
import type { KeywordResearchRow } from "@/types/keywords";
import type { SaveKeywordsInput } from "@/types/schemas/keywords";
import type { SortDir, SortField } from "@/client/features/keywords/components";
import type {
  KeywordMode,
  ResultLimit,
} from "@/client/features/keywords/keywordResearchTypes";
import type { KeywordResearchControllerInput } from "./useKeywordResearchController";
import type { KeywordResearchDisplayRow } from "@/client/features/keywords/groupSharedVolumeRows";
import { formatLocationLabel } from "@/shared/keyword-locations";

/** Local exports name the area the volume, CPC, and competition cover. */
export function keywordResearchHeaders(locationName?: string) {
  const scope = locationName ? ` (${formatLocationLabel(locationName)})` : "";
  return [
    "Keyword",
    `Volume${scope}`,
    `CPC${scope}`,
    `Competition${scope}`,
    "Score",
    "Intent",
  ];
}

export const KEYWORD_RESEARCH_HEADERS = keywordResearchHeaders();

export function keywordResearchExportRow(row: KeywordResearchRow): CsvValue[] {
  return [
    row.keyword,
    row.searchVolume ?? "",
    row.cpc ?? "",
    row.competition ?? "",
    row.keywordDifficulty ?? "",
    row.intent,
  ];
}

type SaveExportActionParams = {
  selectedRows: Set<string>;
  rows: KeywordResearchRow[];
  filteredRows: KeywordResearchDisplayRow[];
  input: KeywordResearchControllerInput;
  saveKeywordsMutate: (
    variables: SaveKeywordsInput,
    options: { onSuccess: () => void },
  ) => void;
  setShowSaveDialog: (show: boolean) => void;
};

export function parseKeywordInput(value: string) {
  return value
    .split(/[\n,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

/**
 * Stable identity for a keyword-research request. Used to dedup the
 * URL-driven search trigger against the form-submit path so the same
 * params don't fire two requests back-to-back.
 */
export function buildKeywordSearchKey(params: {
  keyword: string;
  locationCode: number | undefined;
  locationName: string | undefined;
  resultLimit: ResultLimit;
  mode: KeywordMode;
  clickstream: boolean;
  groupKeywords: boolean;
}) {
  return [
    parseKeywordInput(params.keyword).join(""),
    params.locationCode,
    params.locationName,
    params.resultLimit,
    params.mode,
    params.clickstream ? "cs" : "",
    params.groupKeywords ? "grouped" : "",
  ].join("|");
}

export function getNextSortParams(
  currentField: SortField,
  currentDirection: SortDir,
  targetField: SortField,
): { sort: SortField; order: SortDir } {
  if (currentField !== targetField) {
    return { sort: targetField, order: "desc" };
  }

  return {
    sort: currentField,
    order: currentDirection === "asc" ? "desc" : "asc",
  };
}

export function useSaveAndExportActions(params: SaveExportActionParams) {
  const {
    selectedRows,
    rows,
    filteredRows,
    input,
    saveKeywordsMutate,
    setShowSaveDialog,
  } = params;

  const handleSaveKeywords = () => {
    if (selectedRows.size === 0) {
      toast.error("Select at least one keyword first");
      return;
    }
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    // Saved keyword metrics are stored per country, so local numbers are not
    // saved. The saved list keeps the national metrics.
    const metrics = input.locationName
      ? undefined
      : rows
          .filter((row) => selectedRows.has(row.keyword))
          .map((row) => ({
            keyword: row.keyword,
            searchVolume: row.searchVolume,
            cpc: row.cpc,
            competition: row.competition,
            keywordDifficulty: row.keywordDifficulty,
            intent: row.intent,
            monthlySearches: row.trend,
          }));

    saveKeywordsMutate(
      {
        projectId: input.projectId,
        keywords: [...selectedRows],
        locationCode: input.locationCode,
        metrics,
      },
      {
        onSuccess: () => {
          captureClientEvent("keyword:save", {
            source_feature: "keyword_research",
            keyword_count: selectedRows.size,
          });
          toast.success(`Saved ${selectedRows.size} keywords`);
          setShowSaveDialog(false);
        },
      },
    );
  };

  const sheetsExportRows: CsvValue[][] = useMemo(
    () => filteredRows.map(keywordResearchExportRow),
    [filteredRows],
  );

  const exportCsv = () => {
    if (sheetsExportRows.length === 0) {
      toast.error("No data to export");
      return;
    }
    downloadKeywordResearchCsv(
      sheetsExportRows,
      keywordResearchHeaders(input.locationName),
    );
    captureClientEvent("data:export", {
      source_feature: "keyword_research",
      result_count: sheetsExportRows.length,
    });
  };

  return { handleSaveKeywords, confirmSave, exportCsv, sheetsExportRows };
}

export function downloadKeywordResearchCsv(
  rows: CsvValue[][],
  headers: string[],
) {
  // CSV file keeps cents-formatted CPC/competition for human readability.
  const csvRows = rows.map((row) =>
    row.map((cell, idx) =>
      (idx === 2 || idx === 3) && typeof cell === "number"
        ? cell.toFixed(2)
        : cell,
    ),
  );
  downloadCsv("keyword-research.csv", buildCsv(headers, csvRows));
}
