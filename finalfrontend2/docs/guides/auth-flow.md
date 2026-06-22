# Login & Onboarding Flow — by Role

> **Status:** Phase 1 reference · audited against the build · 2026-05-27
> **Owner:** Product · Engineering · Design
> **SOW anchors:** §3.1.MVP.3 (Onboarding), §3.1.MVP.8 (IAM/RBAC), §3.1.MVP.9 (HRIS sync)

This document explains:
1. **Who** logs in (the actors).
2. **Where** they log in (the one shared door).
3. **How** they get an account in the first place (provisioning).
4. **What** they sign in with (mechanism by role).
5. **Where** they land after sign-in (routing).
6. **What's implemented vs. what's still pending** (build status).

---

## 1. The one shared door

Every actor signs in at **the same URL**:

```
https://app.glimmora.app/auth/login
```

The login page (`src/app/auth/login/page.tsx`) shows three sign-in choices to everyone:

```
┌────────────────────────────────┐
│ [ Google ]   [ Microsoft ]      │  ← SSO via NextAuth providers
│ ─── or with email ───            │
│ Email                            │
│ Password [ 👁 ]                  │
│ ☑ Keep me signed in              │
│ [ Sign in ]                     │
└────────────────────────────────┘
```

After sign-in, **NextAuth mints a JWT** with these claims:

```ts
{
  sub:     <user.id>,
  email:   <user.email>,
  name:    <user.firstName + lastName>,
  role:    <user.role>,            // ← the key claim
  provider: "local-credentials" | "google" | "microsoft-entra-id" | "sso",
  // ...glimmora API tokens if signed in via the upstream-API credentials provider
}
```

The `role` claim is read by **`src/proxy.ts`** middleware on every protected request. It maps the role to the portal home:

```ts
const ROLE_HOME = {
  contributor:  "/contributor/dashboard",
  enterprise:   "/enterprise/dashboard",
  reviewer:     "/enterprise/reviewer",       // sub-portal
  mentor:       "/mentor/dashboard",
  admin:        "/admin/dashboard",
  super_admin:  "/admin/dashboard",
};
```

The middleware also **enforces portal scope** — a `contributor`-roled user requesting `/enterprise/*` gets bounced to their own home with `?reason=portal_mismatch`.

---

## 2. Actors & roles

There are **four portals** and **role taxonomies** like this:

| Portal | Roles in the taxonomy | Who owns the people |
|---|---|---|
| **Contributor** (`/contributor/*`) | `contributor` | Mixed — see sub-types below |
| **Enterprise** (`/enterprise/*`) | `ent.admin`, `ent.sponsor`, `ent.pmo`, `ent.finance`, `ent.reviewer`, `ent.it` | The enterprise customer |
| **Mentor** (`/mentor/*`) | `mentor`, `mentor.senior`, `mentor.lead` | Glimmora |
| **Platform Admin** (`/admin/*`) | `plat.admin`, `plat.tsm`, `plat.mpm`, `plat.tns`, `plat.compliance`, `plat.payments`, `plat.partnerships`, `plat.ai` | Glimmora |

> The JWT today carries the **legacy single-role string** (`contributor`, `enterprise`, `mentor`, `reviewer`, `admin`, `super_admin`). The scoped taxonomy (`ent.*`, `mentor.*`, `plat.*`) is what the portal specs use and what the JWT will carry once the role-array migration ships (Phase 1B).

### 2.1 Contributor sub-types — same role, different *track*

The four contributor sub-types all share the JWT role `contributor`. The sub-type lives in **profile data** (`User.track`, `User.universityId`, `User.partnerOrgId`, `User.hrisId`), not in the role string:

| Sub-type | Track value | Sourced from |
|---|---|---|
| **Freelancer** | `freelancer` | Self-registration |
| **Student** | `student` | University MOU |
| **Women workforce** | `women_wf` | Partner org (e.g., Sheroes) |
| **Internal employee** | `internal` | Enterprise HRIS sync |

