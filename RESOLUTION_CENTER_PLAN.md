# Resolution Center — Implementation Plan (v2)

> Status: **PLAN ONLY** — design gate. v2 folds in the two gap reviews. **Nothing is coded until the design-gate checklist (§R) is satisfied.** The goal: get the schema + rules right now so the architecture is hard to break later.

---

## 0 · What changed in v2 (gap review → where addressed)
| Gap | Severity | Addressed in |
|---|---|---|
| Payment pay leaks to enterprise | 🔴 | §F privacy rule + §D snapshot |
| Conflict-of-interest routing | 🔴 | §F + §G |
| Locked-out users can't raise | 🔴 | §K public intake |
| Evidence changes after creation | 🔴 | §D evidence snapshot |
| No case ownership | 🔴 | §E |
| Appeal vs Complaint not separated | 🔴 | §A streams + §B subtype |
| Lane = Severity (no priority) | 🔴 | §B Lane ≠ Priority |
| Routing has no destination / round-trip | 🟡 | §G |
| Expanded status workflow | 🟡 | §C |
| Related / parent case linking | 🟡 | §H |
| Internal notes | 🟡 | §I *(already in v1)* |
| Immutable / append-only audit | 🟡 | §J |
| Email mode has no engine | 🟡 | §L — **deferred to Phase 5** |
| KB deflection | 🟢 | §M |
| Metrics dashboard | 🟢 | §N |
| Case vs Operational Workflow | ⚠️ arch | §A one engine, four streams |

---

## A · Architecture — one case engine, four streams
The Resolution Center is **one backend case engine** (one table + state machine + ownership + evidence + append-only audit) surfaced through **four streams**. Phase 1 ships a **single unified desk**; the `stream` column exists from day 1 so the surfaces split in Phase 4–5 **with no migration**.

| Stream | Holds | Special rule |
|---|---|---|
| **Support Desk** | questions / help | KB-deflected first; lowest privilege |
| **Resolution Center** | complaint · grievance · safety · security | Glimmora-only; safety/security confidential |
| **Appeals** | mentor/reviewer **decision** disputes | **Backed by the existing `mentor_escalations` / reviewer escalation tables** — an Appeal case is a wrapper/view over an escalation row, not new bookkeeping. Decision-maker gets right-to-respond. |
| **Payment Disputes** | payout not paid / wrong / delayed | **Privacy-walled** — contributor figure never leaves Glimmora |

**`stream` drives the ACL from day 1** (who may see/respond), not just reporting — which is exactly why it can't wait for Phase 4.

---

## B · Lane, Priority, Subtype — all independent (Lane ≠ Severity)
- **Stream** (4) — the surface/system (§A).
- **Lane** (8) — what it's about (Support, Complaint, Safety, Security, Site/Bug, Feedback, Payment, Work).
- **Priority** (P1–P4) — **business impact, set independently.** `Support + P1-Critical` is valid (e.g. *"Can't access a ₹50k task due tomorrow"*).
- **Subtype** — e.g. Complaint → **{Conduct Complaint, Decision Appeal}**; Decision Appeal routes to the **Appeals** stream.

**SLA = f(lane default, priority override).** Lane gives the default clock; priority can raise it. Safety/Security default P1 (4h); a Support ticket can be promoted to P1.

---

