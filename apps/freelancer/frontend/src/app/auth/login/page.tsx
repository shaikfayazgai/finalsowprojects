import { redirect } from "next/navigation";

/**
 * The generic /auth/login is removed — sign-in now happens via per-portal login
 * pages (/admin/login, /enterprise/login, /contributor/login, /mentor/login,
 * /reviewer/login). Send anyone hitting the old URL to the home page, which
 * routes them to the right portal.
 */
export default function LoginPage() {
  redirect("/");
}
