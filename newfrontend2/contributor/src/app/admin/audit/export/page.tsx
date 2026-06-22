import { redirect } from "next/navigation";

/** Legacy route — export opens as a modal on the audit log. */
export default function AdminAuditExportPage() {
  redirect("/admin/audit?export=1");
}
