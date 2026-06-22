import { Suspense } from "react";
import { NotificationsWorkspace } from "./_components/notifications-workspace";
import { NotificationsSkeleton } from "@/components/enterprise/page-skeletons";

export default function EnterpriseNotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsWorkspace />
    </Suspense>
  );
}
