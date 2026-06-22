import { MOCK_TENANTS } from "@/mocks/admin/tenants";

/** Slugs reserved by seed mock tenants. */
export const SEED_TAKEN_SLUGS = MOCK_TENANTS.map((t) => t.id.replace(/^t-/, ""));

export function isSlugTaken(slug: string, extraTaken: string[] = []): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  return (
    SEED_TAKEN_SLUGS.includes(normalized) ||
    extraTaken.map((s) => s.toLowerCase()).includes(normalized)
  );
}

export function suggestSlugAlternatives(slug: string): string[] {
  const base = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  if (!base) return [];
  return [`${base}-2`, `${base}-hq`, `${base}-inc`].filter((s) => !isSlugTaken(s));
}

export function slugStatusHint(
  slug: string,
  extraTaken: string[] = [],
): { message: string; taken: boolean } {
  if (!slug.trim()) return { message: "", taken: false };
  if (isSlugTaken(slug, extraTaken)) {
    const alts = suggestSlugAlternatives(slug.replace(/-\d+$/, "").replace(/-(hq|inc)$/, ""));
    const altText = alts.length ? ` Try: ${alts.join(", ")}` : "";
    return { message: `⚠ Tenant ID already taken.${altText}`, taken: true };
  }
  return { message: "✓ available", taken: false };
}
