"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Role groups — which actual backend roles map to each portal
const ROLE_GROUPS: Record<string, string[]> = {
  superadmin:       ["superadmin", "super_admin", "admin"],
  enterprise:       ["enterprise"],
  contributor:      ["contributor"],
  student:          ["student", "contributor"],
  mentor:           ["mentor", "reviewer"],
  university_admin: ["admin", "university_admin"],
};

interface Props {
  expectedRole: string;
  callbackUrl: string;
}

function LoginWrapperInner({ expectedRole, callbackUrl }: Props) {
  const router = useRouter();

  useEffect(() => {
    // Inject expectedRole and callbackUrl into the shared login page URL
    const params = new URLSearchParams({
      expectedRole,
      callbackUrl,
    });
    router.replace(`/auth/login?${params.toString()}`);
  }, [expectedRole, callbackUrl, router]);

  // Show nothing while redirecting — the login page renders immediately
  return null;
}

export default function LoginPageWrapper(props: Props) {
  return (
    <Suspense>
      <LoginWrapperInner {...props} />
    </Suspense>
  );
}

export { ROLE_GROUPS };
