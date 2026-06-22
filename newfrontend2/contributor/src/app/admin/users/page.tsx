import { redirect } from "next/navigation";

/** Legacy route — identity invites live on domain pages (Tenants, Mentors, Partnerships). */
export default function AdminUsersRedirectPage() {
  redirect("/admin/tenants");
}
