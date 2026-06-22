# Security Hardening — Pass 1

**Scope:** P0 security primitives + demo-bypass production guard + 2 high-risk routes wired as exemplars.
**Status:** Foundational primitives shipped. ~58 of 60 API routes still need authorization audit.

---

## What shipped in this pass

| File | Purpose |
|---|---|
| `src/lib/auth/require-role.ts` | `requireRole(["enterprise", "admin"])` + `requireSession()` — server-side authorization helpers returning either the authorized session or a `NextResponse` (401/403) the route handler can return directly. |
| `src/lib/auth/demo-bypass-guard.ts` | `assertNoDemoBypassInProduction()` — refuses to boot the server if `NEXT_PUBLIC_CONTRIBUTOR_DEMO=1`, `NEXT_PUBLIC_MENTOR_DEMO=1`, or `NEXT_PUBLIC_ENTERPRISE_DEMO=1` while `NODE_ENV === "production"`. Override only via explicit `ALLOW_DEMO_IN_PRODUCTION=1`. |
| `src/instrumentation.ts` | Next.js bootstrap hook that runs the demo-bypass guard once on server start. |
| `src/app/api/superadmin/users/route.ts` | Wired `requireRole(["super_admin"])` at top of POST. |
| `src/app/api/reviewer/create/route.ts` | Wired `requireRole(["enterprise", "admin", "super_admin"])` at top of POST. |

---

## API route authorization status (60 routes)

Legend: ✅ = guard wired in this pass · ⚠️ = needs audit · 🔓 = intentionally public

### ✅ Wired this pass

| Route | Required role |
|---|---|
| `POST /api/superadmin/users` | `super_admin` |
| `POST /api/reviewer/create` | `enterprise`, `admin`, `super_admin` |

### ⚠️ Needs `requireRole` (high priority)

| Route | Suggested role | Reason |
|---|---|---|
| `POST /api/reviewers/invitations` | enterprise, admin | Same workforce-formation risk as reviewer/create |
| `GET /api/reviewers/invitations` | enterprise, admin | Lists invitations |
| `POST /api/email/send` | any authenticated | Spam abuse risk; already uses `auth()` but no role gate |
| `POST /api/contributor/profile` | contributor (self) | Currently per-user; verify userId == session.userId |
| `GET /api/contributor/profile` | contributor (self) | Same |
| `POST /api/contributor/profile/skills` | contributor (self) | Same |
| `POST /api/contributor/profile/evidence` | contributor (self) | Same |
| `GET /api/contributor/profile/digital-twin` | contributor (self) | Same |
| `POST /api/contributor/credentials` | contributor (self) | Same |
| `GET /api/contributor/credentials` | contributor (self) | Same |
| `POST /api/contributor/credentials/[credentialId]/share` | contributor (self) | Verify ownership |
| `POST /api/contributor/credentials/[credentialId]/verify` | any authenticated | Public-ish; verify isn't abused for enumeration |
| `POST /api/contributor/submissions/[submissionId]/resubmit` | contributor (self) | Verify submission belongs to caller |
| `POST /api/contributor/support/tickets` | contributor | Same |
| `POST /api/contributor/support/grievances` | contributor | Same |
| `POST /api/contributor/support/safety-reports` | contributor, mentor, reviewer, enterprise | Anyone reporting |
| `POST /api/contributor/tasks/[taskId]/submissions` | contributor (self, owns task) | High value; verify task ownership |
| `POST /api/contributor/tasks/[taskId]/review-feedback` | mentor | Mentor-only |
| `POST /api/sow/token` | enterprise, admin | SOW token generation |
| `GET /api/sow/proxy` | enterprise, admin | SOW backend proxy |
| `GET /api/decomposition/proxy` | enterprise, admin | Same |
| `POST /api/settings/contributor-pricing` | admin | Currently checked manually — replace with `requireRole(["admin"])` |
| `POST /api/razorpay/create-order` | contributor, enterprise | Payment flow; see payment-safety pass below |
| `POST /api/auth/mfa-confirm` | any authenticated | Existing custom check; audit |
| `POST /api/auth/sso-intent` | any authenticated | Existing custom check; audit |
| `POST /api/auth/validate` | any authenticated | Existing custom check; audit |

### 🔓 Intentionally public (no guard needed)

| Route | Why public |
|---|---|
| `GET/POST /api/auth/[...nextauth]` | NextAuth handler itself |
| `POST /api/auth/forgot-password` | Pre-login flow; rate-limit instead |
| `GET /api/public/credentials/[shareId]` | Public credential share links |
| `GET /api/nda-document` | NDA document is public |
| `GET /api/nda-download` | NDA download is public |
| `GET /api/config/contributor-pricing` | Public pricing display |

---

## What still needs to happen (P0 security follow-up)

### Per-resource ownership checks (not done in this pass)
`requireRole()` covers role-level authorization but **not** resource-level. For routes that read/write per-user data (`/api/contributor/profile`, all submissions, all credentials), the handler must additionally verify the resource belongs to the caller — e.g. `if (task.contributorId !== session.userId) return 403`. Add a `requireResourceOwner(resource, session)` helper as the next primitive.

### CSRF protection
Mutation routes accept POST without origin verification beyond cookies. NextAuth covers its own endpoints; everything else needs a CSRF token middleware. Recommend: same-origin check via `Origin` header validation in a middleware wrapper.

### Rate limiting
No rate limiting visible on any route. Critical for:
- `POST /api/auth/forgot-password` (account enumeration)
- `POST /api/auth/mfa-confirm` (brute force MFA codes)
- `POST /api/email/send` (spam)
- `POST /api/contributor/support/*` (abuse)

Recommend: Upstash Ratelimit middleware, IP + userId-keyed.

### Security headers
No CSP, X-Frame-Options, Referrer-Policy, or Permissions-Policy visible. Add via root `proxy.ts` response-header injection.

### Session lifetime + AUTH_SECRET rotation
- 30-day sessions per CLAUDE.md — appropriate for enterprise but long.
- No documented rotation procedure for `AUTH_SECRET`. Document it; key rotation requires re-encrypting the JWE cookie population, so this needs a maintenance-window plan.

---

## Verification

Typecheck: passes.

Behavioral:
- `POST /api/superadmin/users` from a `contributor` session → 403 (was previously: accepted call, then 401 from upstream; race-confusable)
- `POST /api/reviewer/create` without session → 401
- `POST /api/reviewer/create` from `mentor` session → 403
- `assertNoDemoBypassInProduction()` with `NODE_ENV=production` + `NEXT_PUBLIC_ENTERPRISE_DEMO=1` → throws on boot, message printed to stderr.

Set `ALLOW_DEMO_IN_PRODUCTION=1` to override (for the rare sandbox prod-demo case).

---

## Estimated remaining security-hardening effort

- Wire `requireRole` to the 26 ⚠️ routes above: **2 days**
- Add `requireResourceOwner` helper + wire it: **1 day**
- CSRF middleware: **1 day**
- Rate limiting (Upstash + key strategy): **1-2 days**
- Security headers: **0.5 days**
- AUTH_SECRET rotation runbook: **0.5 days**

**Total to close P0 security gap: ~6-7 engineer-days** after this pass.