The sub-type controls:
- the **onboarding wizard branch** they go through (`/onboarding/student`, `/onboarding/women`, generic flow for the others),
- which **KYC queue** they land in (`Women WF`, `Student`, `Freelancer`, `Internal`),
- which **dashboard modules** render (spec doc 01 §5.C.3 persona-conditional cards),
- the **orgChip** displayed in the sidebar (Sheroes / IIT Madras / Acme / no chip).

---

## 3. Provisioning paths — how the account first exists

Account creation is **one-time** per user. After that, the user signs in repeatedly. Below is the provisioning path for each actor.

### 3.A Freelancer contributor
1. Visits `/auth/register` directly (or from the landing page).
2. Submits name + email + password.
3. Email-verification link arrives (`/auth/activate?token=…`).
4. Clicks the link → email is verified → account is `track: "freelancer"`.
5. Redirected to `/onboarding/skills` → consent → availability → evidence → KYC submission.
6. **Trust & Safety admin** reviews the KYC in `/admin/kyc/{caseId}` — approves or rejects.
7. On approval, contributor lands on `/contributor/dashboard`.

### 3.B Student contributor
1. Glimmora **Partnership Manager** signs a university MOU and adds the partner at `/admin/partnerships/universities/new`.
2. University **supervisor** emails students a signup link with university referral code.
3. Student visits the link → registers with their university email → `track: "student"`, `universityId` set.
4. Onboarding routes through `/onboarding/student` (consent + university supervisor selection + skills + availability + evidence).
5. KYC submitted → admin reviews → on approval → `/contributor/dashboard` with university orgChip.

### 3.C Women-workforce contributor
1. Partner org added at `/admin/partnerships/women-workforce/new`.
2. Partner org refers the contributor — invite email with referral code goes out.
3. Contributor registers → `track: "women_wf"`, `partnerOrgId` set.
4. Onboarding routes through `/onboarding/women` (consent + partner-supervisor pairing + skills + availability + evidence).
5. KYC reviewed → on approval → `/contributor/dashboard` with partner orgChip.

### 3.D Internal-employee contributor
1. Enterprise's IT admin connects their **HRIS** in `/enterprise/settings/integrations`.
2. HRIS sync runs (manual trigger Phase-1, scheduled Phase-2). Pulls **email, role, manager, cost-center** for every employee.
3. Each pulled employee gets an account created with `track: "internal"`, `provider: "sso"`, **no passwordHash**.
4. Employee signs in via the **enterprise IdP** (Microsoft Entra or Google Workspace) — never sets a password.
5. First-login redirects to a lightweight onboarding (`/onboarding/consent` + skills self-attestation). No KYC for internal employees (identity already verified by employer).
6. Lands on `/contributor/dashboard` with employer orgChip.

### 3.E Enterprise user (any `ent.*` sub-role)
1. **Tenant** is provisioned by a Glimmora **Tenant Success Manager** through the 6-step wizard at `/admin/tenants/new`.
2. Step 2 of the wizard captures the **primary admin email** → invite email sent.
3. Primary admin (`ent.admin`) clicks the link, sets password, completes tenant onboarding (`/enterprise/onboarding/*`).
4. Once active, the primary admin **invites other ent.* users** from `/enterprise/settings/members` — each gets an invite email, sets password, and joins.
5. All `ent.*` users sign in at `/auth/login` and land per `ROLE_HOME`:
   - `ent.reviewer` → `/enterprise/reviewer` (sub-portal only)
   - Everyone else → `/enterprise/dashboard`

### 3.F Mentor (all three tiers)
1. Glimmora **Mentor Program Manager (MPM)** invites at `/admin/mentors/new` — email, country, roles (`mentor` / `mentor.senior` / `mentor.lead`), pool assignment.
2. Mentor receives invite email, sets password, completes a brief mentor onboarding (consent + availability + competency confirmation).
3. Signs in next time via Google (preferred for `@glimmora.team` emails) or email+password.
4. Lands on `/mentor/dashboard`. Senior/lead tiers unlock extra sidebar items.

