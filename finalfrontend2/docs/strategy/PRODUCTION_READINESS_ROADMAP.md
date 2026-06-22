# GlimmoraTeam — Production Readiness Roadmap

**Date:** 2026-05-24
**Phase:** 1B → Production transition
**Author:** Productionization audit pass

This document consolidates the production-readiness audit across security, persistence, payment safety, infrastructure, and observability. It defines what's done, what's mocked, what's missing, and the engineering work remaining to make the platform safe for real production traffic.

It assumes the reader has access to:
- `SECURITY_HARDENING_PASS_1.md` (slice 1)
- `PERSISTENCE_PASS_1.md` (slice 2)
- `PAYMENT_SAFETY_PASS_1.md` (slice 3)
- `STAKEHOLDER_WALKTHROUGH_SCRIPT.md` (demo orchestration)

---

## 0 · One-paragraph summary

The Phase 1B MVP is a polished V2 experience grounded in a real NextAuth + Prisma + Postgres foundation. The UI ecosystem (9 enterprise surfaces, 3 role portals, cross-role propagation, unified task store) is production-grade in shape. The backend behind it is **mock-heavy by design** — most operational mutations live in Zustand localStorage, most data structures are TS arrays in `src/mocks/data/`, and three demo-bypass env flags disable authentication wholesale for stakeholder walkthroughs. Three foundational hardening passes have shipped (security primitives + production guard, decision persistence with optimistic-rollback, Razorpay webhook + signature verification + payout gate). What remains is mechanical: ~6-10 engineer-weeks of applying the patterns already established across the rest of the surface.

---

## 1 · Production readiness scorecard

| Subsystem | Status | Notes |
|---|---|---|
| **Stack foundations** (Next.js 16, React 19, Tailwind 4) | ✅ Production | Standard, supportable |
| **Auth (NextAuth v5)** | ✅ Production-shape | Real JWE; salt+cookieName workaround for edge-runtime drift documented in `proxy.ts` |
| **Prisma + Postgres** | ✅ Production | User + ContributorProfile + AcceptanceDecision + PaymentOrder + PaymentEvent models exist |
| **Role-based middleware** | ⚠️ Mostly production-shape | Bypassed wholesale by 3 demo env flags; production guard now refuses to boot if they leak (slice 1) |
| **Per-route authorization** | ⚠️ Foundation shipped | `requireRole()` exists; wired to 2/28 routes; remaining is mechanical (~2 days) |
| **Enterprise acceptance decisions** | ✅ Persisted | Audit log in Postgres; optimistic UI + rollback pattern (slice 2) |
| **Task state itself** | ❌ localStorage only | Slice 2A — needs Task → Prisma migration |
| **Mentor decisions** | ❌ localStorage only | Same — needs MentorReview → Prisma |
| **SOW / Project / Decomposition** | ❌ Mock arrays | Slice 2B — needs domain models |
| **Razorpay order intent** | ✅ Persisted + auth-gated | Slice 3 — milestone-payout gate enforced |
| **Razorpay webhook + signature verification** | ✅ Production | Slice 3 — HMAC + idempotent + fail-closed |
| **Razorpay Payouts (reverse leg)** | ❌ Not wired | Slice 3A — separate API integration |
| **MFA setup / recovery** | ⚠️ Routes exist | End-to-end coverage unverified |
| **Email send (`/api/email/send`)** | ⚠️ Real Nodemailer | Needs `requireRole` audit + rate limiting |
| **PDF / report generation** | ❌ Client-only | Slice 5 — needs server-side or queued |
| **Observability (Sentry / OTel / logs)** | ❌ None | Slice 6 — unknown failures invisible in prod |
| **Settings / notifications preferences** | ❌ React local state | Slice 7 — needs persistence |
| **Visual / UX V2 quality** | ✅ Production-grade | Walkthrough-ready; premium polish layer in `globals.css` |

---

## 2 · What is structurally protected today (post-slice 1, 2, 3)

After the three hardening passes, these production-failure modes are now structurally impossible (not just discouraged):

