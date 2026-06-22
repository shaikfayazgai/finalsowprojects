"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  Search,
  LogOut,
  Settings,
  Loader2,
  FileText,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { searchContributor, type ContributorSearchResult } from "@/lib/api/contributor";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ModuleConfig } from "@/lib/config/navigation";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import { NotificationBellMenu } from "./notification-bell-menu";
import { useSowStore } from "@/lib/stores/sow-store";
import { useSOWDetail } from "@/lib/hooks/use-manual-sow";
import { useBreadcrumbLabel } from "@/lib/hooks/use-breadcrumb-label";

const segmentLabels: Record<string, string> = {
  apg: "Policies", "sow-forms": "SOW Intake Forms", "clause-library": "Clause Library",
  "review-rubrics": "Review Rubrics", sow: "SOW Repository", intake: "Create New SOW",
  upload: "Upload SOW", generate: "Generate SOW", review: "Review Draft", users: "Contributors",
  notifications: "Notifications",
};

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const OBJECTID_RE = /^[0-9a-f]{24}$/i;
// Prisma cuid IDs (e.g., DecompositionPlan.id) are 24+ char lowercase
// alphanumeric strings starting with 'c' — admit them so plan/task ids
// in the URL get resolved instead of looking like a static segment.
const CUID_RE = /^c[a-z0-9]{20,32}$/i;

function isUuid(s: string) {
  return UUID_RE.test(s) || OBJECTID_RE.test(s) || CUID_RE.test(s);
}

function getFriendlyLabel(segment: string, _prev: string[]): string | null {
  if (segmentLabels[segment]) return segmentLabels[segment];
  const sow = mockSOWs.find((s) => s.id === segment);
  if (sow) return sow.title;
  return null;
}


interface TopBarProps { config: ModuleConfig; }

export function TopBar({ config }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { openMobile } = useSidebarStore();
  const [searchFocused, setSearchFocused] = React.useState(false);

  // Universal search — currently only contributor backend supports it. Limit to
  // contributor pages so other roles don't see a broken dropdown.
  const isContributor = pathname.startsWith("/contributor");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<ContributorSearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchAbortRef = React.useRef<AbortController | null>(null);
  const searchContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Debounced fetch
  React.useEffect(() => {
    if (!isContributor) { setSearchResults(null); return; }
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearchLoading(false);
      // Cancel any in-flight request when the user clears the input.
      searchAbortRef.current?.abort();
      searchAbortRef.current = null;
      return;
    }
    const token = getContributorAccessToken(session);
    const contributorId = (session?.user as { id?: string } | undefined)?.id ?? "";
    if (!token || !contributorId) return;

    const handle = setTimeout(() => {
      // Cancel any prior in-flight request before firing a new one.
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      setSearchLoading(true);
      searchContributor(token, contributorId, q, { limit: 20, signal: controller.signal })
        .then(res => {
          if (controller.signal.aborted) return;
          setSearchResults(res.results);
        })
        .catch(err => {
          if (controller.signal.aborted) return;
          if ((err as { name?: string })?.name === "AbortError") return;
          setSearchResults([]);
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setSearchLoading(false);
        });
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery, isContributor, session]);

  // Close dropdown on outside click
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    if (searchOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen]);

  function handleResultClick(r: ContributorSearchResult) {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    if (r.url) router.push(r.url);
  }

  const ResultIcon = (type: ContributorSearchResult["type"]) => {
    if (type === "task") return ClipboardCheck;
    if (type === "learning") return GraduationCap;
    return FileText; // submission
  };

  const uuidSegment = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.find(isUuid) ?? null;
  }, [pathname]);

  const isSowDetailRoute = /^\/enterprise\/sow\/[^/]+$/.test(pathname);
  const sowDetailQuery = useSOWDetail(isSowDetailRoute ? uuidSegment : null);
  const allSows = useSowStore((s) => s.sows);
  const sowTitle = React.useMemo(() => {
    // Check Zustand store first (instant, no network)
    const stored = uuidSegment ? allSows.find((s) => s.id === uuidSegment) : null;
    if (stored?.title) return stored.title;
    if (!sowDetailQuery.data) return null;
    const d = sowDetailQuery.data as Record<string, unknown>;
    return (d.title ?? d.project_title ?? d.name ?? null) as string | null;
  }, [sowDetailQuery.data, allSows, uuidSegment]);

  // Decomposition plan label — fires on /enterprise/decomposition/<id> or
  // any descendant route. Replaces the old mockPlans static lookup.
  const isPlanRoute = /^\/enterprise\/decomposition\/[^/]+/.test(pathname);
  const planLabelQuery = useBreadcrumbLabel(
    isPlanRoute && uuidSegment ? "plan" : null,
    isPlanRoute && uuidSegment ? uuidSegment : null,
  );
  const planLabel = planLabelQuery.data ?? null;
  const userEmail = session?.user?.email || "";
  // Fallback to the email local-part when the session has no display name
  // (common for SSO/OTP users), so the dropdown never shows a bare "User".
  const rawName = session?.user?.name?.trim();
  const userName = rawName && rawName.length > 0
    ? rawName
    : (userEmail.split("@")[0] || "User");
  const userInitials =
    (session?.user as { initials?: string })?.initials ||
    userName
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

