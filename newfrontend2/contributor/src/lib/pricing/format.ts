/**
 * Currency formatting — consolidates the duplicated `fmtINR` helpers
 * (project page, billing invoices) in one importable place.
 *
 * INR rendered with the Indian comma grouping (e.g. ₹1,20,000).
 */

/** Major-unit rupees (integer). 70000 → "₹70,000". */
export function formatINR(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  return `₹${safe.toLocaleString("en-IN")}`;
}

/** Minor-unit paise. 7000000 → "₹70,000". */
export function formatINRMinor(minor: number): string {
  const safe = Number.isFinite(minor) ? minor : 0;
  return formatINR(safe / 100);
}

/** Render a percentage with one decimal. 31.234 → "31.2%". */
export function formatPct(pct: number): string {
  const safe = Number.isFinite(pct) ? pct : 0;
  return `${(Math.round(safe * 10) / 10).toFixed(1)}%`;
}