### 3.G Platform admin (any `plat.*` sub-role)
1. Seeded directly to the database during initial Glimmora setup (Phase 1: SQL seed; Phase 2: bootstrapped via a privileged "founding admin" account).
2. Additional platform staff: assigned `plat.*` roles via database seed / backend promotion (Phase 2: UI at `/admin/roles`).
3. **Production:** Glimmora SSO only (per spec doc 04 §5.A.1). No password fallback for staff.
4. **Dev:** email + password via the `local-credentials` provider (e.g., `admin@glimmora.ai / admin1234` seeded by `scripts/ensure-admin.ts`).
5. Lands on `/admin/dashboard`.

---

## 4. Sign-in mechanism by role

After the account exists, the recurring sign-in differs by user type:

| User type | Preferred mechanism | Backup mechanism | Source of truth |
|---|---|---|---|
| Freelancer | Email + password | Google OAuth | Local DB |
| Student | Email + password (university email) | Google OAuth | Local DB |
| Women WF | Email + password | none | Local DB |
| Internal employee | **Enterprise SSO** (Microsoft Entra / Google Workspace) | — | Enterprise IdP |
| Enterprise admin / sponsor / pmo / finance / reviewer / IT | Enterprise SSO | Email + password | Enterprise IdP (preferred) |
| Mentor | Google (`@glimmora.team`) | Email + password | Local DB / Google Workspace |
| Platform admin | **Glimmora SSO only** (production) | Email + password (dev only) | Glimmora IdP |

---

## 5. The technical flow — what actually happens when they click "Sign in"

### 5.1 OAuth path (Google / Microsoft)

```
User clicks "Google" or "Microsoft"
       │
       ▼
signIn("google", { callbackUrl })  ────►  redirect to Google/MS IdP
       │
       ▼
IdP authenticates user, redirects back to /api/auth/callback/google
       │
       ▼
NextAuth's `Google` / `MicrosoftEntraID` provider:
   • verifies the OAuth response (state + PKCE)
   • upserts the User row (or fails with SsoNotRegistered)
       │
       ▼
JWT minted with `role` from the User row, session cookie set
       │
       ▼
Middleware reads role on next request → routes to ROLE_HOME[role]
```

### 5.2 Email + password path (current — local)

```
User types email + password, clicks "Sign in"
       │
       ▼
signIn("local-credentials", { email, password, redirect: false })
       │
       ▼
`local-credentials` provider in src/auth.ts:
   • prisma.user.findUnique({ email })
   • bcrypt.compare(password, user.passwordHash)
   • if either fails → return null → Auth.js surfaces "credentials error"
   • if both pass → return user object → JWT minted with user.role
       │
       ▼
Login page fetches /api/auth/session → reads role → router.push(ROLE_HOME[role])
```

### 5.3 Email + password path (Phase 2 — via upstream Glimmora API)

```
User types email + password, clicks "Sign in"
       │
       ▼
POST /api/auth/validate { email, password }
       │
       ▼
proxies to GLIMMORA_API_BASE_URL/v1/auth/login
       │  ── returns: { user, access_token, refresh_token, expires_in,
       │                status? ("mfa_required" | "mfa_setup_required" | …),
       │                mfa_pending_token? }
       ▼
If status === "mfa_required":
       ─► show MFA TOTP form → POST /api/auth/mfa/confirm
       ─► on success → signIn("credentials", …) with the validated tokens
If status === "mfa_setup_required":
       ─► redirect to /auth/mfa-setup → QR code → confirm → signIn(…)
Else:
       ─► signIn("credentials", { email, password, … }) directly
       │
       ▼
"credentials" provider re-calls upstream /v1/auth/login → JWT minted
```

