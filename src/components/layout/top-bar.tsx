"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronRight,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { ModuleConfig } from "@/lib/config/navigation";
import { mockPlans } from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";

/* ── Friendly name lookup for dynamic route segments (#5) ── */
function getFriendlyLabel(segment: string, _prevSegments: string[]): string | null {
  /* Plan IDs → plan title */
  const plan = mockPlans.find((p) => p.id === segment);
  if (plan) return plan.title;
  /* SOW IDs → sow title */
  const sow = mockSOWs.find((s) => s.id === segment);
  if (sow) return sow.title;
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
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, i) => ({
      label: getFriendlyLabel(seg, segments.slice(0, i)) ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + segments.slice(0, i + 1).join("/"),
      isLast: i === segments.length - 1,
    }));
  }, [pathname]);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-gray-200/40">
        <div className="flex items-center justify-between h-[52px] px-6">
          {/* Left — Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={openMobile}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-[13px]">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  {i > 0 && (
                    <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5" />
                  )}
                  {crumb.isLast ? (
                    <span className="font-semibold text-brown-800">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Mobile: just page title */}
            <span className="sm:hidden text-[14px] font-semibold text-brown-800">
              {pageTitle}
            </span>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-1">
            {/* Search pill */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "h-8 rounded-xl bg-gray-50/70 border border-gray-200/50 pl-9 pr-14 text-[12px] text-gray-800 placeholder:text-gray-400 transition-all duration-250",
                  "focus:outline-none focus:ring-2 focus:ring-brown-200/30 focus:border-brown-200/50 focus:bg-white/80",
                  searchFocused ? "w-56" : "w-40"
                )}
              />
              <div
                className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/80 border border-gray-200/50 text-gray-400",
                  searchFocused && "hidden"
                )}
              >
                <Command className="w-2.5 h-2.5" />
                <span className="text-[9px] font-mono font-bold">K</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200/50 mx-1.5 hidden md:block" />

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50/60 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brown-500 ring-2 ring-white" />
            </button>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-brown-200/40 focus:ring-offset-1">
                  <div className="relative">
                    <Avatar size="sm">
                      <AvatarImage src="" alt="User" />
                      <AvatarFallback className="bg-gradient-to-br from-brown-400 to-brown-600 text-white text-[10px] font-bold">
                        PN
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-forest-400 border-[1.5px] border-white" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar size="md">
                      <AvatarFallback className="bg-gradient-to-br from-brown-400 to-brown-600 text-white font-bold">
                        PN
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Priya Nair
                      </p>
                      <p className="text-xs text-gray-400">
                        priya@enterprise.com
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/enterprise/profile">
                    <User className="w-4 h-4" /> <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/enterprise/settings">
                    <Settings className="w-4 h-4" /> <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
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
