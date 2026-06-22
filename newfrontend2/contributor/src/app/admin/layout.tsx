import { Suspense } from "react";
import { AdminClientLayout } from "./admin-client-layout";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminClientLayout>
      <Suspense fallback={null}>{children}</Suspense>
    </AdminClientLayout>
  );
}
