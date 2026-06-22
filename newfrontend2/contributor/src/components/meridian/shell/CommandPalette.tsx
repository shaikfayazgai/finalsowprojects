"use client";

/**
 * Meridian — CommandPalette (⌘K)
 *
 * Global launcher for pages, actions, and AI signals.
 * Default view is curated (recents + quick picks); typing filters everything.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Search,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import type { ModuleConfig, NavItem } from "@/lib/config/navigation";
import { getPaletteBundle } from "@/lib/admin/palette-config";
import { cn } from "@/lib/utils/cn";
import { useShell } from "./ShellContext";

type CommandGroup = "actions" | "pages" | "ai" | "recent";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: CommandGroup;
  icon: React.ReactNode;
  shortcut?: string;
}

type ScopeFilter = "all" | CommandGroup;

const RECENTS_KEY = "meridian-cmd-recents";
const MAX_RECENTS = 5;

const SCOPE_FILTERS: Array<{ id: ScopeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pages", label: "Go to" },
  { id: "actions", label: "Actions" },
  { id: "ai", label: "AI assist" },
];

const GROUP_LABELS: Record<CommandGroup, string> = {
  recent: "Recent",
  actions: "Quick actions",
  pages: "Go to",
  ai: "AI assist",
};

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENTS);
  } catch {
    return [];
  }
}

function pushRecent(href: string) {
  try {
    const next = [href, ...readRecents().filter((h) => h !== href)].slice(0, MAX_RECENTS);
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable */
  }
}

function buildPageItems(config: ModuleConfig): CommandItem[] {
  const items: CommandItem[] = [];
  for (const section of config.sections) {
    if (section.zone === "utility") continue;
    for (const navItem of section.items) {
      if (navItem.disabled) continue;
      items.push(navItemToCommandItem(navItem, section.title));
    }
  }
  return items;
}

function navItemToCommandItem(item: NavItem, sectionTitle?: string): CommandItem {
  const Icon = item.icon;
  return {
    id: `page-${item.href}`,
    label: item.label,
    hint: sectionTitle,
    href: item.href,
    group: "pages",
    icon: <Icon className="h-4 w-4" strokeWidth={1.75} />,
    shortcut: item.shortcut,
  };
}

function scoreItem(item: CommandItem, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const label = item.label.toLowerCase();
  const hint = (item.hint ?? "").toLowerCase();
  const href = item.href.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 80;
  if (hint.startsWith(q)) return 60;
  if (hint.includes(q)) return 50;
  if (href.includes(q)) return 40;
  return 0;
}

function highlightMatch(label: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return label;
  const idx = label.toLowerCase().indexOf(trimmed.toLowerCase());
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="rounded-[2px] bg-[color-mix(in_oklab,var(--color-brand)_12%,transparent)] text-foreground font-semibold not-italic">
        {label.slice(idx, idx + trimmed.length)}
      </mark>
      {label.slice(idx + trimmed.length)}
    </>
  );
}

function buildDefaultGroups(
  pageItems: CommandItem[],
  recentHrefs: string[],
  quickActions: CommandItem[],
  aiActions: CommandItem[],
  suggestedHrefs: string[],
): Array<{ id: CommandGroup; label: string; items: CommandItem[] }> {
  const byHref = new Map<string, CommandItem>();
  for (const item of [...quickActions, ...pageItems, ...aiActions]) {
    byHref.set(item.href, item);
  }

  const groups: Array<{ id: CommandGroup; label: string; items: CommandItem[] }> = [];

  const recents = recentHrefs
    .map((href) => byHref.get(href))
    .filter((item): item is CommandItem => !!item)
    .map((item) => ({ ...item, id: `recent-${item.href}`, group: "recent" as const }));

  if (recents.length > 0) {
    groups.push({ id: "recent", label: GROUP_LABELS.recent, items: recents });
  }

  groups.push({ id: "actions", label: GROUP_LABELS.actions, items: quickActions });

  const suggested = suggestedHrefs
    .map((href) => pageItems.find((p) => p.href === href))
    .filter((item): item is CommandItem => !!item)
    .slice(0, 8);

  if (suggested.length > 0) {
    groups.push({ id: "pages", label: GROUP_LABELS.pages, items: suggested });
  }

  groups.push({ id: "ai", label: GROUP_LABELS.ai, items: aiActions });

  return groups;
}

