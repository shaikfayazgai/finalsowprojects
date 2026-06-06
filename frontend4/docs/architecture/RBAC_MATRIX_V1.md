# RBAC Matrix v1 — Critical Paths

**Status:** Living doc · Phase 1 foundation  
**Last updated:** 2026-05-30

Two role layers:

| Layer | Where stored | Examples |
|-------|--------------|----------|
| **Platform role** | JWT / `session.user.role` | `enterprise`, `admin`, `contributor`, `reviewer`, `super_admin` |
| **Tenant role** | Enterprise member directory (mock today) | `admin`, `sponsor`, `finance`, `it`, `compliance` |

Platform role → which portal you can enter.  
Tenant role → which **Settings** sections you can manage inside enterprise.

---

## Critical path matrix

| # | Journey | Route | Platform role | Tenant role | UI gate | API gate | Status |
|---|---------|-------|---------------|-------------|---------|----------|--------|
| 1 | Enterprise dashboard | `/enterprise/dashboard` | `enterprise`, `admin`* | any | `useRoleGuard` | — | ✅ |
| 2 | Plan & billing | `/enterprise/settings/plan` | `enterprise`, `admin`* | `admin` (manage), `finance` (view) | `SettingsShell` | `GET /api/enterprise/subscription` | ✅ |
| 3 | Plan change history | same page | same | same | — | `GET /api/enterprise/subscription/history` | ✅ |
| 4 | SOW list / create | `/enterprise/sow`, `POST /api/sow` | `enterprise`, `admin`* | `create.sow` permission | — | `requireTenantRequest` + usage headroom | ✅ |
| 5 | AI SOW intake | `/enterprise/sow/intake` | `enterprise` | plan: `sow.ai_intake` | `SubscriptionRouteGate` | `POST /api/sow/proxy` | ✅ |
| 6 | Decomposition | `/enterprise/decomposition` | `enterprise` | plan: `decomposition.ai` | `SubscriptionRouteGate` | `POST /api/decomposition/proxy` | ✅ |
| 7 | Acceptance / review | `/enterprise/review` | `enterprise` | plan: `reviewer.hub` | nav badge + gate | — (mock queue) | 🟡 |
| 8 | Reviewer sub-portal | `/enterprise/reviewer/*` | `reviewer` or `enterprise`† | plan: `reviewer.hub` | layout role swap | `requireRole` on proxies | 🟡 |
| 9 | Admin tenant tier | `/admin/tenants/[id]` | `admin`, `super_admin` | — | `useRoleGuard` | `PATCH .../subscription` | ✅ |
| 10 | Contributor task | `/contributor/tasks/[id]` | `contributor` | — | `useRoleGuard` | contributor APIs + `requireResourceOwner` | 🟡 |
| 11 | Mentor review queue | `/mentor/queue` | `reviewer`‡ | — | `useRoleGuard` | reviewer APIs | 🟡 |

\* Platform `admin` / `super_admin` may browse enterprise for demos; settings fallback grants tenant `admin` for settings RBAC.  
† Enterprise admins keep enterprise sidebar when browsing reviewer routes.  
‡ Mentor portal uses JWT role `reviewer` today.

**Legend:** ✅ verified in dev · 🟡 mock-heavy / audit pending · 🔴 broken

---

## Settings section access (enterprise tenant roles)

| Section | admin | finance | it | compliance |
|---------|-------|---------|-----|------------|
| Tenant & roles | manage | — | view | — |
| Plan & billing | manage | view | — | — |
| Integrations | manage | — | manage | — |
| Policies | manage | — | — | manage |
| Workspace security | manage | — | manage | — |

Source: `src/lib/settings/settings-rbac.ts`

---

## Subscription enforcement

| Check | Where |
|-------|--------|
| Feature in plan | `checkFeatureAccess()` |
| Usage limit | `checkUsageLimit()` |
| Route paywall | `SubscriptionRouteGate` + `route-features.ts` |
| API 402 | `requireSubscriptionFeature()` / `requireUsageHeadroom()` |

---

## Week 1 fixes applied

- Platform `admin` / `super_admin` → tenant settings access (`use-enterprise-tenant-roles.ts`)
- Subscription plan change audit trail (`subscription.plan_changed`)
- Admin + enterprise plan history UI

---

## Next RBAC tickets

1. Align mentor JWT role naming (`reviewer` vs `mentor`) in docs and guards  
2. Wire acceptance queue APIs with same `reviewer.hub` subscription check  
3. Contributor task submit — verify `requireResourceOwner` on all mutating routes  
4. Export this matrix to QA checklist per portal audit  
