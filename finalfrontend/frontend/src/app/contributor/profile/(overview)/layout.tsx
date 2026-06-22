"use client";

/**
 * Profile overview layout — no in-page title; topbar shows "Profile" and the
 * workspace opens with the contributor identity hero (spec §5.K.1).
 */

export default function ContributorProfileOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-fade-in">{children}</div>;
}
