import { useQuery } from "@tanstack/react-query";
import { BackLink, PageHeader } from "@/client/components/PageHeader";
import { projectsQueryOptions } from "./projectQueries";

export function ProjectPageHeader({
  projectId,
  title,
  showBackLink = false,
}: {
  projectId: string;
  title: string;
  showBackLink?: boolean;
}) {
  const projectsQuery = useQuery(projectsQueryOptions());
  const project = projectsQuery.data?.find((entry) => entry.id === projectId);

  return (
    <div className="space-y-4">
      {showBackLink ? <BackLink to="/projects">Projects</BackLink> : null}
      <PageHeader title={title} description={project?.name ?? " "} />
    </div>
  );
}
