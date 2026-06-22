import type { ModuleConfig, NavItem } from "@/lib/config/navigation";

/** All hrefs across a module config — used for longest-prefix active matching. */
export function allHrefsOf(config: ModuleConfig): string[] {
  return config.sections.flatMap((s) => s.items.map((i) => i.href));
}

/**
 * Active when the pathname equals the href, or is nested under it — unless a
 * *more specific* sibling href also matches (so /admin/sow doesn't light up
 * while you're on /admin/sow/123/edit if a deeper nav item owns that route).
 */
export function isItemActive(
  item: NavItem,
  pathname: string,
  allHrefs: string[],
): boolean {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(item.href + "/")) return false;
  for (const other of allHrefs) {
    if (other === item.href) continue;
    if (other.length <= item.href.length) continue;
    if (!other.startsWith(item.href + "/")) continue;
    if (pathname === other || pathname.startsWith(other + "/")) return false;
  }
  return true;
}

/** Best-matching nav item for the current path — drives the topbar title. */
export function activeNavItem(
  pathname: string,
  config: ModuleConfig,
): NavItem | null {
  let best: { item: NavItem; len: number } | null = null;
  for (const section of config.sections) {
    for (const item of section.items) {
      const hit = pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (!hit) continue;
      if (!best || item.href.length > best.len) best = { item, len: item.href.length };
    }
  }
  return best?.item ?? null;
}

/** Humanize a raw path segment for breadcrumb tails ("rate-cards" → "Rate cards"). */
export function humanizeSegment(seg: string): string {
  const decoded = decodeURIComponent(seg).replace(/[-_]/g, " ");
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}
