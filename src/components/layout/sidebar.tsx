"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
  ChevronDown,
  HelpCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import type { ModuleConfig } from "@/lib/config/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui";

interface SidebarProps {
  config: ModuleConfig;
}

/* Single consistent icon style for all nav items */
const iconColorClass = "bg-beige-100/70 text-beige-600";

export function Sidebar({ config }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggle, closeMobile } = useSidebarStore();
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

  function isActive(href: string) {
    if (
      href === config.basePath + "/dashboard" ||
      href === config.basePath + "/overview"
    )
      return pathname === href;
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Brand ── */}
      <div className={cn("px-5 pt-6 pb-2", isCollapsed && "px-3 pt-5")}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-[-3px] rounded-2xl bg-gradient-to-br from-brown-400/30 via-gold-400/20 to-teal-400/20 blur-[6px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-brown-500 via-brown-600 to-brown-700 flex items-center justify-center shadow-lg shadow-brown-500/20">
              <Sparkles className="w-[18px] h-[18px] text-gold-200" />
            </div>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-[15px] font-bold text-brown-900 tracking-[-0.02em]">
                  Glimmora
                </p>
                <p className="text-[10px] font-semibold text-beige-500 tracking-wide uppercase mt-[-2px]">
                  {config.shortName}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Quick search ── */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-beige-100/60 border border-beige-200/40 text-[12px] text-beige-500 hover:bg-beige-100 hover:border-beige-200/60 transition-all">
            <Search className="w-3.5 h-3.5" />
            <span>Quick search...</span>
            <span className="ml-auto text-[9px] font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded text-beige-400 border border-beige-200/40">
              /
            </span>
          </button>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-none">
        <TooltipProvider delayDuration={0}>
          {config.sections.map((section, sIdx) => {
            const isExpanded = expandedSections[sIdx] ?? true;

            return (
              <div key={sIdx} className={sIdx > 0 ? "mt-3" : ""}>
                {/* Section header */}
                {section.title && !isCollapsed && (
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className="flex items-center justify-between w-full px-3 py-1.5 mb-0.5 rounded-lg group hover:bg-beige-50/50 transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-beige-400 group-hover:text-beige-600 transition-colors">
                      {section.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="w-3 h-3 text-beige-300 group-hover:text-beige-500 transition-colors" />
                    </motion.div>
                  </button>
                )}

                {section.title && isCollapsed && (
                  <div className="mx-2 mb-2 mt-1 border-t border-beige-200/40" />
                )}

                <AnimatePresence initial={false}>
                  {(isExpanded || isCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const active = isActive(item.href);
                          const Icon = item.icon;

                          const link = (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => closeMobile()}
                              className={cn(
                                "group/item relative flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] font-medium transition-all duration-200",
                                isCollapsed && "justify-center px-2.5",
                                active
                                  ? "bg-white/80 shadow-sm shadow-brown-200/20 border border-beige-200/50"
                                  : "hover:bg-white/40 border border-transparent"
                              )}
                            >
                              {/* Icon with colored background */}
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                                  active
                                    ? "bg-gradient-to-br from-brown-500 to-brown-600 shadow-sm shadow-brown-400/20"
                                    : iconColorClass + " group-hover/item:scale-105"
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "w-[14px] h-[14px] transition-colors duration-200",
                                    active
                                      ? "text-white"
                                      : ""
                                  )}
                                />
                              </div>

                              <AnimatePresence>
                                {!isCollapsed && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className={cn(
                                      "whitespace-nowrap overflow-hidden transition-colors",
                                      active ? "text-brown-800 font-semibold" : "text-beige-700 group-hover/item:text-brown-700"
                                    )}
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>

                              {/* Badge */}
                              {item.badge && !isCollapsed && (
                                <span
                                  className={cn(
                                    "ml-auto text-[10px] font-bold min-w-[22px] text-center py-0.5 px-1.5 rounded-lg",
                                    active
                                      ? "bg-brown-500 text-white"
                                      : "bg-beige-100 text-beige-600 border border-beige-200/50"
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );

                          if (isCollapsed) {
                            return (
                              <Tooltip key={item.href}>
                                <TooltipTrigger asChild>{link}</TooltipTrigger>
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

      {/* ── Bottom section ── */}
      <div className="px-3 pb-3 space-y-2">
        {/* Ask APG — standout gradient button */}
        <div className="px-1">
          <button
            className={cn(
              "relative w-full overflow-hidden rounded-xl py-2.5 text-[13px] font-bold transition-all duration-300",
              "flex items-center justify-center gap-2 group/apg"
            )}
          >
            <div
              className="absolute inset-0 rounded-xl opacity-90 group-hover/apg:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #4D5741 0%, #5B9BA2 50%, #D0B060 100%)",
                backgroundSize: "200% 200%",
                animation: "gradient-shift 6s ease infinite",
              }}
            />
            <div className="absolute inset-[1px] rounded-[10px] bg-white/90 group-hover/apg:bg-white/80 transition-colors" />
            <Sparkles className="w-4 h-4 text-teal-600 relative z-10" />
            {!isCollapsed && (
              <span className="relative z-10 bg-gradient-to-r from-forest-600 via-teal-600 to-gold-600 bg-clip-text text-transparent">
                Ask APG
              </span>
            )}
          </button>
        </div>

        {/* Help + Collapse */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 px-1">
            <button className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[11px] text-beige-500 hover:text-brown-600 hover:bg-beige-100/50 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help
            </button>
            <button
              onClick={toggle}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[11px] text-beige-500 hover:text-brown-600 hover:bg-beige-100/50 transition-colors"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
              Collapse
            </button>
          </div>
        )}

        {isCollapsed && (
          <button
            onClick={toggle}
            className="flex items-center justify-center w-full rounded-lg py-2 text-beige-400 hover:text-brown-600 hover:bg-beige-100/50 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* User profile card */}
        {!isCollapsed && (
          <div className="mx-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-beige-50 to-brown-50/50 border border-beige-200/40">
            <div className="relative">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-brown-400 to-brown-600 text-white text-[10px] font-bold">
                  PN
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-forest-400 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-brown-800 truncate">
                Priya Nair
              </p>
              <p className="text-[10px] text-beige-500 truncate">
                priya@enterprise.com
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-beige-400 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 264 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 overflow-hidden",
          "bg-gradient-to-b from-white/80 via-beige-50/60 to-white/70",
          "backdrop-blur-2xl border-r border-beige-200/50"
        )}
      >
        {/* Subtle ambient orb to give warmth */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[200px] h-[200px] rounded-full bg-brown-200/20 blur-[60px] -top-[40px] left-[20%]" />
          <div className="absolute w-[150px] h-[150px] rounded-full bg-teal-200/10 blur-[50px] bottom-[20%] right-[-20px]" />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          {sidebarContent}
        </div>
      </motion.aside>

      {/* Mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-brown-900/15 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-screen w-[264px] z-50 lg:hidden overflow-hidden bg-white/95 backdrop-blur-2xl border-r border-beige-200/50"
            >
              <button
                onClick={closeMobile}
                className="absolute top-5 right-4 p-1.5 rounded-lg text-beige-400 hover:text-brown-700 z-20"
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
