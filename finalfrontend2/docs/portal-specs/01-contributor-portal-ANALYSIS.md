# Contributor Portal — Deep Analysis

Per-screen analysis with **all seven dimensions** from the spec: wireframe, states, edge cases, cognitive load, decision heuristics, accessibility, cross-portal.

> Compiled by reading `01-contributor-portal.md` end-to-end (2956 lines). The user's correction was: "read everything before designing — otherwise you design blind". This file is the consolidated read.

Status legend matches the CHECKLIST: ✅ built · 🟡 partial · ⛔ missing · ⏭ Phase 2.

Sections marked **PENDING DEEP READ** below are ones we have NOT yet rebuilt — work targets.

---

## §5.D.2 Filter drawer — PENDING DEEP READ

**Wireframe (slides in from right):**
- Header: `Filters` + close `[×]`
- Group `State` (multi-check): Assigned · Accepted · In progress · Blocked · Awaiting clarification · Ready to submit · Revision requested
- Group `Project` (single dropdown)
- Group `Skill` (single dropdown)
- Group `Priority` (radio): Any · P0 only · P0 + P1
- Group `Due` (radio): Any · This week · Overdue
- Footer: `Reset` left, `Apply N filters` right (counts active filters)

**States:** open / closed / applying / no-filters-set / filters-applied.

**Edge:** filters persisted in **URL query string** — page refresh must reproduce the filter set.

**Cognitive load:** narrowing the queue without losing what was selected. Single drawer instead of stacked inline pills.

**Decision heuristic:** the drawer answers "show me only the rows I care about right now".

**Accessibility:** focus traps inside the drawer; ESC closes; restore focus to the trigger.

**Cross-portal:** none — local UI.

**Implementation notes for me:**
- The existing inline `Project / Skill / Date` row is OK on the list page but the spec wants a **drawer**. Two options: replace inline with a "Filters" button that opens the drawer; or keep inline + add the drawer for `State` + `Priority` which inline doesn't support. The cleanest path is drawer-only (move all four filter groups inside) so the list page header is the spec wireframe row + a single "Filters" button.

---

## §5.E.2 Workroom — empty brief — PENDING DEEP READ

**Wireframe:**
```
│ Brief                          │
│ No brief content yet.          │
│ The reviewer is preparing it.  │
│ [ Notify the reviewer ]        │
```

**Use case:** rare — brief is missing (admin error). Show graceful message.

**Cross-portal:** "Notify the reviewer" writes to mentor portal queue.

**Implementation note:** I already have a conditional empty state in the Brief section but it lacks the CTA. Add `[Notify the reviewer]` button that calls an endpoint that writes to the mentor's notification queue.

---

## §5.E.3 Workroom — Q&A / clarification thread — ⛔ MISSING

**Use case:** ask reviewer mid-task; reviewer replies; state transitions to `awaiting_clarification`.

**State machine impact:** §7.1 shows `awaiting_clarification` is a real state — work pane disables editing while waiting; status badge reads "Awaiting clarification".

**Cognitive load:** "When you need help, ask without blocking the task."

**Cross-portal:** writes to mentor portal Q&A thread.

**Implementation note:** Q&A thread is inline in workroom (per §10.8 open decision). Replaces working notes area when opened. The component pattern: a separate `<QnAThread>` that takes the place of the working-notes textarea when active.

---

## §5.E.4 Request clarification modal — ⛔ MISSING

Same as §5.E.5 below but with a prompt for the first question.

---

## §5.E.5 Workroom — report blocker — ⛔ MISSING

**Wireframe:** modal with textarea ("What's blocking you?"), radio "When resolved" (Today / This week / Unsure), optional "Who can help" text.

**Post-condition:** task state → `blocked`; mentor escalation queue gets the entry.

**Cross-portal:** writes to mentor escalation queue.

**Implementation note:** Modal triggered from a "Report blocker" link in the work pane footer or context rail.

---

## §5.E.6 Workroom — scan failed modal — ⛔ MISSING

See §6.2 — shared component. Triggered when a file upload fails virus/plagiarism scan.

**Wireframe:** `⚠ File flagged` / "We couldn't accept demo.mp4 because virus signature detected" / `[Remove file]`.

---

## §5.E.7 Workroom — withdraw task modal — ⛔ MISSING

**Wireframe:** "Withdraw from this task?" / "You won't earn the payout, matching will record this." / reason select / Cancel + destructive Withdraw.

**Edge:** if already submitted, use Withdraw submission (§5.G.2) — different flow.

---

## §5.F.1 Submission screen — `/contributor/tasks/[taskId]/submit` — 🟡 PARTIAL

