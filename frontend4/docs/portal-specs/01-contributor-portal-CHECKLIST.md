# Contributor Portal — Phase 1 spec coverage checklist

Every Phase 1 item from `01-contributor-portal.md` and its current build status.

Legend:
- ✅ built and verified against spec
- 🟡 partial (route exists, but spec mismatch — needs work)
- ⛔ missing (no implementation, must build)
- ⏭️ Phase 2 / out of scope per `2.2 Phase 2 — deferred`
- 🔁 covered by another section (no separate route needed)

After each commit on a section, update the row + add the commit SHA in the Notes column. Don't mark ✅ unless screen-by-screen matches the spec wireframe.

---

## §3 Information architecture

| Item | Status | Notes |
|---|---|---|
| §3.1 Sidebar — Today / My work / My record / Support / account tail | ✅ | `54a32da`. Verified against wireframe. |
| §3.2 Route map — Phase 1 routes only; Phase 2 routes deleted | ✅ | `54a32da` (deleted /community, /learning, /messages, /progress, /skills, /ai/*) |

---

## §5.A Authentication

| Item | Status | Notes |
|---|---|---|
| §5.A.1 Landing / pre-auth handoff `/` | 🟡 | Audit needed |
| §5.A.2 Login `/auth/login` | 🟡 | Exists. Spec verify pending. |
| §5.A.3 Register `/auth/register` | 🟡 | Exists. Spec verify pending. |
| §5.A.4 Email OTP verification `/auth/verify-otp` | ⛔ | Route absent — `/auth/activate` may cover it. Audit needed. |
| §5.A.5 Forgot password `/auth/forgot-password` | 🟡 | Exists. Audit needed. |
| §5.A.6 Reset password `/auth/reset-password` | 🟡 | Exists. Audit needed. |
| §5.A.7 MFA setup `/auth/mfa/setup` | 🟡 | Route is `/auth/mfa-setup`. Verify spec match + URL convention. |
| §5.A.8 MFA challenge `/auth/mfa` | ⛔ | Route absent. |
| §5.A.9 SSO redirect interstitial `/auth/sso/[provider]` | ⛔ | We have `/auth/oauth/callback` — close but not identical. |
| §5.A.10 First-time SSO completion `/contributor/onboarding?sso=true` | 🟡 | Onboarding page exists. Verify SSO query param branch. |
| §5.A.11 Session expired modal (global pattern) | 🟡 | Need to verify implementation. |

---

## §5.B Onboarding

| Item | Status | Notes |
|---|---|---|
| §5.B.1 Onboarding shell `/contributor/onboarding` | 🟡 | Exists. Audit step structure. |
| §5.B.2 Step 1: Welcome + role | 🟡 |  |
| §5.B.3 Step 2: Identity verification | 🟡 |  |
| §5.B.4 Step 3: Skills self-declaration | 🟡 |  |
| §5.B.5 Step 4: Evidence attachments | 🟡 |  |
| §5.B.6 Step 5: Availability + timezone | 🟡 |  |
| §5.B.7 Step 6: Track-specific tailoring | 🟡 |  |
| §5.B.8 Step 7: Consent capture | 🟡 |  |
| §5.B.9 Step 8: Payout method (deferable) | 🟡 |  |
| §5.B.10 Step 9: Completion | 🟡 |  |
| §5.B.11 Onboarding incomplete — exit modal | ⛔ |  |

---

## §5.C Dashboard

| Item | Status | Notes |
|---|---|---|
| §5.C.1 Dashboard home `/contributor/dashboard` | ✅ | `f927a6c`. Header + Continue working + Lifecycle + Earnings 4-tile + Inbox + AI signals. |
| §5.C.2 Empty-but-ready state | ✅ | Same page, no-data branch. |
| §5.C.3.a Internal employee — no extra module | ✅ | Spec says no extra module. |
| §5.C.3.b Student — Supervision module | ⛔ | Persona-conditional; needs role detection from profile. |
| §5.C.3.c Women workforce — Check-in module | ⛔ | Persona-conditional. |
| §5.C.3.d External freelancer — no module | ✅ |  |
| §5.C.3.e Multi-track stacking | ⛔ | Depends on .b + .c. |

---

## §5.D Assigned work

| Item | Status | Notes |
|---|---|---|
| §5.D.1 Assigned list `/contributor/tasks` | ✅ | `38dd39a`. Filter row + Summary + chips + 6-col table + footer. |
| §5.D.2 Filter drawer (slide-in from right) | ✅ | `pending`. State multi-check, Project, Skill, Priority (P1 no-op), Due. URL-backed; ESC + click-outside close. Trigger in the inline filter row. |
| §5.D.3 Task row preview popover | ⛔ | **Building now.** |
| §5.D.4 Accept / Decline modal | ⛔ | **Building now.** |

---

## §5.E Workroom

| Item | Status | Notes |
|---|---|---|
| §5.E.1 Workroom overview `/contributor/tasks/[taskId]` | ✅ | `9890e16` + breadcrumb fix. Phase-1 schema gaps (mentor, structured 3-block feedback) handled with placeholders. |
| §5.E.2 Empty brief state | 🟡 | Conditional renders "No brief content yet" — verify CTA "Notify the reviewer". |
| §5.E.3 Q&A / clarification thread | ⛔ | No thread UI; submissions only. |
| §5.E.4 Request clarification modal | ⛔ |  |
| §5.E.5 Report blocker | ⛔ |  |
| §5.E.6 Scan failed modal | ⛔ |  |
| §5.E.7 Withdraw task modal | ⛔ |  |

---

## §5.F Submission

| Item | Status | Notes |
|---|---|---|
| §5.F.1 Submission screen `/contributor/tasks/[taskId]/submit` | 🟡 | Route exists. Need spec-match audit. |
| §5.F.2 Readiness warning modal | ⛔ |  |
| §5.F.3 In-flight + success `/contributor/tasks/[taskId]/submit/success` | 🟡 | Route exists. |
| §5.F.4 Submission error state | 🟡 |  |

---

## §5.G Under review

| Item | Status | Notes |
|---|---|---|
| §5.G.1 Workroom — under review pane | 🟡 | Workroom renders status badge but no dedicated pane. Audit needed. |
| §5.G.2 Withdraw submission modal | ✅ | `pending`. Endpoint + service + audit; modal inline on submission detail. |

---

## §5.H Revisions

| Item | Status | Notes |
|---|---|---|
| §5.H.1 Revisions queue `/contributor/tasks/revisions` | ✅ | Wave 3. Mock-driven. Summary band + table with hero-row sort for ready-to-resubmit. |
| §5.H.2 Revision detail `/contributor/tasks/revisions/[taskId]` | ✅ | Wave 3. URL moved to spec; 3-block feedback expandables, correction checkboxes + Add note. Sticky footer Save draft + Resubmit. |
| §5.H.3 Diff viewer | ✅ | Wave 3. Modal launched from 'Compare v1 ↔ working' — Evidence/Notes side-by-side + Criteria addressed footer. |
| §5.H.4 Dispute modal | ⛔ |  |
| §5.H.5 Resubmit confirmation | ⛔ |  |

---

## §5.I Acceptance + credentials (completed)

| Item | Status | Notes |
|---|---|---|
| §5.I.1 Completed tasks list `/contributor/tasks/completed` | ✅ | Wave 4. Header sums tasks + ₹ earned; cols Task/Project/Accepted/Payout/Cred/→. |
| §5.I.2 Completed detail `/contributor/tasks/completed/[taskId]` | ✅ | Wave 4. Read-only workroom with What worked block + Payout rail + Credential link + Add to portfolio. |
| §5.I.3 Credential issued modal | ✅ | Wave 4. Triggered by `?showCredential=1` query param. Later / View credential / Share now. |

---

## §5.J Submissions queue

| Item | Status | Notes |
|---|---|---|
| §5.J.1 Submissions list `/contributor/tasks/submissions` | ✅ | `pending`. Columns Task / Reviewer / Submitted / SLA remaining; sidebar entry, no breadcrumb. |
| §5.J.2 Submission detail `/contributor/tasks/submissions/[id]` | ✅ | `pending`. Read-only packet: Cover note / Evidence / Criteria / Routing. Status-conditional CTAs. §5.G.2 Withdraw modal + endpoint wired. |

---

## §5.K Profile / digital twin

| Item | Status | Notes |
|---|---|---|
| §5.K.1 Profile view `/contributor/profile` | ✅ | Wave 8. Identity header + Skills strip + Digital twin metric band + Recent contributions. Top-level — no breadcrumb. |
| §5.K.2 Profile edit `/contributor/profile/edit` | ✅ | Wave 8. Avatar + name + bio (one paragraph, 300 char) + country + timezone. |
| §5.K.3 Skills page `/contributor/profile/skills` | ✅ | Wave 8. Restored. Per-skill row with level + evidence count + tasks; add/remove inline. |
| §5.K.4 Skill detail with evidence `/contributor/profile/skills/[skillId]` | ✅ | Wave 8. Evidence list (upload + add link), Tasks using this skill, Credentials earned. |
| §5.K.5 Digital twin summary `/contributor/profile/digital-twin` | ✅ | Wave 8. Skills / Activity (30d) / Reliability / Availability per wireframe + observation-not-target footer. |

---

## §5.L Earnings & payouts

| Item | Status | Notes |
|---|---|---|
| §5.L.1 Earnings overview `/contributor/earnings` | ✅ | Wave 5. Withdrawable hero + 3 KPI tiles + Pending + Recent. Min-₹500 + no-method edges. |
| §5.L.2 Earnings history `/contributor/earnings/history` | ✅ | Wave 5. Paginated 6-col table with status-tone chips. |
| §5.L.3 Payout method list `/contributor/earnings/payout-method` | ✅ | Wave 5. Primary tag + Verify again + Remove + Add another. |
| §5.L.4 Add payout method `/contributor/earnings/payout-method/new` | ✅ | Wave 5. Country + method radio + bank/UPI fields + penny-verification notice. |
| §5.L.5 Withdraw — request `/contributor/earnings/withdraw` | ✅ | Wave 5. Amount input + Withdraw all + fee/total/ETA + To: method. |
| §5.L.6 Withdraw — success `/contributor/earnings/withdraw/success` | ✅ | Wave 5. Green check + amount + ETA + reference. |
| §5.L.7 Export earnings `/contributor/earnings/export` | ✅ | Wave 5. Time range + format radio + Include checkboxes + mock generate. |

---

## §5.M Credentials

| Item | Status | Notes |
|---|---|---|
| §5.M.1 Credentials wallet `/contributor/credentials` | ✅ | Wave 6. Mock-driven grid; skill pill + level + project + date + View/Share per card. No breadcrumb. |
| §5.M.2 Credential detail `/contributor/credentials/[credentialId]` | ✅ | Wave 6. Hero + What it certifies + Verifier rail + Share controls + 2-segment breadcrumb. |
| §5.M.3 Share credential modal | ✅ | Wave 6. Public link + Copy + Email/LinkedIn/Twitter + Revoke. Reused from wallet and detail. |
| §5.M.4 Public credential page `/public/credentials/[shareId]` | 🟡 | Pre-existing route; audit deferred. |

---

## §5.N Settings

| Item | Status | Notes |
|---|---|---|
| §5.N.1 Settings index `/contributor/settings` | ✅ | Wave 9. 6-row sectioned list (Account / Notifications / Privacy / Language / Connected / Sessions). No breadcrumb. |
| §5.N.2 Account settings `/contributor/settings/account` | ✅ | Wave 9. Email change with verification notice + Password change + MFA toggle. |
| §5.N.3 Notification preferences `/contributor/settings/notifications` | ✅ | Wave 9. Channel × event matrix; Critical row locked. |
| §5.N.4 Privacy & consent `/contributor/settings/privacy` | ✅ | Wave 9. ToS / Privacy / AI guidance / Task notifs / Surveys consent rows + Your data (Export + Request deletion). |
| §5.N.5 Language & region `/contributor/settings/language` | ✅ | Wave 9. Language + date format radio (3 options) + 24/12-hour + currency. |
| §5.N.6 Account deletion request `/contributor/settings/delete` | ✅ | Wave 9. Consequences list + retention notice + "Type DELETE" confirmation + 30-day notice. |

---

## §5.O Support & safety

| Item | Status | Notes |
|---|---|---|
| §5.O.1 Support index `/contributor/support` | ✅ | Wave 7. Browse FAQs (collapsible groups) + Can't find what you need + Concerned about safety with my-tickets and my-cases lists. No breadcrumb (top-level). |
| §5.O.2 New ticket `/contributor/support/tickets/new` | ✅ | Wave 7. Category / Subject / Description / Attachments. Auto-fills task context from `?taskId=`. |
| §5.O.3 Ticket detail `/contributor/support/tickets/[id]` | ✅ | Wave 7. Thread with status pill + per-message bubbles + reply box (hidden when resolved). |
| §5.O.4 Safety report `/contributor/support/safety-report` | ✅ | Wave 7. Type radio + tell us what happened + when + who else involved + Submit anonymously + evidence per wireframe. |
| §5.O.5 Grievance `/contributor/support/grievance` | ✅ | Wave 7. Process-grievance variant: Type radio (Unfair rejection / Payment dispute / Process / Other) + outcome sought + related reference. |

---

## §5.P Notifications

| Item | Status | Notes |
|---|---|---|
| §5.P.1 Notifications page `/contributor/notifications` | 🟡 | Route exists. Spec-match audit. |

---

## §6 Shared component patterns

| Item | Status | Notes |
|---|---|---|
| §6.1 Evidence drop zone | 🟡 |  |
| §6.2 Scan failed modal | ⛔ |  |
| §6.3 Status chips | ✅ | `ContributorStatusBadge` exists. |
| §6.4 Readiness bar | 🟡 | Used on /tasks list + workroom; verify spec usage. |
| §6.5 Version conflict modal | ⛔ |  |
| §6.6 Empty state | ✅ |  |
| §6.7 Toast | 🟡 | Need audit. |
| §6.8 Confirmation modal pattern | 🟡 | Need audit. |

---

## How to use this checklist

1. Before declaring a section done, screenshot the page against the spec wireframe, list divergences, fix all of them, re-screenshot.
2. Update the row to ✅ only after I show the user a screenshot and they confirm — or after my own checklist verification matches every wireframe element.
3. Reference the commit SHA so we can git blame later.
4. Anything I mark ⏭️ Phase 2 must cite the spec section that defers it. Don't unilaterally defer.
