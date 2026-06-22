# Backend Handoff v1 — Subscription & Tenant

**Audience:** Backend engineers implementing real persistence  
**Frontend status:** Phase 1 complete (sales-led upgrades, gates, audit trail UI)  
**Do not implement:** Razorpay checkout yet (Phase 1.5)

---

## Domain summary

**Platform subscription** (this doc) — SaaS tier, feature flags, usage limits.  
**Workforce billing** (separate) — task invoices, payouts, Razorpay per task.

---

## Prisma: `Tenant` fields

| Field | Type | Purpose |
|-------|------|---------|
| `subscriptionTier` | string | `trial` \| `pilot` \| `growth` \| `enterprise` |
| `subscriptionStartedAt` | DateTime? | Current plan period start |
| `trialEndsAt` | DateTime? | Set when tier = trial |
| `usageCounters` | Json? | `{ activeSows, activeProjects, seats, aiInvocationsMonth, aiInvocationsPeriod }` |
| `contractRef` | string? | MSA reference |

Migration: `prisma/migrations/20260528120000_tenant_subscription/`

---

## API endpoints (implement / keep contract)

### Enterprise

#### `GET /api/enterprise/subscription`

- **Auth:** `enterprise` \| `admin` \| `super_admin`
- **Response:** `TenantSubscriptionSnapshot` (see `src/lib/subscription/types.ts`)
- **Fallback:** demo Growth snapshot when no DB tenant

#### `GET /api/enterprise/subscription/history`

- **Auth:** same as above
- **Response:** `{ tenantId, items: PlanChangeRecord[] }`
- **Source:** `AuditEvent` where `action = subscription.plan_changed`

### Admin

#### `GET /api/admin/tenants/[tenantId]/subscription`

- **Auth:** `admin` \| `super_admin`
- **Response:** subscription snapshot or mock pilot fallback

#### `PATCH /api/admin/tenants/[tenantId]/subscription`

- **Auth:** `admin` \| `super_admin`
- **Body:**
  ```json
  {
    "planCode": "trial" | "pilot" | "growth" | "enterprise",
    "contractRef": "MSA-2026-0008",
    "trialDays": 14
  }
  ```
- **Behavior:**
  1. Update `Tenant.subscriptionTier`, `subscriptionStartedAt`, `trialEndsAt`
  2. Emit audit `subscription.plan_changed` with before/after
  3. Return updated snapshot
- **Mock tenants:** `persisted: false` + in-memory history (replace with real `Tenant` row)

#### `GET /api/admin/tenants/[tenantId]/subscription/history`

- **Auth:** `admin` \| `super_admin`
- **Response:** `{ tenantId, items: PlanChangeRecord[] }`

#### `POST /api/admin/tenants/[tenantId]/subscription`

- **Body:** `{ metric: "activeSows" | ..., delta: 1 }`
- **Purpose:** increment usage counters (internal / batch jobs)

---

## Error contract (subscription gates)

HTTP **402** when plan denies access:

```json
{
  "error": "plan_denied",
  "reason": "feature_not_in_plan" | "limit_reached" | "trial_expired" | "tenant_paused" | "tenant_closed",
  "message": "Human-readable",
  "upgradePlan": "pilot"
}
```

Used by: `POST /api/sow` (usage), `POST /api/sow/proxy`, `POST /api/decomposition/proxy`

---

## Audit event

| Field | Value |
|-------|--------|
| `action` | `subscription.plan_changed` |
| `resourceType` | `tenant_subscription` |
| `resourceId` | tenant UUID |
| `before` | `{ planCode: "pilot" }` |
| `after` | `{ planCode: "growth" }` |
| `payload` | `{ fromPlan, toPlan, source, contractRef, note }` |

---

## Plan catalog (source of truth)

File: `src/lib/subscription/plans.ts`

Backend should **read tier from DB**, not hardcode features — but feature matrix in `plans.ts` is the contract until a dedicated `Plan` table exists.

---

## Usage counting rules

| Metric | How frontend resolves today | Backend should |
|--------|----------------------------|----------------|
| `activeSows` | DB count of non-archived SOWs | Same query, or sync counter on SOW lifecycle |
| `seats` | DB count of `User` where `tenantId` | Same |
| `aiInvocationsMonth` | Json counter + monthly reset | Increment on AI proxy success; reset on calendar month |

---

## Acceptance criteria (backend)

- [ ] PATCH subscription updates tenant row atomically + audit in one transaction
- [ ] Enterprise GET subscription returns real tenant for users with `User.tenantId`
- [ ] 402 on SOW create when `activeSows` at cap
- [ ] 402 on AI proxies when feature not in plan or trial expired
- [ ] Paused tenant: `requireTenantRequest` returns 403 `tenant_paused`
- [ ] Plan history API returns audit rows ordered by `timestamp DESC`

---

## Out of scope (Phase 1.5+)

- Razorpay Subscriptions checkout
- Platform subscription invoices
- Self-serve downgrade / cancel
- Webhook handlers

---

## Frontend files (reference)

| Area | Path |
|------|------|
| Plan catalog | `src/lib/subscription/plans.ts` |
| Enforce | `src/lib/subscription/enforce.ts` |
| Service | `src/lib/subscription/service.ts` |
| Plan history | `src/lib/subscription/plan-history.ts` |
| Enterprise UI | `src/app/enterprise/settings/plan/` |
| Admin tier modal | `src/app/admin/tenants/components/tenant-detail-modals.tsx` |
