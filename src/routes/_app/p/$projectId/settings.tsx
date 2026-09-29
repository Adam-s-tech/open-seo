import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProjectPageHeader } from "@/client/features/projects/ProjectPageHeader";
import { SettingsTabs } from "@/client/features/projects/SettingsTabs";

export const Route = createFileRoute("/_app/p/$projectId/settings")({
  component: ProjectSettingsLayout,
});

function ProjectSettingsLayout() {
  const { projectId } = Route.useParams();

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto w-full max-w-2xl space-y-8 p-4 py-8 pb-24 sm:p-6 md:py-12 md:pb-12">
        <div className="space-y-4">
          <ProjectPageHeader
            projectId={projectId}
            title="Project settings"
            showBackLink
          />
          <SettingsTabs projectId={projectId} />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
