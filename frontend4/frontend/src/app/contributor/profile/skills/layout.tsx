"use client";

/**
 * Skills registry layout — list pages get editorial header;
 * detail routes render their own header (wayfinding via shell topbar).
 */

import { usePathname } from "next/navigation";

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDetail = /\/contributor\/profile\/skills\/[^/]+$/.test(pathname);

  if (isDetail) {
    return <div className="animate-fade-in">{children}</div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Skill registry
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Declared skills and self-rated levels. Attach evidence per skill so reviewers can confirm
          your claims on assigned work.
        </p>
      </header>

      {children}
    </div>
  );
}
