"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CompletedDetailView } from "../components/completed-detail-view";

export default function ContributorCompletedDetailPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params?.taskId ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const showCredentialModal = searchParams.get("showCredential") === "1";

  const closeCredentialModal = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("showCredential");
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  return (
    <CompletedDetailView
      taskId={taskId}
      showCredentialModal={showCredentialModal}
      onCloseCredentialModal={closeCredentialModal}
    />
  );
}
