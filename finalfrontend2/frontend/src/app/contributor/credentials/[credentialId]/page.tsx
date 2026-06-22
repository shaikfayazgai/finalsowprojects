"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CredentialDetailView } from "./components/credential-detail-view";
import { CredentialDetailSkeleton } from "./components/detail-skeleton";

function CredentialDetailPageInner() {
  const params = useParams<{ credentialId: string }>();
  const credentialId = params?.credentialId ?? "";
  return <CredentialDetailView credentialId={credentialId} />;
}

export default function ContributorCredentialDetailPage() {
  return (
    <Suspense fallback={<CredentialDetailSkeleton />}>
      <CredentialDetailPageInner />
    </Suspense>
  );
}
