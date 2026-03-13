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

interface SidebarProps {
  config: ModuleConfig;
}

export function Sidebar({ config }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggle, closeMobile } = useSidebarStore();
  const [expandedSections, setExpandedSections] = React.useState<
    Record<number, boolean>
  >({});

  /* Expand all sections by default on mount */
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
      (h) => h !== href && h.startsWith(href + "/") && pathname.startsWith(h)
    );
    if (hasMoreSpecific) return false;
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Brand + Collapse toggle ── */}
      <div className={cn("flex items-center px-[18px]", isCollapsed && "px-2.5")}
           style={{ borderBottom: '1px solid var(--border-hair)', height: 58 }}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(145deg, #5A3E32 0%, #A67763 45%, #D0B060 100%)',
                boxShadow: '0 3px 12px rgba(106,76,63,0.35), 0 1px 3px rgba(208,176,96,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Sparkles className="w-[15px] h-[15px] text-gold-50" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.12 }}
                  className="min-w-0"
                >
                  <p className="font-heading text-[15px] font-semibold tracking-[-0.3px] leading-tight"
                     style={{ color: 'var(--ink)' }}>
                    Glimmora
                  </p>
                  <p className="font-mono text-[8px] tracking-[0.18em] uppercase leading-tight"
                     style={{ color: 'var(--ink-faint)' }}>
                    {config.shortName}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          {!isCollapsed && (
            <button
              onClick={toggle}
              className="p-1 rounded transition-colors shrink-0"
              style={{ color: 'var(--ink-faint)' }}
            >
              <PanelLeftClose className="w-[14px] h-[14px]" />
            </button>
          )}
          {isCollapsed && (
            <button
              onClick={toggle}
              className="p-1 rounded transition-colors shrink-0"
              style={{ color: 'var(--ink-faint)' }}
            >
              <PanelLeftOpen className="w-[14px] h-[14px]" />
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className={cn(
        "flex-1 overflow-y-auto pb-3",
        isCollapsed ? "px-2 pt-2" : "px-[10px] pt-[14px]"
      )} style={{ scrollbarWidth: 'none' }}>
        <TooltipProvider delayDuration={0}>
          {config.sections.map((section, sIdx) => {
            const isExpanded = expandedSections[sIdx] ?? true;
            const hasSectionTitle = !!section.title;

            return (
              <div key={sIdx}>
                {/* Section header */}
                {hasSectionTitle && !isCollapsed && (
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className="flex items-center justify-between w-full px-[14px] py-1 mb-1 rounded group transition-colors"
                    style={{ marginTop: sIdx > 0 ? 22 : 8 }}
                  >
                    <span
                      className="font-semibold uppercase"
                      style={{
                        fontSize: '8.5px',
                        letterSpacing: '0.20em',
                        color: 'var(--ink-faint)',
                      }}
                    >
                      {section.title}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronDown className="w-3 h-3" style={{ color: 'var(--ink-faint)' }} />
                    </motion.div>
                  </button>
                )}

                {hasSectionTitle && isCollapsed && sIdx > 0 && (
                  <div className="mx-2 my-2" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(208,176,96,0.25), transparent)' }} />
                )}

                {/* Items */}
                <AnimatePresence initial={false}>
                  {(isExpanded || isCollapsed || !hasSectionTitle) && (
                    <motion.div
                      initial={hasSectionTitle ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
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
                                "group/item relative flex items-center gap-[10px] rounded-[10px] transition-all duration-250",
                                isCollapsed ? "justify-center px-2 py-2" : "px-[14px] py-[8px]"
                              )}
                              style={{
                                fontSize: '12.5px',
                                fontWeight: active ? 500 : 400,
                                letterSpacing: '0.01em',
                                color: active ? 'var(--ink)' : 'var(--ink-muted)',
                                background: active
                                  ? 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(208,176,96,0.12) 40%, rgba(166,119,99,0.10))'
                                  : undefined,
                                backdropFilter: active ? 'blur(8px)' : undefined,
                                WebkitBackdropFilter: active ? 'blur(8px)' : undefined,
                                border: active ? '1px solid rgba(208,176,96,0.22)' : '1px solid transparent',
                                boxShadow: active
                                  ? '0 1px 4px rgba(208,176,96,0.10), 0 2px 12px rgba(166,119,99,0.06), inset 0 1px 0 rgba(255,255,255,0.5)'
                                  : undefined,
                              }}
                              onMouseEnter={(e) => {
                                if (!active) {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(166,119,99,0.04))';
                                  e.currentTarget.style.borderColor = 'rgba(166,119,99,0.08)';
                                  e.currentTarget.style.boxShadow = '0 1px 6px rgba(166,119,99,0.04)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!active) {
                                  e.currentTarget.style.background = '';
                                  e.currentTarget.style.borderColor = 'transparent';
                                  e.currentTarget.style.boxShadow = '';
                                }
                              }}
                            >
                              {/* Active left bar */}
                              {active && !isCollapsed && (
                                <span
                                  className="absolute left-[-1px] top-[18%] bottom-[18%] rounded-r-sm"
                                  style={{
                                    width: 3,
                                    background: 'linear-gradient(180deg, #D9BF7F, #A67763)',
                                    boxShadow: '1px 0 8px rgba(208,176,96,0.3)',
                                  }}
                                />
                              )}

                              <Icon
                                className={cn(
                                  "shrink-0 transition-colors duration-200",
                                  isCollapsed ? "w-[16px] h-[16px]" : "w-[14px] h-[14px]"
                                )}
                                style={{
                                  color: active ? '#6A4C3F' : 'var(--ink-muted)',
                                }}
                              />

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

                              {/* Badge */}
                              {item.badge && !isCollapsed && (
                                <span
                                  className="ml-auto font-mono text-[10px] font-medium"
                                  style={{ color: 'var(--ink-faint)' }}
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

    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 68 : 228 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FDFBF8 0%, #FAF6F2 35%, #F7F2ED 70%, #F5EFE9 100%)',
          borderRight: '1px solid var(--border-soft)',
          boxShadow: '2px 0 24px rgba(77,55,46,0.06), 4px 0 48px rgba(166,119,99,0.03)',
        }}
      >
        {/* Decorative gradient mesh blob behind brand */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -30,
            left: -20,
            width: 200,
            height: 200,
            background: 'radial-gradient(ellipse at 30% 30%, rgba(208,176,96,0.10) 0%, rgba(166,119,99,0.06) 40%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Secondary teal mesh blob */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 40,
            right: -30,
            width: 140,
            height: 140,
            background: 'radial-gradient(ellipse at 70% 70%, rgba(91,155,162,0.06) 0%, transparent 60%)',
            filter: 'blur(25px)',
          }}
        />
        {/* Gold hairline accent on right edge */}
        <div
          className="absolute top-[8%] bottom-[8%] right-[-1px] w-px z-10"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(208,176,96,0.35) 30%, rgba(208,176,96,0.45) 50%, rgba(208,176,96,0.35) 70%, transparent)',
          }}
        />
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
              initial={{ x: -228 }}
              animate={{ x: 0 }}
              exit={{ x: -228 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-screen w-[228px] z-50 lg:hidden overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #FDFBF8 0%, #FAF6F2 35%, #F7F2ED 70%, #F5EFE9 100%)',
                borderRight: '1px solid var(--border-soft)',
                boxShadow: '4px 0 40px rgba(77,55,46,0.12), 8px 0 60px rgba(166,119,99,0.06)',
              }}
            >
              <button
                onClick={closeMobile}
                className="absolute top-3 right-3 p-1 rounded z-20"
                style={{ color: 'var(--ink-muted)' }}
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
