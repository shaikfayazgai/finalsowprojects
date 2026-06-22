"use client";

import { useParams } from "next/navigation";
import { SafetyCaseDetailView } from "./components/safety-case-detail-view";

export default function ContributorSafetyCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const caseId = params?.id ?? "";
  return <SafetyCaseDetailView caseId={caseId} />;
}
