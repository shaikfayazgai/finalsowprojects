"use client";

/**
 * Meridian — ContributorTopbar
 *
 * Visually identical to EnterpriseTopbar. The contributor portal doesn't
 * use the ShellContext provider, so this component owns its own mobile-menu
 * trigger (via useSidebarStore) and a local search-palette overlay.
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ [≡]  [⌕ Search tasks, submissions…    ⌘K]              [🔔] [user]  │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * Search button opens a lightweight contributor-scoped command palette.
 * Bell links to /contributor/messages (closest contributor-side inbox).
 * Account dropdown uses the shared AccountMenu primitive.
 */

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import type { ModuleConfig, NavItem } from "@/lib/config/navigation";
import { AccountMenu } from "./AccountMenu";

interface ContributorTopbarProps {
  config: ModuleConfig;
  unreadNotifications?: number;
}

export const ContributorTopbar: React.FC<ContributorTopbarProps> = ({
  config,
  unreadNotifications = 0,
}) => {
  const { data: session } = useSession();
  const { openMobile } = useSidebarStore();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const scrolled = useScrolled(4);

  // Keyboard ⌘K / Ctrl+K opens the palette
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen]);

  // Build the operator object the AccountMenu expects. Skip portal-placeholder
  // names like "Contributor" so we never render the portal name as a person's
  // name in the menu trigger.
  const rawName = (session?.user?.name as string | undefined) || "";
  const emailPrefix = (session?.user?.email as string | undefined)?.split("@")[0];
  const isPlaceholder = /^(contributor|user|operator)$/i.test(rawName.trim());
  const displayName = (!isPlaceholder && rawName) || emailPrefix || "Operator";
  const initials =
    (session?.user as { initials?: string } | undefined)?.initials ||
    displayName
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "OP";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 h-[60px] flex items-center gap-3 px-4 lg:px-6",
          "bg-bg border-b border-stroke-subtle",
          "transition-shadow duration-base ease-standard",
          scrolled && "shadow-[var(--shadow-xs)]",
        )}
      >
        {/* Left side — mobile menu + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={openMobile}
            aria-label="Open navigation"
            className={cn(
              "lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-md",
              "text-text-secondary hover:bg-surface-hover hover:text-foreground",
              "transition-colors duration-fast ease-standard",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            )}
          >
            <Menu className="h-4 w-4" />
          </button>

          <SearchBar onClick={() => setPaletteOpen(true)} />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <AccountMenu
            operator={{
              name: displayName,
              initials,
              email: session?.user?.email ?? undefined,
            }}
            compact
            profileHref="/contributor/profile"
            settingsHref="/contributor/settings"
            showSettings
            notificationsHref="/contributor/notifications"
          />
        </div>
      </header>

      {paletteOpen && (
        <ContributorCommandPalette
          config={config}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </>
  );
};

/* ─────────────────────── Search bar ─────────────────────── */

const SearchBar: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Search or ask AI"
    aria-keyshortcuts="Meta+K Control+K"
    className={cn(
      "flex items-center gap-2 h-9 pl-3 pr-1.5 rounded-md min-w-0",
      "w-full max-w-[420px]",
      "bg-bg-subtle text-text-secondary",
      "transition-colors duration-fast ease-standard",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
    )}
  >
    <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
    <span className="flex-1 text-left font-body text-[12.5px] truncate">
      Search tasks, submissions, projects…
    </span>
    <kbd
      className={cn(
        "font-mono text-[9.5px] font-semibold text-text-tertiary",
        "bg-surface px-1.5 py-0.5 rounded border border-stroke-subtle",
      )}
    >
      ⌘K
    </kbd>
  </button>
);

/* ─────────────────────── Hook ─────────────────────── */

function useScrolled(threshold = 4): boolean {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

/* ─────────────────────── Lightweight command palette ─────────────────────── */

/**
 * Contributor-scoped palette. Lists every nav item from the config plus a few
 * quick actions. No fuzzy-search rank — substring match is enough.
 */
function ContributorCommandPalette({
  config,
  onClose,
}: {
  config: ModuleConfig;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  const pages: NavItem[] = React.useMemo(
    () => config.sections.flatMap((s) => s.items),
    [config.sections],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.label.toLowerCase().includes(q));
  }, [pages, query]);

  function go(href: string) {
    onClose();
    if (href !== pathname) router.push(href);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-xl mx-4 rounded-xl bg-surface ring-1 ring-stroke-subtle shadow-[var(--shadow-modal)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-stroke-subtle">
          <Search className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions…"
            className="flex-1 font-body text-[13.5px] text-foreground placeholder:text-text-tertiary bg-transparent border-0 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                e.preventDefault();
                go(filtered[0].href);
              }
            }}
          />
          <kbd className="font-mono text-[10px] font-semibold text-text-tertiary bg-bg-subtle px-1.5 py-0.5 rounded">
            Esc
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center font-body text-[12.5px] text-text-tertiary">
              Nothing matches that.
            </p>
          ) : (
            <ul role="list" className="py-1">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2 text-left",
                        "font-body text-[13px] text-foreground",
                        "hover:bg-[var(--state-hover)]",
                        "transition-colors duration-fast",
                      )}
                    >
                      <Icon className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="font-mono text-[10.5px] text-text-tertiary truncate">
                        {item.href}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
