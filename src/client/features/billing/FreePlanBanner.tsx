import { Link } from "@tanstack/react-router";
import { AppBanner } from "@/client/layout/AppBanner";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import { BILLING_ROUTE, SUBSCRIBE_ROUTE } from "@/shared/billing";

export function FreePlanBanner() {
  const { customerQuery, isFreePlan, isOutOfCredits, isLowCredits } =
    useCreditBalance();

  if (customerQuery.isLoading || !customerQuery.data) {
    return null;
  }

  const creditsActionLink = isFreePlan ? (
    <Link
      to={SUBSCRIBE_ROUTE}
      search={{ upgrade: true }}
      className="link link-primary font-medium"
    >
      Upgrade your plan
    </Link>
  ) : (
    <Link to={BILLING_ROUTE} className="link link-primary font-medium">
      Buy more credits
    </Link>
  );

  if (isOutOfCredits) {
    return (
      <AppBanner variant="destructive">
        You&rsquo;ve used all your credits. {creditsActionLink} to continue
        using OpenSEO.
      </AppBanner>
    );
  }

  if (isLowCredits) {
    return (
      <AppBanner variant="warning">
        You&rsquo;re running low on credits. {creditsActionLink} to keep using
        OpenSEO.
      </AppBanner>
    );
  }

  if (isFreePlan) {
    return (
      <AppBanner variant="info">
        We hope you&rsquo;re enjoying OpenSEO!{" "}
        <Link
          to={SUBSCRIBE_ROUTE}
          search={{ upgrade: true }}
          className="link link-primary font-medium"
        >
          Upgrade anytime
        </Link>{" "}
        or{" "}
        <Link to="/support" className="link link-primary font-medium">
          reach out with questions
        </Link>
        .
      </AppBanner>
    );
  }

  return null;
}
