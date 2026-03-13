"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
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
} from "@/components/ui";
import type { ModuleConfig } from "@/lib/config/navigation";
import { mockPlans, mockTeams } from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

/* ── Static friendly labels for URL segments ── */
const segmentLabels: Record<string, string> = {
  apg: "Policies",
  "sow-forms": "SOW Intake Forms",
  "clause-library": "Clause Library",
  "review-rubrics": "Review Rubrics",
  sow: "SOW",
  users: "Contributors",
};

/* ── Template ID → name lookup ── */
const templateNames: Record<string, string> = {
  "tpl-001": "Healthcare Standard SOW",
  "tpl-002": "FinTech Compliance SOW",
  "tpl-003": "Technology Platform SOW",
  "tpl-004": "Retail E-Commerce SOW",
  "tpl-005": "General Purpose SOW",
  "tpl-006": "Government RFP SOW",
};

/* ── Friendly name lookup for dynamic route segments ── */
function getFriendlyLabel(segment: string, _prevSegments: string[]): string | null {
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

interface TopBarProps {
  config: ModuleConfig;
}

export function TopBar({ config }: TopBarProps) {
  const pathname = usePathname();
  const { openMobile } = useSidebarStore();
  const [searchFocused, setSearchFocused] = React.useState(false);

  const breadcrumbs = React.useMemo(() => {
    const allSegments = pathname.split("/").filter(Boolean);
    const hiddenPrefixes = ["enterprise"];
    const crumbs = allSegments
      .map((seg, i) => ({
        seg,
        label: getFriendlyLabel(seg, allSegments.slice(0, i)) ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: "/" + allSegments.slice(0, i + 1).join("/"),
        hidden: hiddenPrefixes.includes(seg),
      }))
      .filter((crumb) => !crumb.hidden);

    /* Always prepend Dashboard as root crumb (unless already on dashboard) */
    const dashboardHref = "/" + allSegments.slice(0, allSegments.indexOf("enterprise") + 1).join("/") + "/dashboard";
    const isOnDashboard = crumbs.length === 1 && crumbs[0].seg === "dashboard";
    if (!isOnDashboard) {
      crumbs.unshift({ seg: "dashboard", label: "Dashboard", href: dashboardHref, hidden: false });
    }

    return crumbs.map((c, i) => ({ ...c, isLast: i === crumbs.length - 1 }));
  }, [pathname]);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).toUpperCase();

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'linear-gradient(135deg, rgba(253,250,247,0.94), rgba(247,243,239,0.92) 50%, rgba(245,239,233,0.93))',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        borderBottom: '1px solid var(--border-soft)',
        height: 58,
        boxShadow: '0 1px 3px rgba(77,55,46,0.03), 0 4px 24px rgba(166,119,99,0.02)',
      }}
    >
      {/* Gold-brown gradient hairline under topbar */}
      <div
        className="absolute bottom-[-1px] left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(166,119,99,0.12) 15%, rgba(208,176,96,0.35) 35%, rgba(208,176,96,0.40) 50%, rgba(208,176,96,0.35) 65%, rgba(166,119,99,0.12) 85%, transparent 95%)',
        }}
      />
      {/* Secondary subtle glow line */}
      <div
        className="absolute bottom-[-3px] left-[20%] right-[20%] h-[2px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(208,176,96,0.12) 30%, rgba(208,176,96,0.15) 50%, rgba(208,176,96,0.12) 70%, transparent)',
          filter: 'blur(2px)',
        }}
      />

      <div className="flex items-center justify-between h-full px-11">
        {/* Left — Mobile menu + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={openMobile}
            className="lg:hidden p-1.5 -ml-1 rounded-lg transition-colors"
            style={{ color: 'var(--ink-faint)' }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-2" style={{ fontSize: '11.5px' }}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href}>
                {i > 0 && (
                  <span style={{ color: 'var(--ink-faint)', opacity: 0.4 }}>›</span>
                )}
                {crumb.isLast ? (
                  <span className="font-medium" style={{ color: 'var(--ink-mid)' }}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:opacity-80"
                    style={{ color: 'var(--ink-faint)' }}
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Mobile: just page title */}
          <span className="sm:hidden text-[14px] font-medium" style={{ color: 'var(--ink-mid)' }}>
            {pageTitle}
          </span>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          {/* Date label */}
          <span className="hidden lg:block font-mono text-[9px] tracking-[0.12em] uppercase"
                style={{ color: 'var(--ink-faint)' }}>
            {dateString}
          </span>

          {/* Search pill */}
          <div
            className={cn(
              "relative hidden md:flex items-center gap-2 rounded-full transition-all duration-300",
              searchFocused ? "w-56" : "w-[230px]"
            )}
            style={{
              background: searchFocused
                ? 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(253,250,247,0.95))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(249,245,241,0.7))',
              border: searchFocused
                ? '1px solid rgba(208,176,96,0.45)'
                : '1px solid rgba(166,119,99,0.12)',
              padding: '6px 14px',
              boxShadow: searchFocused
                ? '0 0 0 3px rgba(208,176,96,0.10), 0 2px 8px rgba(166,119,99,0.06), inset 0 1px 2px rgba(77,55,46,0.03)'
                : '0 1px 3px rgba(77,55,46,0.03), inset 0 1px 2px rgba(77,55,46,0.03)',
            }}
          >
            <Search className="w-[13px] h-[13px] shrink-0" style={{ color: 'var(--ink-faint)' }} />
            <input
              type="text"
              placeholder="Search everything…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="border-none outline-none bg-transparent w-full font-sans"
              style={{
                fontSize: '12.5px',
                color: 'var(--ink-mid)',
              }}
            />
            {!searchFocused && (
              <span
                className="font-mono whitespace-nowrap shrink-0"
                style={{
                  fontSize: 9,
                  color: 'var(--ink-faint)',
                  background: 'rgba(166,119,99,0.08)',
                  border: '1px solid var(--border-soft)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                ⌘K
              </span>
            )}
          </div>

          {/* Notifications */}
          <button
            className="relative flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.85), rgba(249,245,241,0.7))',
              border: '1px solid rgba(166,119,99,0.12)',
              color: 'var(--ink-muted)',
              boxShadow: '0 1px 3px rgba(77,55,46,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(208,176,96,0.3)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(208,176,96,0.10)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(166,119,99,0.12)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(77,55,46,0.04)';
            }}
          >
            <Bell className="w-[14px] h-[14px]" />
            <span
              className="absolute rounded-full"
              style={{
                top: 6, right: 6,
                width: 7, height: 7,
                background: 'linear-gradient(135deg, #D9BF7F, #D0B060)',
                border: '2px solid var(--page-bg)',
                boxShadow: '0 0 6px rgba(208,176,96,0.4)',
              }}
            />
          </button>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-gold-200/40 focus:ring-offset-1">
                <div
                  className="rounded-full flex items-center justify-center cursor-pointer transition-shadow duration-200"
                  style={{
                    width: 34,
                    height: 34,
                    background: 'linear-gradient(145deg, #4D5741, #A67763)',
                    border: '2px solid rgba(208,176,96,0.40)',
                    boxShadow: '0 2px 10px rgba(77,55,46,0.20), 0 0 0 3px rgba(208,176,96,0.06)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#F4EFEB',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 3px 14px rgba(77,55,46,0.24), 0 0 0 4px rgba(208,176,96,0.10)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(77,55,46,0.20), 0 0 0 3px rgba(208,176,96,0.06)';
                  }}
                >
                  PN
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background: 'linear-gradient(145deg, #4D5741, #A67763)',
                      border: '2px solid rgba(208,176,96,0.35)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#F4EFEB',
                    }}
                  >
                    PN
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      Priya Nair
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                      priya@enterprise.com
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4" /> <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4" /> <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[var(--danger)] focus:text-[var(--danger-hover)] focus:bg-[var(--danger-light)]">
                <LogOut className="w-4 h-4" /> <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