**Wireframe:**
- Header back link: `← Workroom · {Task} · Round X of Y`
- Title: "Submit for review"
- Readiness bar `▓▓▓ 78%` + "4 of 6 criteria addressed"
- Evidence section (file list + total size + scan badges)
- Cover note textarea (0/2000 char counter)
- Route to: radio `Mentor (default)` + `Mentor + Client` (two-stage)
- Acceptance criteria checklist (read-only, marked status)
- ⚠ unaddressed criteria warning (count)
- Footer: `Save draft` + `Cancel` left, `Submit for review` right

**States:** default · submitting · success (redirect) · error · readiness_warning_modal_open · routing_unavailable.

**Edge cases:**
- Unaddressed criteria → §5.F.2 confirm modal
- Final round + unaddressed → harder modal requiring reason
- Mentor offline → fall back to mentor pool with explanation
- Two-stage requested but no client reviewer configured → fall back single-stage with notice
- Concurrent edit → §6.5 version conflict modal
- Submit fails → revert, retain inputs, surface specific error

**Cognitive load:** evidence → note → routing → final criteria check, in that order top-down.

**Decision heuristics:** "Am I ready?" → readiness %; "Single or two-stage?" → radio with one-line each.

**Accessibility:** focus on readiness bar on mount; tab order top-to-bottom; radio group has aria-labelledby; submit announces state on confirm.

**Cross-portal:** writes audit event `submission_v{N}`; creates row in mentor queue.

**Current implementation:** exists at `/contributor/tasks/[taskId]/submit/page.tsx` — needs audit against this whole block.

---

## §5.F.2 Readiness warning modal — ⛔ MISSING

**Wireframe:**
- "Submit with unaddressed criteria?"
- "N criteria are not yet marked addressed:" + bulleted list
- "You can submit anyway — reviewer may request revisions."
- Buttons: `Go back and address` / `Submit anyway`

**Edge:** final round → copy changes to "This is your final round. Unaddressed criteria are likely to cause rejection." + reason textarea required before "Submit anyway" enables.

---

## §5.F.3 Submission in-flight + success — `/contributor/tasks/[taskId]/submit/success` — 🟡 PARTIAL

**Wireframe:**
- Big check: `✓ Submitted`
- "{Task} — round {N}"
- "Sent to {Mentor} for review"
- "Expected response: within 24 hours"
- "What happens next?" card (4 numbered steps)
- Buttons: `Back to my work` / `See submissions`

**Cross-portal:** writes audit event; creates mentor-queue row.

**Implementation note:** route exists. Audit against spec — likely missing "What happens next?" card.

---

## §5.F.4 Submission error — ⛔ MISSING (graceful path)

Box with "Couldn't submit / Your work is safe / Error: {message}" + `Try again` + `Save as draft and continue later`.

---

## §5.G.1 Under review pane — 🟡 PARTIAL

Workroom in read-only mode with:
- "Under review · Submitted to {Mentor} 14m ago · Expected response in 23h"
- Read-only submission packet view
- `[ Withdraw submission ]` button

**State machine:** corresponds to `under_review` state in §7.1.

---

## §5.G.2 Withdraw submission modal — ⛔ MISSING

"Withdraw this submission?" / "Reviewer won't see it. You can edit and resubmit." / reason / Cancel + Withdraw.

---

## §5.H.1 Revisions queue — `/contributor/tasks/revisions` — 🟡 PARTIAL

Same structure as §5.D.1 list, scoped to revision states (`revision_requested`, `ready_for_submission`). **Hero row:** tasks where all corrections are addressed and ready to resubmit.

---

## §5.H.2 Revision detail — `/contributor/tasks/revisions/[taskId]` — 🟡 ROUTE MISMATCH

Currently lives at `/contributor/tasks/[taskId]/revision/page.tsx` — spec wants `/contributor/tasks/revisions/[taskId]`. URL needs to move.

**Content:** same workroom shell PLUS:
- Mentor feedback expanded 3-block (What worked / Required corrections / Optional suggestions)
- Each correction is a row: checkbox "Addressed" + "Add resolution note"
- "Compare v1 ↔ working" link → §5.H.3 diff viewer

---

## §5.H.3 Diff viewer — ⛔ MISSING

Two-column compare (v1 vs working): Evidence list with `modified/replaced/added` markers; Notes side-by-side; "Criteria addressed: v1 4/6 → Working 6/6" footer.

---

## §5.H.4 Dispute modal — ⛔ MISSING

Conditional. Opens governance review. Textarea + optional evidence + Cancel/Open dispute. Writes to governance queue.

---

## §5.H.5 Resubmit confirmation — ⛔ MISSING

Same as §5.F.3 success but with round counter incremented.

---