## C · Lifecycle — expanded status
`Open → Investigating → Awaiting {Enterprise | Mentor | Contributor | External} → Resolved → Closed → Reopened`
- **SLA clock pauses** on any `Awaiting-*` (so SLA reporting stays honest).
- **4h lanes (Safety/Security)** get **on-call escalation if unattended** past threshold (don't let a night-time safety report sit).
- **Reopen** has a bounded window + counter (no infinite loop).

---

## D · Evidence snapshot — freeze at creation
On raise, capture `case_evidence_snapshot` (jsonb): **task status, review decision + comments, payout state, linked timestamps, attachments**. Investigate against the **snapshot**, never live mutable records (enterprise/reviewer can edit after the fact). Same freeze philosophy as the **price-lock-on-assign** we already ship. For **payment disputes** the snapshot holds the **contributor amount privately** (Glimmora-only) so the dispute is investigable without re-exposing pay.

---

## E · Ownership
Every case carries `assigned_to` + `assigned_at`; **one owner at a time**; reassignment is an explicit, audited handoff event (§J). No more "Admin A starts, B replies, C closes."

---

## F · Privacy & routing rules (HARD)
1. **Payment privacy** — the contributor figure is **never** exposed to the enterprise. The enterprise only ever gets a **client-side "release funds" request** (client price + GST), never the case detail or the payout amount. *(Golden rule.)*
2. **Conflict-of-interest** — **never route a case to the party it is about.** A Work/Task complaint *about* the enterprise stays with Glimmora; never boomerang to the accused.
3. **Stream ACL** — Safety/Security confidential (need-to-know + audited reads); Appeals visible to the decision-maker (right-to-respond) but the raiser stays **pseudonymous** if anonymous.

---

## G · Routing + round-trip
`Glimmora triages → routes to resolver (Enterprise / Mentor) → resolver gets a queue + notification → resolver marks "resolved" → returns to Glimmora → Glimmora confirms, closes, notifies the raiser.` Glimmora **always owns the final close** even when someone else does the work. **Routing destinations land in Phase 4**; until then Phase 1–3 handle **Glimmora-owned streams only** (Support, Resolution, Appeals, Payment) — no dead-end routes.

---

## H · Related / parent cases
`parent_case_id` + `related[]`. One incident often spawns a Complaint + a Payment case + a Work case — **link them so Glimmora investigates the incident once**, not three times.

---

## I · Internal notes vs public thread *(already in v1)*
`case_messages.internal(bool)` — `true` = Glimmora-only investigation notes; `false` = raiser-visible reply. Investigators discuss privately on the same thread.

---

## J · Immutable audit — append-only
`case_events` is **append-only** (`message_added, status_changed, reassigned, resolved, reopened`, with `from/to/actor/at`). **Never UPDATE history.** Mirrors to the **Mongo `audit_log`** we already run (verified live). A Glimmora admin **cannot edit** past entries — critical because cases touch payments, disputes and safety.

---

## K · Public intake for locked-out users
The Security/access lane (*"can't log in"*) needs a **pre-auth intake** — email/token-verified, no session required — feeding the same engine. Otherwise the people who most need the access lane can't reach it.

---

## L · Response modes
**One-way** (ack + status) · **Two-way** (in-app live thread) · ~~Email~~.
**DECISION:** the stack has **no outbound email engine** (notifications are in-app DB rows). **Email mode is DEFERRED to Phase 5**; Phase 1–4 run on in-app two-way + one-way. *(Override to wire SMTP earlier if needed.)*

---

## M · KB deflection
Before a Support case submits, show **suggested help articles** (how payouts work, how reviews work, how to submit). Deflects an estimated 30–60% of Support volume off the human queue.

---

## N · Metrics dashboard
Open cases · avg resolution time · SLA breaches · by lane · by stream · enterprise-specific complaints · mentor-specific complaints. Without it Glimmora can't see systemic issues (e.g. a spike in payment complaints).

---

## O · Data model (additive only — no destructive migration)
- **`cases`** — `id, stream, lane, subtype, priority, sla_due_at, status, account_id, role, anonymous, assigned_to, assigned_at, assigned_party, linked_type, linked_id, parent_case_id, response_mode, channel, data(jsonb), created_at, updated_at`
- **`case_messages`** — `id, case_id, author, body, internal(bool), created_at` *(append-only)*
- **`case_events`** — `id, case_id, actor, kind, from_val, to_val, at` *(append-only audit)*
- **`case_evidence_snapshot`** — `case_id, snapshot(jsonb), captured_at`
- Legacy `contributor_support_tickets` + `complaints` **read-across** (no migration). Optional VIEW `resolution_cases` = UNION for one queue shape.
- All privileged actions also mirror to **Mongo `audit_log`**.

---

## P · Notification dependency (now sound)
Raise → `notify_role(["superadmin"], category="complaint"|"security")`; resolve → `create_notification(raiser, kind="case.resolved")`; route → `create_notification(resolver)` / pool. **These are the exact paths repaired + verified today** (pool routing + `create_notification`), so the engine won't inherit the silent-drop bug.

---

## Q · Phased build (revised)
- **Phase 0 — design gate (this doc):** §R satisfied before any code.
- **Phase 1:** case **engine** (table + status machine + ownership + evidence snapshot + append-only `case_events`) · raise for **all roles** across the 4 streams · **unified Glimmora desk** (read-across queue, lane/priority/stream filters, case detail, internal notes, resolve) · KB-deflection stub · audit mirror.
- **Phase 2:** anonymous + confidential + attachments + right-to-respond · de-mock contributor support.
- **Phase 3:** Appeals integrate with the escalation tables · SLA timers + pause + on-call for 4h lanes · related/parent linking · reopen window.
- **Phase 4:** routing destinations (enterprise inbox, mentor) + round-trip + conflict-of-interest guard · payment-dispute privacy wall + release-ask.
- **Phase 5:** split the four surfaces · email engine · metrics dashboard · CSAT · templates · auto-escalation · rate-limit · i18n.

---

## R · Design-gate checklist — MANDATORY before coding Phase 1
- [ ] **Payment privacy rule** (§F.1) — contributor pay never reaches the enterprise
- [ ] **Conflict-of-interest routing** (§F.2) — never route to the accused
- [ ] **Evidence snapshotting** (§D) — freeze state at creation
- [ ] **Case ownership** (§E) — assigned_to + assigned_at + audited handoff
- [ ] **Public intake** (§K) — locked-out users can raise

**Strongly recommended (design in now):**
- [ ] **Decision-Appeal subtype + stream** (§A/§B), reusing escalation tables
- [ ] **Internal notes** (§I) — *already in the schema*
- [ ] **Expanded status workflow** (§C) — incl. SLA pause on Awaiting-*
- [ ] **Immutable append-only audit** (§J)

*(Plus the structural call: carry `stream` from day 1 so the four-surface split in Phase 4–5 needs no migration.)*

---
*v2 captured from the planning + two gap reviews. Say "build Phase 1" once the §R gate is signed off.*
