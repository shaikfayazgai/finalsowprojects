"use client";

/**
 * Meridian — AccountMenu
 *
 * Topbar avatar pill + account dropdown. Personal / account surfaces live
 * here — not in the operational sidebar:
 *
 *   - Profile
 *   - Notifications
 *   - Settings
 *   - Theme
 *   - Sign out
 */

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/design-system";
import { useMyNotifications } from "@/lib/hooks/use-notifications";

interface Operator {
  name: string;
  initials: string;
  email?: string;
}

interface AccountMenuProps {
  operator: Operator;
  /**
   * When true, render only the avatar circle (no first name, no
   * chevron). Click still opens the dropdown menu.
   */
  compact?: boolean;
  profileHref?: string;
  settingsHref?: string;
  /** When false, Settings is hidden (user has no workspace settings access). */
  showSettings?: boolean;
  /** When set, Notifications appears in the menu (replaces a separate bell). */
  notificationsHref?: string;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  operator,
  compact,
  profileHref = "/enterprise/profile",
  settingsHref = "/enterprise/settings",
  showSettings = true,
  notificationsHref,
}) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();

  const { data: notificationData } = useMyNotifications({
    limit: 1,
    refetchInterval: 60_000,
    enabled: Boolean(notificationsHref),
  });
  const unreadCount = notificationData?.unreadCount ?? 0;

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const firstName = operator.name.split(" ")[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Account menu — ${operator.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={operator.email ?? operator.name}
        className={cn(
          compact
            ? cn(
                "relative shrink-0 grid place-items-center h-8 w-8 rounded-full",
                "bg-surface-inverse text-text-inverse",
                "font-body text-[11px] font-bold leading-none tracking-[-0.01em]",
                "transition-transform duration-fast ease-standard hover:scale-105",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              )
            : cn(
                "group flex items-center gap-2 pl-1 pr-1.5 h-8 rounded-md",
                "hover:bg-surface-hover",
                "transition-colors duration-fast ease-standard",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                open && "bg-surface-hover",
              ),
        )}
      >
        {compact ? (
          <>
            {operator.initials}
            {notificationsHref && unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[var(--color-error-solid)] ring-2 ring-surface"
              />
            )}
          </>
        ) : (
          <>
            <span
              aria-hidden
              className={cn(
                "relative shrink-0 grid place-items-center h-6 w-6 rounded-md",
                "bg-surface-inverse text-text-inverse",
                "font-body text-[10.5px] font-bold leading-none tracking-[-0.01em]",
              )}
            >
              {operator.initials}
              {notificationsHref && unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-error-solid)] ring-2 ring-surface"
                />
              )}
            </span>
            <span className="hidden md:inline font-body text-[12.5px] font-medium text-text-secondary max-w-[120px] truncate group-hover:text-foreground">
              {firstName}
            </span>
            <ChevronDown
              className={cn(
                "hidden md:block h-3 w-3 text-text-tertiary transition-transform duration-fast",
                open && "rotate-180",
              )}
              strokeWidth={2}
              aria-hidden
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className={cn(
            "absolute right-0 top-full mt-1 w-60 z-dropdown",
            "rounded-lg bg-surface border border-stroke-subtle",
            "shadow-[var(--shadow-dropdown)]",
            "py-1.5",
            "animate-fade-in",
          )}
          style={{ animationDuration: "120ms" }}
        >
          <div className="px-3 py-2 border-b border-stroke-subtle">
            <p className="font-body text-[12.5px] font-semibold text-foreground truncate">
              {operator.name}
            </p>
            {operator.email && (
              <p className="font-body text-[11px] text-text-tertiary truncate mt-0.5">
                {operator.email}
              </p>
            )}
          </div>

          <div className="py-1">
            <MenuItem
              href={profileHref}
              icon={UserCircle2}
              label="Profile"
              onClick={() => setOpen(false)}
            />
            {notificationsHref && (
              <MenuItem
                href={notificationsHref}
                icon={Bell}
                label="Notifications"
                badge={unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined}
                onClick={() => setOpen(false)}
              />
            )}
            {showSettings && (
              <MenuItem
                href={settingsHref}
                icon={Settings}
                label="Settings"
                onClick={() => setOpen(false)}
              />
            )}
            <MenuButton
              icon={theme === "light" ? Moon : Sun}
              label={theme === "light" ? "Switch to Night" : "Switch to Day"}
              onClick={() => {
                toggleTheme();
                setOpen(false);
              }}
            />
          </div>

          <div className="border-t border-stroke-subtle py-1">
            <MenuButton
              icon={LogOut}
              label="Sign out"
              destructive
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface MenuRowProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  label: string;
  badge?: string;
  destructive?: boolean;
}

function rowClasses(destructive?: boolean) {
  return cn(
    "flex items-center w-full gap-2 px-3 h-8 rounded-md",
    "font-body text-[12.5px]",
    "transition-colors duration-fast ease-standard",
    "focus-visible:outline-none focus-visible:bg-surface-hover",
    destructive
      ? "text-[var(--color-error-text)] hover:bg-[var(--color-error-subtle)]"
      : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
  );
}

const MenuItem: React.FC<
  MenuRowProps & { href: string; onClick?: () => void }
> = ({ icon: Icon, label, href, onClick, destructive, badge }) => (
  <Link
    href={href}
    role="menuitem"
    onClick={onClick}
    className={cn("mx-1.5", rowClasses(destructive))}
  >
    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
    <span className="truncate flex-1">{label}</span>
    {badge && (
      <span
        aria-hidden
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-error-solid)] text-white font-body text-[9px] font-bold tabular-nums"
      >
        {badge}
      </span>
    )}
  </Link>
);

const MenuButton: React.FC<MenuRowProps & { onClick: () => void }> = ({
  icon: Icon,
  label,
  onClick,
  destructive,
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={cn("mx-1.5 text-left", rowClasses(destructive))}
  >
    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
    <span className="truncate">{label}</span>
  </button>
);
