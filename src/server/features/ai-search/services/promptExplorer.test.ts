import { describe, expect, it, vi } from "vitest";
import type { LlmResponseResult } from "@/server/lib/dataforseoLlmSchemas";
import { explorePrompt, extractCitations } from "./promptExplorer";

vi.mock("cloudflare:workers", () => ({ waitUntil: vi.fn() }));

const { llmResponse } = vi.hoisted(() => ({ llmResponse: vi.fn() }));
vi.mock("@/server/lib/dataforseo", () => ({
  createDataforseoClient: () => ({ aiSearch: { llmResponse } }),
}));
vi.mock("@/server/lib/dataforseo/llm-models", () => ({
  resolveLatestLlmModelName: vi.fn(async () => "gpt-5.5"),
}));
vi.mock("@/server/lib/r2-cache", () => ({
  AI_SEARCH_PROMPT_CACHE_NAMESPACE: "ai-search-prompt",
  buildCacheKey: vi.fn(async () => "cache-key"),
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => {}),
}));

// DataForSEO's LLM Responses payload nests references as untyped
// `{ title, url }` objects under items[].sections[].annotations — mirroring the
// SDK's AnnotationInfo, which has no citation-type discriminator.
function response(
  annotations: Array<{ title?: string; url?: string }>,
): LlmResponseResult {
  return {
    model_name: "gpt-5",
    web_search: true,
    items: [
      {
        // Annotations outside message items are never citations.
        type: "reasoning",
        sections: [
          {
            type: "summary_text",
            text: "thinking",
            annotations: [{ title: "x", url: "https://x.test/1" }],
          },
        ],
      },
      {
        type: "message",
        sections: [{ type: "text", text: "answer", annotations }],
      },
    ],
  };
}

describe("extractCitations", () => {
  it("keeps untyped annotations (no citation-type discriminator exists)", () => {
    const citations = extractCitations(
      response([
        { title: "Town & Country", url: "https://www.townandcountrymag.com/x" },
        { title: "Stylevana", url: "https://www.stylevana.com/y" },
      ]),
    );
    expect(citations.map((c) => c.url)).toEqual([
      "https://www.townandcountrymag.com/x",
      "https://www.stylevana.com/y",
    ]);
    expect(citations[0]?.domain).toBe("townandcountrymag.com");
    expect(citations[0]?.title).toBe("Town & Country");
  });

  it("dedupes repeated URLs and drops unsafe schemes", () => {
    const citations = extractCitations(
      response([
        { title: "A", url: "https://example.com/a" },
        { title: "A dup", url: "https://example.com/a" },
        { title: "evil", url: "javascript:alert(1)" },
        { title: "no url" },
      ]),
    );
    expect(citations).toHaveLength(1);
    expect(citations[0]?.url).toBe("https://example.com/a");
  });
});

const modelResponse = (webSearch: boolean): LlmResponseResult => ({
  model_name: "gpt-5",
  web_search: webSearch,
  output_tokens: 10,
  items: [
    {
      type: "message",
      sections: [
        {
          type: "text",
          text: "answer",
          annotations: webSearch
            ? [{ title: "Source", url: "https://example.com/post" }]
            : [],
        },
      ],
    },
  ],
});

describe("explorePrompt web-search retry", () => {
  const input = {
    projectId: "p1",
    prompt: "what is the best open source seo tool",
    models: ["chat_gpt" as const],
    webSearch: true,
  };
  const billing = {
    organizationId: "org_1",
    userId: "user_1",
    userEmail: "a@b.c",
  };

  it("retries once when search was requested but the model answered from memory", async () => {
    llmResponse
      .mockResolvedValueOnce(modelResponse(false))
      .mockResolvedValueOnce(modelResponse(true));

    const result = await explorePrompt(input, billing);

    expect(llmResponse).toHaveBeenCalledTimes(2);
    expect(result.results[0]).toMatchObject({
      status: "success",
      webSearch: true,
      citations: [{ url: "https://example.com/post" }],
    });
  });

  it("does not retry when the first response already searched", async () => {
    llmResponse.mockResolvedValueOnce(modelResponse(true));

    await explorePrompt(input, billing);

    expect(llmResponse).toHaveBeenCalledTimes(1);
  });

  it("keeps the first answer when the retry fails", async () => {
    llmResponse
      .mockResolvedValueOnce(modelResponse(false))
      .mockRejectedValueOnce(new Error("upstream timeout"));

    const result = await explorePrompt(input, billing);

    expect(result.results[0]).toMatchObject({
      status: "success",
      webSearch: false,
      text: "answer",
    });
  });
});
