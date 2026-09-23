import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCustomer } from "autumn-js/react";
import { useState } from "react";
import { QueryError } from "@/client/components/QueryState";
import { PageLoading } from "@/client/components/Spinner";
import { useSession } from "@/lib/auth-client";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { useCanManageBilling } from "@/client/features/team/organizationQueries";
import { captureClientEvent } from "@/client/lib/posthog";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { buildCheckoutSuccessUrl } from "@/client/features/billing/checkout-url";
import { BillingUsageChart } from "@/client/features/billing/BillingUsageChart";
import { BillingFeatureBreakdown } from "@/client/features/billing/BillingFeatureBreakdown";
import { parseTopUpAmount } from "@/client/features/billing/HostedBillingContentUtils";
import { getBillingRouteState } from "@/client/features/billing/route-state";
import {
  getCustomerPaidPlan,
  getCustomerPlanStatus,
} from "@/client/features/billing/plan-detection";
import {
  BASE_PLAN_OFFER,
  monthlyCreditsFeature,
} from "@/client/features/billing/plan-offers";
import {
  AUTUMN_CHECKOUT_SESSION_PARAMS,
  BILLING_ROUTE,
  AUTUMN_SEO_DATA_BALANCE_FEATURE_ID,
  LOW_CREDITS_THRESHOLD_USD,
  AUTUMN_SEO_DATA_CREDITS_PER_USD,
  AUTUMN_SEO_DATA_TOP_UP_PLAN_ID,
  AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID,
  autumnSeoDataCreditsToUsd,
} from "@/shared/billing";

export const Route = createFileRoute("/_app/billing")({
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
      throw notFound();
    }
  },
  component: BillingPage,
});

