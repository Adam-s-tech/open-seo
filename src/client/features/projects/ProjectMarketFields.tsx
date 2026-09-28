import { useId } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/client/components/ui/combobox";
import { Field, FieldLabel } from "@/client/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import {
  getLanguageCode,
  getLanguageOptions,
} from "@/client/features/keywords/locations";
import type { ProjectMarket } from "@/client/features/projects/types";
import { LOCATION_OPTIONS } from "@/shared/keyword-locations";

type LocationOption = (typeof LOCATION_OPTIONS)[number];

// Matches the start of the name or of any word in it, so "uni" finds United
// States, not Tunisia, and "united states" still finds United States.
function matchesCountry(option: LocationOption, query: string) {
  const needle = query.trim().toLowerCase();
  const label = option.label.toLowerCase();
  return (
    label.startsWith(needle) ||
    label.split(/[\s-]+/).some((word) => word.startsWith(needle)) ||
    option.shortLabel.toLowerCase().startsWith(needle)
  );
}

/**
 * The project's default market: country plus the language served for it.
 * Shared by project settings and onboarding so the pair — and the rule that
 * changing the country snaps the language to that country's native one —
 * stays identical in both places.
 */
export function ProjectMarketFields({
  value,
  onChange,
  hideLanguageOnMobile = false,
}: {
  value: ProjectMarket;
  onChange: (market: ProjectMarket) => void;
  hideLanguageOnMobile?: boolean;
}) {
  const countryId = useId();
  const languageId = useId();
  const country =
    LOCATION_OPTIONS.find((option) => option.code === value.locationCode) ??
    null;
  const languageItems = getLanguageOptions(value.locationCode).map(
    (option) => ({ value: option.code, label: option.label }),
  );
  // Most countries have exactly one language DataForSEO serves, so the
  // select is only a real choice where there's more than one.
  const languageDisabled = languageItems.length <= 1;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={countryId}>Country</FieldLabel>
        <Combobox
          items={LOCATION_OPTIONS}
          value={country}
          itemToStringLabel={(option) => option.label}
          autoHighlight
          filter={matchesCountry}
          onValueChange={(option) => {
            if (!option) return;
            onChange({
              locationCode: option.code,
              languageCode: getLanguageCode(option.code),
            });
          }}
        >
          <ComboboxInput
            id={countryId}
            className="w-full"
            placeholder="Search countries"
          />
          <ComboboxContent>
            <ComboboxEmpty>No countries match.</ComboboxEmpty>
            <ComboboxList>
              {(option: LocationOption) => (
                <ComboboxItem key={option.code} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
      <Field
        className={hideLanguageOnMobile ? "hidden sm:flex" : undefined}
        data-disabled={languageDisabled}
      >
        <FieldLabel htmlFor={languageId}>Language</FieldLabel>
        <Select
          items={languageItems}
          value={value.languageCode}
          onValueChange={(languageCode) => {
            if (languageCode) onChange({ ...value, languageCode });
          }}
          disabled={languageDisabled}
        >
          <SelectTrigger id={languageId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