interface CommandPaletteProps {
  config: ModuleConfig;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ config }) => {
  const { commandOpen, openCommand, closeCommand } = useShell();
  const router = useRouter();
  const palette = React.useMemo(() => getPaletteBundle(config), [config]);
  const quickActions = palette.quickActions as CommandItem[];
  const aiActions = palette.aiActions as CommandItem[];
  const [query, setQuery] = React.useState("");
  const [scope, setScope] = React.useState<ScopeFilter>("all");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [recentHrefs, setRecentHrefs] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (commandOpen) setRecentHrefs(readRecents());
  }, [commandOpen]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommand();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCommand]);

  React.useEffect(() => {
    if (!commandOpen) {
      setQuery("");
      setScope("all");
      setActiveIndex(0);
    } else {
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [commandOpen]);

  const pageItems = React.useMemo(() => buildPageItems(config), [config]);
  const allItems = React.useMemo(
    () => [...quickActions, ...pageItems, ...aiActions],
    [quickActions, pageItems, aiActions],
  );

  const hasQuery = !!query.trim();

  const grouped = React.useMemo(() => {
    if (!hasQuery) {
      const defaults = buildDefaultGroups(
        pageItems,
        recentHrefs,
        quickActions,
        aiActions,
        palette.suggestedHrefs,
      );
      if (scope === "all") return defaults;
      return defaults.filter((g) => g.id === scope);
    }

    const q = query.trim();
    const matched = allItems
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
      .map(({ item }) => item);

    const scoped =
      scope === "all" ? matched : matched.filter((item) => item.group === scope);

    const groups: Array<{ id: CommandGroup; label: string; items: CommandItem[] }> = [
      { id: "actions", label: GROUP_LABELS.actions, items: [] },
      { id: "pages", label: GROUP_LABELS.pages, items: [] },
      { id: "ai", label: GROUP_LABELS.ai, items: [] },
    ];

    for (const item of scoped) {
      groups.find((g) => g.id === item.group)?.items.push(item);
    }

    return groups.filter((g) => g.items.length > 0);
  }, [allItems, aiActions, hasQuery, pageItems, palette.suggestedHrefs, query, quickActions, recentHrefs, scope]);

  const flatList = React.useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  React.useEffect(() => {
    if (activeIndex >= flatList.length) setActiveIndex(Math.max(flatList.length - 1, 0));
  }, [flatList.length, activeIndex]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, scope]);

  function handleSelect(item: CommandItem) {
    pushRecent(item.href);
    closeCommand();
    router.push(item.href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(Math.max(flatList.length - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatList[activeIndex];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeCommand();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const order = SCOPE_FILTERS.map((f) => f.id);
      const idx = order.indexOf(scope);
      const next = e.shiftKey ? order[(idx - 1 + order.length) % order.length] : order[(idx + 1) % order.length];
      setScope(next);
    }
  }

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!mounted || !commandOpen || typeof document === "undefined") return null;

  let flatIndex = -1;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-start justify-center px-4 pt-[12vh]"
      role="presentation"
    >
      <div
        aria-hidden
        onClick={closeCommand}
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        style={{ animation: "meridian-fade-in var(--duration-slow) var(--ease-standard)" }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and command palette"
        className={cn(
          "relative w-full max-w-[560px] rounded-xl bg-surface border border-stroke shadow-modal overflow-hidden",
          "flex flex-col max-h-[min(68vh,640px)]",
        )}
        style={{ animation: "meridian-scale-in var(--duration-slow) var(--ease-standard)" }}
      >
        {/* Search header */}
        <div className="shrink-0 border-b border-stroke-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <Search className="h-[18px] w-[18px] text-text-tertiary shrink-0" strokeWidth={1.75} aria-hidden />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded
              aria-controls="command-palette-list"
              aria-activedescendant={
                flatList[activeIndex] ? `cmd-option-${flatList[activeIndex].id}` : undefined
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, actions, or AI assist…"
              className="flex-1 min-w-0 bg-transparent font-body text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className={cn(
                  "inline-flex items-center justify-center h-7 w-7 rounded-md shrink-0",
                  "text-text-tertiary hover:text-foreground",
                  "transition-colors duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                )}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center font-mono text-[10px] font-medium text-text-tertiary px-1.5 py-0.5 rounded border border-stroke-subtle">
              esc
            </kbd>
          </div>
          <p className="mt-2 font-body text-[11px] text-text-tertiary pl-[30px]">
            {palette.subtitle}
          </p>
        </div>

        {/* Scope filters */}
        <div className="shrink-0 px-4 py-2.5 border-b border-stroke-subtle flex items-center gap-1.5 overflow-x-auto">
          {SCOPE_FILTERS.map((filter) => {
            const active = scope === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setScope(filter.id)}
                className={cn(
                  "shrink-0 h-7 px-2.5 rounded-md font-body text-[12px] font-semibold transition-colors duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                  active
                    ? "bg-surface text-foreground border border-stroke shadow-[var(--shadow-xs)]"
                    : "text-text-tertiary hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            );
          })}
          <span className="ml-auto shrink-0 font-body text-[11px] text-text-tertiary tabular-nums">
            {flatList.length} {flatList.length === 1 ? "result" : "results"}
          </span>
        </div>

        {/* Results */}
        <div ref={listRef} id="command-palette-list" role="listbox" className="overflow-y-auto flex-1 py-2">
          {flatList.length === 0 && (
            <EmptyState
              query={query}
              scope={scope}
              onPick={handleSelect}
              onClearScope={() => setScope("all")}
              quickActions={quickActions}
            />
          )}

          {grouped.map((group) => (
            <section key={group.id} aria-label={group.label} className="px-2 pb-1">
              <p className="px-3 pt-1 pb-1.5 font-body text-[10.5px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                {group.label}
              </p>
              <ul role="presentation" className="space-y-0.5">
                {group.items.map((item) => {
                  flatIndex += 1;
                  const isActive = flatIndex === activeIndex;
                  const myIndex = flatIndex;
                  return (
                    <li key={item.id}>
                      <button
                        id={`cmd-option-${item.id}`}
                        role="option"
                        type="button"
                        aria-selected={isActive}
                        data-cmd-index={myIndex}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(myIndex)}
                        className={cn(
                          "group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "font-body transition-[background,border-color,box-shadow] duration-fast ease-standard",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                          isActive
                            ? "bg-surface border border-stroke shadow-[var(--shadow-xs)]"
                            : "border border-transparent text-text-secondary hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "shrink-0 transition-colors duration-fast",
                            isActive ? "text-brand" : "text-text-tertiary group-hover:text-foreground",
                          )}
                          aria-hidden
                        >
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold text-foreground truncate">
                            {highlightMatch(item.label, query)}
                          </span>
                          {item.hint && (
                            <span className="block mt-0.5 text-[11.5px] text-text-tertiary truncate">
                              {item.hint}
                            </span>
                          )}
                        </span>
                        {item.shortcut ? (
                          <ShortcutChip text={item.shortcut} />
                        ) : isActive ? (
                          <CornerDownLeft
                            className="h-3.5 w-3.5 text-text-tertiary shrink-0"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {!hasQuery && scope === "all" && (
            <p className="px-5 py-3 font-body text-[11.5px] text-text-tertiary text-center">
              Type to search all {allItems.length} destinations
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-2.5 border-t border-stroke-subtle flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[10.5px] text-text-tertiary">
          <Hint keys={[<ArrowUp key="u" className="h-2.5 w-2.5" />, <ArrowDown key="d" className="h-2.5 w-2.5" />]} label="navigate" />
          <Hint keys={["↵"]} label="open" />
          <Hint keys={["tab"]} label="filter" />
          <Hint keys={["esc"]} label="close" />
        </div>
      </div>
    </div>,
    document.body,
  );
};

const ShortcutChip: React.FC<{ text: string }> = ({ text }) => {
  const keys = text.split(/\s+/);
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded",
            "font-mono text-[10px] font-semibold tabular-nums",
            "text-text-tertiary border border-stroke-subtle bg-surface",
          )}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
};

const Hint: React.FC<{ keys: React.ReactNode[]; label: string }> = ({ keys, label }) => (
  <span className="inline-flex items-center gap-1">
    <span className="inline-flex items-center gap-0.5">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded font-mono text-[10px] border border-stroke-subtle bg-surface"
        >
          {key}
        </kbd>
      ))}
    </span>
    {label}
  </span>
);

const EmptyState: React.FC<{
  query: string;
  scope: ScopeFilter;
  onPick: (item: CommandItem) => void;
  onClearScope: () => void;
  quickActions: CommandItem[];
}> = ({ query, scope, onPick, onClearScope, quickActions }) => (
  <div className="px-6 py-10 text-center">
    <p className="font-body text-[14px] font-semibold text-foreground">
      {query.trim() ? (
        <>
          No matches for{" "}
          <span className="font-mono text-text-tertiary">&quot;{query.trim()}&quot;</span>
        </>
      ) : (
        "Nothing in this filter"
      )}
    </p>
    <p className="font-body text-[12.5px] text-text-tertiary mt-1.5 mb-5">
      {query.trim()
        ? "Try a shorter keyword or switch filters."
        : "Choose another category or start typing."}
    </p>
    <div className="flex flex-wrap justify-center gap-2">
      {scope !== "all" && (
        <button
          type="button"
          onClick={onClearScope}
          className={cn(
            "inline-flex items-center h-8 px-3 rounded-md border border-stroke",
            "font-body text-[12px] font-semibold text-foreground",
            "hover:border-stroke-strong transition-colors duration-fast",
          )}
        >
          Show all
        </button>
      )}
      {quickActions.slice(0, 2).map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-stroke",
            "font-body text-[12px] font-semibold text-foreground",
            "hover:border-stroke-strong transition-colors duration-fast",
          )}
        >
          <span className="text-text-tertiary" aria-hidden>
            {s.icon}
          </span>
          {s.label}
        </button>
      ))}
    </div>
  </div>
);