## §5.I.1 Completed tasks list — `/contributor/tasks/completed` — 🟡 PARTIAL

**Wireframe header:** "Completed work · 14 tasks accepted · ₹42,800 earned"

**Columns:** Task / Project / Accepted / Payout / Cred (with credential link arrow).

**Footer:** Rows per page selector.

---

## §5.I.2 Completed detail (read-only) — `/contributor/tasks/completed/[taskId]` — ⛔ MISSING

Same workroom shell, read-only. Adds: mentor's "what worked" message, payout status (eligible/paid), credential issued link, "Add to portfolio" toggle.

---

## §5.I.3 Credential issued modal — ⛔ MISSING

`🏅 You earned a credential` / task name / issued date / verified by + buttons View / Share now / Later.

---

## §5.J.1 Submissions list — `/contributor/tasks/submissions` — ✅ BUILT (commit 2545e03)

Columns: Task / Reviewer / Submitted / SLA remaining / →.

---

## §5.J.2 Submission detail — `/contributor/tasks/submissions/[id]` — 🟡 PARTIAL

Read-only view of submitted packet — evidence, notes, criteria status at submit time, routing.

---

## §5.K.1 Profile view — `/contributor/profile` — 🟡 PARTIAL

**Wireframe:**
- Avatar + Name + Role/Level + Joined + Country/TZ + Edit button
- Skills (3) with Edit link
- Digital twin block: tasks completed / acceptance rate / first-try / on-time / reliability
- Recent contributions (5 rows)

**Cognitive load:** numbers are observations not targets. No leaderboard, no "X% better than peers."

---

## §5.K.2 Profile edit — 🟡 PARTIAL

Standard form: name, bio (one paragraph), avatar, location, timezone.

---

## §5.K.3 Skills page — `/contributor/profile/skills` — ⛔ MISSING (was deleted)

Skill add/remove + per-skill evidence attachment.

---

## §5.K.4 Skill detail with evidence — ⛔ MISSING

Per-skill: level / attached evidence / tasks completed using this skill / credentials earned.

---

## §5.K.5 Digital twin summary — `/contributor/profile/digital-twin` — 🟡 PARTIAL

**Wireframe sections:** SKILLS / ACTIVITY / RELIABILITY / AVAILABILITY + footer note "This summary updates as you complete tasks."

---

## §5.L.1 Earnings overview — `/contributor/earnings` — 🟡 PARTIAL

**Wireframe:**
- Withdrawable balance hero (large) + Withdraw button
- 3 KPI tiles: This wk / This mo / All time
- Pending list (one row per pending earning)
- Recent list (last 5 paid)

**Edge cases:**
- No payout method → "Set up payout to enable withdrawal"
- Balance < min withdrawal → "Minimum ₹500 to withdraw"
- Withdrawal pending → balance shows reserved amount

---

## §5.L.2 Earnings history — ⛔ MISSING

Paginated table: task / project / amount / status (pending/paid/reversed) / reference / date.

---

## §5.L.3 Payout method list — `/contributor/earnings/payout-method` — ⛔ MISSING

Card per method: bank info / verified date / country / currency / Verify again + Remove. + Add another method.

---

## §5.L.4 Add payout method — ⛔ MISSING

Country → method radio (Bank/UPI/Razorpay wallet) → account fields → "Penny verification" notice → Cancel + Verify and save.

**States:** form_default / verifying / verify_failed / verified.
**Edge:** mismatched account/IFSC → backend validates with specific error. Penny verification fails → 24h cooldown.
**Cross-portal:** Razorpay/bank API integration.

---

## §5.L.5 Withdraw — request — ⛔ MISSING

"Withdraw to {Method} ****1234" + Available + Amount input + Withdraw all + fee/total/ETA + Cancel + Confirm.

---

## §5.L.6 Withdraw — success — ⛔ MISSING

`✓ Withdrawal requested` + amount + ETA + Reference + Back link.

---

## §5.L.7 Export earnings — `/contributor/earnings/export` — ⛔ MISSING

Time range select + custom range / Format radio (CSV/PDF) / Include checkboxes (Paid / Pending / Reversed) / Cancel + Download.

---

## §5.M.1 Credentials wallet — `/contributor/credentials` — 🟡 PARTIAL

Grid of credential cards: skill / project / date / share button per card.

---

## §5.M.2 Credential detail — 🟡 PARTIAL

Per-credential: what it certifies / earning task / verifier / evidence link / share controls.

---

## §5.M.3 Share credential modal — ⛔ MISSING

Modal with public link + Copy + Email/LinkedIn/X buttons + Privacy line + Revoke link.

---

## §5.M.4 Public credential page — `/public/credentials/[shareId]` — 🟡 PARTIAL

