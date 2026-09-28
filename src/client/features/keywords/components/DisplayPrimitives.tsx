import { ChevronDown, ChevronUp } from "lucide-react";
import { createPortal } from "react-dom";
import { Area, AreaChart } from "recharts";
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
import type { MonthlySearch } from "@/types/keywords";
import {
  formatCompactNumber,
  lastTwelveMonths,
  MONTH_SHORT_LABELS,
} from "../utils";
import {
  FloatingTooltip,
  useFloatingTooltip,
} from "@/client/components/FloatingTooltip";

export type SortField =
  | "keyword"
  | "searchVolume"
  | "cpc"
  | "competition"
  | "keywordDifficulty";
export type SortDir = "asc" | "desc";

const trendChartConfig = {
  searchVolume: { label: "Search volume", color: "var(--color-primary)" },
} satisfies ChartConfig;

export function AreaTrendChart({ trend }: { trend: MonthlySearch[] }) {
  const last12 = lastTwelveMonths(trend);
  if (last12.length === 0) return null;

  const data = last12.map((m) => ({
    month: MONTH_SHORT_LABELS[m.month - 1],
    searchVolume: m.searchVolume,
  }));

  return (
    <ChartContainer
      config={trendChartConfig}
      className="h-[210px]"
      aria-label="Search trend chart"
    >
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-searchVolume)"
              stopOpacity="var(--trend-fill-start-opacity)"
            />
            <stop
              offset="100%"
              stopColor="var(--color-searchVolume)"
              stopOpacity="var(--trend-fill-end-opacity)"
            />
          </linearGradient>
        </defs>
        <ChartGrid />
        <ChartXAxis dataKey="month" minTickGap={5} />
        <ChartYAxis
          tickFormatter={(value: number | string) =>
            formatCompactNumber(Number(value))
          }
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="searchVolume"
          stroke="var(--color-searchVolume)"
          strokeWidth={2}
          fill="url(#trendGrad)"
          isAnimationActive={false}
          dot={{ r: 3, fill: "var(--color-searchVolume)", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "var(--color-searchVolume)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function SortHeader({
  label,
  helpText,
  field,
  current,
  dir,
  onToggle,
  className,
}: {
  label: string;
  helpText?: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onToggle: (f: SortField) => void;
  className?: string;
}) {
  const isActive = field === current;
  const tooltip = useFloatingTooltip<HTMLButtonElement>({
    enabled: !!helpText,
  });

  return (
    <button
      ref={tooltip.triggerRef}
      className={`inline-flex items-center gap-0.5 hover:text-primary transition-colors cursor-pointer select-none ${className ?? ""}`}
      onClick={() => onToggle(field)}
      onMouseEnter={tooltip.scheduleOpen}
      onMouseLeave={tooltip.close}
      onFocus={tooltip.scheduleOpen}
      onBlur={tooltip.close}
      onKeyDown={(e) => {
        if (e.key === "Escape") tooltip.close();
      }}
      aria-describedby={
        tooltip.isOpen && helpText ? tooltip.tooltipId : undefined
      }
    >
      {label}
      {isActive &&
        (dir === "asc" ? (
          <ChevronUp className="size-3" />
        ) : (
          <ChevronDown className="size-3" />
        ))}
      {tooltip.isOpen && helpText && typeof document !== "undefined"
        ? createPortal(
            <FloatingTooltip id={tooltip.tooltipId} position={tooltip.position}>
              {helpText}
            </FloatingTooltip>,
            document.body,
          )
        : null}
    </button>
  );
}
