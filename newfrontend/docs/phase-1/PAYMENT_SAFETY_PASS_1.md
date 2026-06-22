# Payment Safety Hardening — Pass 1

**Scope:** Razorpay webhook signature verification · `PaymentOrder` + `PaymentEvent` Prisma models · milestone-payout validation gate on order creation · idempotent event handling.
**Status:** Webhook receiver production-shape. Closes the silent-fraud risk that existed before.

---

## What shipped in this pass

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | `PaymentOrder` (order-intent persistence) + `PaymentEvent` (idempotent webhook audit log) models with indexes. |
| `prisma/migrations/20260524130000_add_payment_models/migration.sql` | DDL for both tables + indexes. |
| `src/lib/razorpay/verify-signature.ts` | HMAC-SHA256 signature verification with constant-time comparison (`crypto.timingSafeEqual`). Returns structured result `{ valid, reason }` for monitoring. |
| `src/app/api/razorpay/webhook/route.ts` | Webhook receiver. Reads raw body → verifies signature → idempotently persists event → applies lifecycle effect to `PaymentOrder` only on verified events. |
| `src/app/api/razorpay/create-order/route.ts` (rewritten) | Authorized + Zod-validated + milestone-payout gate + persisted intent + idempotent against duplicate `razorpayOrderId`. |

---

## The four critical invariants enforced

1. **Signature verification before trust.** Raw body is captured (no JSON parse/stringify round-trip) and HMAC-SHA256-verified with `RAZORPAY_WEBHOOK_SECRET` using `timingSafeEqual` to prevent signature-leak timing attacks.

