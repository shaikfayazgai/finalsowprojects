"use client";

/**
 * Mentor settings index — spec doc 03 §5.H.3.
 * Sections: Notifications, Availability, Account, Privacy.
 */

import { Bell, Clock, Shield, User } from "lucide-react";
import {
  MentorPage,
  MentorPageHeader,
  MentorSettingsIndex,
} from "@/app/mentor/_components/mentor-ui";

const ROWS = [
  { href: "/mentor/settings/notifications", icon: Bell, title: "Notifications", detail: "Channel preferences for reviews, SLA, and mentorship" },
  { href: "/mentor/settings/availability", icon: Clock, title: "Availability", detail: "Working hours, capacity, and out-of-office" },
  { href: "/mentor/settings/account", icon: User, title: "Account", detail: "Password and sign-in security" },
  { href: "/mentor/settings/privacy", icon: Shield, title: "Privacy", detail: "Program consents and data requests" },
];

export default function MentorSettingsPage() {
  return (
    <MentorPage>
      <MentorPageHeader
        title="Settings"
        subtitle="Mentor-specific controls for notifications, availability, and account security."
      />
      <MentorSettingsIndex rows={ROWS} />
      <p className="font-body text-[11.5px] text-text-tertiary italic">
        Password changes apply to your Glimmora sign-in across all workspaces.
      </p>
    </MentorPage>
  );
}
