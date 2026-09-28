import { createFileRoute } from "@tanstack/react-router";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { useQuery } from "@tanstack/react-query";
import { ProjectContextPage } from "@/client/features/projects/project-context/ProjectContextPage";

export const Route = createFileRoute("/_app/p/$projectId/context")({
  component: ProjectContextRoute,
});

function ProjectContextRoute() {
  const { projectId } = Route.useParams();
  const projectsQuery = useQuery(projectsQueryOptions());
  const project = projectsQuery.data?.find((entry) => entry.id === projectId);

  return (
    <div className="h-full overflow-auto bg-base-100">
      <div className="mx-auto w-full max-w-2xl space-y-8 p-4 py-8 pb-24 sm:p-6 md:py-12 md:pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Context</h1>
          <p className="text-sm text-base-content/60">{project?.name ?? " "}</p>
        </div>

        <ProjectContextPage projectId={projectId} />
      </div>
    </div>
  );
}
