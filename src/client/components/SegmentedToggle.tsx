import type { ReactNode } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/client/components/ui/toggle-group";

interface SegmentedToggleItem<T extends string> {
  value: T;
  icon: ReactNode;
  label: string;
}

/** A single-choice segmented control. Each item is a toggle with `aria-pressed`. */
export function SegmentedToggle<T extends string>({
  items,
  value,
  onChange,
  showLabels = false,
}: {
  items: SegmentedToggleItem<T>[];
  value: T;
  onChange: (value: T) => void;
  showLabels?: boolean;
}) {
  return (
    <ToggleGroup
      size="sm"
      spacing={0.5}
      value={[value]}
      onValueChange={(next) => {
        // A press on the active item empties the group. Keep one item on.
        const picked = items.find((item) => item.value === next[0]);
        if (picked) onChange(picked.value);
      }}
      className="rounded-lg bg-muted p-0.5 ring-1 ring-border ring-inset"
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          aria-label={showLabels ? undefined : item.label}
          title={item.label}
          className="h-6 text-muted-foreground aria-pressed:bg-primary/15 aria-pressed:text-primary aria-pressed:shadow-sm"
        >
          {item.icon}
          {showLabels && item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
