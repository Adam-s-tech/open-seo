import { describe, expect, it } from "vitest";
import { AUTUMN_PAID_PLAN_FEATURE_ID } from "@/shared/billing";
import { deriveBillingCustomerStatusSnapshot } from "./customer-status-model";

const paidFlags = (planId: string) => ({
  [AUTUMN_PAID_PLAN_FEATURE_ID]: { planId },
});

describe("deriveBillingCustomerStatusSnapshot", () => {
  it("marks customers whose paid plan is active as paying", () => {
    const snapshot = deriveBillingCustomerStatusSnapshot({
      id: "org_123",
      flags: paidFlags("yc-plan"),
      subscriptions: [{ planId: "yc-plan", status: "active" }],
    });

    expect(snapshot).toMatchObject({
      organizationId: "org_123",
      isPaying: true,
      paidPlanId: "yc-plan",
      paidPlanStatus: "active",
    });
  });

  it("preserves the full customer payload in customerJson", () => {
    const snapshot = deriveBillingCustomerStatusSnapshot({
      id: "org_123",
      email: "alice@example.com",
      stripeId: "cus_123",
    });

    expect(JSON.parse(snapshot.customerJson)).toMatchObject({
      id: "org_123",
      email: "alice@example.com",
      stripeId: "cus_123",
    });
  });

  it("keeps customers without the paid entitlement queryable but not paying", () => {
    const snapshot = deriveBillingCustomerStatusSnapshot({
      id: "org_123",
      flags: {},
      subscriptions: [{ planId: "free", status: "active" }],
    });

    expect(snapshot.isPaying).toBe(false);
    expect(snapshot.paidPlanId).toBeNull();
    expect(snapshot.paidPlanStatus).toBeNull();
  });

  it("records a past-due paid plan as not paying", () => {
    const snapshot = deriveBillingCustomerStatusSnapshot({
      id: "org_456",
      flags: paidFlags("base-plan"),
      subscriptions: [{ planId: "base-plan", status: "past_due" }],
    });

    expect(snapshot).toMatchObject({
      isPaying: false,
      paidPlanId: "base-plan",
      paidPlanStatus: "past_due",
    });
  });

  it("prefers the active row when the plan has several subscriptions", () => {
    const snapshot = deriveBillingCustomerStatusSnapshot({
      id: "org_789",
      flags: paidFlags("base-plan"),
      subscriptions: [
        { planId: "base-plan", status: "scheduled" },
        { planId: "base-plan", status: "active" },
      ],
    });

    expect(snapshot.isPaying).toBe(true);
    expect(snapshot.paidPlanStatus).toBe("active");
  });
});
