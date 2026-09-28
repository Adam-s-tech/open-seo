import { useAggregateEvents } from "autumn-js/react";
import { Bar, BarChart } from "recharts";
import {
  AUTUMN_SEO_DATA_BALANCE_FEATURE_ID,
  AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID,
  autumnSeoDataCreditsToUsd,
} from "@/shared/billing";
import { QueryError } from "@/client/components/QueryState";
import {
  ChartGrid,
  ChartXAxis,
  ChartYAxis,
} from "@/client/components/ChartAxes";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/client/components/ui/chart";

const BILLING_USAGE_FEATURE_IDS: string[] = [
  AUTUMN_SEO_DATA_BALANCE_FEATURE_ID,
  AUTUMN_SEO_DATA_TOPUP_BALANCE_FEATURE_ID,
];

const chartConfig = {
  credits: { label: "Usage", color: "#7c3aed" },
} satisfies ChartConfig;

export function BillingUsageChart() {
  const eventsQuery = useAggregateEvents({
    featureId: BILLING_USAGE_FEATURE_IDS,
    range: "30d",
    binSize: "day",
  });

  const chartData = (eventsQuery.list ?? []).map((row) => ({
    date: row.period,
    credits: autumnSeoDataCreditsToUsd(
      BILLING_USAGE_FEATURE_IDS.reduce(
        (sum, featureId) => sum + (row.values?.[featureId] ?? 0),
        0,
      ),
    ),
  }));

  const totalSpend = chartData.reduce((sum, d) => sum + d.credits, 0);

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">Usage</span>
        <span className="text-xs text-base-content/50">Last 30 days</span>
      </div>

      <div className="text-2xl font-semibold tabular-nums">
        ${totalSpend.toFixed(2)}
      </div>

      <div className="w-full h-32 min-w-0">
        {eventsQuery.isLoading ? null : eventsQuery.list === undefined &&
          eventsQuery.isError ? (
          <QueryError
            error={eventsQuery.error}
            fallback="Failed to load usage"
            onRetry={() => void eventsQuery.refetch()}
            isRetrying={eventsQuery.isFetching}
          />
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-base-content/40">
              No usage recorded yet
            </span>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <ChartGrid />
              <ChartXAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                minTickGap={40}
              />
              <ChartYAxis tickFormatter={formatUsdAxis} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label: unknown) =>
                      typeof label === "number" ? formatShortDate(label) : ""
                    }
                    valueFormatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                }
              />
              <Bar
                dataKey="credits"
                fill="var(--color-credits)"
                radius={[2, 2, 0, 0]}
                maxBarSize={12}
              />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}

function formatShortDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatUsdAxis(value: number) {
  return `$${value % 1 === 0 ? value : value.toFixed(2)}`;
}
