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
  if (user.role === "admin")       redirect("/admin/dashboard");
  if (user.role === "reviewer")    redirect("/enterprise/reviewer");
  if (user.role === "enterprise")  redirect("/enterprise/dashboard");

  // Role missing from the session (race between sign-in and JWT hydration in
  // production) — land on the enterprise dashboard instead of bouncing back
  // to /auth/login, which would re-auth and loop.
  redirect("/enterprise/dashboard");
}
