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

const INVOICES: InvoiceDetail[] = [
  {
    id: "INV-3082",
    project: "Reporting V2",
    amountMinor: 24_000_000,
    status: "paid",
    issuedAt: "2026-05-28T00:00:00Z",
    paidAt: "2026-05-28T00:00:00Z",
    periodStart: "2026-05-01T00:00:00Z",
    periodEnd: "2026-05-31T00:00:00Z",
    subtotalMinor: 20_869_600,
    platformFeeMinor: 3_130_400,
    totalMinor: 24_000_000,
    paymentMethod: "Bank transfer to Acme corporate account",
    paymentReference: "TRX-9421",
    lineItems: [
      {
        task: "Connect Snowflake source",
        role: "Backend",
        skillLevel: "Python L2",
        hours: 8,
        rateMinor: 150_000,
        amountMinor: 1_200_000,
      },
      {
        task: "ETL spec",
        role: "Backend",
        skillLevel: "SQL L3",
        hours: 12,
        rateMinor: 200_000,
        amountMinor: 2_400_000,
      },
      {
        task: "Data validation suite",
        role: "Data",
        skillLevel: "Python L2",
        hours: 16,
        rateMinor: 150_000,
        amountMinor: 2_400_000,
      },
    ],
  },
  {
    id: "INV-3081",
    project: "Helios Q3",
    amountMinor: 18_000_000,
    status: "pending",
    issuedAt: "2026-05-25T00:00:00Z",
    paidAt: null,
    periodStart: "2026-05-01T00:00:00Z",
    periodEnd: "2026-05-31T00:00:00Z",
    subtotalMinor: 15_652_200,
    platformFeeMinor: 2_347_800,
    totalMinor: 18_000_000,
    paymentMethod: "Bank transfer to Acme corporate account",
    paymentReference: null,
    lineItems: [
      {
        task: "Date picker accessibility",
        role: "Designer",
        skillLevel: "Figma L3",
        hours: 18,
        rateMinor: 180_000,
        amountMinor: 3_240_000,
      },
      {
        task: "Search shortcuts UX",
        role: "Designer",
        skillLevel: "Figma L2",
        hours: 12,
        rateMinor: 120_000,
        amountMinor: 1_440_000,
      },
    ],
  },
  {
    id: "INV-3080",
    project: "Auth modernize",
    amountMinor: 9_600_000,
    status: "paid",
    issuedAt: "2026-05-20T00:00:00Z",
    paidAt: "2026-05-22T00:00:00Z",
    periodStart: "2026-04-15T00:00:00Z",
    periodEnd: "2026-05-15T00:00:00Z",
    subtotalMinor: 8_347_800,
    platformFeeMinor: 1_252_200,
    totalMinor: 9_600_000,
    paymentMethod: "Bank transfer to Acme corporate account",
    paymentReference: "TRX-9402",
    lineItems: [
      {
        task: "Auth modal redesign",
        role: "Designer",
        skillLevel: "Figma L2",
        hours: 14,
        rateMinor: 120_000,
        amountMinor: 1_680_000,
      },
    ],
  },
  {
    id: "INV-3079",
    project: "Helios Q3",
    amountMinor: 4_500_000,
    status: "overdue",
    issuedAt: "2026-04-30T00:00:00Z",
    paidAt: null,
    periodStart: "2026-04-01T00:00:00Z",
    periodEnd: "2026-04-30T00:00:00Z",
    subtotalMinor: 3_913_000,
    platformFeeMinor: 587_000,
    totalMinor: 4_500_000,
    paymentMethod: "Bank transfer to Acme corporate account",
    paymentReference: null,
    lineItems: [
      {
        task: "Helios design review prep",
        role: "Designer",
        skillLevel: "Figma L3",
        hours: 25,
        rateMinor: 180_000,
        amountMinor: 4_500_000,
      },
    ],
  },
];

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
  return INVOICES.map((inv) => {
    const { subtotalMinor, platformFeeMinor, totalMinor, paymentMethod, paymentReference, lineItems, ...rest } = inv;
    return applyOverlay(rest);
  });
}

export function listRecentInvoicesMock(limit = 5): InvoiceSummary[] {
  return listInvoicesMock().slice(0, limit);
}

export function getInvoiceMock(id: string): InvoiceDetail | undefined {
  const needle = id.toUpperCase();
  const hit = INVOICES.find((i) => i.id.toUpperCase() === needle);
  return hit ? applyOverlay(hit) : undefined;
}