1. **Demo bypass leaking to production** → server refuses to boot if `NEXT_PUBLIC_*_DEMO=1` while `NODE_ENV=production`.
2. **Acceptance decisions vanishing on session reset** → every accept/rework writes to `AcceptanceDecision` table; survives logout + cross-device.
3. **Spoofed Razorpay webhooks** → HMAC-SHA256 signature required; unverified events recorded but never mutate state.
4. **Webhook replay double-processing** → idempotent upsert on `razorpayEventId`.
5. **Paying for unaccepted work** → `create-order` returns `412 Precondition Failed` unless an `AcceptanceDecision.decision='accept'` row exists for the task.
6. **Anonymous order creation** → `requireRole(["enterprise","admin","super_admin"])` enforced.

---

## 3 · Remaining engineering work

Organized into shippable slices. Each is self-contained, has acceptance criteria, and uses patterns established in slices 1-3.

### Slice 4 — Complete authorization audit *(2 engineer-days)*

**Status:** Foundation shipped (`requireRole` primitive). 26 routes still need wiring.

**Work:**
- Apply `requireRole` to each of the 26 ⚠️ routes listed in `SECURITY_HARDENING_PASS_1.md`.
- Build `requireResourceOwner(resource, session)` helper for per-user data routes (`/api/contributor/profile`, all submissions, all credentials).
- Verify the per-resource ownership check on each `/api/contributor/*` route.

**Acceptance criteria:**
- [ ] Every API route (except the 6 intentionally public) has either `requireRole` or explicit "// no-auth intentional" comment.
- [ ] Every per-user route verifies `resource.userId === session.userId`.
- [ ] `curl` test matrix: each role attempting each route returns expected 200/401/403.

---

### Slice 5 — Task model migration *(1-2 engineer-weeks)*

**Status:** Audit log shipped (slice 2). The state itself still in localStorage.

**Work:**
- Promote the Zustand `Task` shape to a Prisma `Task` model with foreign keys to `User` (contributor + mentor), `Sow`, `Project`.
- Build per-mutation API endpoints following the slice 2 template (`POST /api/tasks/[id]/accept`, `POST /api/tasks/[id]/submit`, `POST /api/tasks/[id]/mentor-decide`, etc.).
- Migrate each Zustand mutator to: snapshot → optimistic local update → API call → rollback on failure (the slice 2 pattern is the template).
- Re-hydration on app load: read latest decisions per task, merge into Zustand store.

**Acceptance criteria:**
- [ ] Closing browser + reopening on another device shows same task state.
- [ ] Two enterprise operators viewing the same task see the same state in real time (after refresh).
- [ ] All existing V2 hooks (`useDeliveryTracking`, `useAcceptanceOverview`, `useBillingOverview`, `useReviewerOverview`) read from Postgres via TanStack Query.

---

### Slice 6 — Domain models (SOW / Project / Decomposition) *(1-2 engineer-weeks)*

**Status:** All mock TS arrays in `src/mocks/data/*`.

**Work:**
- Add Prisma models: `Sow`, `SowApprovalStage`, `Project`, `DecompositionPlan`, `Workstream`, `TaskUnit`, `ComplianceReadiness`.
- Migrate the existing mock arrays into seed data for these tables.
- Build read APIs (`GET /api/sows`, `GET /api/projects/:id`) and the create/update endpoints for SOW intake.
- Wire the V2 hooks to read from these endpoints.

**Acceptance criteria:**
- [ ] SOW Intake commit persists to DB.
- [ ] Decomposition plan edits persist.
- [ ] Project portfolio is multi-tenant aware (every query scoped to enterprise org).

---

### Slice 7 — Settings / Preferences / Profile persistence *(3 engineer-days)*

**Status:** React local state only.

**Work:**
- Add `OperatorPreferences` Prisma model keyed by `userId`.
- `GET /api/settings` returns the row; `PATCH /api/settings` updates it.
- Wire Enterprise Settings V2 page to call the API + show "Saved" indicator (already in the UI; just wire the network).
- Notification preferences likewise.
- Profile edits (display name, role title, avatar) — same pattern.

