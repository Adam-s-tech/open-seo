import { Link } from "@tanstack/react-router";
import { Sparkles, type LucideIcon } from "lucide-react";
import { SUBSCRIBE_ROUTE } from "@/shared/billing";
import { GateCard } from "@/client/components/GateCard";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";

type Props = {
  feature: string;
  description: string;
  bullets: Array<{ icon: LucideIcon; title: string; body: string }>;
};

export function AiSearchPaidPlanGate({ feature, description, bullets }: Props) {
  return (
    <GateCard
      className="mx-auto max-w-3xl"
      badge={
        <Badge variant="soft">
          <Sparkles data-icon="inline-start" />
          Paid plan
        </Badge>
      }
      title={`Unlock ${feature}`}
      description={<p className="max-w-xl">{description}</p>}
      actions={
        <Button
          size="lg"
          nativeButton={false}
          render={<Link to={SUBSCRIBE_ROUTE} search={{ upgrade: true }} />}
        >
          Upgrade
        </Button>
      }
      features={bullets}
    />
  );
}