> Phase 2 path is wired in `src/auth.ts` (`credentials` provider, lines 225+) but **doesn't run in local dev** because `GLIMMORA_API_BASE_URL` isn't set. The Phase-1 path (`local-credentials`) bypasses all of this.

### 5.4 Enterprise SSO (Phase 2)

Same as 5.1 but the OAuth client ID is the **enterprise tenant's own IdP** (configured in `/enterprise/settings/integrations`), not Glimmora's. Sign-in is restricted to that tenant's domain. The HRIS-synced internal employees use this path exclusively.

---

## 6. Onboarding — what happens *after* sign-in for a new account

Each user type has a different post-sign-in onboarding flow.

### 6.1 Contributor onboarding routes

| Route | Purpose | Branch |
|---|---|---|
| `/onboarding/student` | Student-specific consent + university supervisor binding | Student track |
| `/onboarding/women` | Women-WF consent + partner supervisor pairing | Women WF track |
| `/onboarding/consent` | Generic platform consent (T&C, privacy, optional notifications) | All four tracks |
| `/onboarding/skills` | Initial skill self-attestation (against the global taxonomy) | All four tracks |
| `/onboarding/availability` | Weekly hours + timezone | All four tracks |
| `/onboarding/evidence` | Upload credentials / portfolio links (Phase-1 light) | Freelancer / Student / Women WF |
| `/onboarding/verify` | KYC document upload | Freelancer / Student / Women WF (skipped for internal employees) |
| `/onboarding/complete` | Final landing — animation + redirect to dashboard | All four tracks |

`/contributor/onboarding/*` exists as an in-portal onboarding for users who skipped the unauthenticated flow (e.g., SSO users whose first session lands them in the portal directly).

### 6.2 Enterprise onboarding

`/enterprise/onboarding/*` — a multi-step wizard for the **primary admin (`ent.admin`)** of a newly-provisioned tenant: confirm tenant metadata, invite the other `ent.*` users, configure the first SOW upload destination, set retention defaults, accept the MSA contract reference. After this completes, the tenant flips to status `active`.

### 6.3 Mentor onboarding

**Not yet built as a dedicated route.** When a mentor's invite is clicked, they're routed to `/auth/activate` → set password → `/mentor/dashboard`. The competency confirmation step (review the matrix MPM set, accept/contest) and the consent step are **pending**.

### 6.4 Platform admin onboarding

**Not built.** New platform admins are seeded directly to the DB; there is no onboarding screen. Phase 2 would add a short "your role, your scope, your environments" walkthrough.

---

## 7. Implementation status — what's built vs. pending

