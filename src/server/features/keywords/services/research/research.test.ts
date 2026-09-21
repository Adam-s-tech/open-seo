import { expect, it, vi } from "vitest";
import type { KeywordResearchRow } from "@/types/keywords";
import { EMPTY_FILTERS } from "@/client/features/keywords/keywordResearchTypes";
import { applyKeywordFiltersAndSort } from "@/client/features/keywords/hooks/useKeywordFiltering";
import { buildCacheKey } from "@/server/lib/r2-cache";
import { research } from "./research";

const mocks = vi.hoisted(() => ({
  cache: new Map<string, string>(),
  fetchRows: vi.fn(),
  upsertKeywordMetric: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("cloudflare:workers", () => ({
  env: {
    R2: {
      get: async (key: string) => {
        const value = mocks.cache.get(key);
        return value === undefined ? null : { text: async () => value };
      },
      put: async (key: string, value: string) => mocks.cache.set(key, value),
    },
  },
}));
vi.mock("./research-data", () => ({
  fetchResearchRowsBySource: mocks.fetchRows,
  fetchGoogleAdsResearchRows: vi.fn(),
}));
vi.mock(
  "@/server/features/keywords/repositories/KeywordResearchRepository",
  () => ({
    KeywordResearchRepository: {
      upsertKeywordMetric: mocks.upsertKeywordMetric,
    },
  }),
);

it("keeps shared-volume keywords independently filterable through research and cache", async () => {
  const seed: KeywordResearchRow = {
    keyword: "caregiving",
    searchVolume: 110000,
    trend: [
      { year: 2026, month: 6, searchVolume: 90500 },
      { year: 2026, month: 7, searchVolume: 110000 },
    ],
    cpc: 8.25,
    competition: 0.4,
    keywordDifficulty: 60,
    intent: "informational",
  };
  const opportunity: KeywordResearchRow = {
    ...seed,
    keyword: "caregiver",
    keywordDifficulty: 20,
    intent: "commercial",
  };
  const siblings = [
    "respite care",
    "elder care",
    "adult day care",
    "care home",
  ].map((keyword) => ({ ...seed, keyword, searchVolume: 500 }));
  mocks.fetchRows.mockImplementation(async ({ source }) =>
    source === "suggestions" ? [seed] : [opportunity, ...siblings],
  );
  const input = {
    projectId: "project_1",
    keywords: ["caregiving"],
    locationCode: 2840,
    languageCode: "en",
    resultLimit: 150 as const,
    mode: "auto" as const,
    clickstream: false,
  };
  const customer = {
    organizationId: "org_1",
    userId: "user_1",
    userEmail: "user@example.com",
  };
  // An older cached grouping must not hide the opportunity after this fix.
  const oldKey = await buildCacheKey("kw:research", {
    ...input,
    cacheVersion: 4,
    organizationId: customer.organizationId,
    depth: 3,
  });
  mocks.cache.set(
    `dataforseo-cache/${oldKey}`,
    JSON.stringify({
      rows: [{ ...seed, closeVariants: [opportunity.keyword] }],
      source: "blended",
      usedFallback: false,
    }),
  );

  const fresh = await research(input, customer);
  const cached = await research(input, customer);
  expect(mocks.fetchRows).toHaveBeenCalledTimes(2);
  expect(cached).toEqual(fresh);
  expect(fresh.rows).toContainEqual(opportunity);
  expect(fresh.source).toBe("blended");
  expect(mocks.upsertKeywordMetric).toHaveBeenCalledWith(
    expect.objectContaining({
      keyword: "caregiver",
      keywordDifficulty: 20,
      intent: "commercial",
    }),
  );
  const filtered = applyKeywordFiltersAndSort({
    rows: cached.rows,
    filters: { ...EMPTY_FILTERS, maxKd: "30", intents: "commercial" },
    sortField: "keyword",
    sortDir: "asc",
  });
  expect(filtered).toEqual([opportunity]);
});
