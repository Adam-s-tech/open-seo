import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavTab, NavTabs } from "@/client/components/NavTabs";
import { isHostedClientAuthMode } from "@/lib/auth-mode";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsLayout,
});

// Account-level settings, tabbed like project settings. Personal = the
// signed-in user (theme, API keys, analytics); Organization = the active org
// (team). Billing keeps its own page — it's linked from paywalls all over.
function SettingsLayout() {
  const tabs = [
    { to: "/settings" as const, label: "Personal", exact: true },
    // Self-host has no memberships — the organization tab would 404.
    ...(isHostedClientAuthMode()
      ? [{ to: "/settings/organization" as const, label: "Organization" }]
      : []),
  ];

  return (
    <div className="h-full overflow-auto bg-base-100">
      <div className="mx-auto w-full max-w-4xl space-y-8 p-4 py-8 pb-24 sm:p-6 md:py-12 md:pb-12">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <NavTabs label="Settings sections">
            {tabs.map((tab) => (
              <NavTab
                key={tab.to}
                to={tab.to}
                activeOptions={{ exact: tab.exact ?? false }}
              >
                {tab.label}
              </NavTab>
            ))}
          </NavTabs>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
