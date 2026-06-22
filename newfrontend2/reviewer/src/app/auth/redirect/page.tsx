import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getContributorTrackStatus } from "@/lib/contributor/profile-status";
import { resolveIncompleteOnboardingPath } from "@/lib/contributor/onboarding-routing";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user as {
    id?: string;
    role?: string;
    isNewSsoUser?: boolean;
    provider?: string;
  };

  if (user.isNewSsoUser) {
    if (user.role === "enterprise") redirect("/enterprise/onboarding");
    if (user.role === "contributor" && user.id) {
      const track = await getContributorTrackStatus(user.id);
      redirect(
        resolveIncompleteOnboardingPath({
          contribType: track?.contribType,
          isInternalEmployee: track?.onboardingTrack === "internal",
        }),
      );
    }
    redirect("/contributor/onboarding");
  }

  if (user.role === "contributor") {
    if (user.id) {
      const track = await getContributorTrackStatus(user.id);
      if (track && !track.onboardingComplete) {
        const path = resolveIncompleteOnboardingPath({
          provider: user.provider,
          isNewSsoUser: user.isNewSsoUser,
          contribType: track.contribType,
          isInternalEmployee: track.onboardingTrack === "internal",
        });
        redirect(path);
      }
      if (track && !track.portalReady) {
        redirect("/onboarding/kyc-pending");
      }
    }
    redirect("/contributor/dashboard");
  }
  if (user.role === "admin")       redirect("/admin/dashboard");
  if (user.role === "super_admin") redirect("/admin/dashboard");
  if (user.role === "reviewer")    redirect("/enterprise/reviewer");
  if (user.role === "mentor")      redirect("/mentor/dashboard");
  if (user.role === "enterprise")  redirect("/enterprise/dashboard");

  if (user.role) redirect("/auth/login?error=UnknownRole");

  redirect("/auth/login?reason=session_hydrating");
}
