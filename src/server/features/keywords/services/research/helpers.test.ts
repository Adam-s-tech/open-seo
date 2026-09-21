import { describe, expect, it } from "vitest";
import { interleaveRows, type EnrichedKeyword } from "./helpers";

const row = (
  keyword: string,
  overrides: Partial<EnrichedKeyword> = {},
): EnrichedKeyword => ({
  keyword,
  searchVolume: 1000,
  trend: [{ year: 2026, month: 7, searchVolume: 1000 }],
  cpc: 1.5,
  competition: 0.4,
  keywordDifficulty: 20,
  intent: "informational",
  ...overrides,
});

describe("interleaveRows", () => {
  it("alternates sources, dedupes by keyword, and respects the limit", () => {
    const rows = interleaveRows(
      [row("a"), row("b"), row("c")],
      [row("x"), row("a"), row("y")],
      4,
    );
    expect(rows.map((r) => r.keyword)).toEqual(["a", "x", "b", "c"]);
  });

  it("drains the longer source when the other runs out", () => {
    const rows = interleaveRows([row("a")], [row("x"), row("y"), row("z")], 10);
    expect(rows.map((r) => r.keyword)).toEqual(["a", "x", "y", "z"]);
  });
});
