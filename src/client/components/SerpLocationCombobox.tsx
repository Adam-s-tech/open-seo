import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { searchSerpLocations } from "@/serverFunctions/serp-locations";
import { formatLocationLabel } from "@/shared/keyword-locations";
import { Badge } from "@/client/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/client/components/ui/input-group";
import type { SerpLocationResult } from "@/server/lib/dataforseo/serp-locations";

type Props = {
  value: string | undefined;
  onChange: (locationName: string | undefined) => void;
  /** ISO 3166-1 alpha-2 country code, e.g. "us". */
  countryCode: string;
  placeholder?: string;
};

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function SerpLocationCombobox({
  value,
  onChange,
  countryCode,
  placeholder = "Search cities...",
}: Props) {
  const selectedLabel = value ? formatLocationLabel(value) : "";
  const [inputValue, setInputValue] = useState(selectedLabel);
  const [results, setResults] = useState<SerpLocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // The input shows the selection's label. Searching for that text again would
  // reopen the list the selection just closed. A ref, so a new selection does
  // not re-run the search for the text typed before it.
  const selectedLabelRef = useRef(selectedLabel);
  // Bumped by a pick or a blur, so a search still in flight cannot reopen the
  // list the user just dismissed.
  const searchGenerationRef = useRef(0);

  // Each keystroke makes a new query, so retyping a query the user dismissed
  // before its debounce settled still starts a search.
  const [editCount, setEditCount] = useState(0);
  const query = useMemo(
    () => ({ text: inputValue, editCount }),
    [inputValue, editCount],
  );
  const debouncedQuery = useDebounce(query, 350);

  // Show the label of a value set from outside (a reset or a restored search).
  useEffect(() => {
    selectedLabelRef.current = selectedLabel;
    setInputValue(selectedLabel);
    if (!selectedLabel) {
      setResults([]);
      setOpen(false);
    }
  }, [selectedLabel]);

  // Fetch results when debounced query changes
  useEffect(() => {
    const trimmed = debouncedQuery.text.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      setIsLoading(false);
      return;
    }
    if (trimmed === selectedLabelRef.current) {
      // Any fetch this change superseded was cancelled before its own
      // finally could clear the spinner, so clear it here.
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const generation = searchGenerationRef.current;
    const isStale = () =>
      cancelled || generation !== searchGenerationRef.current;
    setIsLoading(true);
    setIsError(false);
    searchSerpLocations({ data: { query: trimmed, countryCode } })
      .then((data) => {
        if (isStale()) return;
        setResults(data);
        setOpen(true);
        setActiveIndex(0);
      })
      .catch(() => {
        if (isStale()) return;
        setIsError(true);
        setOpen(true);
      })
      .finally(() => {
        if (!isStale()) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, countryCode]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        e.target instanceof Node &&
        !containerRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, open]);

  const dismissPendingSearch = () => {
    searchGenerationRef.current += 1;
    setIsLoading(false);
  };

  const select = (loc: SerpLocationResult) => {
    dismissPendingSearch();
    onChange(loc.locationName);
    setInputValue(loc.displayLabel);
    setResults([]);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setEditCount((count) => count + 1);
    if (!v.trim()) {
      onChange(undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      // Text that is not a picked location must not submit the form with
      // the previous selection: wait for the list, then pick a result.
      const typed = inputValue.trim();
      if (e.key === "Enter" && typed && typed !== selectedLabelRef.current) {
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const loc = results[activeIndex];
        if (loc) select(loc);
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={(e) => {
        if (containerRef.current?.contains(e.relatedTarget)) return;
        // Leaving without picking a result shows the selection again, so the
        // field never names a place the form will not use.
        dismissPendingSearch();
        setInputValue(selectedLabelRef.current);
        // The matches were for the abandoned text; focusing again must not
        // offer them under the restored label.
        setResults([]);
        setOpen(false);
      }}
    >
      <InputGroup className="h-10">
        <InputGroupAddon>
          {isLoading ? <Loader2 className="animate-spin" /> : <MapPin />}
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          autoComplete="off"
        />
      </InputGroup>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          // Keep focus in the input, so picking a result is not a blur.
          onMouseDown={(e) => e.preventDefault()}
        >
          {isError ? (
            <p className="px-3 py-2 text-sm text-destructive">
              Unable to load locations
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No locations found for "{debouncedQuery.text.trim()}"
            </p>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-56 w-full overflow-y-auto"
            >
              {results.map((loc, index) => (
                <li
                  key={loc.locationCode}
                  role="option"
                  aria-selected={loc.locationName === value}
                >
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${index === activeIndex ? "bg-accent text-accent-foreground" : ""}`}
                    onClick={() => select(loc)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="truncate text-left">
                      {loc.displayLabel}
                    </span>
                    <Badge variant="secondary" size="sm">
                      {loc.locationType}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
