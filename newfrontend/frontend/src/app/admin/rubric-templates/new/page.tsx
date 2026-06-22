import { redirect } from "next/navigation";

/** Legacy route — create opens as a modal on the rubric templates list. */
export default function AdminNewRubricTemplatePage() {
  redirect("/admin/rubric-templates?new=1");
}
