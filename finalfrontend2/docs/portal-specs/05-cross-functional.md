# Cross-Functional Platform Contracts — Detailed Specification

> **Status:** Draft v1.0 — Phase 1 rebuild reference
> **SOW anchor:** GLIMMORATEAM™ Global Workforce Intelligence Platform v1.1
> **Owner:** Platform Engineering · Security · Data
> **Last updated:** 2026-05-26

---

## 0. Document control

| Field | Value |
|---|---|
| Document role | Source of truth for the **horizontal contracts** every portal depends on |
| Audience | Backend engineers, platform engineers, security, SRE; consumed by all four portal teams |
| SOW anchor | §3.1.MVP.7, §3.1.MVP.8, §3.1.MVP.9, §3.1.1, §3.1.2, §3.1.8, §5, §6, §14, §15, §16, §17, §18 |
| Phase 1 horizon | 0–90 days |
| Scope philosophy | Define every boundary that's shared across portals; portals depend on this doc; no portal redefines anything that lives here |

### Why this document

Each portal spec (01–04) defines its UI surfaces. Those surfaces all **call into shared infrastructure** for auth, RBAC enforcement, audit writes, AI invocations, notifications, integrations, and persistence. This document defines the **contracts** for that shared infrastructure — what the API looks like, what guarantees hold, what fails gracefully.

If a portal spec says "writes audit event," this doc says **what that event looks like, where it's stored, and what's promised**.

### Reading conventions

- **§** = SOW · **P1/P2** = Phase 1/2 · **🚧 BUILD** · **🔧 WIRE** · **✅ KEEP**
- Sequence diagrams use ASCII; data contracts use TypeScript-like syntax
- "MUST" / "SHOULD" / "MAY" follow RFC 2119 semantics

---

## 1. Scope

### 1.1 What this document defines

| Concern | What's defined |
|---|---|
| Identity & auth | SSO, OAuth, password, MFA, session model |
| Authorization | RBAC, tenant isolation, server-side enforcement |
| Audit | Immutable event log, signing, retention, export |
| AI service | Agent contracts, confidence, override capture, fallback |
| Notifications | Dispatch, channels, templates, preferences |
| Integrations | HRIS, SSO IdPs, webhooks, payment rails, file scan, email/SMS, ERP |
| Data model | Tenancy, versioning, soft delete, foreign keys |
| Idempotency | API keys, event dedup, webhook semantics |
| Accessibility | WCAG 2.1 AA contract |
| i18n | Locale, currency, timezone, RTL framework |
| Observability | Logging, tracing, metrics, health |
| Security | TLS, encryption, secrets, vulnerability handling |

### 1.2 What this document does NOT define

