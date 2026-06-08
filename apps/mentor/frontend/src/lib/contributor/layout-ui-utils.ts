import { cn } from "@/lib/utils/cn";

/**
 * Shared two-column page layout for contributor profile / support / tasks.
 * Right rail sticks below the shell topbar (52px) with breathing room.
 */
export const SHELL_TOPBAR_HEIGHT = "52px";

export const twoColumnGridClassName =
  "grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start";

export const twoColumnGridWideClassName =
  "grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start";

/** Sticky right rail — offset clears EnterpriseTopbar (z-50, h-[52px]). */
export const stickyRailClassName = cn(
  "xl:sticky xl:self-start",
  "xl:top-[calc(var(--shell-topbar-height,52px)+1rem)]",
  "xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)]",
  "xl:overflow-y-auto xl:overscroll-y-contain",
);

export const stickyRailWideTopClassName = cn(
  stickyRailClassName,
  "xl:top-[calc(var(--shell-topbar-height,52px)+1.5rem)]",
);
