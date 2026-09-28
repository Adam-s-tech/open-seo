import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart } from "recharts";
import { getRankConfigTrend } from "@/serverFunctions/rank-tracking";
import { QueryState } from "@/client/components/QueryState";
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
import {
  formatDateLabel,
  TIME_AXIS,
  TrendRangeToggle,
} from "./RankTrackingTrendChart";

const BUCKETS = [
  { key: "top3", label: "Top 3", color: "#16a34a" },
  { key: "top4to10", label: "4–10", color: "#2563eb" },
  { key: "top11to20", label: "11–20", color: "#f59e0b" },
  { key: "notRanking", label: "Not in top 20", color: "#6b7280" },
] as const;

const chartConfig: ChartConfig = Object.fromEntries(
  BUCKETS.map((b) => [b.key, { label: b.label, color: b.color }]),
);

export function RankTrackingOverview({
  device,
  projectId,
  configId,
}: {
  device: "desktop" | "mobile";
  projectId: string;
  configId: string;
}) {
  const [sinceDays, setSinceDays] = useState(730);

  const trendQuery = useQuery({
    queryKey: ["rankConfigTrend", projectId, configId, device, sinceDays],
    queryFn: () =>
      getRankConfigTrend({
        data: { projectId, configId, device, sinceDays },
      }),
  });
  const trend = trendQuery.data;

  const chartData = useMemo(
    () =>
      (trend ?? []).map((p) => ({
        checkedAt: new Date(p.checkedAt).getTime(),
        top3: p.top3,
        top4to10: p.top4to10,
        top11to20: p.top11to20,
        notRanking: p.notRanking,
      })),
    [trend],
  );

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="rounded-lg border border-base-300 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Position distribution</span>
          <TrendRangeToggle value={sinceDays} onChange={setSinceDays} />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {BUCKETS.map((b) => (
            <span
              key={b.key}
              className="inline-flex items-center gap-1 text-[11px] text-base-content/60"
            >
              <span
                className="size-2 rounded-sm"
                style={{ backgroundColor: b.color }}
              />
              {b.label}
            </span>
          ))}
        </div>

        <QueryState
          query={trendQuery}
          errorFallback="Failed to load position history"
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-4 animate-spin text-base-content/50" />
            </div>
          }
        >
          {() =>
            chartData.length <= 1 ? (
              <div className="rounded-lg border border-dashed border-base-300 p-8 text-center text-xs text-base-content/60">
                {chartData.length === 0
                  ? "No history yet — run a check to start tracking positions over time."
                  : "Only 1 check so far — the trend fills in after the next check."}
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[220px]">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <ChartGrid />
                  <ChartXAxis {...TIME_AXIS} />
                  <ChartYAxis allowDecimals={false} width={28} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent labelFormatter={formatDateLabel} />
                    }
                  />
                  {BUCKETS.map((b) => (
                    <Area
                      key={b.key}
                      type="monotone"
                      dataKey={b.key}
                      stackId="positions"
                      stroke={`var(--color-${b.key})`}
                      fill={`var(--color-${b.key})`}
                      fillOpacity={0.7}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            )
          }
        </QueryState>
      </div>
    </div>
  );
}
