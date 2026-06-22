"use client";

import * as React from "react";
import {
  adminMentorOverlays,
  getAdminMentor,
  getMentorCompetency,
  listAdminMentors,
} from "@/lib/admin/mocks/mentors-service";

/** Re-render when any admin mentor/pool overlay mutates. */
export function useAdminMentorsVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const unsubs = Object.values(adminMentorOverlays).map((store) =>
      store.subscribe(() => setV((n) => n + 1)),
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  return v;
}

export function useAdminMentorsList() {
  const v = useAdminMentorsVersion();
  return React.useMemo(() => listAdminMentors(), [v]);
}

export function useAdminMentor(mentorId: string | undefined) {
  const v = useAdminMentorsVersion();
  return React.useMemo(
    () => (mentorId ? getAdminMentor(mentorId) : undefined),
    [mentorId, v],
  );
}

export function useMentorCompetency(mentorId: string | undefined) {
  const v = useAdminMentorsVersion();
  return React.useMemo(
    () => (mentorId ? getMentorCompetency(mentorId) : []),
    [mentorId, v],
  );
}