2. **Idempotent event persistence.** Every event is upserted on `razorpayEventId` (Razorpay's `x-razorpay-event-id` header). Retried deliveries — which Razorpay does aggressively — become no-ops. When no event-id header is present (unusual), a SHA-256 prefix of the raw body provides best-effort idempotency.

3. **Milestone-payout validation gate.** `POST /api/razorpay/create-order` now refuses to create an order unless an `AcceptanceDecision` row with `decision='accept'` exists for the `taskId`. Returns `412 Precondition Failed` if missing. This is the structural guarantee that we never pay for unaccepted work — bypassing the gate requires bypassing the previous slice's role guard *and* manufacturing a fake AcceptanceDecision row in Postgres.

4. **No state mutation from unverified events.** Even when signature verification fails, the event is persisted (with `signatureValid: false`) for monitoring. But no `PaymentOrder` row is touched. Probing or replay attempts leave a forensic trail without consequences.

---

## API contracts

### `POST /api/razorpay/create-order`

**Auth:** `enterprise` | `admin` | `super_admin`

**Request:**
```json
{
  "taskId": "t-4821",
  "amount": 240,
  "currency": "INR",
  "receipt": "rcpt_t4821_q2",
  "notes": { "milestone": "m2" }
}
```

**Responses:**
- `200` → `{ "orderId": "order_AbCdEf123", "amount": 24000, "currency": "INR" }`
- `400` → `{ "error": "Invalid request body", "issues": [...] }`
- `401` / `403` → auth failures
- `412` → `{ "error": "milestone-not-accepted", "message": "Accept the delivery first." }` **← the new payout gate**
- `409` → `{ "error": "duplicate-order", "message": "Order already exists" }`
- `502` → upstream Razorpay failure
- `500` → local persistence failure (orderId returned for manual reconciliation)

### `POST /api/razorpay/webhook`

**Auth:** none (webhook signature is the auth)

**Headers:**
- `x-razorpay-signature` — required for trust
- `x-razorpay-event-id` — used for idempotency

**Behavior:**
- Always responds `200` (so Razorpay doesn't retry on transient DB issues)
- Returns `{ received: true, signatureValid: <bool> }`
- Updates `PaymentOrder.status` to `paid` on `payment.captured` / `order.paid`, to `failed` on `payment.failed`

---

## What's structurally impossible after this pass

Before:
- ❌ Anyone with the create-order URL could mint Razorpay orders
- ❌ Payment captured without app-side record — no reconciliation possible
- ❌ Webhook acceptance with no signature check — anyone could simulate "payment.captured"
- ❌ Duplicate webhook deliveries reprocessed N times
- ❌ Could pay for work that was never accepted

After:
- ✅ Order creation gated by `requireRole(["enterprise","admin","super_admin"])`
- ✅ Every order persisted to `PaymentOrder` linked to `taskId` + `initiatedById`
- ✅ Webhooks rejected unless HMAC-SHA256 signature matches body
- ✅ Replays + retries idempotent on `razorpayEventId`
- ✅ Order creation requires a prior `AcceptanceDecision.decision='accept'` row

---

## Required environment variables

```bash
# Existing (kept)
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx

# NEW — must be set or webhook accepts nothing
RAZORPAY_WEBHOOK_SECRET=xxxx
```

`RAZORPAY_WEBHOOK_SECRET` is configured in the Razorpay dashboard at **Settings → Webhooks → [your webhook URL] → Secret**. If unset, every webhook is recorded with `signatureValid: false` and no state mutations occur — the system fails closed.

---

## Verification (end-to-end, requires DB + Razorpay test account)

```bash
# 1) Apply migrations
npx prisma migrate deploy

# 2) Boot dev server with webhook secret set
RAZORPAY_WEBHOOK_SECRET=<test-secret> npm run dev

# 3) Configure Razorpay test webhook → ngrok https://.../api/razorpay/webhook

# 4) Negative path: try create-order on an unaccepted task
curl -X POST http://localhost:3000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -H "Cookie: <enterprise-session>" \
  -d '{"taskId":"t-9999","amount":100}'
# → 412 milestone-not-accepted ✅

# 5) Accept the task via the previous slice's endpoint
curl -X POST http://localhost:3000/api/enterprise/acceptance/t-9999 \
  -H "Cookie: <enterprise-session>" \
  -d '{"decision":"accept","note":"OK"}'

# 6) Retry create-order
curl -X POST http://localhost:3000/api/razorpay/create-order ... 
# → 200 with orderId, PaymentOrder row exists with status=created

# 7) Make a test payment in Razorpay checkout
# → Razorpay fires webhook → PaymentEvent row appears (signatureValid=true)
# → PaymentOrder.status flips to "paid" with paidAt timestamp

# 8) Test signature failure path: curl webhook with bad signature
curl -X POST http://localhost:3000/api/razorpay/webhook \
  -H "x-razorpay-signature: WRONG" \
  -H "x-razorpay-event-id: probe_123" \
  -d '{"event":"payment.captured"}'
# → 200 received + signatureValid=false
# → PaymentEvent row exists with signatureValid=false
# → PaymentOrder.status NOT changed ✅
```

---

## What still needs to happen for full payment safety

### Slice 3A: Payout API integration (1 week)
This pass covers Razorpay *order* (enterprise → platform). The reverse leg (platform → contributor) uses Razorpay **Payouts** which is a separate API. Models needed: `Payout`, `PayoutEvent`. Same patterns apply.

### Slice 3B: Reconciliation job (3 days)
Cron that lists `PaymentOrder` rows in `status='created'` for >24h with no terminal webhook and queries Razorpay's order-status API to reconcile. Catches missed webhooks.

### Slice 3C: Refund handling (3-4 days)
`refund.created` / `refund.processed` / `refund.failed` events are persisted in `PaymentEvent` already but not yet propagated to `PaymentOrder.status`. Add a `refunded` status + `refundedAt` column.

### Slice 3D: Duplicate-charge prevention at order-level (2 days)
Current gate prevents paying for unaccepted work. A stricter gate would prevent paying for already-paid work — e.g., reject create-order if a `PaymentOrder` exists for the same `(taskId, status='paid')`.

### Slice 3E: Webhook timeout protection (1 day)
Move heavy processing to a queue. Webhook handler should just persist + 200 within ~50ms; the lifecycle update should be a background job. Lower priority — current handler is already fast.

### Slice 3F: Rate limiting on create-order (0.5 days)
Per-user rate limit so a stolen session can't enumerate payment intents at scale.

---

## Estimated remaining payment-safety effort

- Slice 3A (Payout API): 1 week
- Slice 3B (Reconciliation cron): 3 days
- Slice 3C (Refund handling): 3-4 days
- Slice 3D (Duplicate-charge prevention): 2 days
- Slice 3E (Webhook queue): 1 day
- Slice 3F (Rate limiting): 0.5 days

**Total to close payment-safety gap fully: ~3 engineer-weeks** after this pass.

The slice shipped here is the load-bearing one — the webhook signature check, the idempotency story, and the milestone gate are the three pieces that turn a fraud-shaped surface into something that can safely face production traffic.
