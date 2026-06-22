# GlimmoraTeam — Full E2E Manual Test Manual
### SOW → Task → Review → Payment · Notifications · Dashboards · Status Matrix · Audit
### Forwards (happy path) **and** Backwards (reject / rework / decline / send-back / cancel)

---

## 0. How to use this manual
- Driven through the **real portals** via the MCP browser at `http://localhost:3000`.
- Every test case states: **WHO is logged in → the ACTION → the EXPECTED change** in 5 channels:
  1. **UI** (what the screen shows)
  2. **Status matrix** (`decomp_tasks.status` / `contributor_tasks.status`)
  3. **Notifications** (which role's bell lights up, category, title)
  4. **Dashboards** (which counters move, in which portals)
  5. **Audit** (what audit-log entry appears)
- `▶ FWD` = forward / happy path. `◀ BWD` = backward / negative path.
- **GOLDEN RULE to verify everywhere:** the **Enterprise never sees** contributor pay or Glimmora margin — only its **budget**. Pricing is hidden.

---

## 1. Environment preconditions (check BEFORE starting)
| Component | Where | Must be |
|---|---|---|
| Frontend (Next.js) | `:3000` | up |
| Mentor backend | `:8101` | listening |
| Super-admin backend | `:8102` | listening |
| Enterprise backend | `:8103` | listening |
| Freelancer/contributor backend | `:8104` | listening |
| Reviewer backend | `:8105` | listening |
| Gateway | `:9000` | listening |
| DB | Neon Postgres `glimmora` | reachable |

---

## 2. Accounts & login/logout
| Role | Login URL | Email | Password | Acct |
|---|---|---|---|---|
| **Super-admin (Glimmora)** | `/admin/login` | `superadmin@glimmora.dev` | `glimmora123` | 70 |
| **Enterprise admin** | `/enterprise/login` | `mdeepika0998@gmail.com` | `Fayaz@123` | 41 (tenant `tnt-fsdbf-588ak`) |
| **Contributor** | `/contributor/login` | `aarav.contributor@glimmora.com` | `Fayaz@123` | 60 |
| **Mentor** | `/mentor/login` | `sfayazmr7@gmail.com` | `Fayaz@123` | 54 |
| **Reviewer** | `/reviewer/login` | `sfayazmr1@gmail.com` | `Fayaz@123` | 59 |

- **Logout:** profile menu (top-right) → Sign out (or `POST /api/auth/signout`).
- Single browser = one session at a time; logging in as another role **replaces** the session.
- **Bell consistency check (every portal):** topbar order must be **Search → 🔔 Notifications → Profile**. Badge is **gold** normally, **red** when any unread item is `critical`.

---

## 3. Status matrix (the "task matrix") — every state + per-role label
Canonical task status lives in `decomp_tasks.status`; the contributor's working copy in `contributor_tasks.status`. Each code renders a **different label per role** (via `status-matrix.ts`).

| # | Status code | Set by (gate) | Enterprise label | Contributor label | Mentor/Reviewer label |
|---|---|---|---|---|---|
| 1 | `draft` | plan created | Draft | — | — |
| 2 | `submitted` (plan) | enterprise submits plan | Awaiting Glimmora | — | — |
| 3 | `ready` | super-admin prices+approves | Ready to assign | Opportunity | — |
| 4 | `assigned` | enterprise sources/assigns | Assigned | **New — accept to start** | — |
| 5 | `in_progress` | contributor accepts | In delivery | In progress | — |
| 6 | `submitted`/`req_check_pending` | contributor submits | In review | Submitted | **Pending (mentor)** |
| 7 | `qa_review_pending` | mentor accepts | In QA | In QA | **Ready for QA (reviewer)** |
| 8 | `payment_pending` | reviewer QA-accepts | Delivered | Accepted — payout processing | Approved |
| 9 | `paid` | payout settled | Paid | Paid | — |
| **F1** | `req_check_failed` | **mentor rejects** | Returned | Rejected (gate 1) | Rejected |
| **F2** | `qa_review_failed` | **reviewer rejects** | Returned | Rejected (QA) | Rejected |
| **F3** | `declined` | **contributor declines** | Declined → re-source | Declined | — |
| **F4** | `cancelled` | enterprise/admin cancels | Cancelled | Cancelled | — |
| **R1** | back to `in_progress` | **mentor rework** | In revision | **Revision — resubmit** | — |
| **R2** | back to `qa_review_pending` | **reviewer rework** (skips mentor) | In revision | **Revision — resubmit** | Awaiting resubmit |

> **Check at every transition:** the SAME underlying code shows the correct, different wording in each portal it appears in.

---

## 4. Notification catalog (every event → who gets it)
| Event (kind) | Triggered by | Recipient | Category | Severity | Title |
|---|---|---|---|---|---|
| `decomposition.submitted` | enterprise submits plan | **all super-admins** | action | important | "Decomposition ready to price" |
| `task.assigned` | enterprise sources/assigns | **contributor** | action | important | "New task assigned to you" |
| `submission.received` | contributor submits | **assigned mentor** | action | important | "New submission to review" |
| `mentor.accepted` | mentor accepts | **contributor** | action | important | "Mentor accepted your work" |
| `mentor.rework` | mentor requests rework | **contributor** | action | important | "Mentor requested changes" |
| `mentor.rejected` | mentor rejects | **contributor** | action | **critical** | "Mentor rejected your submission" |
| `qa.ready` | mentor accepts (handoff) | **reviewer** | action | important | "New work ready for QA review" |
| `qa.accepted` | reviewer QA-accepts | **contributor** | action | important | "QA approved your work" |
| `qa.rework` | reviewer requests rework | **contributor** | action | important | (rework) |
| `qa.rejected` | reviewer rejects | **contributor** | action | **critical** | (rejected) |
| `payout.eligible` | reviewer QA-accept (payout created) | **all super-admins** | payment | important | "Payout eligible to request" |
| `payout.requested` | Glimmora requests release | **enterprise** (plan owner) | payment | important | "Payment requested by Glimmora" |
| (security/complaint examples) | sign-in / complaint raised | per-account | security / complaint | critical/important | — |

**Per recipient, verify in their portal:** (a) bell unread count increments, (b) the item shows in the bell popover with the right icon, (c) it appears on `/<portal>/notifications` under the correct **category tab** (All / Action / Update / Payment / Complaint / Security), (d) mark-as-read decrements the count, (e) mark-all-read zeroes it.

---

## 5. Money / pricing model (verify the math + visibility)
- **Contributor is paid in FULL** (e.g. ₹5,000). GST is **never** deducted from the contributor.
- **Client price** (deal) = `cost ÷ (1 − commission%)` — commission default **15%** (super-admin configurable).
- **Enterprise budget** = `client × (1 + GST%)` — GST default **18%**.
- Example: cost ₹5,000 → client ≈ ₹5,882 → budget ≈ ₹6,941. **Enterprise sees ₹6,941 only**; never ₹5,000 or the margin.
- **Payout lifecycle:** `eligible` → `requested` (Glimmora) → `released` (enterprise on Billing) → `paid` (Glimmora disburses, simulated/Razorpay-test).

---

## 6. Ratings (verify averaging + surfacing)
- **Mentor** rates 5 dimensions (1–5★), required to accept → mentor overall.
- **Reviewer/QA** rates 5 dimensions (Acceptance criteria / Code quality / Testing / Security / Documentation), required to accept → QA overall.
- **Final rating = average(mentor, QA)** stored in `work_ratings` (e.g. 5.0 + 5.0 = 5.00).
- Surfaced to: enterprise sourcing panel (contributor public rating), contributor completed-task history/timeline.

---

# 7. TEST PHASES (run in order; each has FWD + BWD)

### Phase 0 — Login / topbar / bell sanity (all 5 portals)
For EACH portal: log in → confirm dashboard loads, topbar = **Search → Bell → Profile**, bell reads real `/api/notifications`, no error flashes (e.g. no "Missing bearer token").

---

### Phase 1 — SOW creation ▶ (Enterprise)
**Login:** Enterprise. **Go:** SOW Workspace → "Create a SOW".
- **Fields to exercise:** title, description/scope, budget (enterprise-side), skills, timeline/deadline, attachments (upload a file), deliverables.
- **Action:** Save / Submit for approval.
- **Expected — UI:** SOW appears in SOW Workspace with status (e.g. "Draft"/"In approval").
- **Status:** SOW row created.
- **Notification:** (if wired) super-admin/commercial gate notified.
- **Dashboard:** Enterprise "In approval" counter +1.
- **Audit:** `sow.create` (enterprise audit).

### Phase 2 — SOW approval gates ▶ / ◀ (Enterprise admin approve-buttons + Glimmora commercial gate)
The 5 gates (Finance / Security / Legal = enterprise admin approve-buttons; Commercial = Glimmora/super-admin).
- **▶ FWD:** approve each gate → SOW becomes Approved.
  - **Audit:** one `sow.<gate>` entry per approval.
- **◀ BWD (reject):** reject a gate (e.g. Commercial reject as super-admin) → SOW status = Rejected; flows stop; enterprise notified; **no decomposition possible**.
- **Commercial-gate textarea check (known bug area):** the approve comment textarea must accept full text (not drop to 1 char) and the Approve button must enable.

### Phase 3 — Decomposition (creationals) ▶ (Enterprise)
**Go:** Decomposition → open the approved SOW → decompose into tasks.
- **Per task, exercise:** title, description, **acceptance criteria**, **required skills**, **estimated hours**, dependencies, milestones, **reference file upload + view** (verify view works for all roles later).
- **Action:** add ≥1 task; plan status `draft`.
- **Action 2 — Submit to Glimmora** → confirmation page → **"Submit to Glimmora"**.
- **Status:** plan `draft → submitted`.
- **Notification:** **super-admins** get `decomposition.submitted` ("Decomposition ready to price").
- **Dashboard:** Enterprise "Decomposition / awaiting PMO"; Super-admin "Awaiting pricing" +1.
- **Audit:** `decomposition.plan.submit` + `decomposition_plan:<id>`.

### Phase 4 — Pricing & approval ▶ / ◀ (Super-admin)
**Login:** Super-admin. **Go:** Work pricing → open the plan.
- **Verify:** commission% (15) + GST% (18) shown; per-task **set contributor pay** (e.g. ₹5,000); "= ₹5,000" cost preview.
- **▶ FWD — "Approve & provision":** plan `submitted → active`, task → `ready`. Delivery project provisioned.
  - **Dashboard:** moves Awaiting pricing → Priced/In delivery.
  - **Audit:** pricing/approval entry.
- **◀ BWD — "Send back":** enter feedback → plan returns to enterprise (status sent-back); enterprise sees it back in Decomposition for edits; re-submit loops to Phase 3.
- **Visibility check:** log back as Enterprise → the **price (₹5,000) and margin are NOT visible**; only budget.

### Phase 5 — Sourcing / Assignment ▶ / ◀ (Enterprise)
**Login:** Enterprise. **Go:** Decomposition → plan → task page → "Source & assign".
Two paths:
- **5a Publish-for-interest ▶:** "Publish to matched" → window. Contributors see it under Opportunities → "I'm interested". Enterprise sees interested pool (tabs: All / Only interested / Top matched) with **public profiles** (rating, tasks accepted/completed, acceptance %, skill match). Select one.
- **5b Direct select ▶:** pick a contributor's "Select" → **"Assign"** confirm dialog.
- **Status:** task `ready → assigned`; `contributor_tasks` row created (`assigned`); others' interest → `rejected`.
- **Notification:** **contributor** gets `task.assigned`.
- **Dashboard:** Contributor "Assigned" +1; Enterprise "In delivery".
- **Audit:** `decomposition.task.select`.
- **◀ BWD — decline → reassign:** (Phase 6 decline) → task `declined` → enterprise re-sources to another contributor (loops here). Verify the assign list still works after a decline.

### Phase 6 — Contributor accept + submit ▶ / ◀ (Contributor)
**Login:** Contributor. **Go:** Assigned → task.
- **Verify bell:** `task.assigned` present; dashboard "Assigned 1".
- **◀ BWD — Decline:** "Decline" → task `declined`; goes back to enterprise to re-source (Phase 5).
- **▶ FWD — Accept & start:** confirm → `contributor_tasks: assigned → in_progress`; dashboard "In progress 1".
- **▶ FWD — Submit:** "Open draft" → fill **Deliverable link (GitHub, required)**, **Task completion %** (slider), **Working notes**, optional **evidence file upload** → "Submit".
  - **Verify pay tile:** "YOUR PAY (TAKE-HOME) ₹5,000 · Paid in full · GST never deducted from you".
  - **Status:** `in_progress → submitted`; `decomp_tasks` → req_check_pending (routes to mentor).
  - **Notification:** **mentor** gets `submission.received`.
  - **Dashboard:** Contributor "Submitted 1"; Mentor "Pending reviews 1".

### Phase 7 — Mentor review (gate 1) ▶ / ◀ (Mentor)
**Login:** Mentor. **Go:** Queue → the review.
- **Verify bell:** `submission.received`; queue shows the submission (R1/3, contributor, SLA).
- Open review → **"Decide"** → choose:
- **▶ FWD — Accept:** rate the **5★ rubric (all required)** → "Confirm accept".
  - **Status:** mentor_review `accepted`; `decomp_tasks → qa_review_pending`.
  - **Notifications:** **reviewer** `qa.ready`; **contributor** `mentor.accepted`.
  - **Dashboard:** Mentor pending −1; Reviewer "Pending 1".
  - **Rating:** mentor overall recorded (e.g. 5.0).
- **◀ BWD — Request rework:** add corrections → `decomp_tasks` back to contributor (R2, in_progress/revision).
  - **Notification:** **contributor** `mentor.rework` ("Mentor requested changes"). Contributor "Revisions" shows it → edits → resubmits (loops to Phase 7, round 2).
- **◀ BWD — Reject:** reason → mentor_review `rejected`; `decomp_tasks → req_check_failed` (terminal, **no payout**).
  - **Notification:** **contributor** `mentor.rejected` (**critical** → red bell badge).

### Phase 8 — Reviewer QA (gate 2) ▶ / ◀ (Reviewer)
**Login:** Reviewer. **Go:** QA Review queue → the assignment.
- **Verify bell:** `qa.ready`; queue shows it; **MENTOR SCORE** carried (e.g. 5.0).
- Decision = Accept / Request rework / Reject. For **Accept**, the **"Rate the work quality"** dialog (5 dimensions, all required) appears → score all → "Confirm accept".
- **▶ FWD — Accept (QA pass):** reviewer_assignment `approved`; `decomp_tasks → payment_pending`; **eligible payout created** (`source: reviewer_qa_approval`, contributor pay full).
  - **Notifications:** **contributor** `qa.accepted` ("QA approved your work — payout now being processed"); **super-admins** `payout.eligible` ("Payout eligible to request").  ← *(fixed this session: fires here, not at a later gate)*
  - **Rating:** `work_ratings.final_rating = avg(mentor, QA)` (e.g. 5.00). Surfaced to enterprise sourcing + contributor history.
  - **Dashboard:** Reviewer pending −1; Super-admin "Pending payments / payouts" reflects eligible; Enterprise "Delivered".
- **◀ BWD — Request rework:** returns to contributor; resubmission goes **straight back to reviewer** (skips mentor), `decomp_tasks` qa_review_pending (R2). **Notification:** contributor `qa.rework`.
- **◀ BWD — Reject:** `decomp_tasks → qa_review_failed` (terminal, **no payout**). **Notification:** contributor `qa.rejected` (**critical**).

### Phase 9 — Payment flow ▶ (3-party payout)
- **9a Super-admin (Glimmora) requests release:** Glimmora pricing/payouts → request payout (whole task / remaining / total / **custom amount box**). Payout `eligible → requested`.
  - **Notification:** **enterprise** `payout.requested` ("Payment requested by Glimmora ₹…").
- **9b Enterprise releases (Billing):** Enterprise → Billing → the budget figures (Total committed / Delivered / Outstanding / Awaiting / **Released (cumulative)** / Paid; budget-utilization bar). Release → payout `requested → released`.
  - **Check:** "Released" KPI = released + paid (cumulative); over/under-budget variance shown.
  - **Audit:** payment/release entry (enterprise audit).
- **9c Glimmora disburses:** payout `released → paid` (simulated). `decomp_tasks → paid`.
  - **Notification:** **contributor** payout paid; contributor Earnings shows `paid`/sent.
  - **Dashboard:** Contributor "This week/month" earnings move, Accepted/Completed buckets; Enterprise "Paid".

### Phase 10 — Cross-role file view ▶
For the task's reference files + the contributor's evidence: verify **all 4 roles** (contributor, mentor, reviewer, enterprise) can **view/open** the uploaded artifacts (links resolve to blob).

### Phase 11 — Notifications full sweep
For EACH role's `/<portal>/notifications`: confirm the **category tabs** (All / Action / Update / Payment / Complaint / Security) show the right counts and **filter** correctly; mark-read + mark-all-read update the bell; **2-color badge** flips red↔gold with a critical item (e.g. after a reject).

### Phase 12 — Dashboards sweep (all 5 portals)
Re-open each dashboard and confirm counters reflect the run:
- **Contributor:** Assigned / In progress / Submitted / Accepted / This week / This month / Acceptance% / Streak.
- **Enterprise:** In approval / Acceptance / In delivery / Decomposition + Billing totals.
- **Super-admin:** Work pricing tabs (Awaiting/Priced/Completed/Pending payments/Paid), payouts.
- **Mentor:** Pending reviews / decisions / escalations / mentorship stats.
- **Reviewer:** QA queue (Pending / SLA risk / Overdue / Round 2+) / metrics.

### Phase 13 — Audit sweep
- **Enterprise audit:** sow.*, decomposition.plan.submit, decomposition.task.select, payment/release — tamper-evident, signed.
- **Super-admin audit:** sees cross-tenant actions (the enterprise submit, pricing, payouts).

---

## 7b. Cross-cutting — Contributor "updates" experience & Enterprise visibility of profiles/ratings
> **Verify these IN PARALLEL with every phase above.** At each transition check **all** channels at once — UI + status + notification + dashboard + audit — for **every** affected role, not one at a time.

### A. Contributor — "check updates" (runs through Phases 5–9)
At each event the contributor must **see the update without being told**:
- **Bell** lights up for `task.assigned`, `mentor.accepted/rework/rejected`, `qa.accepted/rework/rejected`, payout paid — count + category + 2-color badge (red on a reject).
- **Notifications page**: item under the right **category tab**; mark-read works; "See all" link correct.
- **Status reflects live** as it moves Assigned → In progress → Submitted → In QA → Accepted → Paid (the **contributor-side label**, not the raw code).
- **Assigned / Submissions / Revisions / Completed** tabs: the task sits in the correct one for its state. On mentor/QA **rework** → appears under **Revisions** with feedback → contributor edits → **resubmits**.
- **Completed history + timeline**: an accepted task shows the full timeline (assigned→submitted→mentor→QA→paid), each revision round, and the **final rating** (avg of mentor+QA) visible to the contributor.
- **Earnings**: pay shows **in full** (₹), status eligible→…→paid; **GST never deducted** from the contributor.

### B. Enterprise — sees contributor PUBLIC PROFILE + RATINGS (Phase 5 sourcing + Workforce + task timeline)
When sourcing/selecting, the enterprise must see each candidate's **public** data:
- **Rating** — the averaged final rating from prior work (e.g. ★4.6).
- **Tasks accepted / completed / acceptance %**.
- **Skills** + skill-match for the task (e.g. "2/2 skills match").
- Past project types (if shown).
- **MUST NOT see**: contributor pay or Glimmora margin — only the task **budget**.
- The same public profile/rating is also visible on enterprise **Workforce** and the task **activity timeline**.

### C. Parallel-verification rule (apply to every action in Phases 1–9)
Immediately confirm the change landed in **all** of: the actor's UI · the recipient's bell · every dashboard counter that should move · the status-matrix label in each portal it appears · the audit log — **before** moving on.

---

## 8. Backward / negative test matrix (summary)
| Path | Trigger | End state | Notification | Payout? |
|---|---|---|---|---|
| SOW reject | super-admin commercial reject | SOW rejected | enterprise notified | no |
| Decomposition send-back | super-admin "Send back" | plan sent-back → enterprise edits | enterprise | no |
| Contributor decline | contributor "Decline" | task `declined` → re-source | (enterprise) | no |
| Mentor rework | mentor "Request rework" | `in_progress` R2 | contributor `mentor.rework` | no (yet) |
| Mentor reject | mentor "Reject" | `req_check_failed` (terminal) | contributor `mentor.rejected` (critical) | **no** |
| Reviewer rework | reviewer "Request rework" | `qa_review_pending` R2 (skips mentor) | contributor `qa.rework` | no (yet) |
| Reviewer reject | reviewer "Reject" | `qa_review_failed` (terminal) | contributor `qa.rejected` (critical) | **no** |
| Cancel | enterprise cancel | `cancelled` | (per role) | no |

---

## 9. Sign-off checklist (pass criteria)
- [ ] All 5 portals: login + topbar bell (search→bell→profile) + no error flash.
- [ ] SOW create → approve gates → (reject path too).
- [ ] Decompose → submit → super-admin notified + pricing queue + audit.
- [ ] Price → approve (+ send-back path) → task ready; **enterprise can't see price/margin**.
- [ ] Assign (interest + direct + decline→reassign) → contributor notified + dashboard.
- [ ] Contributor accept + submit (+ decline path) → mentor notified.
- [ ] Mentor accept (+rework +reject) → correct notifications + rating + matrix labels.
- [ ] Reviewer QA accept (+rework +reject) → qa.accepted + **payout.eligible to super-admin** + final rating avg.
- [ ] Payout: eligible → requested → released → paid; enterprise sees budget only.
- [ ] Every status code shows the right **per-role label**.
- [ ] Notifications: every event reaches the right bell; category tabs filter; 2-color badge.
- [ ] Dashboards in all 5 portals reflect the run.
- [ ] Audit logs capture every consequential action (incl. payments), cross-tenant for super-admin.
- [ ] Files viewable by all 4 roles.

---

## 10. Test data note
Re-use or create a fresh SOW per run. Last run left `sow_e2e_ntf` / `dp_e2e_ntf` / `tsk_e2e_ntf` mid-flow at `payment_pending` (eligible ₹5,000). For a clean forward+backward run, create a NEW SOW (so backward paths don't collide with the half-finished one).

---
---

# PART B — EXHAUSTIVE UI REFERENCE
**Every page · section · field · button · option · what it does · what data it holds.** (Captured first-hand from the live portals.) Legend: 🔘 button · ▦ field/input · ☑ checkbox · ◉ radio · ▼ dropdown · 🔗 link · 📊 read-only data.

---

## B1. ENTERPRISE PORTAL

### B1.1 Topbar (every enterprise page)
- 🔗 **Glimmora · Enterprise** (logo) → dashboard. 🔘 **Search/⌘K** (command palette). 🔔 **Notifications** (bell, popover, 2-color badge — gold/red). 🔘 **Account menu** (avatar) → Profile / Settings / Sign out.
- Left nav groups: **OVERVIEW** (Dashboard) · **ORIGINATION** (SOW Workspace, Decomposition) · **DELIVERY** (Projects, Workforce) · **FINANCE** (Billing, Payouts) · **GOVERNANCE** (Audit, Compliance, Support) · **INSIGHTS** (Analytics).

### B1.2 Dashboard `/enterprise/dashboard`
- 📊 KPI cards: **IN APPROVAL** (SOWs awaiting sign-off) · **ACCEPTANCE** (submissions to review) · **IN DELIVERY** (active projects) · **DECOMPOSITION** (plans awaiting PMO). Each clickable → filtered list.
- 📊 **Your queue** — items needing the admin now (else "Queue clear").
- 🔗 **Open workspace**, 🔗 **Create a SOW**.

### B1.3 SOW Workspace `/enterprise/sow`
- 📊 Status pills/tabs: **All · Draft · Approval · Approved** (each a count; click to filter, `?status=`).
- 🔘 **Create a SOW** → `/enterprise/sow/intake`. 📊 SOW list rows (title, status, updated → SOW detail).

### B1.4 SOW Intake wizard `/enterprise/sow/intake`
Right rail = **YOUR PATH**: 1 Choose method · 2 Add SOW details · 3 Assign approvers · 4 Create & submit.
- **Step 1 — Choose method** (4 cards, each a 🔗):
  - **Generate with AI** (`?mode=generate`, *RECOMMENDED, ~2 min*) — describe in a sentence, AI drafts the SOW.
  - **Upload a document** (`?mode=upload`, ~3 min) — drop DOC/DOCX/PDF; extracts scope/deliverables/risks.
  - **Author from scratch** (`?mode=author`, ~5 min) — structured form.
  - **Use a template** (`/templates`) — org template (Software, Design…).
- **Step 2 — Author** (`?mode=author`): ▦ **TITLE** · ◉ **CONFIDENTIALITY** (Internal = tenant-wide / Confidential = approvers+stakeholders / Restricted = need-to-know) · ▦ **SCOPE BODY** (markdown). 🔘 **Continue · pick approvers** (disabled until title+scope).
- **Step 3 — Submit for approval**:
  - **Commercial pricing** tabs: 🔘 **Manual price** (enterprise proposes value, Glimmora adds fee) / 🔘 **AI quote** (base + SOW cost + uplift).
    - Manual: ▦ **ENTERPRISE PROPOSED VALUE ₹** (fair work value, excl fee+GST) · ▦ **GLIMMORA PLATFORM FEE ₹** (fixed fee).
    - 📊 **QUOTE PREVIEW** (what's stored): Client price (excl GST) · GST (18%) · Enterprise total payable. *"You only see the client price; margin + payouts managed separately."*
  - 📊 **Approval gates** list: 1 Security · 2 Finance · 3 Legal · 4 Tenant admin · 5 Super admin. SLA 48h/gate.
  - ☑ **Notify on status changes** (default on). ▦ **COVER NOTE** (optional, context for Glimmora Commercial).
  - 🔘 **Back · Cancel · Save as draft · Submit for approval** (disabled until pricing entered).
- **Step 4 — Confirmation**: 📊 "Submitted for approval" + 🔘 **View SOW · Open approval workflow · Back to workspace**.

### B1.5 SOW detail `/enterprise/sow/{id}`
- 📊 Header: title · **IN APPROVAL/APPROVED/REJECTED** badge · current **Stage** · updated.
- 🔗 **Audit trail** (→ filtered audit) · 🔗 **Record gate decision** (→ `/approve`).
- 📊 **Approval progress**: Security → Finance → Legal → Tenant admin → Super admin (each: In progress / Pending / Approved · time).
- **Delivery staffing**: 📊 **MENTOR · GLIMMORA** (assigned at platform approval) · **REVIEWER · ENTERPRISE** (▼ Select a reviewer [value = account id] + 🔘 **Assign reviewer**).
- 📊 **Approvals log** (5 decisions, version, status). 📊 **Details** (Owner, Confidentiality, Created, Updated). 🔘 **View details** (the 3 captured intake fields).

### B1.6 SOW gate-approve `/enterprise/sow/{id}/approve`
- 📊 **STEP N OF 5** + gate name + description + checklist criteria.
- ◉ **DECISION**: **Approve** (advance pipeline) / **Send back** (return w/ feedback) / **Reject** (end pipeline).
- ▦ **COMMENT** (optional on Security/Finance/Legal). **Tenant admin** adds ▦ **SIGN OFF — YOUR FULL NAME** (required; recorded as the audit signature).
- 🔘 **Approve stage** (disabled until required fields). 📊 Pipeline progress + Decision history side panels.

### B1.7 Decomposition `/enterprise/decomposition`
- 📊 **Awaiting decomposition** — approved SOWs each with 🔗 **View SOW** + 🔘 **Decompose**.
- Tabs: **All · Ready · In progress · Approved** (plan counts). 📊 Work-plan table (Work plan, Status, Structure [milestones·tasks], Updated). ▦ Search by SOW title.

### B1.8 Decomposition builder `/enterprise/decomposition/new?sowId=`
- **Milestones**: ▦ M-title (e.g. "Discovery & setup") · 🔘 **Add milestone / Remove milestone**.
- **Tasks** (per task): ▦ **Task title** · ▼ **Milestone** · ▦ **Skills (comma-sep)** · ▦ **Effort (hrs)** spinbutton · ▦ **Description/brief** · ▦ **Acceptance criteria** (one per line) · **Support files** (🔘 Attach files → blob upload).
- 🔘 **Add task** (repeat) · 🔘 **Cancel** · 🔘 **Create decomposition** (→ plan detail, status Draft).

### B1.9 Plan detail `/enterprise/decomposition/{planId}`
- 📊 Header: Plan id · VERSION · **READY/DRAFT/SUBMITTED/ACTIVE** · milestones·tasks·est·updated.
- 🔗 **Export CSV · Audit trail** · 🔘 **Delete · Submit to Glimmora** (→ `/approve` confirm → fires `decomposition.submitted`).
- 📊 Milestone progress · **Tasks** (each task row → task page).

### B1.10 Task page `/enterprise/decomposition/{planId}/tasks/{taskId}`
- 📊 **Overview**: title · status (Ready to assign…) · est · **SKILLS REQUIRED** · **DESCRIPTION** · **ACCEPTANCE CRITERIA** · **Reference files** (links, open/view).
- 📊 **ACTIVITY TIMELINE** — published→sourced→submitted→reviewed (scroll box).
- **Source & assign** panel:
  - **PUBLISH FOR INTEREST**: ▦ window (h/m) · 🔘 **Publish to matched** (opens interest to skill-matched contributors).
  - **SOURCE A CONTRIBUTOR** tabs: **All · Only interested · Top matched** (counts). Scroll box of contributor **public-profile cards** → 📊 name · interested · email · **RATING** (final avg) · **ACCEPTED** · **COMPLETED** · **ACCEPTANCE %** · **skills match** (e.g. 2/2). 🔘 **Select** → **Confirm assign** dialog → 🔘 **Assign** (fires `task.assigned`; sets others' interest = rejected).

### B1.11 Projects `/enterprise/projects` · Workforce `/enterprise/workforce`
- **Projects**: 📊 active delivery projects (provisioned at SOW approval), per-task status matrix labels.
- **Workforce**: 📊 contributor roster + **public ratings/profiles** (same data as the sourcing cards).

### B1.12 Billing `/enterprise/billing` · Payouts `/enterprise/billing/payouts`
- 📊 6 KPIs: **Total committed · Delivered · Outstanding balance · Awaiting · Released (cumulative) · Paid**.
- 📊 Budget-utilization bar (Paid / Released·pending / Awaiting / Remaining). Over/under-budget variance.
- 📊 SOW table (Total, Balance columns) · 🔗 CSV export.
- **Payouts**: 📊 per-payout rows (eligible→requested→released→paid); 🔘 **Release** (requested→released).

### B1.13 Audit `/enterprise/audit` · Compliance · Support · Analytics
- **Audit**: 📊 KPIs (In window, Critical, Unique actors, Invalid sigs) · severity tabs (All/Critical/Warning/Info) · time (24h/7d/30d) · tamper-evident signed entries (`sow.*`, `decomposition.plan.submit`, `decomposition.task.select`, payment/release).
- **Compliance / Support / Analytics**: policy state, support tickets, delivery analytics.

---

## B2. SUPER-ADMIN (GLIMMORA) PORTAL
Nav: Dashboard · **CUSTOMERS** (Tenants, Commercial gate, Work pricing) · **TALENT** (Mentors) · **STANDARDS** (Rubric templates) · **COMPLIANCE** (Complaints, KYC reviews, Audit log).

### B2.1 Commercial gate `/admin/sow`
- 📊 Tabs: **Awaiting you · Approved · All SOWs** (counts). 📊 Review queue (SOW, Tenant, SOW ID, Waiting — longest first). 🔘 **Raise SOW** (`/create`). Row → detail.

### B2.2 Commercial-gate detail `/admin/sow/{id}`
- 📊 Header + "Awaiting your decision" + tenant + SLA + 🔗 **Enterprise record**.
- 🔘 **Approve commercial** (SOW→approved, delivery can proceed) / **Send back** (→ enterprise, resubmit as new version) / **Reject** (sponsor starts over).
- 📊 **Commercial economics** (super-admin only): Client price · Actual cost basis · Gross margin · GST(18%) · Enterprise total. **Projected split**: Given budget · **Glimmora margin (15%)** · **Contributor pool** · **Contributor net (−18% GST)** · Enterprise pays (+18% GST). *(Enterprise NEVER sees this.)*
- 📊 Scope & details (Priority, Engagement, Confidentiality, Created, **REVIEWER**). 📊 Approval pipeline · Prior stage decisions.
- **Mentor assignment**: ▼ **Select a mentor** [value=account id] · 🔘 **Assign/Reassign mentor**.
- **Approve modal** ("Approve & sign off — Super admin"): ☑ PLATFORM CHECKLIST (Rate cards apply / Effort ±15% / Payment terms align) · ▦ **Sign off — full name** (required, audit signature) · ▼ Delivery mentor (optional) · ▦ **Comment for audit** (required ≥10 chars) · ☑ Notify enterprise sponsor · 🔘 **Sign & approve / Cancel**.

### B2.3 Work pricing `/admin/decomposition`
- 📊 Tabs: **Awaiting pricing · Priced · Sent back · Completed SOW · Pending payments · Payment completed · All**. Rows (SOW, status, X/Y delivered) → pricing detail.

### B2.4 Pricing detail `/admin/decomposition/{planId}`
- **PLATFORM RATES**: ▦ Commission % (drives client = cost÷(1−c%)) · ▦ GST % · 🔘 **Edit**.
- Per task: 📊 title · est · skills · description · **Not priced** · 🔘 **Edit** → ▦ **amount** (contributor pay, full).
- 📊 Live economics: **Contributor payout (full)** · **Glimmora margin (15%)** · **Client price (÷0.85)** · **GST (18% pass-through)** · **Enterprise pays** · "within SOW budget ₹X (target)".
- ▦ Feedback (for send back) · 🔘 **Send back** · 🔘 **Approve & provision** (plan→active, task→ready).

### B2.5 Mentors · Rubric templates · Complaints · KYC reviews · Audit log
- **Mentors**: roster + assignment. **Rubric templates**: rating dimensions config. **Complaints**: contributor/enterprise complaints (notif category). **KYC reviews**: contributor verification queue. **Audit log**: cross-tenant signed audit (sees every tenant's actions + payouts).

---

## B3. CONTRIBUTOR PORTAL
Nav: **TODAY** (Dashboard) · **MY WORK** (Opportunities, Assigned, Submissions, Revisions, Completed) · **MY RECORD** (Earnings, Credentials) · **SUPPORT** (Help) · Profile · Settings. Topbar: Search · 🔔 Bell · Account.

### B3.1 Dashboard `/contributor/dashboard`
- 📊 8 KPIs: **ASSIGNED · IN PROGRESS · SUBMITTED · ACCEPTED (+rate) · THIS WEEK ₹ · THIS MONTH ₹ · ACCEPTANCE % · STREAK**. 📊 Priority "Continue working" · **ACTION ITEMS** (pending count) · AI recommendations.

### B3.2 Opportunities `/contributor/opportunities`
- 📊 Skill-matched published tasks (net pay shown) · 🔘 **I'm interested** (adds to the enterprise interest pool).

### B3.3 Assigned `/contributor/tasks`
- 📊 Assigned summary (ASSIGNED · READY TO START · IN PROGRESS · CAPACITY). Tabs: **All · Ready · In progress**.
- Task row: title · time · "Review pricing, then accept" · 🔘 **Accept & start** (confirm modal → in_progress) · 🔘 **Decline** (→ task `declined`, back to enterprise).

### B3.4 Task detail / workroom `/contributor/tasks/{id}`
- 📊 Header: title · Task code · **In progress** · Submission code · Draft/Round.
- 📊 **Brief** · **Acceptance criteria**.
- ▦ **Deliverable link (required)** — GitHub repo/PR (verified before submit).
- ▦ **Task completion %** (slider, shown to mentor+reviewer).
- ▦ **Working notes** (≤5000 chars).
- **Evidence (optional)**: 🔘 drag/click upload (blob).
- 📊 **Progress** rail (Step N of 5: Assigned → In progress → Revision → Submitted → Accepted).
- 📊 **Context**: status · agreed estimate · **YOUR PAY (TAKE-HOME) ₹X · Paid in full · GST never deducted** · readiness %.
- 🔘 **Open draft · Save draft · Submit** (Submit disabled until valid GitHub link).

### B3.5 Submissions · Revisions · Completed · Earnings · Credentials
- **Submissions**: tasks awaiting review. **Revisions**: tasks returned by mentor/QA rework (with feedback → resubmit). **Completed**: accepted tasks + **history/timeline** (assigned→submitted→mentor→QA→paid, revision rounds, **final rating**). **Earnings**: payouts (eligible→…→paid/sent), full pay. **Credentials**: skills/KYC.

---

## B4. MENTOR PORTAL
Nav: Dashboard · **REVIEW** (Assigned SOWs, Queue, History) · **MENTORSHIP** (Sessions) · Account (Profile, Settings). Topbar: Search · 🔔 Bell · Account.

### B4.1 Queue `/mentor/queue`
- 📊 Pending reviews. Tabs: **All pending · SLA risk · Round 2+ · Two-stage**. View: **Flat list / By project / By contributor / Advanced** (filters: SLA tiers, stages, round, flags). ▦ Search. Row → review (title, contributor, R#/3, Single, Submitted, SLA-left).

### B4.2 Review `/mentor/queue/{reviewId}`
- 📊 Submission context (brief, criteria, deliverable link, evidence, completion %).
- Feedback (3-block): **What worked · Required corrections · Optional suggestions** (🔘 Add a correction / Add a suggestion / Generate w/ AI) · Coaching note.
- 🔘 **Reassign · Withdraw (conflict) · Save draft · Decide**.
- **Decide** → ◉ **Accept / Request rework / Reject** → **5★ rubric** (all dimensions required; e.g. Acceptance criteria, Code quality, Testing, Communication, Timeliness) → 🔘 **Confirm accept** (disabled until all rated). Accept→`qa_review_pending`+notifs; rework→back to contributor; reject→`req_check_failed`.

---

## B5. REVIEWER (QA) PORTAL  `/enterprise/reviewer/*`
Nav: Dashboard · **REVIEW** (Assigned SOWs, Queue, History, Metrics). Topbar: Search · 🔔 Bell · Account.

### B5.1 QA queue `/enterprise/reviewer/queue`
- 📊 KPIs: **PENDING · SLA RISK · OVERDUE · ROUND 2+**. Tabs: All pending / SLA risk / Round 2+. ▦ Search. Table: **SUBMISSION · CONTRIBUTOR · ROUND · CRITERIA · SLA**. Row → review.

### B5.2 QA review `/enterprise/reviewer/queue/{id}`
- 📊 Header: title · **AWAITING QA SIGN-OFF** · SLA · Task/Submission code · % complete · contributor · "Mentor accepted Xh ago".
- 📊 **Scorecard**: **MENTOR SCORE** (carried) · CRITERIA · FILE SCAN · ROUND. Tabs: **Overview · Criteria · Evidence · Scans · Details**.
- 📊 **YOUR DECISION**: ◉ Accept (forward to enterprise acceptance) / Request rework (return to contributor) / Reject (close, no payout). ▦ **COMMENT** (optional, visible to contributor).
- 🔘 **Accept for enterprise** → **"Rate the work quality"** dialog (5 dims, all required: **Acceptance criteria met · Code quality · Testing & robustness · Security/safety · Documentation/handoff**) → 🔘 **Confirm accept** (disabled until all rated). Accept→`payment_pending` + **eligible payout** + `qa.accepted`(contributor) + `payout.eligible`(super-admin); rework→back to reviewer queue (skips mentor); reject→`qa_review_failed`.

---

## B6. SHARED — Notifications surface (every portal)
- 🔔 **Bell** (topbar, between Search + Profile): badge = unread count; **gold** normally, **red** if any unread is `critical`. Click → popover: header ("N unread · includes critical"), 🔘 **Mark all read**, list (severity icon + title + body + relative time + deep-link action), 🔗 **See all notifications**.
- **Notifications page** `/<portal>/notifications`: 📊 KPIs (Total · Unread · Critical unread). Filter tabs: **All / Unread**. **Category tabs**: **All · Action · Update · Payment · Complaint · Security** (each a count; filters via `?category=`). Per row: category/kind chip · UNREAD badge · title · body · timestamp · action button · 🔘 **Mark read**. 🔘 **Refresh · Mark all read**.
</content>
