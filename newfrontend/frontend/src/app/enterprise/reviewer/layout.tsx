"use client";

/**
 * QA Review portal layout — editorial header for reviewer routes.
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

function subtitleForPath(pathname: string, firstName: string): string {
  if (pathname.includes("/queue")) {
    return "All mentor-approved submissions awaiting your quality sign-off.";
  }
  return `Mentor-approved submissions awaiting your quality sign-off — ${firstName}'s queue.`;
}

/** Portal chrome only on top-level QA Review list surfaces — sub-routes own their headers. */
function shouldShowPortalHeader(pathname: string): boolean {
  if (pathname.includes("/profile") || pathname.includes("/notifications")) {
    return false;
  }
  const normalized = pathname.replace(/\/$/, "") || "/";
  return (
    normalized === "/enterprise/reviewer" ||
    normalized === "/enterprise/reviewer/queue"
  );
}

export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "your";

  if (!shouldShowPortalHeader(pathname)) {
    return <div className="animate-fade-in">{children}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Enterprise · QA Review
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          QA Review
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
          {subtitleForPath(pathname, firstName)}
        </p>
      </header>
      {children}
    </div>
  );
}
