"use client";

import { useParams } from "next/navigation";
import { GrievanceDetailView } from "./components/grievance-detail-view";

export default function ContributorGrievanceDetailPage() {
  const params = useParams<{ id: string }>();
  const grievanceId = params?.id ?? "";
  return <GrievanceDetailView grievanceId={grievanceId} />;
}
