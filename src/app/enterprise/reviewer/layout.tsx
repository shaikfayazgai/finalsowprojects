"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/api/auth";

export default function ReviewerSectionLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname || "/enterprise/reviewer")}`);
      return;
    }
    if (status !== "authenticated") return;

    const role = (session?.user as { role?: string })?.role;
    if (role && role !== "reviewer") {
      router.replace("/enterprise/dashboard");
      return;
    }

    const token = (session?.user as { accessToken?: string })?.accessToken;
    if (!token) {
      setChecking(false);
      return;
    }

    if (checkedRef.current) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.getCurrentUser(token);
        if (cancelled) return;
        if (me.requiresPasswordChange) {
          router.replace(`/auth/change-password?callbackUrl=${encodeURIComponent(pathname || "/enterprise/reviewer")}`);
          return;
        }
      } catch {
        // If /me fails, still render children — reviewer APIs will surface errors
      } finally {
        if (!cancelled) {
          checkedRef.current = true;
          setChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, router, pathname]);

  if (status === "loading" || checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading reviewer workspace…
      </div>
    );
  }

  return <>{children}</>;
}
