import { redirect } from "next/navigation";

/** Legacy alias — reviewer dashboard lives at /enterprise/reviewer. */
export default function ReviewerDashboardRedirectPage() {
  redirect("/enterprise/reviewer");
}
