import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleDashboard } from "@/lib/config/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const role = session.user?.role || "";
  redirect(roleDashboard[role] || "/contributor/dashboard");
}
