import { cn } from "cn";
import { Spinner as SpinnerIcon } from "@/client/components/ui/spinner";

/** A loading indicator with an optional visible label, e.g. "Checking…". */
export function Spinner({
  size = "md",
  label,
  className,
}: {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      {/* The icon is the status element, so it carries the label for screen readers. */}
      <SpinnerIcon
        aria-label={label ?? "Loading"}
        className={size === "sm" ? "size-4" : "size-6"}
      />
      {label ? <span aria-hidden>{label}</span> : null}
    </span>
  );
}

/** The centered spinner for a page or section whose data has not arrived. */
export function PageLoading({
  fullScreen = false,
}: {
  /** Fill the viewport, for layouts that render before any app chrome. */
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "min-h-dvh" : "py-10"}`}
    >
      <Spinner />
    </div>
  );
}
