"use client";

import * as React from "react";
import { EmailTemplatesWorkspace } from "./components/email-templates-workspace";
import { EmailTemplatesSkeleton } from "./components/email-templates-skeleton";

export default function AdminEmailTemplatesPage() {
  return (
    <React.Suspense fallback={<EmailTemplatesSkeleton />}>
      <EmailTemplatesWorkspace />
    </React.Suspense>
  );
}
