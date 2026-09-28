import { createFileRoute } from "@tanstack/react-router";
import { projectsQueryOptions } from "@/client/features/projects/projectQueries";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/client/components/PageHeader";
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
        <PageHeader title="Context" description={project?.name ?? " "} />

        <ProjectContextPage projectId={projectId} />
      </div>
    </div>
  );
}
