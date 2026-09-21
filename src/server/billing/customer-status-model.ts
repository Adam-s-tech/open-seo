import { AUTUMN_PAID_PLAN_FEATURE_ID } from "@/shared/billing";

// The subset of the Autumn SDK's `Customer` we read. The SDK already validates
// and returns camelCase, so we type against it structurally instead of
// re-parsing; everything else is preserved verbatim in `customerJson`.
type AutumnSubscriptionInput = {
  planId?: string | null;
  status?: string | null;
};

type AutumnCustomerInput = {
  id?: string | null;
  subscriptions?: AutumnSubscriptionInput[];
  flags?: Record<string, { planId?: string | null } | undefined>;
  [key: string]: unknown;
};

export type BillingCustomerStatusSnapshot = {
  organizationId: string;
  isPaying: boolean;
  paidPlanId: string | null;
  paidPlanStatus: string | null;
  customerJson: string;
  syncedAt: string;
};

export function deriveBillingCustomerStatusSnapshot(
  customer: AutumnCustomerInput,
): BillingCustomerStatusSnapshot {
  const organizationId = customer.id;
  if (!organizationId) {
    throw new Error("Autumn customer is missing an id");
  }

  // Autumn names the plan that granted `paid_plan`, so every plan configured
  // to grant it counts as paid without listing plan IDs here. A flag with no
  // plan (granted by hand) has no subscription to report on.
  const paidPlanId =
    customer.flags?.[AUTUMN_PAID_PLAN_FEATURE_ID]?.planId ?? null;
  const subscription = paidPlanId
    ? selectSubscription(customer.subscriptions ?? [], paidPlanId)
    : null;

  return {
    organizationId,
    isPaying: subscription?.status === "active",
    paidPlanId,
    paidPlanStatus: subscription?.status ?? null,
    // Full payload kept verbatim — query rarely-used fields via json_extract.
    customerJson: JSON.stringify(customer),
    syncedAt: new Date().toISOString(),
  };
}

// Prefer the active row; fall back to any row for the plan so a past-due or
// scheduled state is still recorded.
function selectSubscription(
  subscriptions: AutumnSubscriptionInput[],
  planId: string,
) {
  const rows = subscriptions.filter((s) => s.planId === planId);
  return rows.find((s) => s.status === "active") ?? rows[0] ?? null;
}
