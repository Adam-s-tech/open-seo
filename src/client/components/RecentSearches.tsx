import type { ComponentType, ReactNode } from "react";
import { ArrowLeft, Clock, History, X } from "lucide-react";

// Props for the caller's clickable element. Spread them onto a <Link> so
// cmd+click and "open in new tab" work, or onto a <button> for in-page state.
type ClickableProps = { className: string; children: ReactNode };

type Props<TItem extends { timestamp: number }> = {
  items: TItem[];
  loaded: boolean;
  onRemove: (timestamp: number) => void;
  renderLink: (item: TItem, props: ClickableProps) => ReactNode;
  getTitle: (item: TItem) => ReactNode;
  getSubtitle: (item: TItem) => ReactNode;
  emptyIcon: ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyDescription?: string;
};

export function RecentSearches<TItem extends { timestamp: number }>({
  items,
  loaded,
  onRemove,
  renderLink,
  getTitle,
  getSubtitle,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
}: Props<TItem>) {
  if (!loaded) {
    return null;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-base-300 bg-base-100/70 p-6 text-center text-base-content/55 space-y-2">
        <EmptyIcon className="size-9 mx-auto opacity-35" />
        <p className="text-base font-medium text-base-content/80">
          {emptyTitle}
        </p>
        {emptyDescription ? (
          <p className="text-sm max-w-md mx-auto">{emptyDescription}</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="size-4 text-base-content/45" />
        <span className="text-sm text-base-content/60">
          {items.length} recent search{items.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.timestamp}
            className="group flex min-w-0 items-center gap-2 rounded-lg border border-base-300 bg-base-100 p-2"
          >
            {renderLink(item, {
              className:
                "flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-base-200",
              children: (
                <>
                  <Clock className="size-4 text-base-content/40 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-base-content truncate">
                      {getTitle(item)}
                    </p>
                    {getSubtitle(item) ? (
                      <p className="text-sm text-base-content/60 truncate">
                        {getSubtitle(item)}
                      </p>
                    ) : null}
                  </div>
                </>
              ),
            })}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-base-content/40">
                {new Date(item.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs p-1 reveal-on-hover"
                onClick={() => onRemove(item.timestamp)}
                aria-label="Remove from recent searches"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// The "Recent searches" link that returns a research page to its list.
export function RecentSearchesBackLink({
  render,
}: {
  render: (props: ClickableProps) => ReactNode;
}) {
  return (
    <div>
      {render({
        className:
          "btn btn-ghost btn-sm gap-2 px-0 text-base-content/70 hover:bg-transparent",
        children: (
          <>
            <ArrowLeft className="size-4" />
            Recent searches
          </>
        ),
      })}
    </div>
  );
}
