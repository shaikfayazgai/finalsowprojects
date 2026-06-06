import { Suspense } from "react";
import { PortalSetupPasswordScreen } from "@/components/auth/PortalSetupPassword";

export default function SetupPasswordPage() {
  return <Suspense><PortalSetupPasswordScreen portal="mentor" /></Suspense>;
}
