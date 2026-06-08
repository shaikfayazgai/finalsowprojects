# Enterprise Portal — Mock layer · Backend Dev Handoff

The enterprise portal currently runs **entirely on mock data** so it
can demo end-to-end without a database. This file maps every mock to
the real API contract a backend dev should implement, then how to swap.

## File layout

```
src/lib/enterprise/mocks/
  overlay.ts          ← localStorage overlay helper (delete when wiring real APIs)
  sows.ts             ← 12 SOWs across draft/approval/approved/rejected/withdrawn
  decompositions.ts   ← 6 plans across draft/approved/active/archived
  rate-cards.ts       ← 6 rate cards across active/draft/expired
  payouts.ts          ← 14 payouts across eligible/pending/paid/reversed
  compliance.ts       ← consent (15 contributors) + retention rules + overview
  reviews.ts          ← 12 enterprise-review queue items
  notifications.ts    ← 15 notifications, 4 unread
```

The `src/lib/api/*.ts` clients re-export these as `tick(mockFn())`
promises so hooks like `use-sow-v2` keep the exact same signature.
**Replace the body of each `api/*.ts` function with `fetch(...)` to
swap.** No upstream UI code changes.

## Endpoint contracts

### SOW (`src/lib/api/sow-v2.ts`)

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/sow` | `?status=&stage=&ownerId=&includeArchived=&limit=&cursor=` | `{ items: SowSummary[], nextCursor: string|null }` |
| GET | `/api/sow/:id` |  | `{ sow: SowDetail }` |
| POST | `/api/sow` | `CreateSowInput` | `{ sow: SowDetail }` |
| PATCH | `/api/sow/:id` | `UpdateSowDraftInput` | `{ sow: SowDetail }` |
| POST | `/api/sow/:id/submit` |  | `{ sow }` |
| POST | `/api/sow/:id/withdraw` | `{ reason }` | `{ sow }` |
| POST | `/api/sow/:id/archive` |  | `{ sow }` |
| POST | `/api/sow/:id/approve` | `{ stage, comment }` | `TransitionEnvelope` — stage `commercial` is Glimmora-ops only |
| POST | `/api/sow/:id/reject` | `{ stage, comment }` | `TransitionEnvelope` |
| POST | `/api/sow/:id/send-back` | `{ fromStage, toStage, comment }` | `TransitionEnvelope` |

**Upload intake payload** (`POST /api/sow` from `/enterprise/sow/intake?mode=upload`):
`payload.intakeMode = "upload"` plus flat fields (`startDate`, `endDate`, `sponsor`, `stakeholders[]`, `riskBreakdown`) and nested `extraction` + `sourceFile`. Detail page reads via `src/lib/sow/intake-payload.ts`. Production also needs `POST /api/sow/upload` (multipart) before NLP extract.

### Decomposition (`src/lib/api/decomposition-v2.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/decomposition/plans` | `?sowId=&status=&includeArchived=&limit=&cursor=` | `{ items: PlanSummary[] }` |
| GET | `/api/decomposition/plans/:id` |  | `{ plan: PlanDetail }` |
| POST | `/api/decomposition/plans` | `CreatePlanInput` | `{ plan }` |
| PATCH | `/api/decomposition/plans/:id` | `UpdatePlanInput` | `{ plan }` |
| POST | `/api/decomposition/plans/:id/approve` |  | `{ plan }` |
| POST | `/api/decomposition/plans/:id/activate` |  | `{ plan }` |
| POST | `/api/decomposition/plans/:id/archive` |  | `{ plan }` |
| POST | `/api/decomposition/plans/:id/copy` |  | `{ plan }` |

### Billing (`src/lib/api/enterprise-billing.ts`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/payouts/tenant?status=` | `{ items: PayoutDetail[] }` |
| POST | `/api/payouts/release-batch` | `{ releasedCount, totalMinor }` — flips `eligible → requested` |
| GET | `/api/billing/export?kind=&from=&to=` | CSV blob + `X-Billing-Row-Count` header |

