import { Check } from "lucide-react";
import { resolveTagColor, tagDotClass } from "@/shared/tag-colors";
import type { SavedKeywordTagSummary } from "@/types/keywords";

/** Checkbox, color dot, name and keyword count for one tag in a tag list. */
export function TagCheckboxRow({
  tag,
  checked,
  onToggle,
  className,
}: {
  tag: SavedKeywordTagSummary;
  checked: boolean;
  onToggle: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 text-left ${className}`}
      onClick={onToggle}
    >
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded border ${
          checked
            ? "border-primary bg-primary text-primary-content"
            : "border-base-300"
        }`}
      >
        {checked ? <Check className="size-3" /> : null}
      </span>
      <span
        className={`size-2 shrink-0 rounded-full ${tagDotClass(resolveTagColor(tag))}`}
      />
      <span className="min-w-0 flex-1 truncate text-sm">{tag.name}</span>
      <span className="shrink-0 text-[11px] tabular-nums text-base-content/45">
        {tag.keywordCount}
      </span>
    </button>
  );
}
