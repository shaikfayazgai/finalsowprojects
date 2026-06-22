import { redirect } from "next/navigation";

/**
 * Alias route — assigned list and workroom link here; canonical revision
 * detail lives under /contributor/tasks/revisions/[taskId].
 */
export default async function TaskRevisionAliasPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  redirect(`/contributor/tasks/revisions/${taskId}`);
}
