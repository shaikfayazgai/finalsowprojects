import type { ReactNode } from "react";

// The login screen renders its own full-screen branded shell, so this group
// layout is a pass-through.
export default function MentorAuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