| Concern | Status | Where in code |
|---|---|---|
| `/auth/login` UI (Meridian redesign) | ✅ Built | `src/app/auth/login/page.tsx` |
| Email + password sign-in via local Prisma | ✅ Built | `src/auth.ts` — `local-credentials` provider |
| Email + password via upstream Glimmora API | 🟡 Wired, dormant in dev | `src/auth.ts` — `credentials` provider |
| Google OAuth | ✅ Built | NextAuth `Google({…})` |
| Microsoft Entra OAuth | ✅ Built | NextAuth `MicrosoftEntraID({…})` |
| Glimmora-OAuth callback (post-upstream-OAuth synthetic signin) | ✅ Built | `glimmora-oauth` credentials provider |
| `/auth/register` (freelancer self-register) | ✅ Built | `src/app/auth/register/page.tsx` |
| `/auth/register/enterprise` | ✅ Built (rarely used; tenants are admin-invited in Phase 1) | route + form |
| `/auth/register/reviewer` | ✅ Built | route + form |
| `/auth/forgot-password` + `/auth/reset-password` | ✅ Built | routes + server actions |
| `/auth/change-password` (first-login password change) | 🟡 Wired to upstream API only | route exists |
| `/auth/mfa-setup` | 🟡 Wired to upstream API only | route exists |
| `/auth/oauth/callback` (Glimmora OAuth dance) | ✅ Built | route exists |
| `/auth/activate` (email verification) | ✅ Built | route + server action |
| `/auth/select-tenant` (multi-tenant disambiguation) | ✅ Built | route exists |
| `/auth/redirect` (post-signin role-router fallback) | ✅ Built | route exists |
| `/onboarding/*` shared post-register flow | ✅ Built | 8 step routes (consent, skills, availability, student, women, evidence, verify, complete) |
| `/contributor/onboarding/*` (in-portal) | ✅ Built | routes + components + hooks |
| `/enterprise/onboarding/*` | ✅ Built | routes + components |
| `/mentor/onboarding/*` | ❌ **Not built** | — |
| `/admin/onboarding/*` | ❌ Not needed in Phase 1 (admins seeded via SQL) | — |
| Role-to-portal routing | ✅ Built | `src/proxy.ts` middleware |
| Portal-scope enforcement | ✅ Built | `src/proxy.ts` `matchPortalRule()` |
| JWT role claim | ✅ Built | `src/auth.ts` jwt callback |
| Session token cookie | ✅ Built | NextAuth defaults + cookie hardening |
| Logout / sign-out flow | ✅ Built | `signOut()` from NextAuth |
| KYC review queue (post-onboarding gate for freelancer/student/women) | ✅ Built | `/admin/kyc` |
| KYC approval → contributor account activated | 🟡 Backend service + UI built; auto-routing on approval needs wiring | `src/lib/kyc.ts` |
| **HRIS sync (internal-employee provisioning)** | ❌ **Backend endpoint stub only — no UI, no scheduled job** | — |
| **Partner-referral invite system** (universities + WW orgs) | ❌ **No invite-link generator, no referral-code capture on register** | — |
| **MFA enforcement** (TOTP, SMS OTP) | 🟡 Spec'd; wired only on upstream-API path | — |
| **Multi-tenant tenant switching** for users on multiple tenants | 🟡 UI page exists at `/auth/select-tenant`; session-aware switching is partial | — |
| **Role-array migration** (JWT carries `roles: string[]` not a single role string) | ❌ Phase 1B | — |

### 7.1 The "needs design + implementation" list

These are the gaps you'll need to design + build before each contributor sub-type's full provisioning works end-to-end:

| Item | What's missing | Effort |
|---|---|---|
| **Partner-invite link** for students | Generator in `/admin/partnerships/universities/{uniId}` that produces a signed referral URL the supervisor can email students | small |
| **Partner-invite link** for women WF | Same as above, but in `/admin/partnerships/women-workforce/{orgId}` | small |
| **Referral code capture on `/auth/register`** | Read `?ref=` and pre-fill `track` + `partnerOrgId` / `universityId`; show partner orgChip on the register form | small |
| **HRIS sync UI** in `/enterprise/settings/integrations` | Pick provider (BambooHR / Workday / Personio) → enter credentials → test connection → trigger first sync → success state | medium |
| **HRIS sync scheduled job** | Background job that re-pulls daily; surfaces diffs in a "pending changes" UI for the tenant admin to confirm | medium |
| **Mentor onboarding wizard** at `/mentor/onboarding/*` | Consent → competency review/accept → initial availability → done | small |
| **Internal-employee SSO sign-in** | Connect the tenant's IdP from Settings → user clicks "Microsoft" / "Google" on login → IdP recognizes them → first-login routes to `/onboarding/consent` (skipping KYC) | medium |
| **First-login password change** without the upstream API | Right now `/auth/change-password` POSTs to `GLIMMORA_API_BASE_URL`; need a local server action variant | small |
| **MFA enforcement** without upstream | Local TOTP generator + verifier, store secret on User row, gate sign-in if MFA enabled | medium |

