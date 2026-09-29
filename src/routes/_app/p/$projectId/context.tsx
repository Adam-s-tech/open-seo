import { createFileRoute } from "@tanstack/react-router";
import { ProjectPageHeader } from "@/client/features/projects/ProjectPageHeader";
import { ProjectContextPage } from "@/client/features/projects/project-context/ProjectContextPage";

export const Route = createFileRoute("/_app/p/$projectId/context")({
  component: ProjectContextRoute,
});

function ProjectContextRoute() {
  const { projectId } = Route.useParams();
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto w-full max-w-2xl space-y-8 p-4 py-8 pb-24 sm:p-6 md:py-12 md:pb-12">
        <ProjectPageHeader projectId={projectId} title="Context" />

        <ProjectContextPage projectId={projectId} />
      </div>
    </div>
  );
}