- UI components (each portal spec covers its own UI)
- Business logic specific to one portal (lives in that portal's spec)
- Marketing pages, public site, docs portal
- Mobile native apps (not in Phase 1)

### 1.3 Service boundaries (Phase 1)

```
┌────────────────────────────────────────────────────────────────┐
│                   Next.js App Router (all portals)              │
└─────────────────┬──────────────────────────────────────────────┘
                  │
   ┌──────────────┼──────────────┬─────────────┬────────────────┐
   ▼              ▼              ▼             ▼                ▼
┌──────┐  ┌──────────────┐  ┌────────┐  ┌──────────┐  ┌──────────────┐
│ Auth │  │ App services │  │ Audit  │  │ AI orch. │  │ Notifications│
│ svc  │  │ (Prisma /    │  │ svc    │  │ svc      │  │ svc          │
│      │  │  Postgres)   │  │        │  │          │  │              │
└──────┘  └──────────────┘  └────────┘  └──────────┘  └──────────────┘
                  │              │             │                │
                  ▼              ▼             ▼                ▼
            ┌─────────┐    ┌─────────┐  ┌──────────┐    ┌──────────┐
            │Postgres │    │Postgres │  │ LLM API  │    │Email/SMS │
            │+ tables │    │ append- │  │(Claude/  │    │ providers│
            │         │    │  only   │  │ OpenAI)  │    │          │
            └─────────┘    └─────────┘  └──────────┘    └──────────┘

External:
  • SSO IdPs (Azure AD, Okta, Google Workspace, custom SAML/OIDC)
  • HRIS (Workday, BambooHR, SAP, custom)
  • Payment rails (Razorpay, Wise, bank APIs)
  • File scan (ClamAV, plagiarism provider)
  • Webhooks (outbound to Jira, Slack, generic)
  • ERP file drop (SFTP, S3)
```

---

## 2. Authentication & identity

### 2.1 Stack

- **NextAuth v5** as the auth orchestrator (existing)
- **JWT sessions**, 30-day expiry, rotated on each successful refresh
- **Postgres** for credential storage (`passwordHash` bcrypt cost 12)
- **Redis** for short-lived state (OTPs, session blacklist on logout)

### 2.2 Identity providers (Phase 1)

| Provider | Audience | Phase | SOW |
|---|---|---|---|
| **SAML 2.0** | Enterprise customers' staff | P1 — 🚧 BUILD | §3.1.MVP.8 |
| **OIDC** | Enterprise customers' staff | P1 — 🚧 BUILD | §3.1.MVP.8 |
| **Glimmora SSO** (Google Workspace OIDC) | Glimmora staff | P1 — 🚧 BUILD | §3.1.MVP.8 |
| **Email + password** | External contributors, mentors not on SSO | P1 — ✅ KEEP | §3.1.MVP.8 |
| **Google OAuth** | Contributors (consumer convenience) | P1 — ✅ KEEP | §3.1.MVP.8 |
| **Microsoft OAuth** | Contributors with Microsoft accounts | P1 — ✅ KEEP | §3.1.MVP.8 |

> Phase 2: LinkedIn OAuth, Apple Sign In, GitHub OAuth.

### 2.3 Account-to-portal routing

A user can hold roles in **multiple portals**. On login, NextAuth resolves the identity to a `User` row, then to a `roles[]` array. Routing rule:

```
if (roles.includes('contributor')) → /contributor/dashboard
else if (roles.includes('mentor*')) → /mentor/dashboard
else if (roles.includes('ent.*')) → /enterprise/dashboard
else if (roles.includes('plat.*')) → /admin/dashboard

If user has 2+ portal roles → tenant/portal selector page (doc 02 §5.A.1)
```

### 2.4 MFA contract

| Method | Phase | Notes |
|---|---|---|
| Authenticator app (TOTP) | P1 | Recommended default |
| SMS code | P1 | India SMS rail; cost-tracked |
| Email code | P1 | Fallback |
| WebAuthn / passkeys | P2 | — |

**Enforcement rules:**
- Enterprise tenants MAY require MFA for all staff (tenant policy, doc 02 §5.K.9)
- Glimmora staff (plat.*) MUST have MFA enabled
- Contributors and mentors are NOT required by default; recommended on signup

### 2.5 Session model

```typescript
interface Session {
  userId: string;
  tenantId?: string;         // null for contributors and Glimmora staff
  roles: string[];            // e.g., ['ent.sponsor', 'ent.pmo']
  primaryPortal: 'contributor' | 'enterprise' | 'mentor' | 'admin';
  glimmoraAccessToken: string;
  glimmoraRefreshToken: string;
  glimmoraExpiresAt: number;
  mfaVerified: boolean;
  trustedDeviceUntil?: number;
  issuedAt: number;
  expiresAt: number;          // 30 days from issuedAt
}
```

**Refresh:** any request within 7 days of `expiresAt` triggers silent refresh.

### 2.6 Sequence: SSO login (SAML)

```
[User] → click "Continue with SSO"
   ↓
[Glimmora] → /api/auth/sso/saml/initiate
   ↓
[Glimmora] → resolve tenant from email domain → IdP URL
   ↓
[User browser] → 302 to IdP login
   ↓
[IdP] → user authenticates → POST SAMLResponse
   ↓
[Glimmora] → /api/auth/sso/saml/callback
   ↓
[Glimmora] → verify signature, extract claims, map to roles
   ↓
[Glimmora] → create session → 302 to /<portal>/dashboard
```

### 2.7 First-time SSO user

If the IdP assertion contains an email not in our `User` table:

- **Enterprise tenant**: claim mapping creates the user with claim-mapped roles; user lands at `/enterprise/dashboard` (or sponsor's first-time tour)
- **Contributor**: claim mapping creates a new contributor; user lands at `/contributor/onboarding?sso=true`
- **Glimmora staff**: must be pre-provisioned in `plat.*` role; otherwise login fails with "Contact your administrator"

### 2.8 Session lifetime edge cases

- **Idle timeout (per tenant policy)**: enforced via heartbeat ping; default 30 days (= session expiry)
- **Forced logout**: admin or self can revoke sessions; revoked session ID added to Redis blacklist for the remaining session lifetime
- **Password change**: invalidates all sessions except the current one
- **Tenant pause**: all sessions for that tenant's users blocked with "Tenant paused" message
- **Mentor suspension**: mentor's sessions invalidated immediately
- **Account deletion** (contributor): grace period 30 days; sessions still work but with a global banner; after 30 days, sessions invalidated

---

## 3. Authorization (RBAC + tenant isolation)

### 3.1 Role taxonomy

Roles use dotted scope notation: `<scope>.<role>`.

| Scope | Roles | Doc |
|---|---|---|
| `contributor` (implicit, no prefix) | — | 01 |
| `mentor.*` | mentor, mentor.senior, mentor.lead | 03 |
| `ent.*` | admin, sponsor, pmo, finance, compliance, reviewer, procurement, it | 02 |
| `plat.*` | admin, tsm, mpm, tns, compliance, payments, partnerships, ai | 04 |

A user can hold roles across scopes (e.g., a Glimmora staff member can be `plat.tns + plat.admin`; a contributor can also be a `mentor` if they're a senior contributor mentoring juniors).

### 3.2 Permission model

Permissions follow `<action>.<resource>` pattern. Roles map to permission sets.

```typescript
type Permission =
  | `read.${string}`
  | `create.${string}`
  | `update.${string}`
  | `delete.${string}`
  | `${string}.${string}`;     // for special actions like 'approve.sow'

interface Role {
  code: string;                  // e.g., 'ent.sponsor'
  scope: 'contributor' | 'mentor' | 'enterprise' | 'platform';
  permissions: Permission[];
  description: string;
  mutuallyExclusiveWith?: string[];  // SoD rules
}
```

### 3.3 Server-side enforcement (Next.js middleware)

**Phase 1 must-build: `src/middleware.ts`** — runs before every route, enforces:

1. **Auth check** — session valid; redirect to `/auth/login` if not
2. **Portal scope** — current path matches the user's roles (a `contributor`-only user opening `/enterprise/*` → 403)
3. **Tenant scope** — for enterprise routes, the URL tenant slug (or implicit tenant from session) MUST match the user's `session.tenantId`
4. **Role check on dynamic routes** — e.g., `/enterprise/billing/rate-cards/new` requires `ent.admin` OR `ent.finance`
5. **MFA check** — if MFA required by tenant or platform policy, redirect to `/auth/mfa` for unverified sessions

```typescript
// Sketch
export async function middleware(req: NextRequest) {
  const session = await getSessionFromCookie(req);
  if (!session) return redirect('/auth/login');

  const portal = inferPortalFromPath(req.nextUrl.pathname);
  if (!session.roles.some(r => roleMatchesPortal(r, portal))) {
    return notAuthorized();
  }

  if (portal === 'enterprise' && !pathTenantMatchesSession(req, session)) {
    return notAuthorized();
  }

  if (requiresMfa(session) && !session.mfaVerified) {
    return redirect('/auth/mfa');
  }

  // Per-route permission check at API/page handler (more granular than middleware)
  return NextResponse.next();
}
```

### 3.4 Client-side gates (sidebar + UI)

Client-side gating hides UI elements the user can't use. This is **UX-only** — never trust the client for security:

```typescript
// Client component
if (!hasRole('ent.finance')) return null;   // hides "Rate Cards" link
```

Server MUST re-check on every request. Hidden UI never substitutes for server enforcement.

### 3.5 Tenant isolation

Every row in tenant-scoped tables has a `tenant_id` column. Postgres-level **row-level security (RLS)** policies enforce:

```sql
CREATE POLICY tenant_isolation ON sow
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

The app sets `SET LOCAL app.tenant_id = '<uuid>'` at the start of every request inside a transaction. RLS catches any query that forgets to filter by tenant.

**Cross-tenant tables** (no tenant_id):
- `skill_taxonomy` — global
- `rubric_template` — global defaults; per-tenant overrides have tenant_id
- `mentor` — cross-tenant (a mentor can review tasks from multiple tenants)
- `mentor_pool` — `scope` field is either `tenant_id` or `'cross-tenant'`
- `audit_event` — has `tenant_id` for tenant-scoped events; `null` for platform-internal events. Compliance role can read across; others see only their tenant.

### 3.6 Separation of duties (SoD)

Some role combinations create conflicts of interest. Phase 1 = **warn**, not block.

| Conflict pair | Warning |
|---|---|
| `ent.finance` + `ent.procurement` (same user) | "These roles are typically separated for SOX compliance." |
| `mentor` + `ent.reviewer` for same project | "You'd review your own mentor decisions — recused from project's two-stage queue." |
| `plat.compliance` + `plat.tns` | "Compliance audits your own T&S decisions — note for legal review." |

### 3.7 Permission audit

Every permission-checked action writes an audit event whether granted or denied. Denied actions write at severity `warning`. Repeated denies from the same user → security alert.

---

## 4. Audit system

### 4.1 Why audit matters (SOW §3.1.MVP.8, §14)

The SOW makes immutable audit logs MVP-binding for: SOW changes · assignments · submissions · reviews · acceptances · pricing · payout eligibility. The audit system is therefore a **first-class platform capability**, not a side-effect.

### 4.2 Event schema

```typescript
interface AuditEvent {
  id: string;                     // UUIDv7 (time-orderable)
  tenantId: string | null;        // null for platform-internal events
  actor: {
    userId: string;
    portalRole: string;            // e.g., 'ent.sponsor'
    sessionId: string;
    ipAddress: string;
    userAgent: string;
  };
  action: string;                 // dotted action.resource (e.g., 'sow.approve')
  resource: {
    type: string;                 // e.g., 'sow', 'task', 'review', 'payout'
    id: string;
    label?: string;               // human-friendly name (e.g., SOW title)
  };
  payload: Record<string, unknown>;  // action-specific data
  before?: Record<string, unknown>;  // pre-mutation snapshot (for state changes)
  after?: Record<string, unknown>;   // post-mutation snapshot
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;              // ISO 8601 UTC
  signature?: string;             // HMAC of canonical event JSON
}
```

### 4.3 Storage & immutability

- **Append-only Postgres table** `audit_event`. No `UPDATE` or `DELETE` permitted at the DB role level for application connections.
- **Daily snapshot** to immutable object storage (S3 with object lock) for tamper-evidence.
- **Signing**: every event signed with tenant key (per tenant) or platform key (for platform-internal events). Signature includes a canonical JSON serialization. Tampering breaks the signature.
- **Retention**: indefinite by default; per-tenant configurable in compliance settings (doc 02 §5.I.3). Minimum retention floor: 7 years.

### 4.4 What gets audited (Phase 1 must-have)

| Action | Where it fires | Doc |
|---|---|---|
| `auth.login`, `auth.logout`, `auth.mfa.verify` | Auth | — |
| `auth.password.change`, `auth.session.revoke` | Auth | — |
| `sow.create`, `sow.update`, `sow.version`, `sow.approve.<stage>`, `sow.reject.<stage>` | Enterprise | 02 |
| `decomposition.create`, `decomposition.update`, `decomposition.approve` | Enterprise | 02 |
| `task.create`, `task.assign`, `task.reassign`, `task.withdraw`, `task.accept`, `task.decline` | Enterprise + Contributor | 01, 02 |
| `submission.create`, `submission.withdraw`, `submission.resubmit` | Contributor | 01 |
| `review.assign`, `review.decide`, `review.override` (AI delta) | Mentor + Enterprise reviewer | 02, 03 |
| `payout.eligible`, `payout.release`, `payout.fail`, `payout.reversed` | Finance | 02, 05 |
| `rate_card.create`, `rate_card.activate`, `rate_card.archive` | Finance | 02 |
| `tenant.provision`, `tenant.pause`, `tenant.resume`, `tenant.close` | Platform admin | 04 |
| `mentor.create`, `mentor.suspend`, `mentor.competency.update` | Platform admin | 04 |
| `skill.create`, `skill.merge`, `skill.deprecate` | Platform admin | 04 |
| `governance_case.open`, `governance_case.resolve`, `governance_case.escalate` | Platform admin | 04 |
| `kyc.decide` | Platform admin | 04 |
| `agent.prompt.activate`, `agent.prompt.rollback`, `agent.enable`, `agent.disable` | Platform admin | 04 |
| `integration.create`, `integration.update`, `integration.test` | Enterprise / Admin | 02, 04 |
| `notification.dispatch`, `notification.deliver`, `notification.fail` | Notification svc | this doc §6 |
| `consent.record`, `consent.revoke` | Compliance | 01, 02 |
| `permission.check` (with denial) | Middleware | this doc §3.7 |

### 4.5 Search & query

- **By actor** (`actor.userId`) — common compliance query
- **By resource** (`resource.type:resource.id`) — "show me everything that happened to SOW-1042"
- **By action** (`action` exact or prefix) — "all rate card activations"
- **By tenant** (`tenant_id`) — required for non-compliance roles
- **By time range** — required for export
- **Full-text** on `resource.label` and `payload.comment` — Postgres tsvector

### 4.6 Export

- **CSV**: human-readable, default
- **JSON**: nested, for legal/integration
- **NDJSON**: streaming friendly for large exports
- **Signed bundle** (optional): includes signature manifest; for tamper-evident legal evidence

Export endpoints (enterprise + admin) write a `audit.export` event for the export itself.

### 4.7 Sequence: audit write

```
[Service] → emits event
   ↓
[Audit svc] → validates schema
   ↓
[Audit svc] → signs (HMAC with tenant or platform key)
   ↓
[Audit svc] → INSERT into audit_event (append-only)
   ↓
[Audit svc] → fanout to:
              • compliance feed (if severity ≥ warning)
              • notification svc (if subscribed)
              • daily snapshot job (eventually consistent)
   ↓
[Service] ← acknowledged
```

Audit writes are **synchronous** for state-changing actions — if the audit fails, the action fails. This ensures we never have an undocumented mutation.

### 4.8 Phase 1 vs Phase 2

**Phase 1:**
- All actions above audited
- HMAC signing per event
- Daily S3 snapshot
- Search by actor/resource/action/tenant/time
- CSV/JSON/NDJSON export

**Phase 2:**
- Cryptographic merkle tree across events (verifiable evidence chain)
- Real-time stream subscription (webhooks for audit events)
- Cross-tenant analytics on audit
- Automated anomaly detection on audit patterns
- Audit retention policy automation (per-tenant rules)

---

## 5. AI service contracts

### 5.1 Phase 1 agents (SOW §3.1.MVP.7)

| Agent | Used by | Purpose |
|---|---|---|
| **SOW Intake Assistant** | Enterprise portal — SOW upload | Extract metadata, tag clauses, flag hallucination risk |
| **Decomposition Assistant** | Enterprise portal — Decomposition | Suggest milestones + tasks + skill tags + dependencies |
| **Contributor Support Assistant** | Contributor portal — Workroom | Answer task-related questions, surface AI signals (criteria progress, readiness) |
| **Review Assistant** | Mentor portal — Review detail | Pre-fill rubric scores, summarize submission, flag coverage gaps |

> SOW §3.1.MVP.7 explicit: "Agents operate in **assistive mode** for high-impact decisions; human approvals are mandatory for: acceptance, payouts, sanctions, and policy overrides."

### 5.2 Agent contract (shared)

Every agent call uses the same request/response envelope.

```typescript
interface AgentRequest {
  agentId: string;                 // 'review-assistant'
  promptId: string;                // 'review-assistant.score-rubric'
  promptVersion: string;           // 'v4'
  variables: Record<string, unknown>;
  context: {
    tenantId?: string;
    actorUserId: string;
    actorRole: string;
    requestId: string;             // for idempotency
  };
}

interface AgentResponse<T = unknown> {
  requestId: string;
  agentId: string;
  promptVersion: string;
  modelId: string;                 // e.g., 'claude-sonnet-4-6'
  output: T;                       // agent-specific schema
  confidence: number;              // 0..1
  sources: AgentSource[];          // citations / signals used
  coverageGaps: string[];          // what the agent did NOT check
  riskFlags: string[];             // e.g., ['hallucination_risk', 'incomplete_evidence']
  latencyMs: number;
  costCents?: number;              // Phase 2 — cost attribution
  generatedAt: string;
}

interface AgentSource {
  kind: 'task_field' | 'evidence_file' | 'criterion' | 'audit_event' | 'external_link';
  reference: string;
  excerpt?: string;
}
```

### 5.3 Confidence semantics

| Range | Label | UX treatment |
|---|---|---|
| ≥ 0.85 | High | "AI is confident; you can usually trust this" |
| 0.65–0.85 | Medium | "Reasonable suggestion; spot-check" |
| < 0.65 | Low | "Suggest only — the system is uncertain" |

Confidence is mandatory on every output. Outputs without confidence MUST NOT render in the UI.

### 5.4 Override capture

Every UI surface that consumes AI output MUST capture the human's final decision and write an `agent.override.delta` audit event if the human differs from the AI:

```typescript
interface AgentOverrideDelta {
  agentId: string;
  promptVersion: string;
  requestId: string;
  criterionOrField: string;
  aiValue: unknown;
  humanValue: unknown;
  humanReason?: string;
  decidedAt: string;
  actorUserId: string;
}
```

This is **the calibration signal** — never shown to mentors as a real-time scoreboard (that's Phase 2 governance), but feeds prompt tuning offline.

### 5.5 Failure modes

| Failure | UX behavior |
|---|---|
| LLM service unreachable | Agent panel collapses to "AI unavailable" message; surface still operates without AI |
| LLM returns invalid JSON | Agent panel shows "AI output couldn't be parsed; try again" + retry button |
| LLM timeout (>10s) | Cancel client-side; "AI took too long; submit without it or retry" |
| Prompt schema mismatch (server-detected) | Error logged; agent disabled for that invocation; fallback to "AI unavailable" |
| Rate limit hit | Soft degrade: serve cached suggestion if recent; otherwise "AI cooling down" |

**Rule:** AI failure NEVER blocks a critical human action. A mentor can review and decide without AI; a sponsor can upload a SOW without AI extraction (manual mode); a contributor can submit without AI readiness check.

### 5.6 Audit of every invocation

Every agent call emits two events:
- `agent.invoke` (request) — agent, prompt version, model, tenant, actor, request id
- `agent.respond` (response) — same id, confidence, latency, success/failure

Plus on every human override: `agent.override.delta` (above).

### 5.7 Prompt versioning (Platform Admin doc 04 §5.K)

- Active prompt is the one served on each invocation
- Rollback is an admin action; takes effect on the next invocation
- Audit trail on every activation and rollback

### 5.8 Phase 2 deferrals

- Bias monitoring dashboards (§3.1.1 - AI governance)
- Risk classification per agent (low/medium/high impact)
- Autonomy tier configuration (full / human-in-loop / notify-only) — Phase 1 = HITL-only
- A/B testing prompt variants
- Cost attribution to tenants
- Automated prompt regression testing

---

## 6. Notifications

### 6.1 Channels (Phase 1)

| Channel | Provider | SOW |
|---|---|---|
| In-app | Built-in (Postgres `notification` table + websocket/poll) | implicit |
| Email | Provider: SendGrid (or nodemailer fallback to SMTP) | §3.1.5 implicit |
| SMS (critical only) | Provider: Twilio for international + India local (e.g., MSG91) | §20.2 (safety) |

> Phase 2: push notifications (native + web), Slack DM integration, in-app voice.

### 6.2 Notification taxonomy

```typescript
interface Notification {
  id: string;
  recipientUserId: string;
  tenantId?: string;
  kind: NotificationKind;
  severity: 'critical' | 'important' | 'informational';
  payload: {
    title: string;
    body: string;
    actionUrl?: string;
    actionLabel?: string;
    resourceType?: string;
    resourceId?: string;
  };
  channels: Array<'in_app' | 'email' | 'sms'>;
  dispatchedAt: string;
  deliveredAt?: Partial<Record<'in_app' | 'email' | 'sms', string>>;
  readAt?: string;
}

type NotificationKind =
  | 'auth.password_changed'
  | 'auth.mfa_setup_required'
  | 'task.assigned'
  | 'task.accepted'
  | 'task.revision_requested'
  | 'task.accepted_final'
  | 'submission.under_review'
  | 'review.assigned'
  | 'review.sla_warning'
  | 'review.sla_breach'
  | 'mentorship.session_in_30min'
  | 'mentorship.session_no_show'
  | 'payout.eligible'
  | 'payout.sent'
  | 'payout.failed'
  | 'sow.stage_changed'
  | 'sow.approved'
  | 'sow.rejected'
  | 'governance.case_assigned'
  | 'governance.case_resolved'
  | 'safety.case_received'
  | 'kyc.approved'
  | 'kyc.rejected'
  | 'system.tenant_paused'
  | 'system.agent_unavailable';
```

### 6.3 Per-user preferences

Each user has a preferences matrix (kind × channel) with defaults:
- **Critical** channels locked on (email + in-app minimum)
- **Important** defaults to in-app + email
- **Informational** defaults to in-app only

### 6.4 Templates

Notification body comes from the **email template store** (doc 04 §5.G). Each `NotificationKind` maps to:
- An email template (subject + body)
- An in-app card layout (title + body + action)
- An SMS short text (critical only)

Templates use merge variables: `{{contributorName}}`, `{{taskTitle}}`, `{{actionUrl}}`, etc. Schema declared per template.

### 6.5 Dispatch sequence

```
[Service] → emit NotificationKind + recipient + payload
   ↓
[Notification svc] → load user preferences
   ↓
[Notification svc] → determine channels (intersect with prefs)
   ↓
[Notification svc] → INSERT into notification table (in_app always)
   ↓
[Notification svc] → fanout per channel:
          ├ in_app    → push via websocket / polled by client
          ├ email     → render template + send via SendGrid
          └ sms       → render short text + send via Twilio
   ↓
[Audit] → notification.dispatch event
[Audit] → notification.deliver event (per channel, on confirmation)
[Audit] → notification.fail event (on failure, with retry policy)
```

### 6.6 Delivery semantics

- **At-least-once delivery** with idempotency key (`notification.id`)
- **Retries**: 3 attempts with exponential backoff on transient failures
- **Dead letter queue** for permanent failures; visible in `/admin/system-health`
- **Receipt confirmation**: in-app marks `deliveredAt` on websocket ack; email via provider webhook; SMS via provider delivery report

### 6.7 Phase 2 deferrals

- Digest mode (daily/weekly summaries instead of per-event)
- User-configurable templates
- Conditional routing (e.g., "if SLA at risk, escalate to SMS")
- Cross-channel deduplication

---

## 7. Integrations layer

### 7.1 Integration types

| Type | Provider | Phase | SOW |
|---|---|---|---|
| **SSO** | SAML 2.0, OIDC (multi-provider) | P1 | §3.1.MVP.8 |
| **HRIS** | Workday, BambooHR, SAP SuccessFactors, custom CSV | P1 | §3.1.MVP.9 |
| **Webhooks** outbound | Jira, Slack, generic HTTP | P1 | §3.1.MVP.9 |
| **Payment rails** | Razorpay (India), Wise (global) | P1 | §3.1.MVP.6 |
| **File scan — virus** | ClamAV (self-hosted) | P1 | §3.1.MVP.5 implied |
| **File scan — plagiarism** | Provider TBD (Copyscape / Originality.ai) | P1 baseline; deeper Phase 2 | §3.1.MVP.5 implied |
| **Email** | SendGrid (primary), SMTP fallback | P1 | §3.1.5 implied |
| **SMS** | Twilio (intl), MSG91 (India) | P1 | §20.2 (safety alerts) |
| **ERP file drop** | SFTP / S3 | P1 (basic) | §3.1.7 |
| **Identity verification (KYC)** | Phase 1: manual + basic checks; Phase 2: automated provider (Persona / Onfido) | P1 minimal | §3.1.MVP.3 |

### 7.2 Common integration contract

All integrations follow a uniform pattern:

```typescript
interface Integration {
  id: string;
  tenantId?: string;             // null for platform-wide (e.g., Razorpay)
  type: IntegrationType;
  status: 'configured' | 'testing' | 'active' | 'degraded' | 'paused' | 'failed';
  config: Record<string, unknown>;  // type-specific
  credentialsRef: string;        // points to secrets store (never inline)
  lastTestAt?: string;
  lastSyncAt?: string;
  errorCount24h: number;
  createdBy: string;
  createdAt: string;
}
```

Configuration UI lives in enterprise portal (doc 02 §5.K) for tenant integrations, platform admin (doc 04 §5.L) for platform-wide rails.

### 7.3 HRIS sync contract

**Input** (from HRIS):
```typescript
interface HrisEmployeeRecord {
  employeeId: string;
  preferredName: string;
  email: string;
  jobTitle: string;
  organization: string;
  manager?: string;              // employeeId of manager
  costCenter: string;
  status: 'active' | 'inactive' | 'pending';
}
```

**Sync rules:**
- Phase 1: pull-based, scheduled (default daily 03:00 IST per tenant)
- Idempotent: re-syncing same record is a no-op if hash unchanged
- Delete handling: HRIS-removed employee → mark `inactive`, retain row (audit + active tasks)
- Conflict: HRIS data wins for matched fields; user profile edits in Glimmora overridden on next sync (with audit)
- Preview before commit (doc 02 §5.K.5)

### 7.4 Webhook contract (outbound)

Webhooks fire from Glimmora to external systems on subscribed events.

```typescript
interface WebhookPayload {
  webhookId: string;
  deliveryId: string;            // unique per attempt
  event: WebhookEventKind;
  tenantId?: string;
  occurredAt: string;
  data: Record<string, unknown>; // event-specific
  signature: string;             // HMAC-SHA256 of body with webhook secret
}
```

**Delivery:**
- POST to configured URL
- 3 retries with exponential backoff
- Signature verifies authenticity (consumer checks)
- Delivery log accessible in `/enterprise/settings/integrations/webhooks`

**Events supported (Phase 1):**
- `task.created`, `task.completed`, `task.failed`
- `project.health.changed`
- `sow.approved`, `sow.rejected`
- `payout.released`

### 7.5 Payment rail contract

Payouts route through configured rails. Each rail abstracts:

```typescript
interface PaymentRailAdapter {
  type: 'razorpay' | 'wise' | 'bank';
  initiatePayout(req: PayoutRequest): Promise<PayoutInitiated>;
  checkStatus(payoutId: string): Promise<PayoutStatus>;
  cancelPayout(payoutId: string): Promise<void>;
  reconcileFile(file: Buffer): Promise<PayoutReconciliation>;
}

interface PayoutRequest {
  payoutId: string;              // our id, idempotency key
  amount: number;
  currency: string;
  recipient: {
    method: 'bank' | 'upi' | 'wallet';
    accountDetails: Record<string, string>;   // encrypted in transit
  };
  reference: string;             // task id / contributor id (for reconciliation)
}
```

**Failure handling:** rail-level degradation → admin can pause rail (doc 04 §5.L); pending payouts held; "drain to fallback" manually invoked.

### 7.6 File scan contract

Every uploaded file passes through:

1. **MIME + extension verification** (server-side, never trust client)
2. **Virus scan** (ClamAV sidecar)
3. **Plagiarism scan** (if document-like content; provider TBD)

```typescript
interface FileScanResult {
  fileId: string;
  scanStatus: 'pending' | 'clean' | 'flagged' | 'failed';
  scanCompletedAt: string;
  flags: Array<{
    kind: 'virus' | 'plagiarism' | 'malformed';
    severity: 'block' | 'warn';
    detail: string;
  }>;
}
```

Files in `scanStatus: 'pending'` MUST NOT be visible to reviewers or shared via public URLs.

### 7.7 Email + SMS

- **Templates** stored in `email_template` (doc 04 §5.G); rendered server-side with merge variables
- **Sending** via SendGrid (primary) with SMTP fallback; SMS via Twilio (intl) + MSG91 (India)
- **Bounce / complaint webhooks** processed by notification service; persistent bouncers flagged
- **Suppression lists** respected (regulatory + per-user opt-out)

### 7.8 ERP file drop

- Tenant-configurable SFTP or S3 destination
- Scheduled export (weekly Mon 06:00 per default)
- Includes: invoices CSV, payouts CSV, GL-mapped journal CSV (per rate card config)
- Tenant-side ingestion is their responsibility; Glimmora retries 3x on failure

### 7.9 Identity verification (KYC) — Phase 1

- Self-upload ID (Aadhaar / PAN / Passport)
- Automated checks: format valid, OCR'd name vs declared name, watchlist scan (basic)
- Manual review (Platform Admin doc 04 §5.I) for flagged or ambiguous cases
- Phase 2: full automated KYC via provider (Persona / Onfido)

---

## 8. Data model — tenancy & versioning

### 8.1 Tenancy enforcement

- **`tenant_id` UUID** column on every tenant-scoped table
- **Postgres RLS** policy enforces tenant isolation (§3.5)
- Cross-tenant tables (`skill_taxonomy`, `rubric_template`, `mentor`, `mentor_pool` cross-pool, `audit_event` with nullable tenant_id) explicitly noted

### 8.2 Soft delete vs hard delete

Phase 1 default: **soft delete with `deleted_at` timestamp**.

Hard delete reserved for:
- Personal data on full account deletion (after 30-day grace; doc 01 §5.N.6)
- Test / staging cleanup
- Court-ordered erasure

Soft-deleted rows excluded from default queries via `WHERE deleted_at IS NULL`.

### 8.3 Versioning patterns

| Entity | Pattern |
|---|---|
| **SOW** | Separate `sow_version` table with immutable snapshots; `sow` row points to current version |
| **Rate Card** | Same as SOW (`rate_card_version`); historical cards preserved |
| **Rubric Template** | Same pattern; templates have versions, criteria within a version |
| **AI Prompt** | Same; rollback re-activates an old version |
| **Decomposition Plan** | Single row; updates tracked in audit (no separate version table) |
| **Profile fields** | Single row; updates tracked in audit |
| **Submission** | Per-round immutable snapshots (rework round = new submission row) |
| **Mentor Decision** | Immutable on submit; no edits |

### 8.4 Timestamps (universal columns)

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at TIMESTAMPTZ NULL
created_by UUID NULL REFERENCES "user"(id)
updated_by UUID NULL REFERENCES "user"(id)
```

### 8.5 Foreign keys & referential integrity

- **All FKs are explicit** (no application-level joins replacing DB constraints)
- **Cascade behavior**: prefer `ON DELETE RESTRICT` for human entities (soft delete instead); `ON DELETE CASCADE` only for clearly-owned children (e.g., `submission_evidence` cascades on submission delete)
- **Cross-table tenant_id consistency** enforced via composite constraints where supported

### 8.6 Phase 2 deferrals

- Sharding (single Postgres instance is fine for Phase 1)
- Read replicas (basic primary-only is fine for pilot scale)
- Multi-region replication
- Event sourcing (current model is state + audit; full ES is Phase 2)
- Search index (Elasticsearch / Meilisearch for advanced search; Phase 1 = Postgres FTS)

---

## 9. Idempotency & event semantics

### 9.1 API idempotency

All mutating endpoints accept an optional `Idempotency-Key` header.

```
POST /api/sow
Idempotency-Key: 0193a234-1f0e-7000-8000-000000000001
```

If the same key arrives twice within a 24h window, the server returns the original response without re-executing. Phase 1 implementation: Redis with TTL.

**Required on:** all `POST`, `PATCH`, `PUT`, `DELETE` to write endpoints, especially payout-related and audit-writing endpoints.

### 9.2 Webhook delivery (outbound)

- **At-least-once** delivery semantics
- **`deliveryId`** unique per attempt; **`webhookId`** unique per webhook subscription
- Consumers MUST treat repeats as no-ops (signature + `deliveryId` enables dedup)
- Glimmora retries 3x with exponential backoff (10s, 60s, 5min)

### 9.3 Event semantics across portals

When an action in one portal needs to trigger work in another (e.g., contributor submits → mentor sees in queue), the source portal:

1. Commits its state change locally (DB transaction)
2. Writes the audit event in the same transaction
3. Publishes a domain event (`task.submitted`) to an internal event bus (Postgres LISTEN/NOTIFY for Phase 1; full Kafka or NATS in Phase 2)

Consumers (other portals' services) subscribe and react. Eventual consistency is acceptable for cross-portal sync (≤ 5 seconds in normal operation).

### 9.4 Idempotency in workflows

State machine transitions (e.g., SOW stage advance) are idempotent at the action level:
- `sow.approve.business` on a SOW already past Business stage → no-op + audit warning

This protects against double-clicks, retried API calls, and concurrent operators.

---

## 10. Accessibility (WCAG 2.1 AA)

### 10.1 SOW commitment

§1.4.1 makes WCAG-aligned practices Phase 1 MVP-binding for core journeys.

### 10.2 Baseline contract

Every portal MUST:

- **Pass automated checks** (axe-core in CI) on all Phase 1 routes
- **Keyboard navigable** — every interactive element reachable via Tab; logical focus order; visible focus ring
- **Screen reader operable** — semantic HTML; `aria-*` only when semantics fall short; `aria-live` for dynamic content
- **Color contrast** — 4.5:1 for text; 3:1 for UI elements; meet WCAG AA
- **Text resize** — works at 200% zoom without horizontal scroll
- **Motion** — respects `prefers-reduced-motion`; no flashing > 3Hz
- **Forms** — every input has a `<label>`; errors announced; required fields explicit

### 10.3 Per-portal core journeys to audit (Phase 1 exit criterion)

| Portal | Core journeys |
|---|---|
| Contributor | Register · Onboard · Accept→Submit · View earnings · Claim credential |
| Enterprise | SOW intake → approval · Decomposition → tasks ready · Rate card config |
| Mentor | Queue → Review → Decision · Mentorship session · Escalation |
| Platform Admin | Tenant new · Governance case · Mentor new |

### 10.4 Audit process

- **Automated**: axe-core integration in test suite; CI fails on new violations
- **Manual**: keyboard-only walkthrough per portal pre-release
- **External**: third-party WCAG 2.1 AA audit before customer go-live (one-time at Phase 1 close)

### 10.5 Phase 2 deferrals

- WCAG 2.2 AA
- AAA-level compliance (not mandatory for SOW)
- Sign-language video for critical journeys
- Cognitive accessibility extensions

---

## 11. Internationalization (i18n)

### 11.1 SOW commitment

§3.1.5: "Localization framework to enable multiple languages where required." Phase 1 ships **framework**; English-only content is acceptable for go-live.

### 11.2 Framework requirements

- **Locale resolution**: from user preference, fallback to browser, fallback to tenant default, fallback to `en-US`
- **Translation keys**: all user-visible strings extracted to `messages/<locale>.json`; no inline English in components
- **ICU MessageFormat**: for plurals, gender, dates, numbers
- **RTL support**: layout flips automatically for RTL locales (Arabic, Hebrew); CSS uses logical properties (`inline-start`, `block-end`)
- **Currency**: per-tenant primary currency; per-user display preference (some users may want to see INR while their tenant is USD)
- **Date/time**: per-user timezone; per-locale formatting
- **Number formatting**: per-locale decimal/thousands separators

### 11.3 Phase 1 reality

- English (`en-US`) content shipped
- Framework in place: every string is a translation key
- Tenants can request additional locales; translation production is a separate work stream
- Acceptance test: switch the locale to a stub language and confirm no English strings leak

### 11.4 Phase 2

- Multiple production locales (Hindi, Tamil, Spanish, Portuguese)
- Translation memory + AI-assisted translation
- Locale-aware help content

---

## 12. Observability

### 12.1 Phase 1 minimum (SOW §3.1.MVP.8, §3.1.8)

| Concern | Phase 1 |
|---|---|
| **Structured logging** | JSON logs to stdout; aggregated to centralized log service |
| **Trace propagation** | W3C TraceContext headers; OpenTelemetry SDKs |
| **Metrics** | Prometheus-format `/metrics` per service; key dashboards in Grafana |
| **Health checks** | `/healthz` (liveness) + `/readyz` (readiness) per service |
| **Error reporting** | Structured errors; Sentry (or equivalent) for unhandled errors |
| **Service status** | Exposed in `/admin/system-health` (doc 04 §5.M) |
| **Alerting** | PagerDuty (or equivalent) for service degradation; thresholds per service |

### 12.2 Required metrics per service

- `requests_total` (counter, labeled by method, route, status)
- `request_duration_seconds` (histogram, labeled by route)
- `errors_total` (counter, labeled by route, kind)
- Service-specific business metrics (e.g., `submissions_total`, `payouts_total`)

### 12.3 Required log fields

```json
{
  "timestamp": "2026-05-26T12:14:32.123Z",
  "level": "info",
  "service": "task-service",
  "traceId": "...",
  "spanId": "...",
  "userId": "...",         // when authenticated
  "tenantId": "...",       // when scoped
  "route": "POST /api/task",
  "msg": "Task created",
  "metadata": { ... }
}
```

### 12.4 Phase 2 deferrals

- Distributed tracing for AI invocations end-to-end
- SLO-based alerting
- Cost attribution per tenant
- Capacity planning dashboards

---

## 13. Security envelope

### 13.1 SOW commitments

§3.1.MVP.8: SSO + RBAC + tenant isolation + audit logs + monitoring aligned to Zero Trust.
§15: Zero Trust posture; MFA; least privilege; encryption at rest and in transit.

### 13.2 Phase 1 commitments

| Concern | Commitment |
|---|---|
| **TLS** | TLS 1.3 everywhere; HSTS enforced; redirect HTTP → HTTPS |
| **At-rest encryption** | DB-level encryption (Postgres TDE or cloud-managed); secrets in KMS |
| **Secret management** | No secrets in code or env files; cloud secret manager (AWS Secrets Manager / GCP Secret Manager) |
| **API authentication** | OAuth2 bearer tokens (NextAuth-issued); short-lived (1h); refresh tokens for long sessions |
| **Rate limiting** | Per-route rate limits; per-tenant quotas; per-IP throttling on auth endpoints |
| **CSRF** | NextAuth's built-in CSRF protection; SameSite cookies |
| **XSS** | React's auto-escaping; no `dangerouslySetInnerHTML` except for explicit, audited cases |
| **SQL injection** | Prisma ORM (parameterized queries); no raw string SQL |
| **Audit signing** | HMAC per event (§4.3); key rotation quarterly |
| **PII redaction in logs** | Email, phone, ID numbers, addresses redacted from logs |
| **Dependency scanning** | Dependabot / Renovate; weekly scans; high+ severity patched within 7 days |
| **SAST + DAST** | Static analysis in CI; periodic dynamic scans |
| **Penetration test** | One external pentest before Phase 1 go-live |
| **Vulnerability disclosure** | `security.txt`; intake email; response SLA 5 business days |

### 13.3 Tenant data isolation

- Postgres RLS (§3.5)
- File storage: per-tenant prefix; signed URLs with tenant binding
- Cache keys include `tenantId`
- Logs include `tenantId` for filtering

### 13.4 Audit-grade actions

These actions require additional verification (re-auth, MFA challenge, or admin confirmation):

| Action | Verification |
|---|---|
| Password change | Current password |
| MFA disable | Current MFA + email confirmation |
| Tenant pause/close | Admin + MFA |
| Mentor suspend | Admin + reason |
| Payment rail credential rotation | Admin + MFA + audit |
| Prompt rollback | Audit + change reason |
| Bulk payout release | Admin + signature |
| KYC override-approve (flagged case) | T&S + reason |
| Cryptographic key rotation (audit signing) | Two-person approval (Phase 2 hard requirement) |

### 13.5 Incident response

- **Detection** via monitoring alerts (§12)
- **Triage** via on-call (Platform team + Security team)
- **Containment** via runbook actions (pause integration, revoke session, rotate key)
- **Notification** to affected tenants within 24h for confirmed breach (legal-team-led)
- **Postmortem** within 5 days; published internally; relevant lessons shared with tenants

### 13.6 Phase 2 deferrals

- SOC2 audit (planned for Phase 2 close)
- ISO 27001 certification
- Continuous external monitoring
- Bug bounty program
- Zero Trust microsegmentation (service-to-service mTLS)

---

## 14. Phase 1 vs Phase 2 — cross-functional

### 14.1 Phase 1 must-haves (cross-functional)

| # | Capability | Driver | Effort |
|---|---|---|---|
| 1 | Next.js middleware for RBAC + tenant isolation | §3.1.MVP.8 | 🚧 BUILD |
| 2 | SAML 2.0 + OIDC enterprise SSO | §3.1.MVP.8 | 🚧 BUILD |
| 3 | MFA: TOTP, SMS, email | §3.1.MVP.8 | 🔧 WIRE |
| 4 | Postgres RLS for tenant isolation | §3.1.MVP.8 | 🚧 BUILD |
| 5 | Unified audit service (signed, append-only, exportable) | §3.1.MVP.8, §14 | 🚧 BUILD |
| 6 | AI orchestrator (4 agents, confidence, override capture) | §3.1.MVP.7 | 🚧 BUILD |
| 7 | Notification service (in-app + email + SMS) | §3.1.5 implicit | 🔧 WIRE + 🚧 BUILD SMS rail |
| 8 | HRIS integration framework (Workday, BambooHR, custom) | §3.1.MVP.9 | 🚧 BUILD |
| 9 | Webhook outbound (Jira, Slack, generic) | §3.1.MVP.9 | 🚧 BUILD |
| 10 | Payment rail integration (Razorpay India + Wise) | §3.1.MVP.6 | 🚧 BUILD |
| 11 | File scan (virus + plagiarism) | §3.1.MVP.5 implied | 🚧 BUILD |
| 12 | ERP file drop (SFTP/S3) | §3.1.7 | 🚧 BUILD |
| 13 | i18n framework (English-only content OK) | §3.1.5 | 🚧 BUILD |
| 14 | WCAG 2.1 AA audit + remediation for core journeys | §1.4.1 | 🚧 BUILD |
| 15 | Structured logging + metrics + tracing | §3.1.MVP.8 | 🚧 BUILD |
| 16 | TLS, secret management, dependency scanning | §3.1.MVP.8 | 🔧 WIRE |
| 17 | Idempotency for all write APIs | implicit | 🚧 BUILD |
| 18 | OpenAPI 3.1 spec for public APIs | §3.1.MVP.8 | 🚧 BUILD |
| 19 | Pen test before go-live | §3.1.MVP.8 | external |

### 14.2 Phase 2 deferrals (cross-functional)

| Capability | Why Phase 2 |
|---|---|
| Autonomous Project Governor (APG) | §3.2 — Phase 2 explicit |
| Dynamic / surge pricing | §3.2 explicit |
| Cryptographic credentialing | §3.2 explicit |
| Advanced fraud + anti-collusion | §3.2.4 |
| Multi-region active-active | §3.2.5 |
| Deep ERP automation | §3.2.6 |
| Bias monitoring for AI | §3.1.1 advanced |
| Risk tier classification (AI autonomy) | §3.1.1 advanced |
| SOC2 / ISO 27001 certification | post-Phase 1 |
| Full event sourcing + Kafka | scale-driven |
| Search infra (ES / Meilisearch) | scale-driven |
| Multi-tenant hierarchies (parent-org / sub-org) | Phase 2 |
| Real-time analytics streams | Phase 2 |

### 14.3 Phase 1 exit criteria — cross-functional

1. A new tenant can configure SAML SSO and have ≥5 employees sign in
2. Postgres RLS rejects cross-tenant queries in pen-test verification
3. A contributor's session is invalidated within 60s of admin revoking it
4. Audit log records every action in §4.4 with no gaps; signature verifies
5. AI orchestrator handles all 4 MVP agents with confidence + override capture
6. Notification dispatch achieves >99% delivery within 60s for in-app; >95% within 5 min for email
7. HRIS sync executes daily for ≥1 tenant; preview-before-commit works
8. Webhook delivery succeeds for ≥3 event types with signature verification
9. Razorpay India initiates and reconciles ≥1 real payout end-to-end
10. File scan catches ≥1 EICAR test virus + ≥1 plagiarism positive in QA
11. ERP file drop delivers weekly CSV to ≥1 tenant's SFTP
12. Translation framework: switching to stub locale shows zero English strings
13. WCAG 2.1 AA audit passes on core journeys (§10.3) with no critical findings
14. Penetration test completes; high+ findings remediated
15. Logs, metrics, traces visible in dashboards; alerting fires on synthetic incidents

---

## 15. Cross-portal sequence diagrams (selected)

### 15.1 SOW upload → approval → decomposition → contributor sees task

```
[Sponsor]                [Enterprise Portal]      [Audit]    [AI svc]    [Mentor + Contributor]
   │                          │                       │          │             │
   ├─ upload SOW DOCX ───────→│                       │          │             │
   │                          ├─ AI extract metadata ─┼─────────→│             │
   │                          │←─ extracted ──────────┼──────────│             │
   │                          ├─ persist + audit ────→│          │             │
   │←─ review screen ─────────┤                       │          │             │
   ├─ approve metadata ──────→│                       │          │             │
   │                          ├─ stage to Business ──→│ audit    │             │
   │                          │ (stage transitions per stage approver — abbreviated)
   ├─ approve last stage ────→│                       │          │             │
   │                          ├─ provision project ──→│ audit    │             │
   │                          ├─ start decomposition → │          │             │
   │                          ├─ AI suggest tasks ────┼─────────→│             │
   │                          │←─ suggestions ────────┼──────────│             │
   │                          ├─ tasks created ──────→│ audit    │             │
   │                          │                       │          ├─ matching ──→│
   │                          │                       │          │   (cross-fn) │
   │                          │                       │          │             ├─ contributor sees in /tasks
```

### 15.2 Contributor submission → mentor review → enterprise reviewer (two-stage) → payout

```
[Contributor]   [Contributor Portal]   [File Scan]   [Audit]   [Mentor Portal]   [Enterprise]   [Payout svc]
   │                  │                     │           │              │                │             │
   ├─ submit ────────→│                     │           │              │                │             │
   │                  ├─ scan evidence ────→│           │              │                │             │
   │                  │←─ clean ────────────│           │              │                │             │
   │                  ├─ persist submission ────────────→│ audit       │                │             │
   │                  ├─ task → under_review              │             │                │             │
   │                  ├─ enqueue review ─────────────────┼─────────────→│                │             │
   │                  │                                  │              ├─ mentor opens  │             │
   │                  │                                  │              ├─ AI rubric ─── │             │
   │                  │                                  │              ├─ decide: accept│             │
   │                  │                                  │ audit ←─ override.delta       │             │
   │                  │                                  │              │ (two-stage)    │             │
   │                  │                                  │              ├──────────────→ ├─ enterprise │
   │                  │                                  │              │                │   reviewer  │
   │                  │                                  │              │                ├─ accept ──→│
   │                  │                                  │ audit ←──────┤                │             │
   │                  │                                  │              │                ├─ payout    │
   │                  │                                  │              │                │   eligible ─→│
   │                  │                                  │              │                │             ├─ release
   │                  │                                  │              │                │             ├─ rail call
   │←─ notification ──┤                                  │              │                │             │
```

### 15.3 Safety report → governance triage → mentor suspension

```
[Contributor]   [Contributor]   [Notification]   [Admin Portal · T&S]   [Audit]   [Mentor]
   │                 │                │                    │                │          │
   ├─ submit safety ─→                │                    │                │          │
   │   report        ├─ governance case (gr-1042)         │ audit          │          │
   │                 │                                     ├─ assign to T&S │          │
   │   (anonymous)   │                                     ├─ T&S reviews   │          │
   │                 │                                     ├─ decides: suspend mentor   │
   │                 │                                     │ audit ←────────┤          │
   │                 │                                     ├─ pause mentor login       │
   │                 │                                     │                │ logged out
   │                 │                                     ├─ reassign their reviews   │
   │                 │                                     │                ├─ cross-portal trigger
   │                 ├─ (anonymous: no notification back)  │                │          │
```

### 15.4 AI agent unavailable → graceful degrade

```
[Mentor]   [Mentor Portal]   [AI svc]   [LLM API]
   │             │               │            │
   ├─ open ─────→│               │            │
   │             ├─ invoke AI ──→│            │
   │             │               ├─ call ────→│ (timeout)
   │             │               │←─ timeout ─│
   │             │←─ unavailable │            │
   │             ├─ collapse panel              │
   │             ├─ render review without AI suggestions
   │             │                              │
   │             ├─ audit: agent.respond (failed)
   ├─ mentor reviews + decides without AI ────→│
   │                                            │
```

---

## 16. Open decisions

1. **Postgres RLS vs application-layer tenant filter** — proposed: RLS at DB level for defense-in-depth. Some teams prefer app-only for performance. Confirm RLS commitment.

2. **Session length** — proposed: 30 days default (per existing CLAUDE.md). Some enterprises will want shorter (e.g., 8h). Confirm tenant policy can override.

3. **MFA enforcement** — proposed: required for `plat.*` + tenant-optional for `ent.*` + recommended for contributors. Confirm.

4. **SSO multi-IdP per tenant** — proposed: Phase 1 = one IdP per tenant; users with multiple work emails use the most recent. Phase 2: multi-IdP. Confirm.

5. **Audit signing key rotation** — proposed: quarterly; events signed with the key active at write time; old keys retained for verification. Confirm.

6. **Audit retention floor** — proposed: 7 years minimum; tenant configurable indefinite. Confirm jurisdictional minimum (some sectors require longer).

7. **AI fallback policy** — proposed: every AI-assisted surface MUST work without AI (graceful degrade). Confirm zero hard dependencies.

8. **AI override delta visibility** — proposed: captured in audit; visible to mentor in their personal metrics (aggregate, last 30 days); NEVER shown as real-time comparison to peers. Confirm.

9. **Notification SMS only for critical** — proposed: SMS used for password change, safety case acknowledgment, payout failure. Email used for everything else important. Confirm what counts as "critical."

10. **HRIS sync frequency** — proposed: daily default; tenants can configure hourly or weekly. Confirm whether real-time webhook from HRIS is Phase 2.

11. **Webhook retry policy** — proposed: 3 attempts with exponential backoff. Failed deliveries logged; tenant visible in `/enterprise/settings/integrations/webhooks`. Confirm.

12. **File scan blocking behavior** — proposed: virus = block (file rejected); plagiarism = warn + flag for mentor review (not blocked). Confirm — some tenants may want plagiarism = block.

13. **Idempotency window** — proposed: 24h for `Idempotency-Key` reuse. Confirm.

14. **Soft delete default** — proposed: soft delete everywhere except personal data on account deletion (after grace period). Confirm.

15. **Localization Phase 1 floor** — proposed: framework only, English content shipped. Confirm acceptable for go-live.

16. **WCAG audit cadence** — proposed: automated checks every CI; manual keyboard walk per release; external audit at Phase 1 close + then annually. Confirm.

17. **Penetration test scope** — proposed: external pentest before Phase 1 go-live, covering all four portals + cross-functional APIs. Confirm timing and provider.

18. **Service architecture** — proposed: monolithic Next.js + Postgres for Phase 1; selected sidecars (audit svc, AI svc, notification svc) as separate processes. Phase 2: microservices. Confirm Phase 1 monolith vs microservices upfront.

---

## End of cross-functional spec

Next doc:
- `06-phase-1-scope-lockdown.md` — Consolidated 90-day execution checklist; converts every Phase 1 commitment in docs 01–05 into a roadmap with sequencing, dependencies, and exit criteria
