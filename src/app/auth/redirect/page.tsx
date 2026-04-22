import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user as {
    role?: string;
    isNewSsoUser?: boolean;
    provider?: string;
  };

  // New SSO user (not yet in Glimmora DB) — route by intended role
  if (user.isNewSsoUser) {
    if (user.role === "enterprise") redirect("/enterprise/dashboard");
    redirect("/contributor/onboarding");
  }

  // Existing user — route to the correct dashboard by role
  if (user.role === "contributor") redirect("/contributor/dashboard");
  if (user.role === "mentor")      redirect("/mentor/dashboard");
  if (user.role === "admin")       redirect("/admin/dashboard");

  // enterprise, reviewer, or unknown
  redirect("/enterprise/dashboard");
}
