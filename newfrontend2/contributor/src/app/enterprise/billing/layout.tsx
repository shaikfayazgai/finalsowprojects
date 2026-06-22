"use client";

/**
 * Billing layout — header rail only.
 *
 * Spec doc 02 §5.G doesn't use a tab bar; sub-sections are reached via
 * the sidebar (Billing / Rate Cards / Payouts) and via action buttons
 * on the overview page itself.
 */

import * as React from "react";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fade-in">{children}</div>;
}
