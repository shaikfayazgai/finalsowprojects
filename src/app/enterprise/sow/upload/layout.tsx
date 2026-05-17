import * as React from "react";

// Pass-through layout. The Manual SOW navigation guard lives in each upload
// step's page via <SOWUploadGuard /> — mirroring the AI wizard's per-page
// pattern, which works reliably given Next.js App Router's effect timing.
export default function UploadFlowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
