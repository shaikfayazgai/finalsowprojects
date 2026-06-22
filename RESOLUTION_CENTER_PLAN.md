# Resolution Center — Implementation Plan

> Status: **PLAN ONLY** (approved design — not yet built). The unified Glimmora desk that handles every Support / Complaint / Safety / Security / Site / Feedback / Payment / Work case, raised by **any** role.

## A · Decisions (approved)
- **One unified Glimmora desk** ("Resolution Center") aggregates all lanes into a single queue.
- **Glimmora (super-admin) is the sole handler** for grievances + safety reports (neutral third party).
- **Any authenticated role can raise** (contributor, mentor, reviewer, enterprise) — not just contributors.
- Build incrementally; **Phase 1 = the unified desk** for review before more.

## B · The 8 lanes (a raiser picks one)
| Lane | "I want to report…" | Severity / SLA | Response mode | Must link |
|---|---|---|---|---|
| 🟦 Support | a question / need help | Standard 72h | Two-way (in-app) | — |
| 🟧 Complaint / Grievance | unfair treatment, a decision, conduct | High 24h | Email (formal) + two-way if escalated | — |
| 🟥 Safety | harassment / feeling unsafe (confidential) | Critical 4h | Two-way · immediate | — |
| 🟪 Security | role/permission issue, access problem, vulnerability | Critical 4h | Two-way · immediate | — |
| 🟫 Site issue / Bug | a page/feature is broken | Normal 24–48h | One-way (+ status) | — |
| 🟩 Feedback / Suggestion | an idea / improvement | Low / none | One-way (ack only) | — |
| 🟨 Payment / Payout | not paid · wrong amount · delayed · deduction question | High 24h | Two-way (+ email proof) | **payout / task** |
| 🟦 Work / Task issue | blocked · unclear · can't access · scope/deadline | High if blocked else 48h | Two-way (+ routing) | **task / SOW** |

> A *dispute over a mentor/reviewer **decision*** stays a **Complaint → escalation**; a *work issue* (blocked/unclear) is operational → the **Work/Task** lane.

## C · Three response modes
- **One-way** — auto-acknowledged + status updates only; no reply thread (Feedback, Site/Bug).
- **Email** — Glimmora corresponds via the raiser's registered email (formal records / attachments).
- **Two-way (in-app)** — live thread; Glimmora replies, the raiser sees it instantly (bell + page) and can reply. Used for anything immediate.

Each lane has a default `response_mode`; Glimmora can **upgrade** a case (e.g. a "Feedback" that's really a bug → two-way).

## D · Who does what
| Role | Raise | Handle / see |
|---|---|---|
| **Every role** | A "Raise to Glimmora" entry (8 lanes) + a "My cases" tracker + notifications on reply/resolve | — |
| **Super-admin (Glimmora)** | — | The single **Resolution Center** desk; triage, assign, route, resolve |

### Routing (not every case is Glimmora's to fix)
| Lane | Triage | Resolved by |
|---|---|---|
| Payment / Payout | Glimmora | **Glimmora** (owns payouts); loops in Enterprise to release |
| Work / Task issue | Glimmora | **Enterprise** (task owner) or **Mentor** (if a review holds it); Glimmora escalation if stuck |
| Safety · Security · Grievance · Support · Site · Feedback | Glimmora | Glimmora |

The **Enterprise** gets a read-filtered queue of cases routed to it (`assigned_party='enterprise'`).

## E · Lifecycle
`New → Triaged → In progress → Awaiting raiser → Resolved → Closed → Reopened`
- Safety/Security skip the queue → fast-track + confidential.
- A decision-dispute feeds the existing mentor/reviewer **escalation** tables.
- Every case links to the task / SOW / decision / payout it's about (one-click open).

## F · Data model (additive only — no destructive migration)
- **NEW `glimmora_cases`** — `id, account_id, role, lane, subject, body, severity, status, response_mode, channel, assigned_to, assigned_party, linked_type, linked_id, attachments(jsonb), anonymous(bool), data(jsonb), created_at, updated_at`. Every role's raise writes here.
- **NEW `glimmora_case_messages`** — the two-way thread (case_id, author, body, internal(bool), created_at). `internal=true` = staff-only note.
- Legacy `contributor_support_tickets` + `complaints` are **read-across** for existing data (no migration).
- Optional Postgres VIEW `resolution_cases` = UNION over the above for one queue shape.

## G · Backend (super-admin 8102 — owns the desk + the table; shares the DB)
| Endpoint | Does |
|---|---|
| `POST /api/v1/cases` | **Any** logged-in role raises a case (gateway routes `/api/v1/cases → 8102`) |
| `GET /api/v1/cases/mine` | The raiser tracks their own cases |
| `POST /api/v1/cases/{id}/messages` | Two-way reply |
| `GET /api/superadmin/resolution-center` | Unified queue — read-across, normalized; filters: lane, status, severity, assignee; SLA flags |
| `GET /api/superadmin/resolution-center/{id}` | Case detail + thread + the linked record |
| `PATCH /api/superadmin/resolution-center/{id}` | Triage / assign / route / change-severity / **resolve** → updates source + audit + notify raiser |

Notifications reuse the existing bell system: raise → `notify_role(["superadmin"], category="complaint"|"security")`; resolve → `create_notification(raiser, kind="case.resolved")`. Every action → Mongo audit log.

## H · Frontend (newfrontend/frontend)
- **NEW Glimmora desk:** `/admin/resolution` (extends `/admin/complaints`) — queue with **lane tabs** + filters + SLA + assignee; detail at `/admin/resolution/[caseId]` with thread, the linked record, internal-notes vs public-reply, triage/resolve + **route-to-party**.
- **Shared "Raise to Glimmora"** entry + **"My cases"** tracker in every portal.
- **De-mock** any remaining mock FE in `/contributor/support`.
- **Enterprise** inbox for cases routed to it + compliance overview.

## I · Quality extras to include from the start (⭐)
- **Attachments / evidence** (screenshots, payment proof, harassment screenshot).
- **Anonymous / confidential** option (Safety, Security, Grievance).
- **"Cases about me" + right to respond** — a named party can see + respond before resolution.
- **Internal notes vs public replies** (staff-only triage notes).
- **Status flow + Reopen window** (above).
- **Analytics for Glimmora** — volume by lane, SLA compliance, avg resolution time, trends (catch systemic issues, e.g. a spike in Payment complaints).

### Phase-5 polish backlog
CSAT (rate the resolution) · canned-response templates · FAQ deflection · auto-escalation on SLA breach · rate-limit / abuse flag · multi-language.

## J · Phased build
1. **Phase 1** — `glimmora_cases` table + `POST /api/v1/cases` raise (all roles) + the unified Glimmora desk (read-across queue + case detail + resolve) + audit.
2. **Phase 2** — wire grievance/safety raise → notify Glimmora + surface; de-mock contributor support FE; attachments + anonymous + internal notes.
3. **Phase 3** — cross-links (case → task/SOW/decision) + escalation hookup + SLA timers + reopen + right-to-respond.
4. **Phase 4** — enterprise inbox + compliance overview + route-to-party.
5. **Phase 5** — the polish backlog above.

---
*Approved design captured from the planning discussion. Say "build Phase 1" to start with the unified desk.*
