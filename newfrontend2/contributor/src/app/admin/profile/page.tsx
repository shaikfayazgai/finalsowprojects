"use client";

import { Suspense } from "react";
import { ProfileWorkspace } from "./components/profile-workspace";
import { ProfileSkeleton } from "./components/profile-skeleton";

export default function AdminProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileWorkspace />
    </Suspense>
  );
}
