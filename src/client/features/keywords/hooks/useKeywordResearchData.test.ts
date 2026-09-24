import { describe, expect, it, vi } from "vitest";

// The hook module pulls in the server functions it calls, whose graph reaches
// Workers-only bindings that don't resolve outside workerd.
vi.mock("cloudflare:workers", () => ({ env: {} }));

import {
  buildKeywordResearchRequest,
  buildKeywordResearchQueryKey,
} from "./useKeywordResearchData";

const baseInput = {
  projectId: "project_1",
  keywordInput: "technical seo",
  locationCode: 2704,
  locationName: undefined,
  resultLimit: 150 as const,
  mode: "auto" as const,
  clickstream: false,
  groupKeywords: false,
};

describe("buildKeywordResearchRequest", () => {
  it("carries an explicitly selected location without a language", () => {
    const request = buildKeywordResearchRequest(baseInput);

    expect(request).toMatchObject({ locationCode: 2704, groupKeywords: false });
    expect(request).not.toHaveProperty("languageCode");
    const grouped = buildKeywordResearchRequest({
      ...baseInput,
      groupKeywords: true,
    });
    expect(grouped).toMatchObject({ groupKeywords: true });
    expect(buildKeywordResearchQueryKey(grouped)).not.toEqual(
      buildKeywordResearchQueryKey(request),
    );
  });

  it("never serves a national result for a local search", () => {
    const national = buildKeywordResearchRequest(baseInput);
    const local = buildKeywordResearchRequest({
      ...baseInput,
      locationName: "Hanoi,Hanoi,Vietnam",
    });

    expect(local).toMatchObject({ locationName: "Hanoi,Hanoi,Vietnam" });
    expect(buildKeywordResearchQueryKey(local)).not.toEqual(
      buildKeywordResearchQueryKey(national),
    );
  });

  it("leaves the location undefined for the server to resolve", () => {
    const request = buildKeywordResearchRequest({
      ...baseInput,
      locationCode: undefined,
    });

    expect(request).toMatchObject({ locationCode: undefined });
    expect(request).not.toHaveProperty("languageCode");
  });
});
