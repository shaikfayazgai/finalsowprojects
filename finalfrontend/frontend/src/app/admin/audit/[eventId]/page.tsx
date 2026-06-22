import { redirect } from "next/navigation";

/** Legacy route — event detail opens as a modal on the audit log. */
export default function AdminAuditEventPage({ params }: { params: { eventId: string } }) {
  redirect(`/admin/audit?event=${encodeURIComponent(params.eventId)}`);
}