React.useEffect(() => {
  const loadPhoto = () => {
    const saved = localStorage.getItem("profilePhoto");
    if (saved) setProfilePhoto(saved);
  };

  loadPhoto();

  window.addEventListener("profilePhotoUpdated", loadPhoto);
  return () => window.removeEventListener("profilePhotoUpdated", loadPhoto);
}, []);

  const breadcrumbs = React.useMemo(() => {
    const allSegments = pathname.split("/").filter(Boolean);
    const moduleRoots = ["enterprise", "contributor", "mentor", "analytics", "admin"];
    const moduleRoot = allSegments.find((seg) => moduleRoots.includes(seg)) || allSegments[0];
    const hiddenPrefixes = moduleRoots;
    const crumbs = allSegments
      .map((seg, i) => {
        let label: string;
        if (isUuid(seg)) {
          // Resolution order: SOW title (Zustand-backed) → plan label
          // (API-backed) → first-8-char slice fallback.
          label = sowTitle ?? planLabel ?? seg.slice(0, 8).toUpperCase();
        } else {
          label = getFriendlyLabel(seg, allSegments.slice(0, i)) ??
            seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        }
        return {
          seg,
          label,
          href: "/" + allSegments.slice(0, i + 1).join("/"),
          hidden: hiddenPrefixes.includes(seg),
        };
      })
      .filter((crumb) => !crumb.hidden);
    const dashboardHref = "/" + moduleRoot + "/dashboard";
    const isOnDashboard = crumbs.length === 1 && crumbs[0].seg === "dashboard";
    if (!isOnDashboard) crumbs.unshift({ seg: "dashboard", label: "Dashboard", href: dashboardHref, hidden: false });
    return crumbs.map((c, i) => ({ ...c, isLast: i === crumbs.length - 1 }));
  }, [pathname, sowTitle, planLabel]);

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
          {/* Search — contributor-only. Other portals don't have a backing
              search endpoint yet, so the input is hidden to avoid a dead
              placeholder. (Phase 2 will add cross-portal search.) */}
          {isContributor && (
          <div
            ref={searchContainerRef}
            className={cn(
              "relative hidden md:flex items-center gap-2 rounded-full transition-all duration-300",
              searchFocused ? "w-72" : "w-52"
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
              type="search"
              name="global-search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!searchOpen) setSearchOpen(true);
              }}
              onFocus={() => {
                setSearchFocused(true);
                if (searchQuery.trim().length >= 2) setSearchOpen(true);
              }}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  (e.currentTarget as HTMLInputElement).blur();
                } else if (e.key === "Enter") {
                  if (searchResults && searchResults.length > 0) {
                    e.preventDefault();
                    handleResultClick(searchResults[0]);
                  }
                }
              }}
              placeholder="Search tasks, submissions…"
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              className="border-none outline-none bg-transparent w-full text-[13px] text-gray-700 placeholder:text-gray-400"
            />
            {searchLoading ? (
              <Loader2 className="w-3 h-3 shrink-0 animate-spin text-gray-400" />
            ) : !searchFocused ? (
              <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] text-gray-400 bg-black/[0.04] border border-black/[0.06] px-1.5 py-px rounded">⌘K</kbd>
            ) : null}

            {/* Results dropdown */}
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl bg-white ring-1 ring-stroke-subtle shadow-xl overflow-hidden z-40"
              >
                {searchLoading && !searchResults ? (
                  <div className="px-3 py-4 text-center font-body text-[12px] text-text-tertiary">
                    Searching…
                  </div>
                ) : !searchResults || searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-center font-body text-[12px] text-text-tertiary">
                    No matches for &ldquo;{searchQuery.trim()}&rdquo;.
                  </div>
                ) : (
                  <ul className="max-h-[320px] overflow-y-auto py-1">
                    {searchResults.map((r) => {
                      const Icon = ResultIcon(r.type);
                      return (
                        <li key={`${r.type}-${r.id}`}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleResultClick(r)}
                            className="w-full text-left flex items-start gap-2 px-3 py-2 hover:bg-surface-muted/50 transition-colors"
                          >
                            <Icon className="w-3.5 h-3.5 mt-0.5 text-teal-600 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-body text-[12.5px] font-semibold text-foreground truncate">
                                {r.title}
                              </div>
                              <div className="font-mono text-[10.5px] text-text-tertiary uppercase tracking-wide">
                                {r.type}
                                {r.subtitle ? ` · ${r.subtitle}` : ""}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
          )}

          {/* Notification Bell (FSD 6.7) */}
          <NotificationBellMenu />


          {/* Avatar */}
{/* Avatar */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button
      suppressHydrationWarning
      className="rounded-full focus:outline-none focus:ring-2 focus:ring-gold-200/40 focus:ring-offset-1"
    >
      <Avatar size="sm">
        <AvatarImage src={profilePhoto || ""} alt="User avatar" />
        <AvatarFallback>
          {userInitials}
        </AvatarFallback>
      </Avatar>
    </button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    className="w-84"
    style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
  >
    <DropdownMenuLabel>
      <div className="flex items-center gap-3">
        <Avatar size="md">
          <AvatarImage src={profilePhoto || ""} alt="User avatar" />
          <AvatarFallback>
            {userInitials}
          </AvatarFallback>
        </Avatar>

        <div>
          <p className="text-sm font-semibold text-gray-900">
            {userName}
          </p>
          <p className="text-xs text-gray-500 lowercase">
            {userEmail}
          </p>
        </div>
      </div>
    </DropdownMenuLabel>

    <DropdownMenuSeparator />

    <DropdownMenuItem
      onClick={() => router.push(config.basePath + "/settings")}
    >
      <Settings className="w-4 h-4" />
      <span>Settings</span>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem
      className="text-[var(--danger)] focus:text-[var(--danger-hover)] focus:bg-[var(--danger-light)]"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
    >
      <LogOut className="w-4 h-4" />
      <span>Log out</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
        </div> {/* right section */}
      </div> {/* main container */}
    </header>
  );
}
