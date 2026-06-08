import { SettingsShell } from "./_components/settings-shell";

export default function ContributorSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsShell>{children}</SettingsShell>;
}
