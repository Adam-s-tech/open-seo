/** A placeholder block with the shape of content that has not loaded yet. Size it with `className`. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}
