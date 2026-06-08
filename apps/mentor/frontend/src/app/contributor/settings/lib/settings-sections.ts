import {
  Bell,
  Languages,
  Monitor,
  Plug,
  Shield,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SettingsSectionId =
  | "account"
  | "notifications"
  | "privacy"
  | "language"
  | "connected"
  | "sessions"
  | "mentorship";

export interface SettingsSection {
  id: SettingsSectionId;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const CONTRIBUTOR_SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "account",
    href: "/contributor/settings/account",
    label: "Account",
    description: "Email, password, and two-factor authentication",
    icon: User,
  },
  {
    id: "notifications",
    href: "/contributor/settings/notifications",
    label: "Notifications",
    description: "Channel preferences for tasks, payouts, and alerts",
    icon: Bell,
  },
  {
    id: "privacy",
    href: "/contributor/settings/privacy",
    label: "Privacy & consent",
    description: "Consents, data export, and account deletion",
    icon: Shield,
  },
  {
    id: "mentorship",
    href: "/contributor/settings/mentorship",
    label: "Mentorship",
    description: "Opt in to peer mentorship matching",
    icon: Users,
  },
  {
    id: "language",
    href: "/contributor/settings/language",
    label: "Language & region",
    description: "Language, date, time, and currency display",
    icon: Languages,
  },
  {
    id: "connected",
    href: "/contributor/settings/connected",
    label: "Connected accounts",
    description: "Google, GitHub, and LinkedIn sign-in",
    icon: Plug,
  },
  {
    id: "sessions",
    href: "/contributor/settings/sessions",
    label: "Sessions",
    description: "Devices currently signed in to your account",
    icon: Monitor,
  },
];

export function pathnameToSettingsSection(pathname: string): SettingsSectionId | null {
  if (pathname === "/contributor/settings") return null;
  const match = CONTRIBUTOR_SETTINGS_SECTIONS.find(
    (s) => pathname === s.href || pathname.startsWith(`${s.href}/`),
  );
  return match?.id ?? null;
}

export function sectionMeta(id: SettingsSectionId): SettingsSection {
  const section = CONTRIBUTOR_SETTINGS_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`Unknown settings section: ${id}`);
  return section;
}
