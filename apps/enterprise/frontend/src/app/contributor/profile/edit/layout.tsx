"use client";

/**
 * Edit profile layout — editorial header (wayfinding via shell topbar).
 */

export default function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-stroke-subtle pb-5">
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Edit profile
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-secondary max-w-2xl">
          Update how you appear on the platform. Your display name and bio are visible to mentors
          and reviewers on assigned work.
        </p>
      </header>

      {children}
    </div>
  );
}
