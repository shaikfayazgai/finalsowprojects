# Contributor Portal — Implementation Plan (you approve, then I build)

You asked me to stop, re-read the doc, and explain everything cleanly. Here it is. **No code changes** until you sign off on this plan.

---

## 1. Where to find every screen in the doc

The spec is one file: `docs/portal-specs/01-contributor-portal.md` (2956 lines). The actual UI menu / screen list lives in **§3.1 (sidebar) + §3.2 (route map) + §5.A–§5.P (every screen)**.

There's no separate "Task" menu in the doc — what you may be remembering is the **Workroom** (§5.E), which is the per-task surface. That's not a sidebar entry; it's the screen you reach by clicking a row in **Assigned**.

### The full sidebar per spec §3.1

```
TODAY
  • Dashboard

MY WORK
  • Assigned        → /contributor/tasks
  • Submissions     → /contributor/tasks/submissions
  • Revisions       → /contributor/tasks/revisions
  • Completed       → /contributor/tasks/completed

MY RECORD
  • Earnings        → /contributor/earnings
  • Credentials     → /contributor/credentials

SUPPORT
  • Help            → /contributor/support

(account tail, no label)
  • Profile         → /contributor/profile
  • Settings        → /contributor/settings
```

Plus the **bell icon** in the topbar → `/contributor/notifications` (not in sidebar; it's a global pattern).

That's **10 sidebar entries + 1 topbar action** total.

### Per-screen depth (what each sidebar entry leads to)

| Sidebar entry | Screens within |
|---|---|
| Dashboard | Just one page, with persona-conditional modules slotted in |
| **Assigned** | List → click row → **Workroom (§5.E)** with 6 sub-flows (Q&A, blocker, withdraw, scan-failed) |
| **Submissions** | List → click row → submission detail (read-only) → withdraw modal |
| **Revisions** | List → click row → revision workroom (3-block feedback + diff viewer + resubmit) |
| **Completed** | List → click row → completed detail (read-only) + credential modal |
| Earnings | Overview → history / payout method / add method / withdraw flow / export |
| Credentials | Wallet grid → detail → share modal → public page (already at /public/credentials) |
| Help | Index → new ticket / ticket detail / safety report / grievance |
| Profile | View → edit / skills / skill detail / digital twin |
| Settings | Index → account / notifications / privacy / language / deletion |
| (Notifications) | One list page |

### The "Task" surface you mentioned — what it actually is

It's **§5.E Workroom**: `/contributor/tasks/[taskId]`. Single most-important screen in the portal. Not a sidebar item — you reach it by clicking a row in Assigned (or the dashboard hero).

It has **seven sub-flows** that are easy to forget:
1. §5.E.1 Main workroom (60/40 split, brief / criteria / feedback / notes / evidence)
2. §5.E.2 Empty brief state
3. §5.E.3 Q&A / clarification thread (inline replaces notes when open)
4. §5.E.4 Request clarification modal
5. §5.E.5 Report blocker modal
6. §5.E.6 Scan failed modal (shared §6.2)
7. §5.E.7 Withdraw task modal (different from §5.G.2 withdraw submission)

---

## 2. The four personas + their conditional modules

Spec §1.2 calls out **four** personas (not five — "AI agent" is Phase 2 per §1.2 note):

| # | Persona | Where they come from | Identity check | Dashboard module shown |
|---|---|---|---|---|
| 1 | **Internal employee** | HRIS sync or admin invite (SSO) | Inherited from corp IdP | **None** — just an org chip in the header (e.g. "Acme Corp · Design org") |
| 2 | **External freelancer** | Self-register or invite | Email + phone OTP + ID | **None** in Phase 1 (the dashboard shell is enough) |
| 3 | **Student** | University partner invite | Institutional verification | **Supervision module** — supervisor name + "approved your participation" + academic-credit progress bar + term-end date + Contact supervisor button |
| 4 | **Women workforce** | Self-register / partner program | Lightweight KYC + safety opt-ins | **Your support module** — peer-mentor card with next check-in + active preferences (short sessions, women reviewers) + safety/grievance shortcuts |

**Multi-track stacking:** a contributor can hold **up to 2 active tracks** (e.g. student + women workforce). Both modules render, student first.

**Where else persona matters:** identity-verification fields (§5.B.3), payout method defaults (§5.L.4), safety prominence (§5.O.4), profile fields shown (§5.K.1). Spec calls these out individually.

---

## 3. What's built today vs missing

Working from the latest checklist + my reads. Compressed view:

### ✅ Built and verified

- **Sidebar** matching §3.1 exactly (Today / My work / My record / Support / account tail)
- **Dashboard** §5.C.1 (header + Continue working + Lifecycle + Earnings + Inbox + AI signals) — generic shell, **no persona module yet**
- **Assigned list** §5.D.1 + **Filter drawer** §5.D.2 + **Row popover** §5.D.3 + **Accept/Decline modal** §5.D.4
- **Workroom main view** §5.E.1
- **Submissions list** §5.J.1 + **detail** §5.J.2 + **Withdraw modal** §5.G.2

### 🟡 Routes exist but need a strict-spec pass

- **Workroom states** (§5.E.2 empty brief CTA, under-review pane styling)
- **Submission screen** §5.F.1 (success at §5.F.3, error at §5.F.4)
- **Revisions queue** §5.H.1 (URL is wrong — route is `/contributor/tasks/[id]/revision`, spec wants `/contributor/tasks/revisions/[id]`)
- **Completed list** §5.I.1
- **Profile view** §5.K.1 (no persona-specific blocks yet)
- **Earnings overview** §5.L.1
- **Credentials wallet** §5.M.1
- **Settings index** §5.N.1
- **Support index** §5.O.1
- **Notifications** §5.P.1

### ⛔ Not built at all

| Item | Section | Why it matters |
|---|---|---|
| Persona modules on dashboard (Supervision / Your support) | §5.C.3 | Spec-required for student + women-workforce tracks |
| Workroom Q&A thread | §5.E.3 | Lifecycle state `awaiting_clarification` |
| Request clarification modal | §5.E.4 | |
| Report blocker modal | §5.E.5 | Sets task to `blocked` |
| Scan failed modal | §5.E.6 | Triggered by upload virus/plagiarism flag |
| Withdraw task modal | §5.E.7 | Pre-submit withdraw (different from §5.G.2) |
| Submission readiness warning | §5.F.2 | Unaddressed criteria modal |
| Submission success page (with "What happens next?") | §5.F.3 | |
| Submission error state | §5.F.4 | |
| Diff viewer (v1 ↔ working) | §5.H.3 | |
| Dispute modal | §5.H.4 | Phase-1 conditional |
| Resubmit confirmation | §5.H.5 | |
| Completed detail | §5.I.2 | Read-only workroom + payout/credential block |
| Credential issued modal | §5.I.3 | |
| Skills page + skill detail | §5.K.3 / §5.K.4 | Were deleted as orphans; spec says Phase 1 |
| Earnings history / Payout method list / Add method / Withdraw request / Withdraw success / Export | §5.L.2 – §5.L.7 | Whole earnings flow beyond overview |
| Share credential modal | §5.M.3 | |
| Settings: account / notification prefs / privacy / language / deletion | §5.N.2 – §5.N.6 | Each is a separate page |
| New ticket / ticket detail / safety report / grievance | §5.O.2 – §5.O.5 | |

That's **30+ missing screens / modals.**

---

## 4. Mock data strategy you proposed — agree

You said: *"use mock data for now, every status, every persona, integrate backend later."* I agree, and here's how:

### Per-page mock data file convention

Create `src/mocks/contributor/{page}.ts` that exports the data shape the page needs. Each page imports its mock file directly (no API call) until backend lands. Backend swap is then a one-line change per file.

### What we need to mock

I'll seed **all 4 personas × all 7 lifecycle states** so every status branch is renderable.

| Mock module | Covers |
|---|---|
| `personas.ts` | Active session — switch via env / query param `?persona=student` to render every variant |
| `tasks.ts` | One task per lifecycle state: matched / accepted / in_progress / blocked / awaiting_clarification / ready_to_submit / submitted / under_review / feedback_requested / accepted / rejected (11 mock tasks) |
| `submissions.ts` | Submissions for the tasks that have them, each with artifacts, decision rationale where applicable, every status |
| `payouts.ts` | One payout per status: pending / paid / reversed / withdrawn (with rail reference IDs) |
| `credentials.ts` | 3–4 credentials with share IDs |
| `notifications.ts` | One per kind: revision-requested / reviewer-replied / task-accepted / payout-sent / safety-update |
| `support.ts` | FAQ groups + 1 open ticket + 1 resolved ticket + 1 safety case |
| `profile.ts` | One per persona — internal/freelancer/student/women-workforce — so we can flip and see the page render |
| `digital-twin.ts` | Skills + activity + reliability + availability numbers |
| `mentor.ts` | Mentor names + avatars (for the workroom Reviewer card) |

### Persona toggle for dev

`?persona=internal|freelancer|student|women` on any page reads the persona from URL search params; the layout reads it to decide which dashboard module + profile shape to render. Defaults to `freelancer` if absent. Easy to demo all four.

---

## 5. Proposed build order (after you say go)

Sidebar order so you can verify each in turn:

1. **Wire persona modules onto dashboard** (§5.C.3 a/b/c/d) + persona toggle
2. **Revisions queue + detail** (§5.H.1/.2) — also fix the URL so it matches spec
3. **Completed list + detail + credential modal** (§5.I.1/.2/.3)
4. **Earnings whole flow** (§5.L.1 → .7) — overview, history, payout method, add method, withdraw request/success, export
5. **Credentials wallet + detail + share modal** (§5.M.1/.2/.3)
6. **Help → ticket new/detail, safety report, grievance** (§5.O.1–.5)
7. **Profile view + edit + skills + skill detail + digital twin** (§5.K.1–.5)
8. **Settings: account / notif prefs / privacy / language / deletion** (§5.N.1–.6)
9. **Workroom missing sub-flows** — Q&A, request clarification, report blocker, withdraw task, scan-failed (§5.E.3–.7)
10. **Submission flow** — readiness warning, success page with "what happens next", error state, diff viewer (§5.F.2/.3/.4 + §5.H.3)
11. **Notifications polish** — chip filters + mark-all-read + click-routes-to-context (§5.P.1)

Each step lands as **one PR / one commit** with screenshots, and I update the CHECKLIST.md to ✅ as we go.

---

## 6. What I need from you

1. **Confirm the build order above** (or reorder if you want Earnings before Revisions, etc.)
2. **Confirm mock-data approach** (no DB writes until UI is signed off)
3. **Confirm persona toggle scheme** (`?persona=...` URL param) — or you'd prefer a topbar switcher
4. **Any 'Task' detail I misread?** If you meant something other than the Workroom (§5.E), point me at it and I'll re-read

Once you reply, I'll start at step 1.
