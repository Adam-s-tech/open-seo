import { SerpLocationCombobox } from "@/client/components/SerpLocationCombobox";
import { usePrewarmSerpLocations } from "@/client/components/usePrewarmSerpLocations";

type TargetingMode = "national" | "local";

export function SearchTargetingField({
  mode,
  onModeChange,
  locationName,
  onLocationNameChange,
  countryCode,
}: {
  mode: TargetingMode;
  onModeChange: (mode: TargetingMode) => void;
  locationName: string | undefined;
  onLocationNameChange: (locationName: string | undefined) => void;
  countryCode: string;
}) {
  // Warm the moment Local targeting is in play.
  usePrewarmSerpLocations(countryCode, mode === "local");
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">Search Targeting</span>
      </label>
      <div className="flex gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            className="radio radio-sm"
            checked={mode === "national"}
            onChange={() => {
              onModeChange("national");
              onLocationNameChange(undefined);
            }}
          />
          <span className="text-sm">National</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            className="radio radio-sm"
            checked={mode === "local"}
            onChange={() => onModeChange("local")}
          />
          <span className="text-sm">Local</span>
        </label>
      </div>
      <p className="text-xs text-base-content/50 mt-1.5">
        {mode === "local" ? (
          <>
            <span className="text-success font-medium">Best for:</span> "near
            me" queries, city/county keywords, service-area pages.
          </>
        ) : (
          <>
            Local targeting can understate rankings for non-geo-modified terms.
          </>
        )}
      </p>
      {mode === "local" && (
        <div className="mt-2">
          <SerpLocationCombobox
            value={locationName}
            onChange={onLocationNameChange}
            countryCode={countryCode}
            placeholder="Search cities..."
          />
        </div>
      )}
    </div>
  );
}
