import type { ReactNode } from "react";

/** Card with a header row and a divided body: dashboard and connection cards. */
export function CardShell({
  title,
  icon,
  stamp,
  action,
  children,
}: {
  title: string;
  icon?: ReactNode;
  stamp?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-base-300 bg-base-100 shadow-sm">
              {icon}
            </span>
          ) : null}
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
        </div>
        {action}
      </div>
      <div className="border-t border-base-300 p-5">
        {children}
        {stamp ? (
          <p className="mt-4 text-[11px] text-base-content/45">{stamp}</p>
        ) : null}
      </div>
    </div>
  );
}
