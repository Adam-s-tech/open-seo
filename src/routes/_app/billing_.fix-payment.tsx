import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCustomer } from "autumn-js/react";
import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { useCanManageBilling } from "@/client/features/team/organizationQueries";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { captureClientError, captureClientEvent } from "@/client/lib/posthog";
import { getBillingRouteState } from "@/client/features/billing/route-state";
import { BILLING_ROUTE } from "@/shared/billing";

const SUPPORT_EMAIL = "ben@openseo.so";

// How long the post-portal "checking" screen polls Autumn before telling the
// user the retry is still pending.
const CHECKING_TIMEOUT_MS = 30_000;

// Linked from the payment-failed email. Deliberately narrower than /billing:
// one problem, one fix. The Stripe portal both saves the new card as the
// default and lets the customer pay the open invoice, so it is the only action.
export const Route = createFileRoute("/_app/billing_/fix-payment")({
  validateSearch: (search: Record<string, unknown>): { returned?: true } => ({
    returned:
      search.returned === true || search.returned === "true" ? true : undefined,
  }),
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
      throw notFound();
    }
  },
  component: FixPaymentPage,
});

function FixPaymentPage() {
  const { returned } = Route.useSearch();
  const { data: session, isPending: isSessionPending } = useSession();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingTimedOut, setCheckingTimedOut] = useState(false);

  const customerQuery = useCustomer({
    queryOptions: { enabled: Boolean(session?.user?.id) },
  });
  const canManageBilling = useCanManageBilling();

  const routeState = getBillingRouteState({
    hasSession: Boolean(session?.user?.id),
    isSessionPending,
    isCustomerLoading: customerQuery.isLoading,
    isCustomerError: customerQuery.isError,
  });
  const isPastDue =
    customerQuery.data?.subscriptions?.some((s) => s.pastDue) ?? false;
  const isChecking =
    Boolean(returned) &&
    routeState === "ready" &&
    isPastDue &&
    !checkingTimedOut;

  // Stripe retries the invoice with the new card and Autumn relays the result
  // a few seconds later; poll until the subscription is no longer past due.
  const { refetch: refetchCustomer } = customerQuery;
  useEffect(() => {
    if (!isChecking) return;
    const interval = setInterval(() => void refetchCustomer(), 2000);
    const timeout = setTimeout(() => {
      setCheckingTimedOut(true);
      // The user did the right thing and we could not confirm it worked.
      // Rare enough that every occurrence is worth a look.
      captureClientError(
        new Error("Subscription still past due after billing portal return"),
        { context: "fix_payment_check_timeout" },
      );
    }, CHECKING_TIMEOUT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isChecking, refetchCustomer]);

  useEffect(() => {
    if (returned && routeState === "ready" && !isPastDue) {
      captureClientEvent("billing:payment_fixed");
    }
  }, [returned, routeState, isPastDue]);

  async function openPortal() {
    setError(null);
    setIsOpeningPortal(true);
    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set("returned", "true");
      await customerQuery.openCustomerPortal({ returnUrl: returnUrl.href });
    } catch (err) {
      captureClientError(err, { context: "fix_payment_open_portal" });
      setError(
        getStandardErrorMessage(
          err,
          "We couldn't open the billing portal. Please try again.",
        ),
      );
      setIsOpeningPortal(false);
    }
  }

  if (routeState === "loading") {
    return null;
  }

  if (routeState === "error") {
    return (
      <Page title="Billing unavailable">
        <p className="text-sm text-base-content/70">
          {getStandardErrorMessage(
            customerQuery.error,
            "We couldn't load your billing details right now. Please try again.",
          )}
        </p>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={() => void customerQuery.refetch()}
        >
          Try again
        </button>
      </Page>
    );
  }

  if (isChecking) {
    return (
      <Page title="Checking your payment…">
        <span className="loading loading-spinner loading-md" />
        <p className="text-sm text-base-content/70">
          Stripe is retrying the charge with your updated card. This usually
          takes a few seconds.
        </p>
      </Page>
    );
  }

  if (!isPastDue) {
    return (
      <Page title={returned ? "You're all set" : "Your billing is up to date"}>
        <p className="text-sm text-base-content/70">
          {returned
            ? "The payment went through and your subscription is active again."
            : "There's nothing outstanding on your account."}{" "}
          <Link to={BILLING_ROUTE} className="link link-primary font-medium">
            Back to billing
          </Link>
        </p>
      </Page>
    );
  }

  if (!canManageBilling) {
    return (
      <Page title="Fix your payment">
        <p className="text-sm text-base-content/70">
          A payment for this organization didn&rsquo;t go through. Only the
          organization owner can update the card, so please ask them to visit
          this page.
        </p>
      </Page>
    );
  }

  return (
    <Page title={returned ? "Still showing as unpaid" : "Fix your payment"}>
      <p className="text-sm text-base-content/70">
        {returned
          ? "Your subscription is still marked past due. Stripe can take a few minutes to retry the charge. If you added a new card but the invoice is still listed as open in the portal, you can pay it there directly."
          : "Your last payment didn't go through. This usually means the card expired or the bank declined the charge. Nothing has been turned off yet."}
      </p>

      <div className="rounded-lg border border-base-300 bg-base-100 p-4">
        <p className="text-sm font-semibold">Update your payment method</p>
        <p className="mt-1 text-sm text-base-content/60">
          Add a working card in the billing portal. It becomes your default for
          future renewals, and the open invoice can be paid on the same screen.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm mt-3"
          disabled={isOpeningPortal}
          onClick={() => void openPortal()}
        >
          {isOpeningPortal ? "Opening Stripe..." : "Open billing portal"}
        </button>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </Page>
  );
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 p-4 py-10 md:p-6 md:py-12">
      <div>
        <p className="text-sm font-medium text-base-content/40">Billing</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {children}
      <p className="text-xs text-base-content/40">
        Something look wrong? Email {SUPPORT_EMAIL}.
      </p>
    </div>
  );
}
