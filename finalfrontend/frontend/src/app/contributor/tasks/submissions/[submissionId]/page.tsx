"use client";

import { useParams } from "next/navigation";
import { SubmissionDetailView } from "../components/submission-detail-view";

export default function ContributorSubmissionDetailPage() {
  const params = useParams<{ submissionId: string }>();
  const submissionId = params?.submissionId ?? "";
  return <SubmissionDetailView submissionId={submissionId} />;
}
