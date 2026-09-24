import { Info, Search } from "lucide-react";
import { getFieldError } from "@/client/lib/forms";
import { MAX_KEYWORDS_PER_SUBMIT } from "@/client/features/keywords/keywordResearchTypes";
import { isLabsLocationCode } from "@/client/features/keywords/locations";
import { LocationSelect } from "@/client/components/LocationSelect";
import { KeywordAreaField, LocalVolumeCostNote } from "./KeywordAreaField";
import { KeywordSearchOptions } from "./KeywordSearchOptions";
import type { KeywordResearchControllerState } from "./types";

type Props = {
  controller: KeywordResearchControllerState;
};

function getTextareaRows(value: string): number {
  const newlines = (value.match(/\n/g) ?? []).length;
  const lines = newlines + 1;
  return Math.min(MAX_KEYWORDS_PER_SUBMIT, Math.max(1, lines));
}

export function KeywordResearchSearchBar({ controller }: Props) {
  const { controlsForm, handleSearchSubmit } = controller;

  return (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body gap-2">
        <form
          className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start lg:gap-2"
          onSubmit={handleSearchSubmit}
        >
          <controlsForm.Field name="keyword">
            {(field) => {
              const keywordError = getFieldError(field.state.meta.errors);
              const rows = getTextareaRows(field.state.value);

              return (
                // Same input styling as the location field beside it. Extra
                // lines grow the field.
                <label
                  className={`input input-bordered flex w-full lg:flex-1 lg:min-w-0 lg:max-w-md gap-2 pr-3 ${
                    rows > 1 ? "h-auto items-start py-2" : "items-center"
                  } ${keywordError ? "input-error" : ""}`}
                >
                  <Search
                    className={`size-4 shrink-0 text-base-content/50 ${rows > 1 ? "mt-1" : ""}`}
                  />
                  <textarea
                    className="grow min-w-0 resize-none bg-transparent leading-6 outline-none placeholder:text-base-content/40"
                    rows={rows}
                    placeholder="Enter a keyword"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onKeyDown={(event) => {
                      // Enter submits. Shift+Enter inserts a newline, so
                      // researching several keywords at once means adding a
                      // line per keyword (or pasting newline-separated ones).
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void controlsForm.handleSubmit();
                      }
                    }}
                  />
                </label>
              );
            }}
          </controlsForm.Field>

          <div className="grid grid-cols-2 gap-2 lg:contents">
            <controlsForm.Field name="locationCode">
              {(field) => (
                <LocationSelect
                  value={field.state.value}
                  onChange={(code) => {
                    field.handleChange(code);
                    // An area belongs to one country.
                    controlsForm.setFieldValue("locationName", undefined);
                  }}
                  className="col-span-2 w-full lg:w-44 lg:shrink-0"
                />
              )}
            </controlsForm.Field>

            <controlsForm.Subscribe
              selector={(state) => state.values.locationCode}
            >
              {(locationCode) => (
                <controlsForm.Field name="locationName">
                  {(field) => (
                    <KeywordAreaField
                      locationCode={locationCode}
                      value={field.state.value}
                      onChange={(name) => field.handleChange(name)}
                    />
                  )}
                </controlsForm.Field>
              )}
            </controlsForm.Subscribe>

            <KeywordSearchOptions controller={controller} />

            <button
              type="submit"
              className="btn btn-primary w-full px-6 lg:w-auto lg:shrink-0"
            >
              Search
            </button>
          </div>
        </form>
        <controlsForm.Field name="keyword">
          {(field) => {
            const keywordError = getFieldError(field.state.meta.errors);

            return keywordError ? (
              <p className="text-sm text-error">{keywordError}</p>
            ) : null;
          }}
        </controlsForm.Field>
        <controlsForm.Subscribe
          selector={(state) =>
            [state.values.locationCode, state.values.locationName] as const
          }
        >
          {([locationCode, locationName]) => (
            <>
              {isLabsLocationCode(locationCode) ? null : (
                <div
                  className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-base-content/80"
                  role="status"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-info" />
                  <span>
                    Keyword data for this country comes from Google Ads — search
                    volume, CPC, and trends are available, but difficulty and
                    intent are not.
                  </span>
                </div>
              )}
              {locationName ? <LocalVolumeCostNote /> : null}
            </>
          )}
        </controlsForm.Subscribe>
      </div>
    </div>
  );
}
