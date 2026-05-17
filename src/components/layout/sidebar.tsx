
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronDown,
  AlertCircle,
  Settings,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useSowBadges, useSowAlerts, type SOWAlert } from "@/lib/hooks/use-sow-badges";
import type { ModuleConfig } from "@/lib/config/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  config: ModuleConfig;
}

export function Sidebar({ config }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isCollapsed, isMobileOpen, toggle, closeMobile } = useSidebarStore();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitials = (session?.user as any)?.initials || userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const dynamicBadges = useSowBadges();

  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

React.useEffect(() => {
  const loadPhoto = () => {
    const saved = localStorage.getItem("profilePhoto");
    if (saved) setProfilePhoto(saved);
  };

  loadPhoto();
  window.addEventListener("profilePhotoUpdated", loadPhoto);

  return () => {
    window.removeEventListener("profilePhotoUpdated", loadPhoto);
  };
}, []);

  const alertMap = useSowAlerts();
  const [openAlertHref, setOpenAlertHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!openAlertHref) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-alert-popover]")) setOpenAlertHref(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openAlertHref]);
  const [expandedSections, setExpandedSections] = React.useState<
    Record<number, boolean>
  >({});

  React.useEffect(() => {
    const initial: Record<number, boolean> = {};
    config.sections.forEach((_, idx) => {
      initial[idx] = true;
    });
    setExpandedSections(initial);
  }, [config.sections]);

  function toggleSection(idx: number) {
    setExpandedSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  const allHrefs = React.useMemo(
    () => config.sections.flatMap((s) => s.items.map((i) => i.href)),
    [config.sections]
  );

  function isActive(href: string) {
    if (pathname === href) return true;
    if (
      href === config.basePath + "/dashboard" ||
      href === config.basePath + "/overview"
    )
      return false;
    const hasMoreSpecific = allHrefs.some(
      (h) =>
        h !== href && h.startsWith(href + "/") && pathname.startsWith(h)
    );
    if (hasMoreSpecific) return false;
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className={cn(
          "flex items-center justify-between shrink-0",
          isCollapsed ? "px-3" : "px-4"
        )}
        style={{ height: 72 }}
      >
        <Link href="/" className="flex-1 min-w-0 flex items-center">
          {isCollapsed ? (
            <div className="relative w-10 h-10 shrink-0 overflow-hidden mx-auto">
              <Image
                src="/logo.png"
                alt="Glimmora Team"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col min-w-0 w-full">
              <div className="relative w-full overflow-hidden" style={{ height: 52 }}>
                <Image
                  src="/logo.png"
                  alt="Glimmora Team"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <p className="text-[8px] tracking-[0.14em] uppercase leading-tight text-gray-400 pl-0.5">
                {config.shortName}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all shrink-0"
        >
          {isCollapsed
            ? <PanelLeftOpen className="w-[14px] h-[14px]" />
            : <PanelLeftClose className="w-[14px] h-[14px]" />
          }
        </button>
      </div>

      {/* Navigation — flex-1 so footer stays at bottom */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto pb-6",
          isCollapsed ? "px-2 pt-3" : "px-3 pt-4"
        )}
        style={{ scrollbarWidth: "none" }}
      >
        <TooltipProvider delayDuration={0}>
          {config.sections.map((section, sIdx) => {
            const isExpanded = expandedSections[sIdx] ?? true;
            const hasSectionTitle = !!section.title;

            return (
              <div key={sIdx} className="pb-1">
                {hasSectionTitle && !isCollapsed && (
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className="flex items-center justify-between w-full px-3 mb-1 group"
                    style={{
                      marginTop: sIdx > 0 ? 18 : 4,
                      paddingTop: 4,
                      paddingBottom: 4,
                    }}
                  >
                    <span className="font-semibold uppercase text-[8.5px] tracking-[0.18em] text-gray-400">
                      {section.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </button>
                )}

                {hasSectionTitle && isCollapsed && sIdx > 0 && (
                  <div className="my-2" />
                )}

                <AnimatePresence initial={false}>
                  {(isExpanded || isCollapsed || !hasSectionTitle) && (
                    <motion.div
                      initial={
                        hasSectionTitle
                          ? { height: 0, opacity: 0 }
                          : false
                      }
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: "easeInOut",
                      }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const effectiveHref = item.href;
                          const active = isActive(item.href);
                          const Icon = item.icon;
                          const badge = dynamicBadges[item.href] ?? item.badge;
                          const alertState = alertMap[item.href];
                          const hasAlert = alertState?.hasAlert ?? false;
                          const alertItems: SOWAlert[] = alertState?.items ?? [];

                          const link = (
                            <Link
                              key={item.href}
                              href={effectiveHref}
                              prefetch={false}
                              onClick={() => closeMobile()}
                              className={cn(
                                "group/item relative flex items-center gap-2.5 rounded-xl transition-colors duration-150",
                                isCollapsed
                                  ? "justify-center px-2 py-2.5"
                                  : "px-3 py-[8px]",
                                active
                                  ? "text-brown-700 font-medium"
                                  : "text-gray-500 hover:text-gray-600 hover:bg-white/40"
                              )}
                              style={{
                                fontSize: "12.5px",
                                ...(active ? {
                                  background: "linear-gradient(90deg, rgba(166,119,99,0.09) 0%, transparent 80%)",
                                } : {}),
                              }}
                            >
                              <span className="relative shrink-0">
                                <Icon
                                  className={cn(
                                    isCollapsed ? "w-4 h-4" : "w-[14px] h-[14px]"
                                  )}
                                />
                                {badge && !hasAlert && isCollapsed && (
                                  <span
                                    className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                    style={{ background: "linear-gradient(135deg,#A67763,#8B5E4A)" }}
                                  >
                                    {badge}
                                  </span>
                                )}
                              </span>

                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap overflow-hidden"
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>

                              {hasAlert && !isCollapsed && (
                                <span className="ml-auto relative">
                                  <button
                                    type="button"
                                    data-alert-popover
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenAlertHref((prev) => prev === item.href ? null : item.href);
                                    }}
                                    className="flex items-center justify-center w-5 h-5 rounded-full hover:opacity-80 transition-opacity"
                                  >
                                    <span className="relative flex h-2 w-2">
                                      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
                                      <span className="relative rounded-full w-2 h-2 bg-red-500" />
                                    </span>
                                  </button>
                                  {openAlertHref === item.href && (
                                    <div
                                      data-alert-popover
                                      className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 w-72"
                                      style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.12))" }}
                                    >
                                      {/* Arrow */}
                                      <div
                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45"
                                        style={{ background: "var(--card-bg, #fff)", border: "1px solid rgba(185,28,28,0.15)", borderRight: "none", borderTop: "none" }}
                                      />
                                      <div
                                        className="rounded-xl overflow-hidden"
                                        style={{ background: "var(--card-bg, #fff)", border: "1px solid rgba(185,28,28,0.15)" }}
                                      >
                                        <div
                                          className="px-3 py-2 flex items-center gap-2"
                                          style={{ background: "rgba(185,28,28,0.05)", borderBottom: "1px solid rgba(185,28,28,0.10)" }}
                                        >
                                          <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#B91C1C" }} strokeWidth={2.5} />
                                          <p className="text-[11px] font-semibold" style={{ color: "#B91C1C" }}>
                                            {alertItems.length} SOW{alertItems.length > 1 ? "s require" : " requires"} attention
                                          </p>
                                        </div>
                                        <div className="divide-y divide-red-50">
                                          {alertItems.map((alert) => (
                                            <div key={alert.id} className="px-3 py-2.5">
                                              <p className="text-[12px] font-medium text-gray-800 leading-snug">{alert.title}</p>
                                              {alert.requestedBy && (
                                                <p className="text-[10.5px] text-gray-400 mt-0.5">by {alert.requestedBy}</p>
                                              )}
                                              {alert.reason && (
                                                <p
                                                  className="text-[11px] italic mt-1.5 leading-snug"
                                                  style={{ color: "#7F1D1D" }}
                                                >
                                                  &ldquo;{alert.reason}&rdquo;
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </span>
                              )}
                              {badge && !hasAlert && !isCollapsed && (
                                <span
                                  className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                                  style={{ background: "linear-gradient(135deg,#A67763,#8B5E4A)" }}
                                >
                                  {badge}
                                </span>
                              )}
                            </Link>
                          );

                          if (isCollapsed) {
                            return (
                              <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                  {link}
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  {item.label}
                                </TooltipContent>
                              </Tooltip>
                            );
                          }
                          return (
                            <React.Fragment key={item.href}>
                              {link}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Settings footer — mirrors top bar avatar dropdown */}
      <div
        className={cn(
          "shrink-0 border-t border-black/[0.05]",
          isCollapsed ? "px-2 py-2" : "px-3 py-2.5"
        )}
      >
        <TooltipProvider delayDuration={0}>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    suppressHydrationWarning
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/50",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <Avatar className="w-7 h-7">
  {profilePhoto && (
    <AvatarImage src={profilePhoto} alt="User avatar" />
  )}
  <AvatarFallback>
    {userInitials}
  </AvatarFallback>
</Avatar>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="min-w-0 overflow-hidden"
                        >
                          <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{userName}</p>
                          <p className="text-[10px] text-gray-400 truncate leading-tight">{userEmail}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">{userName}</TooltipContent>
              )}
            </Tooltip>

            <DropdownMenuContent side="right" align="end" className="w-64 mb-1" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}>
              {/* Role Toggle */}
              <DropdownMenuLabel>
                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-[11px] font-medium text-gray-500">Switch Role</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => router.push("/enterprise/dashboard")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                        !pathname.startsWith("/enterprise/reviewer")
                          ? "bg-brown-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}>
                      Admin
                    </button>
                    <button
                      onClick={() => router.push("/enterprise/reviewer")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                        pathname.startsWith("/enterprise/reviewer")
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}>
                      Reviewer
                    </button>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
  {profilePhoto && (
    <AvatarImage src={profilePhoto} alt="User avatar" />
  )}
  <AvatarFallback>
    {userInitials}
  </AvatarFallback>
</Avatar>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{userName}</p>
                    <p className="text-xs text-gray-400 lowercase">{userEmail}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(config.basePath + "/settings")}>
                <Settings className="w-4 h-4" /><span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[var(--danger)] focus:text-[var(--danger-hover)] focus:bg-[var(--danger-light)]"
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
              >
                <LogOut className="w-4 h-4" /><span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 220 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(246,241,239,0.45) 0%, rgba(255,255,255,0.98) 100%)",
          borderRight: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] lg:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-screen w-[220px] z-50 lg:hidden overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(246,241,239,0.5) 0%, rgba(255,255,255,1) 100%)",
                borderRight: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "4px 0 30px rgba(0,0,0,0.04)",
              }}
            >
              <button
                onClick={closeMobile}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-white/50 z-20"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
