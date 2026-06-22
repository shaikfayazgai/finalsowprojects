import { Suspense } from "react";
import { NotificationsWorkspace } from "./components/notifications-workspace";
import { NotificationsSkeleton } from "./components/notifications-skeleton";

export default function ContributorNotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsWorkspace />
    </Suspense>
  );
}
