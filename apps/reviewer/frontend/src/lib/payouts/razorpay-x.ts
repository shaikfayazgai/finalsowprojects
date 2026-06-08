/**
 * Razorpay X payout adapter (M17b).
 *
 * Razorpay X is Razorpay's outbound-payouts product (separate from the
 * Payments product). It supports:
 *   - bank_account, vpa, card transfer methods
 *   - Webhook events for payout state changes
 *
 * Phase 1 ships in two modes:
 *   - mock (default): no external calls; returns a synthetic ref so
 *     the rest of the pipeline can be exercised in dev without
 *     Razorpay credentials.
 *   - live: real HTTP calls to api.razorpay.com using credentials from
 *     env (RAZORPAY_X_KEY_ID + RAZORPAY_X_KEY_SECRET).
 *
 * The mode is controlled by PAYOUTS_RAZORPAY_X_MODE; defaults to 'mock'.
 *
 * Reference: https://razorpay.com/docs/api/x/payouts
 */

import crypto from "node:crypto";

export type RazorpayXMode = "live" | "mock";

export interface CreatePayoutParams {
  /** Internal payout id — surfaced to Razorpay as `reference_id`. */
  payoutId: string;
  /** Amount in smallest currency unit (paise for INR). */
  amountMinor: number;
  /** ISO 4217 currency code. Razorpay X India: must be 'INR'. */
  currency: string;
  /** The payout method to use (already verified). */
  payoutMethod: {
    kind: "bank_in" | "upi" | "paypal" | "razorpay_x";
    payload: Record<string, unknown>;
  };
  /** Contributor display name for the rail metadata. */
  contributorName: string;
  /** Tenant display name shown to the contributor in their bank narration. */
  tenantName: string;
}

export interface CreatePayoutResult {
  /** Razorpay's payout id (or a mock equivalent). */
  externalRef: string;
  /** Synthetic immediate state. Real flow waits for webhooks. */
  initialStatus: "processing" | "queued";
}

export class RazorpayXAdapterError extends Error {
  constructor(message: string, public code: "config" | "validation" | "rail") {
    super(message);
    this.name = "RazorpayXAdapterError";
  }
}

/* ───────────────────────── Mode resolution ───────────────────────── */

export function razorpayXMode(): RazorpayXMode {
  const raw = process.env.PAYOUTS_RAZORPAY_X_MODE?.trim().toLowerCase();
  if (raw === "live") return "live";
  return "mock";
}

/* ───────────────────────── Mock implementation ─────────────────── */

/**
 * Mock returns a deterministic synthetic external ref so smoke tests
 * can assert on it. Format: `mock_pyt_<sha256(payoutId).slice(0,16)>`.
 */
function mockCreatePayout(params: CreatePayoutParams): CreatePayoutResult {
  const hash = crypto
    .createHash("sha256")
    .update(params.payoutId)
    .digest("hex")
    .slice(0, 16);
  return {
    externalRef: `mock_pyt_${hash}`,
    initialStatus: "processing",
  };
}

/* ───────────────────────── Live implementation ─────────────────── */

interface RazorpayXFundAccountIdResolution {
  fundAccountId: string;
  /** Whether resolution required creating a temporary fund account. */
  ephemeral: boolean;
}

async function resolveFundAccountId(
  params: CreatePayoutParams,
): Promise<RazorpayXFundAccountIdResolution> {
  // razorpay_x kind already carries fundAccountId in payload
  if (params.payoutMethod.kind === "razorpay_x") {
    const id = params.payoutMethod.payload.fundAccountId;
    if (typeof id !== "string") {
      throw new RazorpayXAdapterError(
        "razorpay_x payout method missing fundAccountId",
        "validation",
      );
    }
    return { fundAccountId: id, ephemeral: false };
  }
  // For bank_in / upi: live mode would create an ephemeral
  // contact + fund account on the fly. Phase 1 does NOT exercise this
  // path — instructing the route layer to surface a clear error.
  throw new RazorpayXAdapterError(
    "Live Razorpay X mode requires razorpay_x payout method kind in Phase 1; bank_in/upi rail integration is a Phase 2 follow-up.",
    "config",
  );
}