function BillingPage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [topUpAmount, setTopUpAmount] = useState("20");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerQuery = useCustomer({
    // Expanded so the plan card can show the subscribed plan's name.
    expand: ["subscriptions.plan"],
    queryOptions: {
      enabled: Boolean(session?.user?.id),
    },
  });

  // Subscription changes are owner-only; other members see balances but are
  // pointed at the owner instead of checkout (the server enforces this too).
  const canManageBilling = useCanManageBilling();

  const planStatus = getCustomerPlanStatus(customerQuery.data);
  const isFreePlan = planStatus === "free";
  const paidPlan = getCustomerPaidPlan(customerQuery.data);
  const billingRouteState = getBillingRouteState({
    hasSession: Boolean(session?.user?.id),
    isSessionPending,
    isCustomerLoading: customerQuery.isLoading,
    isCustomerError: customerQuery.isError,
  });

  const monthlyRemaining = autumnSeoDataCreditsToUsd(
    customerQuery.data?.balances?.[AUTUMN_SEO_DATA_BALANCE_FEATURE_ID]
      ?.remaining ?? 0,
  );
  const topUpRemaining = autumnSeoDataCreditsToUsd(
    customerQuery.data?.balances?.[AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID]
      ?.remaining ?? 0,
  );
  const totalRemaining = monthlyRemaining + topUpRemaining;

  const { isValid: isValidTopUp, parsed: parsedTopUpAmount } =
    parseTopUpAmount(topUpAmount);

  if (billingRouteState === "loading") {
    return <PageLoading />;
  }

  if (billingRouteState === "error") {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 p-4 py-10 md:p-6 md:py-12">
        <h1 className="text-xl font-semibold">Billing unavailable</h1>
        <QueryError
          error={customerQuery.error}
          fallback="We couldn't load your billing details right now. Please try again."
          onRetry={() => void customerQuery.refetch()}
          isRetrying={customerQuery.isFetching}
        />
      </div>
    );
  }

  function startUpgradeCheckout() {
    captureClientEvent("billing:checkout_start");
    return customerQuery.attach({
      planId: BASE_PLAN_OFFER.planId,
      redirectMode: "always",
      successUrl: buildCheckoutSuccessUrl(BILLING_ROUTE),
      checkoutSessionParams: BASE_PLAN_OFFER.checkoutSessionParams,
    });
  }

  async function runAction(
    callback: () => Promise<unknown>,
    fallbackMessage: string,
  ) {
    setError(null);
    setIsPending(true);
    try {
      await callback();
      await customerQuery.refetch();
    } catch (err) {
      setError(getStandardErrorMessage(err, fallbackMessage));
    } finally {
      setIsPending(false);
    }
  }

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-base-content/50">Redirecting to Stripe...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 p-4 py-10 md:p-6 md:py-12">
      <h1 className="text-xl font-semibold">Billing</h1>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Subscription card */}
        <div className="flex flex-col justify-between rounded-lg border border-base-300 bg-base-100 p-4 gap-4">
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              ${totalRemaining.toFixed(2)}{" "}
              <span className="text-sm font-normal text-base-content/50">
                remaining
              </span>
            </div>
            {!isFreePlan ? (
              <div className="mt-1 flex gap-3 text-xs text-base-content/50">
                <span className="tabular-nums">
                  Monthly ${monthlyRemaining.toFixed(2)}
                </span>
                <span>&middot;</span>
                <span className="tabular-nums">
                  Top-ups ${topUpRemaining.toFixed(2)}
                </span>
              </div>
            ) : null}
            {totalRemaining <= 0 ? (
              <p className="mt-2 text-xs text-error">
                You&rsquo;ve used all your credits.{" "}
                {isFreePlan
                  ? "Upgrade your plan to continue."
                  : "Buy more credits below to continue."}
              </p>
            ) : totalRemaining < LOW_CREDITS_THRESHOLD_USD ? (
              <p className="mt-2 text-xs text-amber-600">
                You&rsquo;re running low on credits.{" "}
                {isFreePlan
                  ? `Upgrade to get $${BASE_PLAN_OFFER.monthlyCreditsUsd}/month.`
                  : "Buy more credits below."}
              </p>
            ) : null}
          </div>

          <div className="text-sm">
            <span className="font-medium">Plan</span>{" "}
            <span className="text-base-content/50">
              {paidPlan?.name ?? "Free Plan"}
            </span>
            {paidPlan ? (
              <span className="text-base-content/50">
                {" "}
                &middot; ${paidPlan.monthlyCreditsUsd.toFixed(2)} of Usage
                Credits each month
              </span>
            ) : null}
          </div>

          {!canManageBilling ? (
            <p className="border-t border-base-300 pt-3 text-sm text-base-content/60">
              Only the organization owner can change the plan or buy credits.
              Ask them if you need more.
            </p>
          ) : isFreePlan ? (
            <div className="space-y-3 border-t border-base-300 pt-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium">
                  {BASE_PLAN_OFFER.name}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  ${BASE_PLAN_OFFER.priceUsd}/month
                </span>
              </div>
              <ul className="space-y-1.5">
                {[
                  "Access to all OpenSEO features",
                  monthlyCreditsFeature(BASE_PLAN_OFFER),
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs text-base-content/60"
                  >
                    <span className="text-base-content/30 mt-[1px] shrink-0">
                      &mdash;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-soft btn-sm w-full"
                disabled={isPending}
                onClick={() =>
                  void runAction(
                    startUpgradeCheckout,
                    "We couldn't start the checkout. Please try again.",
                  )
                }
              >
                Upgrade Plan
              </button>
            </div>
          ) : (
            <button
              className="btn btn-soft btn-sm w-full"
              disabled={isPending}
              onClick={() =>
                void runAction(
                  () =>
                    customerQuery.openCustomerPortal({
                      returnUrl: window.location.href,
                    }),
                  "We couldn't open the billing portal. Please try again.",
                )
              }
            >
              Manage subscription
            </button>
          )}
        </div>

        {/* Buy credits card — paid plan only, owner-only */}
        {!isFreePlan && canManageBilling ? (
          <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
            <div>
              <span className="font-semibold">Buy credits</span>
              <p className="mt-1 text-sm text-base-content/60">
                Top-up credits never expire and are used after your monthly
                credits.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/60">$</span>
                <input
                  type="number"
                  min={10}
                  max={99}
                  step={1}
                  inputMode="numeric"
                  className="input input-bordered input-sm w-full"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                />
              </div>
              {topUpAmount.trim() !== "" && !isValidTopUp ? (
                <p className="mt-1 text-xs text-error">
                  Enter between $10–$99.
                </p>
              ) : null}
            </div>

            <button
              className="btn btn-soft btn-sm w-full"
              disabled={isPending || !isValidTopUp}
              onClick={() =>
                void runAction(
                  () =>
                    customerQuery.attach({
                      planId: AUTUMN_SEO_DATA_TOP_UP_PLAN_ID,
                      redirectMode: "always",
                      successUrl: window.location.href,
                      checkoutSessionParams: AUTUMN_CHECKOUT_SESSION_PARAMS,
                      featureQuantities: [
                        {
                          featureId: AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID,
                          quantity: Math.round(
                            parsedTopUpAmount * AUTUMN_SEO_DATA_CREDITS_PER_USD,
                          ),
                        },
                      ],
                    }),
                  "We couldn't start the checkout. Please try again.",
                )
              }
            >
              Buy credits
            </button>
          </div>
        ) : null}
      </div>

      {/* Usage chart */}
      <BillingUsageChart />

      {/* Per-feature usage breakdown */}
      <BillingFeatureBreakdown />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <p className="text-xs text-base-content/40">
        Billing is powered by Stripe.
      </p>
    </div>
  );
}
