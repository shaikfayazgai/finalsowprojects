/**
 * Spec-shaped invoice mock — used until an invoices endpoint ships.
 *
 * Per user direction: invoices are rebuilt to spec shape with mock data
 * (no real backend yet). Once an /api/invoices endpoint lands, the
 * consumers swap to a TanStack hook and these literals get retired.
 */

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface InvoiceSummary {
  id: string;
  project: string;
  amountMinor: number;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
}

export interface InvoiceLineItem {
  task: string;
  role: string;
  skillLevel: string;
  hours: number;
  rateMinor: number;
  amountMinor: number;
}

export interface InvoiceDetail extends InvoiceSummary {
  subtotalMinor: number;
  platformFeeMinor: number;
  totalMinor: number;
  paymentMethod: string;
  paymentReference: string | null;
  lineItems: InvoiceLineItem[];
}

// Emptied: no real /api/invoices endpoint yet, so end users see a clean empty
// state rather than fabricated invoices. Shape/types preserved for when the
// API lands and consumers swap to a TanStack hook.
const INVOICES: InvoiceDetail[] = [];

/* ────────────────── client-side payment overlay ────────────────── */
// Phase-1 mock pattern: invoices are static, but "Mark as paid" must
// feel real. Overlay layer persists payment recordings to localStorage
// so the list, detail, and dashboard all agree across page navigations
// and reloads. Drops out cleanly once /api/invoices ships.

const OVERLAY_KEY = "glimmora.mock.invoicePayments.v1";

export interface MockInvoicePayment {
  paidAt: string;
  reference: string;
  method?: string;
}

type Overlay = Record<string, MockInvoicePayment>;

function readOverlay(): Overlay {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERLAY_KEY);
    return raw ? (JSON.parse(raw) as Overlay) : {};
  } catch {
    return {};
  }
}

function writeOverlay(o: Overlay): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OVERLAY_KEY, JSON.stringify(o));
    window.dispatchEvent(new CustomEvent("glimmora:invoice-payment"));
  } catch {
    // best-effort; demo seed
  }
}

function applyOverlay<T extends InvoiceDetail | InvoiceSummary>(inv: T): T {
  const overlay = readOverlay()[inv.id];
  if (!overlay) return inv;
  const next = { ...inv, status: "paid" as InvoiceStatus, paidAt: overlay.paidAt };
  if ("paymentReference" in inv) {
    (next as InvoiceDetail).paymentReference = overlay.reference;
    if (overlay.method) (next as InvoiceDetail).paymentMethod = overlay.method;
  }
  return next;
}

export function recordInvoicePayment(
  id: string,
  payment: MockInvoicePayment,
): void {
  const o = readOverlay();
  o[id.toUpperCase()] = payment;
  writeOverlay(o);
}

export function listInvoicesMock(): InvoiceSummary[] {
  // INVOICES is empty (no real /api/invoices endpoint yet) so this resolves to
  // an empty list — end users see a clean empty state instead of fabricated
  // invoices. Once the API ships, consumers swap to a TanStack hook here.
  return INVOICES.map((inv) => {
    const { subtotalMinor, platformFeeMinor, totalMinor, paymentMethod, paymentReference, lineItems, ...rest } = inv;
    return applyOverlay(rest);
  });
}

export function listRecentInvoicesMock(limit = 5): InvoiceSummary[] {
  return listInvoicesMock().slice(0, limit);
}

export function getInvoiceMock(id: string): InvoiceDetail | undefined {
  // No real invoice-detail endpoint yet, and INVOICES is empty — this resolves
  // to undefined so the page renders its "Invoice not found" state instead of a
  // fabricated invoice. Wiring stays in place for when /api/invoices ships.
  const needle = id.toUpperCase();
  const hit = INVOICES.find((i) => i.id.toUpperCase() === needle);
  return hit ? applyOverlay(hit) : undefined;
}