**Acceptance criteria:**
- [ ] Setting a preference, logging out, logging in → preference persists.
- [ ] Default landing surface preference actually redirects at `/enterprise/`.
- [ ] Notification preferences filter the `/enterprise/notifications` event stream.

---

### Slice 8 — Razorpay Payouts (reverse leg) *(1 engineer-week)*

**Status:** Order intake (enterprise → platform) done. Payouts (platform → contributor) not wired.

**Work:**
- Add `Payout` + `PayoutEvent` Prisma models (same shape as `PaymentOrder` + `PaymentEvent`).
- `POST /api/razorpay/payouts` — gated by `requireRole(["enterprise","admin"])` and gated by paid-order existence (similar to milestone gate).
- Webhook handler for `payout.processed` / `payout.reversed` / `payout.failed` — extend the existing webhook route or split.

**Acceptance criteria:**
- [ ] Payout can only initiate after `PaymentOrder.status === "paid"` for the linked task.
- [ ] Payout events idempotent + signature-verified.
- [ ] Workforce Compensation in Billing V2 reads payout state from DB.

---

### Slice 9 — Server-side exports *(1 engineer-week)*

**Status:** All PDF / report generation client-side via `pdf-lib` / `mammoth`.

**Work:**
- Move `pdf-lib` invocations to Node route handlers (`POST /api/exports/governance-summary`, `POST /api/exports/billing-report`).
- For large exports, queue via BullMQ / Inngest / Trigger.dev.
- S3 / R2 object storage for generated files.
- Signed-URL download flow.

**Acceptance criteria:**
- [ ] Export of a 200-task delivery audit completes without browser memory pressure.
- [ ] Generated files survive page refresh (not in-memory).
- [ ] Download links expire (signed URL).

---

### Slice 10 — Observability *(1 engineer-week)*

**Status:** None.

**Work:**
- Sentry integration with source maps (Next.js Sentry SDK).
- Pino structured logging on every API route (request id, user id, role, timing).
- Audit log table that mirrors mutation events (`AuditLog` model — actor, action, target, timestamp, request id).
- OTel tracing for the propagation chain (acceptance → billing).

**Acceptance criteria:**
- [ ] A 500 error in production produces a Sentry issue with stack trace + user context.
- [ ] Mutation logs are queryable by user, by task, by time range.
- [ ] OTel traces show acceptance → billing-line propagation as a single trace.

---

### Slice 11 — Security crosscutting *(1 engineer-week)*

**Status:** Per-route guards done in slices 1+4. Crosscutting concerns remain.

**Work:**
- CSRF protection middleware (same-origin header validation).
- Rate limiting (Upstash Ratelimit) on:
  - `POST /api/auth/forgot-password` (account enumeration)
  - `POST /api/auth/mfa-confirm` (MFA brute force)
  - `POST /api/email/send` (spam)
  - `POST /api/razorpay/create-order` (payment intent enumeration)
- Security headers in `proxy.ts` response: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- AUTH_SECRET rotation runbook (documentation + procedure).

**Acceptance criteria:**
- [ ] CSRF token check passes for legitimate requests, blocks cross-origin.
- [ ] Rate limit returns 429 with `Retry-After` header.
- [ ] CSP enforced in production.
- [ ] Runbook tested with key rotation in staging.

---

### Slice 12 — MFA + onboarding hardening *(1 engineer-week)*

**Status:** Routes exist; end-to-end coverage unverified.

**Work:**
- Manual end-to-end test matrix: enroll → confirm → recover → disable.
- Recovery code generation + secure download.
- OAuth → onboarding redirect tightening.
- Reviewer invite acceptance flow audit (existing `/api/reviewers/invitations` endpoint).

**Acceptance criteria:**
- [ ] MFA enrollment without TOTP app available → recovery codes work.
- [ ] First-time SSO user lands on `/contributor/onboarding`, completes flow, lands on `/contributor/dashboard`.
- [ ] Reviewer invite email → activation → role assignment → first-login experience all clean.

---

### Slice 13 — Reconciliation jobs *(3 engineer-days)*

