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
  Sparkles,
  ChevronRight,
  Plus,
  Share2,
  SlidersHorizontal,
  Command,
  Calendar,
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
  Badge,
} from "@/components/ui";
import type { ModuleConfig } from "@/lib/config/navigation";

interface TopBarProps {
  config: ModuleConfig;
}

export function TopBar({ config }: TopBarProps) {
  const pathname = usePathname();
  const { openMobile } = useSidebarStore();
  const [searchFocused, setSearchFocused] = React.useState(false);

  /* Build breadcrumb from path */
  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, i) => ({
      label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + segments.slice(0, i + 1).join("/"),
      isLast: i === segments.length - 1,
    }));
  }, [pathname]);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-beige-200/40">
        <div className="flex items-center justify-between h-[52px] px-6">
          {/* Left — Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={openMobile}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-beige-500 hover:text-brown-700 hover:bg-beige-100/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-[13px]">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  {i > 0 && (
                    <ChevronRight className="w-3 h-3 text-beige-300 mx-0.5" />
                  )}
                  {crumb.isLast ? (
                    <span className="font-semibold text-brown-800">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-beige-400 hover:text-brown-500 transition-colors"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "h-8 rounded-xl bg-beige-50/70 border border-beige-200/40 pl-9 pr-14 text-[12px] text-brown-800 placeholder:text-beige-400 transition-all duration-250",
                  "focus:outline-none focus:ring-2 focus:ring-brown-200/30 focus:border-brown-200/50 focus:bg-white/80",
                  searchFocused ? "w-56" : "w-40"
                )}
              />
              <div
                className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/80 border border-beige-200/40 text-beige-400",
                  searchFocused && "hidden"
                )}
              >
                <Command className="w-2.5 h-2.5" />
                <span className="text-[9px] font-mono font-bold">K</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-beige-200/50 mx-1.5 hidden md:block" />

            {/* APG quick access */}
            <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all group hover:shadow-sm">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-forest-500/10 to-teal-500/10 flex items-center justify-center group-hover:from-forest-500/20 group-hover:to-teal-500/20 transition-all">
                <Sparkles className="w-3 h-3 text-teal-600" />
              </div>
              <span className="text-teal-700">APG</span>
            </button>

            {/* Date indicator */}
            <button className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-beige-500 hover:text-brown-600 hover:bg-beige-50/60 transition-all">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </button>

            {/* Manage */}
            <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-beige-500 hover:text-brown-600 hover:bg-beige-50/60 transition-all">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Manage
            </button>

            {/* Share */}
            <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-beige-500 hover:text-brown-600 hover:bg-beige-50/60 transition-all">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-beige-200/50 mx-1 hidden sm:block" />

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-beige-500 hover:text-brown-600 hover:bg-beige-50/60 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brown-500 ring-2 ring-white" />
            </button>

            {/* Create task CTA */}
            <button className="hidden sm:flex items-center gap-1.5 ml-1 px-3.5 py-[7px] rounded-xl bg-gradient-to-r from-brown-600 to-brown-700 hover:from-brown-700 hover:to-brown-800 text-white text-[12px] font-semibold transition-all shadow-sm shadow-brown-500/15 hover:shadow-md hover:shadow-brown-500/20">
              <Plus className="w-3.5 h-3.5" />
              Create task
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar size="md">
                      <AvatarFallback className="bg-gradient-to-br from-brown-400 to-brown-600 text-white font-bold">
                        PN
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-brown-900">
                        Priya Nair
                      </p>
                      <p className="text-xs text-beige-500">
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
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-beige-400">
                  Switch Module
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/enterprise/dashboard">
                    <Badge variant="brown" size="sm">Enterprise</Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contributor/dashboard">
                    <Badge variant="teal" size="sm">Contributor</Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mentor/dashboard">
                    <Badge variant="forest" size="sm">Mentor</Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/analytics/overview">
                    <Badge variant="gold" size="sm">Analytics</Badge>
                  </Link>
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
