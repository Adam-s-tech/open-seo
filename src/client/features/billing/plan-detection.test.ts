import { describe, expect, it } from "vitest";
import { AUTUMN_PAID_PLAN_FEATURE_ID } from "@/shared/billing";
import {
  getCustomerPaidPlan,
  getCustomerPaidPlanId,
  getCustomerPlanStatus,
} from "./plan-detection";

describe("getCustomerPlanStatus", () => {
  it("treats a customer without the paid entitlement as free", () => {
    expect(getCustomerPlanStatus(undefined)).toBe("free");
    expect(getCustomerPlanStatus({ flags: {} })).toBe("free");
  });

  it("treats any plan granting the paid entitlement as paid", () => {
    expect(
      getCustomerPlanStatus({
        flags: {
          [AUTUMN_PAID_PLAN_FEATURE_ID]: {
            planId: "friends_and_family_2",
          },
        },
      }),
    ).toBe("paid");
  });
});

describe("getCustomerPaidPlanId", () => {
  it("returns the plan that granted the paid entitlement", () => {
    expect(
      getCustomerPaidPlanId({
        flags: { [AUTUMN_PAID_PLAN_FEATURE_ID]: { planId: "yc-plan" } },
      }),
    ).toBe("yc-plan");
    expect(getCustomerPaidPlanId({ flags: {} })).toBeNull();
  });
});

describe("getCustomerPaidPlan", () => {
  it("reads the name from the expanded subscription and credits from balances", () => {
    expect(
      getCustomerPaidPlan({
        flags: { [AUTUMN_PAID_PLAN_FEATURE_ID]: { planId: "yc-plan" } },
        subscriptions: [{ planId: "yc-plan", plan: { name: "YC Plan" } }],
        balances: { usage_credits: { granted: 50000 } },
      }),
    ).toEqual({ id: "yc-plan", name: "YC Plan", monthlyCreditsUsd: 50 });
  });

  it("falls back to the plan ID when the plan is not expanded", () => {
    expect(
      getCustomerPaidPlan({
        flags: { [AUTUMN_PAID_PLAN_FEATURE_ID]: { planId: "yc-plan" } },
      })?.name,
    ).toBe("yc-plan");
  });
});
