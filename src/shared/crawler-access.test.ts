import { describe, expect, it } from "vitest";
import {
  crawlerHeadersFor,
  shopifyCrawlerHeaders,
} from "@/shared/crawler-access";

const access = {
  host: "store.example.com",
  headers: shopifyCrawlerHeaders("sig1=(...)", "sig1=:abc:"),
  expiresAt: null,
};

describe("crawlerHeadersFor", () => {
  it("sends the signature only to the audited host over https", () => {
    expect(crawlerHeadersFor("https://store.example.com/a", access)).toEqual(
      access.headers,
    );
    expect(
      crawlerHeadersFor("https://www.store.example.com/a", access),
    ).toEqual({});
    expect(crawlerHeadersFor("http://store.example.com/a", access)).toEqual({});
  });

  it("stops sending the signature once it expires mid-crawl", () => {
    const expired = { ...access, expiresAt: "2020-01-01T00:00:00.000Z" };
    expect(crawlerHeadersFor("https://store.example.com/a", expired)).toEqual(
      {},
    );
  });

  it("never sends the signature to another host", () => {
    expect(crawlerHeadersFor("https://cdn.example.com/a", access)).toEqual({});
    expect(crawlerHeadersFor("https://evil.test/a", access)).toEqual({});
  });
});
