import { redirect } from "next/navigation";

/** Legacy route — invite opens as a modal on the mentors list. */
export default function NewMentorPage() {
  redirect("/admin/mentors?new=1");
}
