import {
  GSC_DEVICES,
  SEARCH_PERFORMANCE_RANGES,
  type SearchPerformanceDateRange,
  type SearchPerformanceDevice,
  type SearchPerformanceSearch,
} from "@/types/schemas/search-performance";

const RANGE_LABELS: Record<SearchPerformanceDateRange, string> = {
  last_7_days: "Last 7 days",
  last_28_days: "Last 28 days",
  last_3_months: "Last 3 months",
};
const RANGE_OPTIONS = SEARCH_PERFORMANCE_RANGES.map((value) => ({
  value,
  label: RANGE_LABELS[value],
}));

const DEVICE_LABELS: Record<SearchPerformanceDevice, string> = {
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  TABLET: "Tablet",
};
const DEVICE_OPTIONS = GSC_DEVICES.map((value) => ({
  value,
  label: DEVICE_LABELS[value],
}));

// Sentinel for "no filter" in the selects; never written to the URL.
const ALL = "ALL";

function isDateRange(value: string): value is SearchPerformanceDateRange {
  return SEARCH_PERFORMANCE_RANGES.some((option) => option === value);
}

function isDevice(value: string): value is SearchPerformanceDevice {
  return GSC_DEVICES.some((option) => option === value);
}

/** Device, country, and date range selects of the table toolbar. */
export function SearchPerformanceSelects({
  search,
  countries,
  onSearchChange,
}: {
  search: SearchPerformanceSearch;
  countries: { key: string }[];
  onSearchChange: (update: Partial<SearchPerformanceSearch>) => void;
}) {
  const device = search.device ?? ALL;
  const country = search.country ?? ALL;
  const range = search.range ?? "last_28_days";
  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      <select
        className="select select-bordered select-sm w-36"
        value={device}
        onChange={(event) =>
          onSearchChange({
            page: undefined,
            device: isDevice(event.target.value)
              ? event.target.value
              : undefined,
          })
        }
        aria-label="Device filter"
      >
        <option value={ALL}>All devices</option>
        {DEVICE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="select select-bordered select-sm w-36"
        value={country}
        onChange={(event) =>
          onSearchChange({
            page: undefined,
            country:
              event.target.value === ALL ? undefined : event.target.value,
          })
        }
        aria-label="Country filter"
      >
        <option value={ALL}>All countries</option>
        {country !== ALL && !countries.some((row) => row.key === country) ? (
          <option value={country}>{country.toUpperCase()}</option>
        ) : null}
        {countries.map((row) => (
          <option key={row.key} value={row.key}>
            {row.key.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        className="select select-bordered select-sm w-36"
        value={range}
        onChange={(event) => {
          if (isDateRange(event.target.value)) {
            onSearchChange({
              page: undefined,
              range: event.target.value,
            });
          }
        }}
        aria-label="Date range"
      >
        {RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
