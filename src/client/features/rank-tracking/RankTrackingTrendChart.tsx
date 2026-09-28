import type { ComponentProps } from "react";
import { Line, LineChart, ReferenceArea } from "recharts";
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

export interface TrendSeries {
  /** key into each data row holding the position value (1 = best, serpDepth = bottom band) */
  dataKey: string;
  name: string;
  color: string;
  /** dashed = device line where nulls are plotted in the bottom "not in top N" band */
  strokeDasharray?: string;
}

/**
 * Shared inverted-axis line chart for rank trends. Y-axis is reversed so #1 is
 * pinned at the top and an improving line moves up. The very bottom of the
 * plot (= serpDepth) is a muted "Not in top {serpDepth}" band; callers plot
 * null positions at `serpDepth` so a drop reads as the line dipping into the
 * band rather than a silent gap.
 */
export function RankTrendChart({
  data,
  series,
  serpDepth,
  valueFormatter,
  showBottomBand = false,
}: {
  data: Array<Record<string, unknown>>;
  series: TrendSeries[];
  serpDepth: number;
  valueFormatter?: ComponentProps<typeof ChartTooltipContent>["valueFormatter"];
  /** Show the muted "not in top {serpDepth}" band — only meaningful for a
   * single keyword's position line, not for an averaged value. */
  showBottomBand?: boolean;
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.dataKey, { label: s.name, color: s.color }]),
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-base-content/50">
        <span>Google position (1 = best)</span>
        <span className="inline-flex items-center gap-1">
          Better <span aria-hidden>↑</span>
        </span>
      </div>
      <ChartContainer config={config} className="h-56">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <ChartGrid />
          {/* Muted bottom band: not in top {serpDepth} */}
          {showBottomBand && (
            <ReferenceArea
              y1={serpDepth - 0.5}
              y2={serpDepth}
              fill="currentColor"
              fillOpacity={0.06}
              ifOverflow="extendDomain"
            />
          )}
          <ChartXAxis {...TIME_AXIS} />
          <ChartYAxis
            reversed
            domain={[1, serpDepth]}
            allowDecimals={false}
            width={32}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={formatDateLabel}
                valueFormatter={valueFormatter}
              />
            }
          />
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stroke={`var(--color-${s.dataKey})`}
              strokeWidth={2}
              strokeDasharray={s.strokeDasharray}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

/** X axis for charts keyed by a `checkedAt` timestamp in ms. */
export const TIME_AXIS = {
  dataKey: "checkedAt",
  type: "number",
  scale: "time",
  domain: ["dataMin", "dataMax"],
  tickFormatter: formatDateTick,
} as const;

function formatDateTick(value: number): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Tooltip label for a `checkedAt` timestamp: "Sep 28, 2026". */
export function formatDateLabel(label: unknown): string {
  return typeof label === "number"
    ? new Date(label).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
}

/** 30d / 90d / All range toggle shared by the modal and overview charts. */
const TREND_RANGES = [
  { label: "30d", sinceDays: 30 },
  { label: "90d", sinceDays: 90 },
  { label: "All", sinceDays: 730 },
] as const;

export function TrendRangeToggle({
  value,
  onChange,
}: {
  value: number;
  onChange: (sinceDays: number) => void;
}) {
  return (
    <div className="join">
      {TREND_RANGES.map((range) => (
        <button
          key={range.label}
          type="button"
          className={`btn btn-xs join-item ${
            value === range.sinceDays ? "btn-active" : "btn-ghost"
          }`}
          onClick={() => onChange(range.sinceDays)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
