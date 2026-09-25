import { describe, expect, it, vi } from "vitest";
import {
  buildOnboardingPayload,
  restoreOnboardingAnswers,
} from "./onboardingModel";

vi.mock("@/serverFunctions/onboarding", () => ({
  getOnboardingAnswers: vi.fn(),
}));
const saved = {
  interestedFeatures: ["Keyword research"],
  workFor: "My own startup or business",
  clientWebsiteCount: null,
  foundVia: "Google",
};

describe("historical onboarding values", () => {
  it("keeps a previously saved Google source recognized", () => {
    const answers = restoreOnboardingAnswers({ ...saved, foundVia: "Google" });
    expect(answers.source).toBe("Google");
    expect(answers.sourceOther).toBe("");
    expect(buildOnboardingPayload(answers, 4).foundVia).toBe("Google");
  });

  it.each(["My own startup or business", "My employer's website"])(
    "restores and saves the original work-for value: %s",
    (workFor) => {
      const answers = restoreOnboardingAnswers({ ...saved, workFor });
      expect(answers.workFor).toBe(workFor);
      expect(answers.workForOther).toBe("");
      expect(buildOnboardingPayload(answers, 4).workFor).toBe(workFor);
    },
  );

  it("keeps the original AI workflow value when restoring and saving", () => {
    const interestedFeatures = ["AI workflows with Claude or Codex (MCP)"];
    const answers = restoreOnboardingAnswers({ ...saved, interestedFeatures });
    expect(answers.selectedInterests).toEqual(interestedFeatures);
    expect(answers.interestOther).toBe("");
    expect(buildOnboardingPayload(answers, 4).interestedFeatures).toEqual(
      interestedFeatures,
    );
  });
});