Public read-only / branded / verified-by / evidence link.

---

## §5.N Settings — mostly ⛔

- §5.N.1 Settings index — top-level sections (Account / Notifications / Privacy / Language / Connected / Sessions). 🟡 partial.
- §5.N.2 Account settings — change email/password/MFA. ⛔
- §5.N.3 Notification preferences — channels grid (In-app/Email/SMS × Critical/Tasks/Reviewer/Payout/Marketing). Critical locked. ⛔
- §5.N.4 Privacy & consent — ToS/Privacy/AI guidance/Notifications/Surveys + Download my data + Request deletion. ⛔
- §5.N.5 Language & region — Language select + Date format + Time format + Currency. ⛔
- §5.N.6 Account deletion — confirm screen with consequences + "type DELETE" + 30-day grace. ⛔

---

## §5.O Support & safety — mostly ⛔

- §5.O.1 Support index — FAQ categories + Open ticket + Safety report + Grievance. 🟡 partial.
- §5.O.2 New ticket — category/subject/description/attachments. ⛔
- §5.O.3 Ticket detail — thread + status (open/in progress/waiting/resolved). ⛔
- §5.O.4 Safety report — type radio + textarea + when + who + anonymous checkbox + evidence. 24h SLA promised. Cross-portal: governance queue. ⛔
- §5.O.5 Grievance — similar to safety report; framed as process grievance. ⛔

---

## §5.P.1 Notifications — `/contributor/notifications` — 🟡 PARTIAL

**Wireframe:** chip row (All/Unread/Task/Reviewer/Payout) + list with dot indicator + Mark all read + click routes to context.

---

## §6 Shared component patterns

- **§6.1 Evidence drop zone** — drag-drop, multi-file, per-file progress, scan badges, replace/delete.
- **§6.2 Scan failed modal** — `⚠ File flagged` + reason + `Remove file`.
- **§6.3 Status chips** — same palette across portals; 18px tall, 1.5px h-padding, leading-none, font-weight 700, uppercase.
- **§6.4 Readiness bar** — 0–100 with three thresholds: <50 warning, 50–80 brand, ≥80 success. Animate only on initial mount.
- **§6.5 Version conflict modal** — "Someone else changed this task" / Refresh path / Save mine + refresh.
- **§6.6 Empty state** — centered illustration (calm, not playful), one-line headline + subtext + single CTA.
- **§6.7 Toast** — top-right, 4s auto-dismiss, max 3 stacked, only for completion events.
- **§6.8 Confirmation modal pattern** — verb-led title, one supporting sentence, destructive primary in error tone.

---

## §7 State machines — implementation guards

§7.1 task lifecycle: `assigned → accepted → in_progress ↔ blocked / awaiting_clarification → ready_for_submission → under_review → (revision_requested ↔ in_progress) → completed`.

§7.2 onboarding: register → email_verified → step_1..step_9 → onboarded. Partial onboarding can resume.

§7.3 payout: task_accepted → payout_eligible → payout_pending → payout_paid (or payout_failed → retry; payout_reversed → admin).

---

## §8 Cross-portal touchpoints (audit checklist for every screen)

| Event | Writes to |
|---|---|
| Submission | Mentor portal queue |
| Two-stage routing | Enterprise pipeline stage |
| Withdrawal | Mentor queue (remove submission) + audit |
| Q&A request | Mentor portal Q&A thread |
| Blocker | Mentor escalation queue |
| Safety report | Platform admin governance queue |
| Grievance | Platform admin governance queue |
| Credential share | Public web `/public/credentials/[shareId]` |
| Account deletion | Platform admin compliance queue |

Whenever the spec says "writes to X" for a screen, my implementation must include that side effect, not just the UI.

---

## Order of attack (proposed)

Going down the sidebar so the user can verify each in order:

1. **§5.D.2 Filter drawer** — add drawer over current list page
2. **§5.J.2 Submission detail** — read-only packet view
3. **§5.H.1 Revisions queue** — already exists; align to spec (re-use list pattern)
4. **§5.H.2 Revision detail** — move URL + add 3-block feedback + diff entry
5. **§5.I.1 Completed list** — header w/ earnings sum + columns Task/Project/Accepted/Payout/Cred
6. **§5.L.1 Earnings overview** — withdrawable balance hero + 3 KPIs + Pending + Recent
7. **§5.M.1 Credentials wallet** — grid + share
8. **§5.O.1 Support index** — FAQ list + Open ticket + Safety + Grievance
9. **§5.K.1 Profile** — avatar / skills / digital twin / recent contributions
10. **§5.N.1 Settings** — top-level index

Modals + missing routes folded in as each parent page lands.

---

## End — this is the file I read before I touch the next screen.
