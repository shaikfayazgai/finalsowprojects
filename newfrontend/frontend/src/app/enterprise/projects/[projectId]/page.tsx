import { redirect } from "next/navigation";

/**
 * Delivery projects are real decomposition plans now. Any /enterprise/projects/{id}
 * link (project.id == plan.id) redirects to the real plan detail, where milestones,
 * tasks, and per-task contributor assignment live on live backend data.
 */
export default async function ProjectDetailRedirect({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/enterprise/decomposition/${projectId}`);
}
