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

  // Non-empty but unrecognised role → show an error on the login page.
  if (user.role) redirect("/auth/login?error=UnknownRole");

  // Role is null/undefined — JWT hydration race in production where the
  // cookie is set but the token hasn't decoded yet on the first server request.
  // Fall back to enterprise dashboard instead of bouncing the user back to login.
  redirect("/enterprise/dashboard");
}
