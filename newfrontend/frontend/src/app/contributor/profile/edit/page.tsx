"use client";

/**
 * "Edit profile" now opens the full 10-step profile wizard in edit/update mode
 * (existing values pre-loaded). This route redirects to that wizard so every
 * existing "Edit profile" link keeps working without changes.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace("/contributor/profile/complete");
  }, [router]);
  return (
    <div className="flex items-center gap-2 py-16 justify-center font-body text-[12.5px] text-text-tertiary">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      Opening profile editor…
    </div>
  );
}
