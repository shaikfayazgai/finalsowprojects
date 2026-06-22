"use client";

import * as React from "react";
import { AdminDashboardWorkspace } from "./components/dashboard-workspace";
import { AdminDashboardSkeleton } from "./components/admin-dashboard-skeleton";

export default function AdminDashboardPage() {
  return (
    <React.Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardWorkspace />
    </React.Suspense>
  );
}