### 7.2 The "fully working today" list

These flows are real and demonstrable now (locally, with `npm run dev`):

- Self-register a freelancer at `/auth/register` → email + password → `/onboarding/*` → `/contributor/dashboard`.
- Sign in as `admin@glimmora.ai / admin1234` → `/admin/dashboard` (via the new `local-credentials` provider).
- Sign in via Google OAuth (assuming `GOOGLE_CLIENT_ID/SECRET` is set in `.env.local`) → routes to correct portal.
- Sign in via Microsoft Entra OAuth (with credentials set) → routes correctly.
- Enterprise admin invite + activation flow (via `/auth/activate`).
- Tenant provisioning via `/admin/tenants/new` → admin email invite → password set → enterprise portal.
- Mentor invite via `/admin/mentors/new` (UI built; activation flow uses shared `/auth/activate`).

---

## 8. Putting it all together — a worked example for each sub-type

### Anita — Women-WF contributor (freelance basis, referred via Sheroes)

```
1. Day 0 — Sheroes signs the partner agreement, Glimmora's Partnership
   Manager adds Sheroes at /admin/partnerships/women-workforce/new.

2. Day 1 — Sheroes program lead generates an invite link from
   /admin/partnerships/women-workforce/ww-sheroes  (PENDING — see §7.1)
   and emails it to Anita.

3. Day 1 — Anita clicks: /auth/register?ref=ww-sheroes&track=women_wf
   Sets email + password. Email verification arrives.

4. Day 1 — Anita verifies email (/auth/activate?token=…) → routed to
   /onboarding/women → consent → supervisor pairing → skills →
   availability → evidence → KYC upload.

5. Day 2 — T&S admin reviews Anita's KYC at /admin/kyc/KYC-892,
   approves it.

6. Day 2 — Anita signs in at /auth/login (email + password) →
   JWT { role: "contributor", track: "women_wf", partnerOrgId: "ww-sheroes" }
   → /contributor/dashboard with Sheroes orgChip and her dashboard's
   "Supervision" module visible.

7. Day 30 — Anita signs in monthly the same way.
```

### Karthik — Acme internal employee (set up to act as ent.reviewer)

```
1. Day 0 — Acme's IT admin connects their Azure AD HRIS in
   /enterprise/settings/integrations  (PENDING — see §7.1).
2. Sync runs, pulls Karthik in with role ent.reviewer (mapped from
   his Acme job title + manager hierarchy).
3. Karthik gets a one-time "welcome to GlimmoraTeam" email.
4. Karthik clicks "Microsoft" on /auth/login → MS Entra recognizes
   his Acme account → JWT { role: "reviewer", provider: "sso" }.
5. First login routes to a light /onboarding/consent step (no KYC,
   no skills — internal employees have an HRIS-verified profile).
6. He lands on /enterprise/reviewer — only the reviewer sub-portal,
   not the full enterprise dashboard.
7. Daily: same Microsoft sign-in, no password ever set.
```

---

## 9. Quick-reference — "where does X sign in?"

| If you are… | You sign in at… | Using… | And you land at… |
|---|---|---|---|
| A freelancer | /auth/login | email + password | /contributor/dashboard |
| A student | /auth/login | email + password | /contributor/dashboard |
| A women-WF contributor | /auth/login | email + password | /contributor/dashboard |
| An internal employee | /auth/login | "Microsoft" or "Google" SSO | /contributor/dashboard |
| The enterprise admin | /auth/login | email + password OR enterprise SSO | /enterprise/dashboard |
| An enterprise reviewer | /auth/login | email + password OR enterprise SSO | /enterprise/reviewer |
| A mentor | /auth/login | "Google" (@glimmora.team) OR email + password | /mentor/dashboard |
| A platform admin | /auth/login | Glimmora SSO (prod) / email + password (dev) | /admin/dashboard |

**One door. Different keys. Different rooms.**

---

## End of document
