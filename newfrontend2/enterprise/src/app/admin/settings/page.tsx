import { Suspense } from "react";
import { SettingsWorkspace } from "./components/settings-workspace";
import { SettingsSkeleton } from "./components/settings-skeleton";

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsWorkspace />
    </Suspense>
  );
}
