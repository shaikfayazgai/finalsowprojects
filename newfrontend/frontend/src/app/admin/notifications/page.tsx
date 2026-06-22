import { RealNotificationsWorkspace } from "./components/real-notifications";

export const dynamic = "force-dynamic";

// Wired to the REAL notifications feed (was a mock). The old NotificationsWorkspace
// mock is kept in ./components for reference but no longer rendered.
export default function AdminNotificationsPage() {
  return <RealNotificationsWorkspace />;
}
