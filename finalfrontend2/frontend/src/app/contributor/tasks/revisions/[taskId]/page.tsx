"use client";

import { useParams } from "next/navigation";
import { RevisionDetailView } from "../components/revision-detail-view";

export default function ContributorRevisionDetailPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params?.taskId ?? "";
  return <RevisionDetailView taskId={taskId} />;
}
