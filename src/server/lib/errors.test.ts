import { describe, expect, it } from "vitest";
import { AppError, toClientError } from "@/server/lib/errors";

describe("toClientError", () => {
  it.each([
    {
      label: "sanitizes internal detail down to the bare code",
      error: new AppError(
        "INTERNAL_ERROR",
        "DataForSEO task missing billing metadata (path: Invalid input). Response: {...}",
      ),
      message: "INTERNAL_ERROR",
    },
    {
      label: "keeps public error codes unchanged",
      error: new AppError("PAYMENT_REQUIRED"),
      message: "PAYMENT_REQUIRED",
    },
    {
      label: "passes setup-error detail through as CODE: detail",
      error: new AppError(
        "AUTH_CONFIG_MISSING",
        "TEAM_DOMAIN must be a full https URL like https://your-team.cloudflareaccess.com",
      ),
      message:
        "AUTH_CONFIG_MISSING: TEAM_DOMAIN must be a full https URL like https://your-team.cloudflareaccess.com",
    },
    {
      label: "keeps a detail-less setup error as its bare code",
      error: new AppError("AUTH_CONFIG_MISSING"),
      message: "AUTH_CONFIG_MISSING",
    },
  ])("$label", ({ error, message }) => {
    expect(toClientError(error).message).toBe(message);
  });
});
