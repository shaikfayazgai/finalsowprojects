"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  CheckCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ModuleConfig } from "@/lib/config/navigation";
import { mockPlans, mockTeams } from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import { useNotificationStore } from "@/lib/stores/notification-store";

const segmentLabels: Record<string, string> = {
  apg: "Policies", "sow-forms": "SOW Intake Forms", "clause-library": "Clause Library",
  "review-rubrics": "Review Rubrics", sow: "SOW Repository", intake: "Create New SOW",
  upload: "Upload SOW", generate: "Generate SOW", review: "Review Draft", users: "Contributors",
};
const templateNames: Record<string, string> = {
  "tpl-001": "Healthcare Standard SOW", "tpl-002": "FinTech Compliance SOW",
  "tpl-003": "Technology Platform SOW", "tpl-004": "Retail E-Commerce SOW",
  "tpl-005": "General Purpose SOW", "tpl-006": "Government RFP SOW",
};

function getFriendlyLabel(segment: string, _prev: string[]): string | null {
  if (segmentLabels[segment]) return segmentLabels[segment];
  const plan = mockPlans.find((p) => p.id === segment);
  if (plan) return plan.title;
  const sow = mockSOWs.find((s) => s.id === segment);
  if (sow) return sow.title;
  const team = mockTeams.find((t) => t.id === segment);
  if (team) return team.name;
  if (templateNames[segment]) return templateNames[segment];
  return null;
}

/* ══════════════════════════════════════════ Notification Bell ══════════════════════════════════════════ */

function timeAgo(ts: string) {
  const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const severityColor: Record<string, string> = { high: "bg-red-500", medium: "bg-gold-500", low: "bg-gray-300" };

function NotificationBell() {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [tab, setTab] = React.useState<"all" | "high">("all");

  const unread = notifications.filter((n) => !n.read);
  const hasHigh = unread.some((n) => n.severity === "high");
  const badgeColor = hasHigh ? "bg-red-500" : "bg-gold-500";

  const filtered = tab === "high" ? notifications.filter((n) => n.severity === "high") : notifications;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-full text-gray-500 bg-white/50 border border-white/30 hover:bg-white/70 transition-all"
          aria-label={`Notifications, ${unread.length} unread`}
          suppressHydrationWarning
        >
          <Bell className="w-[14px] h-[14px]" />
          {unread.length > 0 && (
            <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full ${badgeColor} text-white text-[9px] font-bold flex items-center justify-center`}
              style={{ boxShadow: `0 0 6px ${hasHigh ? "rgba(239,68,68,0.5)" : "rgba(208,176,96,0.5)"}` }}>
              {unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl border border-gray-100" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600">
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(["all", "high"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("flex-1 py-2 text-[11px] font-medium transition-colors", tab === t ? "text-brown-600 border-b-2 border-brown-500" : "text-gray-400 hover:text-gray-600")}>
              {t === "all" ? "All" : "High Priority"}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-gray-400">No notifications.</div>
          ) : (
            filtered.slice(0, 20).map((n) => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={cn("w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02]", !n.read && "bg-brown-50/40")}
                style={{ borderBottom: "1px solid var(--border-hair)" }}>
                <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", severityColor[n.severity])} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[12px] font-medium truncate", n.read ? "text-gray-500" : "text-gray-800")}>{n.title}</div>
                  <div className="text-[11px] text-gray-400 truncate mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-gray-300 mt-1">{timeAgo(n.timestamp)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TopBarProps { config: ModuleConfig; }

export function TopBar({ config }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { openMobile } = useSidebarStore();
  const [searchFocused, setSearchFocused] = React.useState(false);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitials = (session?.user as any)?.initials || userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const breadcrumbs = React.useMemo(() => {
    const allSegments = pathname.split("/").filter(Boolean);
    const moduleRoots = ["enterprise", "contributor", "mentor", "analytics"];
    const moduleRoot = allSegments.find((seg) => moduleRoots.includes(seg)) || allSegments[0];
    const hiddenPrefixes = moduleRoots;
    const crumbs = allSegments
      .map((seg, i) => ({
        seg,
        label: getFriendlyLabel(seg, allSegments.slice(0, i)) ??
          seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: "/" + allSegments.slice(0, i + 1).join("/"),
        hidden: hiddenPrefixes.includes(seg),
      }))
      .filter((crumb) => !crumb.hidden);
    const dashboardHref = "/" + moduleRoot + "/dashboard";
    const isOnDashboard = crumbs.length === 1 && crumbs[0].seg === "dashboard";
    if (!isOnDashboard) crumbs.unshift({ seg: "dashboard", label: "Dashboard", href: dashboardHref, hidden: false });
    return crumbs.map((c, i) => ({ ...c, isLast: i === crumbs.length - 1 }));
  }, [pathname]);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        height: 52,
      }}
    >
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center gap-3">
          <button onClick={openMobile} className="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-400 hover:bg-white/50 transition-all">
            <Menu className="w-5 h-5" />
          </button>

          <nav className="hidden sm:flex items-center gap-1.5 text-[13px]">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                {i > 0 && <span className="text-gray-300 text-[11px]">/</span>}
                {crumb.isLast ? (
                  <span className="font-medium text-gray-800">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 transition-colors">{crumb.label}</Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <span className="sm:hidden text-[14px] font-medium text-gray-800">{pageTitle}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div
            className={cn(
              "relative hidden md:flex items-center gap-2 rounded-full transition-all duration-300",
              searchFocused ? "w-60" : "w-52"
            )}
            style={{
              background: searchFocused ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)",
              border: searchFocused ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(0,0,0,0.06)",
              padding: "6px 14px",
              boxShadow: searchFocused ? "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)" : "inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            <Search className="w-[13px] h-[13px] shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Search everything…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="border-none outline-none bg-transparent w-full text-[13px] text-gray-700 placeholder:text-gray-400"
            />
            {!searchFocused && (
              <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] text-gray-400 bg-black/[0.04] border border-black/[0.06] px-1.5 py-px rounded">⌘K</kbd>
            )}
          </div>

          {/* Notification Bell (FSD 6.7) */}
          <NotificationBell />

          {/* Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button suppressHydrationWarning className="rounded-full focus:outline-none focus:ring-2 focus:ring-gold-200/40 focus:ring-offset-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white text-xs font-semibold transition-shadow"
                  style={{
                    background: "linear-gradient(135deg, #A67763, #D0B060)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  {userInitials}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-84">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #5B9BA2, #4D5741)" }}>{userInitials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{userName}</p>
                    <p className="text-xs text-gray-400">{userEmail}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(config.basePath + "/profile")}><User className="w-4 h-4" /> <span>Profile</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(config.basePath + "/settings")}><Settings className="w-4 h-4" /> <span>Settings</span></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--danger)] focus:text-[var(--danger-hover)] focus:bg-[var(--danger-light)]"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
              >
                <LogOut className="w-4 h-4" /> <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