### Rate cards (referenced by `/enterprise/billing/rate-cards/*`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/enterprise/rate-cards` | `RateCardSummary[]` |
| GET | `/api/enterprise/rate-cards/:id` | `RateCardDetail` |
| POST | `/api/enterprise/rate-cards` | `CreateRateCardInput` → `RateCardDetail` |

### Compliance (`src/lib/api/enterprise-{compliance,consent,retention}.ts`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/enterprise/compliance/overview` |  | `ComplianceOverview` |
| GET | `/api/enterprise/compliance/consent` | `?search=&missing=&limit=&format=json` | `ConsentInventoryResponse` |
| GET | `/api/enterprise/compliance/consent` | `?format=csv` | CSV blob |
| GET | `/api/enterprise/compliance/retention` |  | `RetentionResponse` |
| PUT | `/api/enterprise/compliance/retention` | `RetentionRuleSet` | `RetentionResponse` |

### Reviews (`src/lib/api/enterprise-review.ts`)

| Method | Path | Body |
|---|---|---|
| GET | `/api/enterprise/review-queue` | `?mine=&includeClaimed=&limit=` |
| GET | `/api/enterprise/review-queue/history` | `?limit=` — **mock-only until backend ships** |
| GET | `/api/enterprise/review-queue/:id` | `{ item, decided }` — **mock-only until backend ships** |
| POST | `/api/enterprise/review-queue/:id/claim` |  |
| POST | `/api/enterprise/review-queue/:id/release` |  |
| POST | `/api/enterprise/review-queue/:id/decide` | `{ decision: "accept"|"rework", note, deciderInitials }` |

### Notifications (`src/lib/api/notifications.ts`)

| Method | Path | Response |
|---|---|---|
| GET | `/api/notifications?unread=1&limit=N` | `NotificationsListResponse` |
| PATCH | `/api/notifications/:id/read` | `MarkReadResponse` |
| POST | `/api/notifications/mark-all-read` | `MarkAllReadResponse` |

### Invoices (`src/lib/billing/invoices-mock.ts`)

| Method | Path | Response |
|---|---|---|
| GET | `/api/invoices?status=&q=&limit=` | `InvoiceSummary[]` |
| GET | `/api/invoices/:id` | `InvoiceDetail` |
| POST | `/api/invoices/:id/record-payment` | `{ reference, method, paidAt }` → `InvoiceDetail` |

## How to wire a real backend

For any of the above, follow this pattern (example: SOW list):

```ts
// src/lib/api/sow-v2.ts — before
export async function listSows(params: ListSowsParams = {}): Promise<SowListResult> {
  return tick(listSowsMock(params));
}

// after
export async function listSows(params: ListSowsParams = {}): Promise<SowListResult> {
  const q = new URLSearchParams();
  if (params.status) {
    const ss = Array.isArray(params.status) ? params.status : [params.status];
    ss.forEach((s) => q.append("status", s));
  }
  // ... etc
  const res = await fetch(`/api/sow?${q}`, { credentials: "same-origin" });
  if (!res.ok) throw new SowApiError(/* ... */);
  return res.json();
}
```

Then **delete `src/lib/enterprise/mocks/sows.ts`** and the matching
import. The `overlay.ts` helper exists only for demo persistence and
can be removed once every domain has real APIs.

## Demo persistence (localStorage overlay)

Mutations (Mark as paid, Create SOW, Approve stage, Release batch,
Mark notification read, …) write to a localStorage key per domain
(`glimmora.mock.*`). This lets the demo feel like a real backend —
data persists across navigation and page reload. **Clear the keys to
reset** any demo run:

```js
Object.keys(localStorage).filter(k => k.startsWith("glimmora.mock.")).forEach(k => localStorage.removeItem(k));
```

## Demo credentials

- Email: `sandeep@acme.com`
- Password: `acme1234`
- Role: `enterprise` (with `ent.admin` permissions; see `scripts/grant-sandeep-perms.ts`)
