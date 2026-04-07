import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = (session.user as { role?: string }).role;

  if (role === "contributor") redirect("/contributor/dashboard");
  if (role === "mentor") redirect("/mentor/dashboard");

  // enterprise, admin, reviewer, or unknown
  redirect("/enterprise/dashboard");
}
