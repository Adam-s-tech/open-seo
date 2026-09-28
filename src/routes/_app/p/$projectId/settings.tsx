import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavTab, NavTabs } from "@/client/components/NavTabs";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { useQuery } from "@tanstack/react-query";
import { BackLink, PageHeader } from "@/client/components/PageHeader";

export const Route = createFileRoute("/_app/p/$projectId/settings")({
  component: ProjectSettingsLayout,
});

const tabs = [
  { to: "/p/$projectId/settings" as const, label: "General", exact: true },
  { to: "/p/$projectId/settings/integrations" as const, label: "Integrations" },
];

function ProjectSettingsLayout() {
  const { projectId } = Route.useParams();
  const projectsQuery = useQuery(projectsQueryOptions());
  const project = projectsQuery.data?.find((entry) => entry.id === projectId);

  return (
    <div className="h-full overflow-auto bg-base-100">
      <div className="mx-auto w-full max-w-2xl space-y-8 p-4 py-8 pb-24 sm:p-6 md:py-12 md:pb-12">
        <div className="space-y-4">
          <BackLink to="/projects">Projects</BackLink>
          <PageHeader
            title="Project settings"
            description={project?.name ?? " "}
          />
          <NavTabs label="Project settings sections">
            {tabs.map((tab) => (
              <NavTab
                key={tab.to}
                to={tab.to}
                params={{ projectId }}
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
