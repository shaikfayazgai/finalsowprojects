# Resolution Center — Implementation Plan (v2.1 · APPROVED)

> Status: **DESIGN APPROVED — ready for Phase 1.** v2.1 finalises the two gap reviews + the code-verified corrections. One backend **case engine**, four streams, one canonical taxonomy + status model. Every table is **additive** (no destructive migration).

---

## 0 · Corrections applied in v2.1 (vs v2)
| # | Correction | Section |
|---|---|---|
| #2 | Email mode is **build-ready** on the existing `shared/mailer.py` (smtplib/Gmail, OTP already uses it, graceful fallback) — **not** a future phase | §L |
| #8 | Close-gate **branches on `resolution_outcome`** (PAYMENT_OWED / NO_PAYMENT_OWED / INFORMATION_ONLY) — not an unconditional payout block | §M |
| tax | **One canonical hierarchy** `STREAM → LANE → SUBTYPE` + independent `priority` (kills the `case_type`/`stream`/`lane` drift) | §A/§B |
| status | **One canonical status superset** (granular awaiting + `PENDING_GLIMMORA_CONFIRMATION`) | §C |
| owner | **`case_assignments` is the single ownership truth** (current owner = latest active assignment) — no duplicate columns | §E |
| audit | Cases **emit into the existing `audit_log`** (Mongo, verified) — no parallel `case_audit_log` silo; `/admin/audit` sees everything | §J |

---

## A · Architecture — one engine, four streams
One **case engine** (tables + state machine + ownership + evidence + audit) surfaced through **four streams**. Phase 1 ships **one unified Glimmora desk**; `stream` is a first-class column from day 1 so the surfaces split in Phase 4–5 **with no migration**. **`stream` drives the ACL**, not just reporting.

| STREAM | Lanes it carries | Future surface |
|---|---|---|
| **SUPPORT** | Support · Feedback · Site/Bug | Support Desk |
| **RESOLUTION** | Complaint · Safety | Resolution Center |
| **OPERATIONS** | Payment/Payout · Work/Task | Payment / Ops Desk |
| **SECURITY** | Security | Security Desk |

---

## B · Canonical taxonomy — `STREAM → LANE → SUBTYPE` (+ independent `priority`)
**Lane ≠ Priority.** Lane = what it's about; Priority (`CRITICAL / HIGH / MEDIUM / LOW`) = business impact, set independently (`Support + CRITICAL` is valid). **SLA = f(lane default, priority override).**

**Subtypes (initial):**
```
Complaint  → Conduct · Policy · Harassment · Decision Appeal
Payment    → Delayed Payment · Missing Payment · Refund
Security   → Login Access · Permission Issue · Vulnerability Report
```
**Decision Appeal** (Complaint subtype) is **backed by the existing `mentor_escalations` / reviewer escalation tables** — a wrapper/view over an escalation row, not new bookkeeping.

---

## C · Canonical status superset
```
NEW → ASSIGNED → INVESTIGATING
    → AWAITING_CONTRIBUTOR | AWAITING_ENTERPRISE | AWAITING_MENTOR | AWAITING_PAYMENT
    → RESOLVED → PENDING_GLIMMORA_CONFIRMATION → CLOSED
    (CLOSED → REOPENED → …)
```
Rules:
- **`AWAITING_*` pauses the SLA clock** (honest SLA reporting).
- **Safety/Security 4h lanes** trigger **on-call escalation** if unattended past threshold.
- **Only Glimmora** can move `PENDING_GLIMMORA_CONFIRMATION → CLOSED` (single closing authority, even when someone else resolved the work).
- **Reopen** is bounded (window + counter).

---

## D · Evidence snapshot — freeze at creation
On raise, capture an **immutable** `case_snapshots` row (jsonb): task status, review decision + comments, payout state, linked timestamps. Investigate against the **snapshot**, never live records. Same freeze pattern as price-lock-on-assign. For payment disputes the snapshot holds the **contributor figure privately** (Glimmora-only).

---

## E · Ownership — `case_assignments` (single truth)
`case_assignments(id, case_id, assigned_to, assigned_at, released_at)`. **Current owner = the latest row with `released_at IS NULL`.** Reassignment = release current + insert new (full ownership history; no duplicated `assigned_to` column on the case). Desk filters: **My cases · Unassigned · All**.

---

## F · Privacy & routing rules (HARD)
1. **Payment privacy** — contributor pay **never** reaches the enterprise. `case_visibility_rules` splits views: **Glimmora** sees client budget / contributor payout / margin / pool / GST; **Enterprise** sees only task / invoice / **release request**. *(Golden rule.)*
2. **Conflict-of-interest** — case carries `against_type` + `against_id`; routing rule: **`if resolver == against_id → block`** → stays Glimmora-only. No self-investigation.
3. **Stream ACL** — Safety/Security confidential (need-to-know + audited reads); Decision-Appeal visible to the decision-maker (right-to-respond), raiser **pseudonymous** if anonymous.

---

## G · Routing + round-trip
`Glimmora triage → route → resolver works → resolver marks RESOLVED → PENDING_GLIMMORA_CONFIRMATION → Glimmora closes + notifies raiser.` **Phase 1 does NOT route** (enterprise/mentor inboxes are Phase 4) — everything stays on the **Glimmora desk**; a hidden `future_assignee` field is reserved but not exposed. No dead-end workflows.

---

## H · Related / parent cases
`parent_case_id` + `related_case_ids[]`. One incident → Complaint + Payment + Appeal **linked** → investigated once.

---

## I · Internal notes vs public thread
`case_messages.type ∈ {PUBLIC, INTERNAL}`. PUBLIC = raiser-visible; INTERNAL = Glimmora-only investigation notes on the same thread.

