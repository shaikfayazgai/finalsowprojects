import ISO6391 from "iso-639-1";

/**
 * Validates whether a string is a recognised human language.
 *
 * Accepts (case-insensitive):
 * - English language name ("English", "Mandarin")
 * - Native language name ("Español", "Français")
 * - ISO 639-1 two-letter code ("en", "fr")
 *
 * Backed by the ISO 639-1 standard (~180 languages).
 */
export function isValidLanguageName(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Two-letter code path
  if (trimmed.length === 2 && ISO6391.validate(trimmed.toLowerCase())) {
    return true;
  }

  // Name path (English or native). getCode returns "" for unknown names.
  return ISO6391.getCode(trimmed) !== "";
}

/**
 * Returns the canonical English name for a language input, or the original
 * trimmed input if it's not recognised. Use after validation to display a
 * consistent label (e.g. "english" → "English", "es" → "Spanish").
 */
export function canonicalLanguageName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Two-letter code path
  if (trimmed.length === 2 && ISO6391.validate(trimmed.toLowerCase())) {
    return ISO6391.getName(trimmed.toLowerCase());
  }

  // Name path
  const code = ISO6391.getCode(trimmed);
  return code ? ISO6391.getName(code) : trimmed;
}

/**
 * Best-effort suggestion for a typo. Returns up to 3 closest English names
 * using simple substring + Levenshtein-ish heuristic. Empty list if nothing
 * is close enough.
 */
export function suggestLanguages(input: string, max = 3): string[] {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];

  const names = ISO6391.getAllNames();

  // 1. Prefix matches first
  const prefixHits = names.filter((n) => n.toLowerCase().startsWith(q));
  if (prefixHits.length > 0) return prefixHits.slice(0, max);

  // 2. Substring matches
  const substringHits = names.filter((n) => n.toLowerCase().includes(q));
  if (substringHits.length > 0) return substringHits.slice(0, max);

  // 3. Distance-based fallback (only for inputs >= 3 chars to avoid noise)
  if (q.length < 3) return [];
  const scored = names
    .map((n) => ({ n, d: editDistance(q, n.toLowerCase()) }))
    .filter((x) => x.d <= Math.max(2, Math.floor(q.length / 3)))
    .sort((a, b) => a.d - b.d);
  return scored.slice(0, max).map((x) => x.n);
}

// Tiny Levenshtein implementation (sufficient for short language names).
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}
