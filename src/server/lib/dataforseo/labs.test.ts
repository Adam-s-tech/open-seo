import { afterEach, expect, it, vi } from "vitest";
import {
  fetchRelatedKeywords,
  fetchKeywordSuggestions,
  fetchKeywordIdeas,
} from "./labs";

vi.mock("@/server/lib/runtime-env", () => ({
  getRequiredEnvValue: vi.fn(async () => "test-api-key"),
}));

afterEach(() => vi.unstubAllGlobals());

it("sends synonym filtering for every Labs research source and preserves omitted defaults", async () => {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (url) =>
    Response.json({
      status_code: 20000,
      tasks: [
        {
          status_code: 20000,
          path: new URL(url instanceof Request ? url.url : url).pathname
            .split("/")
            .filter(Boolean),
          cost: 0,
          result: [{ items: [] }],
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  for (const fetchKeywords of [
    fetchRelatedKeywords,
    fetchKeywordSuggestions,
    fetchKeywordIdeas,
  ]) {
    for (const ignoreSynonyms of [true, false, undefined]) {
      await fetchKeywords({
        keyword: "caregiving",
        locationCode: 2840,
        languageCode: "en",
        limit: 150,
        ignoreSynonyms,
      });
      const body = fetchMock.mock.lastCall?.[1]?.body;
      if (typeof body !== "string")
        throw new Error("Expected JSON request body");
      expect(JSON.parse(body)).toEqual([
        expect.objectContaining({ ignore_synonyms: ignoreSynonyms ?? false }),
      ]);
    }
  }
});