---

## J · Audit — emit into the existing `audit_log` (no silo)
Cases emit events into the **verified platform `audit_log`** (Mongo): `CASE_CREATED · CASE_ASSIGNED · CASE_REPLIED · CASE_STATUS_CHANGED · CASE_RESOLVED · CASE_CLOSED · CASE_REOPENED` (append-only by nature). `/admin/audit` sees them automatically — one source of truth, legal-grade traceability.

---

## K · Public intake for locked-out users
`POST /api/v1/public-cases` (no session) for **Security / Login-Access** lanes. Fields: `email, name, issue, attachments`. Creates `stream=SECURITY, visibility=restricted, source=public`, **OTP/email-verified via `shared/mailer.py`** (same path as forgot-password; dev-code fallback when SMTP off). Case **activates only after verification** (spam control). Gateway must allow this route unauthenticated.

---

## L · Response modes — email mode **build-ready** (`shared/mailer.py`)
`case_channel ∈ {IN_APP, EMAIL, BOTH}`. The SMTP mailer already exists (Gmail/TLS, OTP uses it, `email_is_configured()` gates + falls back). **No new infra.** Defaults:

| Lane | Channel |
|---|---|
| Support | BOTH |
| Complaint | BOTH |
| Payment/Payout | BOTH |
| Security | BOTH |
| Work/Task | BOTH |
| Safety | IN_APP *(confidential)* |
| Feedback | IN_APP |
| Site/Bug | IN_APP |

Set `EMAIL_ENABLED=true` + `EMAIL_USER` + `EMAIL_APP_PASSWORD` to activate live email; otherwise in-app only, no fake functionality.

---

## M · Payment close-gate — branch on `resolution_outcome`
```
resolution_outcome ∈ { PAYMENT_OWED, NO_PAYMENT_OWED, INFORMATION_ONLY }

PAYMENT_OWED     → cannot CLOSE until payout reaches terminal 'paid'
                   (simulated in this build: eligible→requested→released→paid)
NO_PAYMENT_OWED  → CLOSE immediately, resolution_reason = "No payment owed"
INFORMATION_ONLY → CLOSE immediately (e.g. "how does payout work?")
```
Status and reality stay in sync.

---

## N · KB deflection
Before a Support case submits, search `help_articles / faq / guides` → *"Did this solve it?"* → if no, continue to create. Deflects ~30–60% of Support volume.

---

## O · Metrics dashboard
Open cases · by lane · by stream · by priority · avg resolution time · SLA breaches · reopened · enterprise-complaint count · mentor-complaint count.

---

## P · Data model (additive only)
```
glimmora_cases      id, stream, lane, subtype, priority, sla_due_at, status,
                    resolution_outcome, resolution_reason,
                    account_id, role, anonymous, anon_token,
                    against_type, against_id, assigned_party, future_assignee,
                    linked_type, linked_id, parent_case_id, related_case_ids[],
                    response_mode, case_channel, visibility, source,
                    data(jsonb), created_at, updated_at
case_messages       id, case_id, author, type(PUBLIC|INTERNAL), body, created_at      (append-only)
case_assignments    id, case_id, assigned_to, assigned_at, released_at                (ownership truth)
case_snapshots      id, case_id, snapshot(jsonb), captured_at                         (immutable)
case_attachments    id, case_id, name, url, kind, size_bytes, created_at
```
- Audit → existing **Mongo `audit_log`** (CASE_* events). No `case_audit_log` table.
- Legacy `complaints` + `contributor_support_tickets` **read-across** (no migration); optional VIEW for one queue shape.

---

## Q · Notifications (verified paths)
Raise → `notify_role(["superadmin"], category="complaint"|"security")`; assign/route → `create_notification(owner)`; resolve → `create_notification(raiser, kind="case.resolved")`. These are the **exact pool/`create_notification` paths repaired + verified today** — the engine won't inherit the silent-drop bug.

---

## R · Phased build
- **Phase 1:** engine (4 tables + status machine + `case_assignments` ownership + `case_snapshots` + audit events) · raise for **all roles** across the 4 streams · **`POST /api/v1/public-cases`** (OTP-verified) · **unified Glimmora desk** (read-across queue, stream/lane/priority filters, My/Unassigned/All, detail, internal notes, resolve with `resolution_outcome`) · KB-deflection stub · `case_channel` (in-app live; email when configured).
- **Phase 2:** anonymous + confidential + attachments + right-to-respond · de-mock contributor support FE.
- **Phase 3:** Decision-Appeal ↔ escalation tables · SLA timers + pause + 4h on-call · related/parent linking · reopen.
- **Phase 4:** routing destinations (enterprise inbox, mentor) + round-trip + conflict-of-interest enforcement · payment privacy wall + release-ask.
- **Phase 5:** split the four surfaces · metrics dashboard · CSAT · templates · auto-escalation · rate-limit · i18n.

---

## S · Design gate — SIGNED OFF ✅
- [x] Public intake for access/security (§K) · [x] Email mode via existing mailer (§L) · [x] Payment privacy isolation (§F.1) · [x] Conflict-of-interest routing (§F.2) · [x] Evidence snapshots (§D) · [x] Anonymous reporting (§F.3) · [x] `STREAM → LANE → SUBTYPE` hierarchy (§A/§B) · [x] Canonical status superset (§C) · [x] Assignment history (§E) · [x] Unified audit integration (§J) · [x] Payment close-gate branching (§M)

---
*v2.1 approved. Begin Phase 1 with the engine + raise + public-intake + unified desk.*