**Status:** Not wired.

**Work:**
- Cron: list `PaymentOrder.status='created'` for >24h with no terminal webhook → query Razorpay order-status API → update.
- Cron: list `AcceptanceDecision` where `decidedAt > 7d ago` but no `Task` row exists yet — surface for ops.
- Cron: `Task.state` vs latest `AcceptanceDecision` drift detection.

**Acceptance criteria:**
- [ ] Missed webhooks reconciled within 24h.
- [ ] Audit log + observed state drift surfaces a ticket within 1h.

---

## 4 · Effort summary

| Slice | Effort | Priority | Blocks production? |
|---|---|---|---|
| 4 — Authorization audit completion | 2 days | P0 | Yes — incomplete authorization is critical |
| 5 — Task model migration | 1-2 wk | P0 | Yes — state lost on logout |
| 6 — Domain models | 1-2 wk | P0 | Yes — multi-tenant safety |
| 7 — Preferences persistence | 3 days | P1 | No — UX gap, not safety gap |
| 8 — Razorpay Payouts | 1 wk | P1 | If shipping payouts, yes |
| 9 — Server exports | 1 wk | P1 | If shipping enterprise exports, yes |
| 10 — Observability | 1 wk | P0 | Yes — can't debug production blind |
| 11 — Security crosscutting | 1 wk | P0 | Yes — CSRF + rate limits |
| 12 — MFA hardening | 1 wk | P1 | If MFA is required by sales |
| 13 — Reconciliation jobs | 3 days | P1 | No — defense in depth |

**Total P0 (production-blocking): ~5 engineer-weeks.**
**Total P0 + P1: ~9-10 engineer-weeks.**

These are independent enough to parallelize across 2 engineers, cutting wall-clock to ~5-6 weeks.

---

## 5 · What we don't recommend doing in this phase

- **Building any more V2 surfaces.** The current set is complete and walkthrough-ready. Adding more before shipping the persistence backbone increases the mock surface that has to be migrated later.
- **Refactoring the Zustand store architecture.** The current shape is the right transitional structure. The slice 5 migration replaces it deliberately, not opportunistically.
- **Choosing a queue / job runner before slice 9.** BullMQ, Inngest, Trigger.dev, Vercel Cron — all viable. Pick when slice 9 starts; over-investing now invites churn.
- **Multi-tenant org partitioning.** Out of scope until slice 6 lands the domain models. The current "single org" assumption is documented; the migration to multi-tenant is mechanical at the data-access layer.

---

## 6 · What is *truly* ready to deploy today

If you wanted to deploy what exists right now — as a *read-only beta* for select partners — you can safely:

- Serve the V2 UI ecosystem (all 9 enterprise + 3 portal surfaces)
- Allow login via NextAuth (with demo-bypass flags **off** in production — guarded by slice 1)
- Record acceptance/rework decisions to the audit log (slice 2)
- Accept Razorpay orders + webhooks safely (slice 3)
- All other mutations remain local-only and will not persist across sessions

This is **not** a production deployment in the operating sense — but it is a *safe* deployment for a controlled pilot where the lack of state persistence is acceptable.

To go from there to true production: ship slices 4 (authorization), 5 (task model), 6 (domain models), 10 (observability), 11 (security crosscutting). That's the minimum P0 set. Estimated **~5 engineer-weeks** with focused work.

---

## 7 · Appendix — reference docs

- `SECURITY_HARDENING_PASS_1.md` — what shipped in slice 1, route-by-route audit checklist
- `PERSISTENCE_PASS_1.md` — what shipped in slice 2, the optimistic-rollback pattern as a template
- `PAYMENT_SAFETY_PASS_1.md` — what shipped in slice 3, end-to-end verification recipe
- `STAKEHOLDER_WALKTHROUGH_SCRIPT.md` — demo orchestration (separate concern, but referenced by sales)
- `ENTERPRISE_PORTAL_V2_REORGANIZATION.md` — Phase 1B IA reorganization decisions
- `CLAUDE.md` — project conventions for engineers
