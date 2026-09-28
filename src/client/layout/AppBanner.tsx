import type { ReactNode } from "react";

const variantClass = {
  info: "alert-info",
  warning: "alert-warning",
  error: "alert-error",
} as const;

// The full-width notice strip above the page content in the app shell.
export function AppBanner({
  variant,
  icon,
  children,
}: {
  variant: keyof typeof variantClass;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0 px-4 py-2.5 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className={`alert text-sm ${variantClass[variant]}`}>
          {icon}
          <span>{children}</span>
        </div>
      </div>
    </div>
  );
}
