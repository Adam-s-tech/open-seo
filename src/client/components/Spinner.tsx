import { Loader2 } from "lucide-react";

export function Spinner({
  size = "md",
  label,
  className = "",
}: {
  size?: "sm" | "md";
  /** Shown beside the spinner, e.g. "Checking…". Screen readers get "Loading" without it. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 text-sm text-base-content/60 ${className}`}
    >
      <Loader2
        aria-hidden
        className={`${size === "sm" ? "size-4" : "size-6"} shrink-0 animate-spin`}
      />
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
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
