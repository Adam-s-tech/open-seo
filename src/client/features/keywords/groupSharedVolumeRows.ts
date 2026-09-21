import type { KeywordResearchRow } from "@/types/keywords";

/** A results row plus the other keywords that report the same search volume. */
export type KeywordResearchDisplayRow = KeywordResearchRow & {
  variants: KeywordResearchRow[];
};

// Only group above this volume: bucketed low volumes (10, 20, ...) collide by
// coincidence, while real close-variant groups share big grouped numbers.
const SHARED_VOLUME_MIN = 1000;

function sharedVolumeKey(row: KeywordResearchRow): string | null {
  if (row.searchVolume == null || row.searchVolume < SHARED_VOLUME_MIN) {
    return null;
  }
  // A flat series is a bucketed placeholder, not a fingerprint, so two
  // unrelated keywords could share it by coincidence.
  if (new Set(row.trend.map((entry) => entry.searchVolume)).size <= 1) {
    return null;
  }
  const series = row.trend
    .map((entry) => `${entry.year}-${entry.month}:${entry.searchVolume}`)
    .join(",");
  return `${row.searchVolume}|${row.cpc}|${series}`;
}

/**
 * Google Ads reports one volume for a whole close-variant group ("caregiving"
 * / "caregiver" / "caregivers"), so those rows all claim the same searches.
 * Fold rows with an identical volume, CPC, and monthly series under the
 * searched keyword when it is in the group, otherwise under the first one in
 * the given order. Display only: every keyword keeps its own metrics
 * and stays in the data, so filters and exports still reach each variant.
 */
export function groupSharedVolumeRows(
  rows: KeywordResearchRow[],
  searchedKeyword?: string,
): KeywordResearchDisplayRow[] {
  // Row keywords are lowercase; the searched keyword arrives as typed.
  const seed = searchedKeyword?.trim().toLowerCase();
  const groups = new Map<string, KeywordResearchDisplayRow>();
  const result: KeywordResearchDisplayRow[] = [];

  for (const row of rows) {
    const key = sharedVolumeKey(row);
    const group = key ? groups.get(key) : undefined;
    if (group && row.keyword === seed) {
      const { variants, ...leader } = group;
      Object.assign(group, row, { variants: [leader, ...variants] });
      continue;
    }
    if (group) {
      group.variants.push(row);
      continue;
    }
    const displayRow = { ...row, variants: [] };
    if (key) groups.set(key, displayRow);
    result.push(displayRow);
  }

  return result;
}

export function ungroupRows(
  rows: KeywordResearchDisplayRow[],
): KeywordResearchRow[] {
  return rows.flatMap(({ variants, ...row }) => [row, ...variants]);
}
