import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@/client/components/Modal";
import {
  isResultLimit,
  normalizeKeywordMode,
} from "@/client/features/keywords/keywordSearchParams";
import { RESULT_LIMITS } from "@/client/features/keywords/keywordResearchTypes";
import { isLabsLocationCode } from "@/client/features/keywords/locations";
import type { KeywordResearchControllerState } from "./types";

type Props = {
  controller: KeywordResearchControllerState;
};

const GOOGLE_ADS_ONLY_NOTE =
  "Not available for countries served from Google Ads data.";

/** The search settings most people leave at their defaults. */
export function KeywordSearchOptions({ controller }: Props) {
  const {
    controlsForm,
    preferredGroupKeywords: groupKeywords,
    setPreferredGroupKeywords: setGroupKeywords,
  } = controller;
  const [open, setOpen] = useState(false);

  return (
    <controlsForm.Subscribe selector={(state) => state.values}>
      {(values) => {
        // Google-Ads-only countries ignore source, clickstream, and grouping.
        const labs = isLabsLocationCode(values.locationCode);
        const local = Boolean(values.locationName);

        return (
          <>
            <button
              type="button"
              className="btn w-full gap-2 border-base-300 bg-base-100 font-normal lg:w-auto lg:shrink-0"
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Options
            </button>

            {open ? (
              <Modal
                maxWidth="max-w-md"
                onClose={() => setOpen(false)}
                labelledBy="keyword-search-options-title"
              >
                <h3
                  id="keyword-search-options-title"
                  className="text-lg font-semibold"
                >
                  Search options
                </h3>

                <controlsForm.Field name="resultLimit">
                  {(field) => (
                    <OptionRow label="Results">
                      <select
                        className="select select-bordered w-full"
                        value={field.state.value}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          field.handleChange(isResultLimit(next) ? next : 150);
                        }}
                      >
                        {RESULT_LIMITS.map((limit) => (
                          <option key={limit} value={limit}>
                            {limit} results
                          </option>
                        ))}
                      </select>
                    </OptionRow>
                  )}
                </controlsForm.Field>

                <controlsForm.Field name="mode">
                  {(field) => (
                    <OptionRow
                      label="Keyword source"
                      help={labs ? undefined : GOOGLE_ADS_ONLY_NOTE}
                    >
                      <select
                        className="select select-bordered w-full"
                        value={field.state.value}
                        disabled={!labs}
                        onChange={(event) =>
                          field.handleChange(
                            normalizeKeywordMode(event.target.value),
                          )
                        }
                      >
                        <option value="auto">Auto</option>
                        <option value="suggestions">Phrase match</option>
                        <option value="ideas">Category ideas</option>
                        <option value="related">People also search for</option>
                      </select>
                    </OptionRow>
                  )}
                </controlsForm.Field>

                <controlsForm.Field name="clickstream">
                  {(field) => (
                    <ToggleRow
                      label="Clickstream-refined volumes"
                      help={
                        !labs
                          ? GOOGLE_ADS_ONLY_NOTE
                          : local
                            ? "Not available for local results. Clickstream data covers whole countries only."
                            : "Google reports one combined volume for similar keywords. This estimates each keyword's own volume. Costs 2x the credits."
                      }
                      // The saved choice returns when the option applies again.
                      checked={labs && !local && field.state.value}
                      disabled={!labs || local}
                      onChange={(checked) => field.handleChange(checked)}
                    />
                  )}
                </controlsForm.Field>

                <ToggleRow
                  label="Group keywords"
                  help={labs ? undefined : GOOGLE_ADS_ONLY_NOTE}
                  checked={labs && groupKeywords}
                  disabled={!labs}
                  onChange={setGroupKeywords}
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </Modal>
            ) : null}
          </>
        );
      }}
    </controlsForm.Subscribe>
  );
}

function OptionRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {help ? (
        <span className="text-xs text-base-content/60">{help}</span>
      ) : null}
    </label>
  );
}

function ToggleRow({
  label,
  help,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className="flex flex-col gap-0.5">
        <span
          className={`text-sm font-medium ${disabled ? "text-base-content/40" : ""}`}
        >
          {label}
        </span>
        {help ? (
          <span className="text-xs text-base-content/60">{help}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="toggle toggle-sm toggle-primary mt-0.5 shrink-0"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