async function liveCreatePayout(
  params: CreatePayoutParams,
): Promise<CreatePayoutResult> {
  const keyId = process.env.RAZORPAY_X_KEY_ID;
  const keySecret = process.env.RAZORPAY_X_KEY_SECRET;
  const accountNumber = process.env.RAZORPAY_X_ACCOUNT_NUMBER;
  if (!keyId || !keySecret || !accountNumber) {
    throw new RazorpayXAdapterError(
      "Razorpay X env vars missing: RAZORPAY_X_KEY_ID / RAZORPAY_X_KEY_SECRET / RAZORPAY_X_ACCOUNT_NUMBER",
      "config",
    );
  }
  if (params.currency !== "INR") {
    throw new RazorpayXAdapterError(
      `Razorpay X India only supports INR; got ${params.currency}`,
      "validation",
    );
  }
  const { fundAccountId } = await resolveFundAccountId(params);
  const body = {
    account_number: accountNumber,
    fund_account_id: fundAccountId,
    amount: params.amountMinor,
    currency: params.currency,
    mode: params.payoutMethod.kind === "upi" ? "UPI" : "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: params.payoutId,
    narration: `${params.tenantName.slice(0, 24)} payout`,
    notes: {
      glimmoraPayoutId: params.payoutId,
      contributorName: params.contributorName,
    },
  };
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      "X-Payout-Idempotency": params.payoutId,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new RazorpayXAdapterError(
      `Razorpay X HTTP ${res.status}: ${errBody.slice(0, 240)}`,
      "rail",
    );
  }
  const data = (await res.json()) as {
    id?: string;
    status?: string;
  };
  if (!data.id) {
    throw new RazorpayXAdapterError(
      "Razorpay X response missing payout id",
      "rail",
    );
  }
  // Razorpay statuses: queued | processing | processed | rejected | cancelled | failed
  const initialStatus: CreatePayoutResult["initialStatus"] =
    data.status === "queued" ? "queued" : "processing";
  return { externalRef: data.id, initialStatus };
}

/* ───────────────────────── Public entry point ─────────────────── */

/**
 * Create a payout on the configured rail. Mode-aware: dev/test get a
 * synthetic ref; staging/prod hit the real Razorpay X API.
 *
 * The caller is responsible for:
 *   - Setting status='processing' in our DB after this returns
 *   - Wiring the webhook to advance to 'sent' / 'failed'
 */
export async function createRazorpayPayout(
  params: CreatePayoutParams,
): Promise<CreatePayoutResult> {
  const mode = razorpayXMode();
  if (mode === "mock") return mockCreatePayout(params);
  return liveCreatePayout(params);
}

/* ───────────────── Webhook event status mapping ───────────────── */

/**
 * Map a Razorpay X payout event type + status to our internal
 * PayoutStatus transition target.
 *
 * Razorpay events of interest (per their docs):
 *   payout.created   → no-op (we already set processing at request time)
 *   payout.processed → sent (terminal success)
 *   payout.reversed  → failed (terminal failure; funds returned)
 *   payout.failed    → failed
 *   payout.rejected  → failed
 *   payout.queued    → processing (informational)
 *
 * Returns null when the event doesn't drive a state change.
 */
export function mapRazorpayPayoutEvent(
  eventType: string,
): { target: "sent" | "failed" | null; isTerminal: boolean } {
  switch (eventType) {
    case "payout.processed":
      return { target: "sent", isTerminal: true };
    case "payout.reversed":
    case "payout.failed":
    case "payout.rejected":
      return { target: "failed", isTerminal: true };
    case "payout.created":
    case "payout.queued":
      return { target: null, isTerminal: false };
    default:
      return { target: null, isTerminal: false };
  }
}
