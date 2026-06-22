# Phase 1 Subscription Model — Implementation Summary

## What we built

Glimmora now has a **tenant-level SaaS subscription** layer, separate from workforce billing (invoices/payouts/commission).

### Two money rails (unchanged vs new)

| Rail | Purpose | UI location |
|------|---------|-------------|
| **Platform subscription** (NEW) | Access to AI, reviewer hub, integrations, limits | Settings → Plan & billing |
| **Workforce billing** (existing) | Task invoices, payouts, rate cards | Finance → Billing |

---

## Plan catalog

| Plan | Phase 1 intent |
|------|----------------|
| **Trial** | 14-day eval, 1 SOW, no AI intake |
| **Pilot** | First paid MOU, AI SOW + decomposition, 3 SOW cap |
| **Growth** | Reviewer hub, SSO, full analytics, 15 SOW cap |
| **Enterprise** | Unlimited + all integrations + extended audit |

Defined in: `src/lib/subscription/plans.ts`

---

## Data model

**Prisma `Tenant` fields:**
- `subscriptionTier` — `trial | pilot | growth | enterprise`
- `subscriptionStartedAt` — plan assignment date
- `trialEndsAt` — trial expiry
- `usageCounters` — JSON `{ activeSows, activeProjects, seats, aiInvocationsMonth }`

Migration: `prisma/migrations/20260528120000_tenant_subscription/`

---

## APIs

| Endpoint | Role | Purpose |
|----------|------|---------|
| `GET /api/enterprise/subscription` | Enterprise | Current plan + usage |
| `GET/PATCH /api/admin/tenants/[id]/subscription` | Admin | Read/update tenant plan |
| `POST /api/admin/tenants/[id]/subscription` | Admin/Enterprise | Increment usage counters |

---

## Enforcement layers

1. **Sidebar badges** — locked features show `Growth+` / `Upgrade` (`filterEnterpriseNav`)
2. **Route paywalls** — gated paths show upgrade CTA (`SubscriptionRouteGate`)
3. **Banners** — trial countdown, trial expired, tenant paused (`TenantStatusBanner`)
4. **Server helpers** — `requireSubscriptionFeature()` / `requireUsageHeadroom()` for API routes

### Gated enterprise routes

- AI SOW intake/generate → `sow.ai_intake`
- Decomposition → `decomposition.ai`
- Reviewer hub / Acceptance → `reviewer.hub`
- Rate cards → `billing.rate_cards`
- Compliance → `compliance.module`
- Integrations → `integrations.sso`
- Advanced analytics → `analytics.full`
- Audit export → `audit.export`

---

## Portal changes

### Enterprise
- **Settings → Plan & billing** (`/enterprise/settings/plan`)
- Layout wraps content in subscription route gate + status banners
- Nav filtered by plan

### Admin
- **Edit subscription** modal includes Trial tier
- Saves to Prisma when tenant exists (`m19-tenant-a` in local seed)
- Mock-only tenants still update local admin store

### Contributor / Mentor
- No subscription paywalls (unchanged)

---

## Billing collection (Phase 1)

**Sales-led (Option A):** Upgrades via MSA + admin tier change. No Razorpay Subscriptions checkout yet.

Enterprise plan page includes **Request upgrade** → `partnerships@glimmora.ai`.

---

## How to test locally

1. Run migration: `npx prisma migrate deploy` (or dev migrate)
2. Seed tenant: `npm run db:seed:local` — sets `m19-tenant-a` to **enterprise**
3. Login as enterprise user with `tenantId` linked to seeded tenant
4. Admin → Tenants → Edit subscription → switch to **Trial** → revisit enterprise decomposition (paywall)
5. Enterprise → Settings → Plan & billing → view usage meters

Demo mode (`NEXT_PUBLIC_ENTERPRISE_DEMO=1`) returns a **Growth** snapshot when DB is unavailable.

---

## Next steps (Phase 1.5+)

- Razorpay Subscriptions checkout on plan page
- Wire SOW create / AI invoke APIs to `requireSubscriptionFeature` + usage increment
- Persist admin wizard tenants to `prisma.tenant.create`
- Tenant pause → block login in `proxy.ts` (needs session tenantId)
- Platform subscription invoices (separate from workforce invoices)
