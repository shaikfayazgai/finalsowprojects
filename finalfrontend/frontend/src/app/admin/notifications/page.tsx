import { Suspense } from "react";
import { NotificationsWorkspace } from "./components/notifications-workspace";
import { NotificationsSkeleton } from "./components/notifications-skeleton";

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsWorkspace />
    </Suspense>
  );
}
