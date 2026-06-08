import { SettingsShell } from "./_components/settings-shell";

export default function EnterpriseSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsShell>{children}</SettingsShell>;
}
