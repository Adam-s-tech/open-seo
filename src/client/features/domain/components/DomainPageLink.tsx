import { Link } from "@tanstack/react-router";
import type { PageButtonProps } from "@/client/components/table/TablePagination";

/** Prev/next as real links, so a page can open in a new tab. */
export function DomainPageLink({
  page,
  disabled,
  label,
  children,
  onPageChange,
}: PageButtonProps) {
  return (
    <Link
      from="/p/$projectId/domain"
      to="/p/$projectId/domain"
      search={(prev) => ({
        ...prev,
        page: page === 1 ? undefined : page,
      })}
      aria-label={label}
      aria-disabled={disabled}
      className={`btn btn-ghost btn-sm btn-square ${disabled ? "btn-disabled" : ""}`}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        onPageChange(page);
      }}
    >
      {children}
    </Link>
  );
}
