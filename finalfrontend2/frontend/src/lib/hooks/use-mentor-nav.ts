"use client";

import * as React from "react";
import { Bell, Settings, UserRound } from "lucide-react";
import { mentorNav, type ModuleConfig } from "@/lib/config/navigation";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";

/**
 * Mentor sidebar config — hides Escalations for base mentors; adds Account section.
 */
export function useMentorNavConfig(): ModuleConfig {
  const { isSeniorOrLead } = useActiveMentor();

  return React.useMemo(() => {
    const sections = mentorNav.sections.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.href !== "/mentor/escalation" || isSeniorOrLead,
      ),
    }));

    sections.push({
      title: "Account",
      items: [
        { label: "Profile", href: "/mentor/profile", icon: UserRound },
        { label: "Settings", href: "/mentor/settings", icon: Settings },
        { label: "Notifications", href: "/mentor/notifications", icon: Bell },
      ],
    });

    return { ...mentorNav, sections };
  }, [isSeniorOrLead]);
}
