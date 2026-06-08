"use client";

import * as React from "react";

/**
 * Profile layout — header-only (page renders its own breadcrumb + header).
 */
export default function EnterpriseProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fade-in">{children}</div>;
}
