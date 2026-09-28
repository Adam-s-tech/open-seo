/** Shown where a missing permission would otherwise leave a card or step empty. */
export function PermissionHint({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  return (
    <p className={`text-sm text-base-content/60 ${className ?? ""}`}>
      Ask an organization owner or admin to {action}.
    </p>
  );
}
