# GlimmoraTeam — LIVE Test Manual (Vercel)

Step-by-step manual testing on the **live deployment**. Every test says **where to
click**, **what to do**, and **what you should see**. Email-notification steps are
excluded (email isn't delivered on the cloud backend); OTPs/passwords are obtained
another way where noted.

- **App URL:** https://gtproject-red.vercel.app
- **Backend health:** https://gtproject-60jh.onrender.com/healthz

---

## ⚠️ READ FIRST — 5 RULES

1. **Cold start.** The first action after the site has been idle is slow (~15s) —
   the backend (Render free tier) is waking up. If login shows "wrong password"
   or hangs on "Working…", **wait ~15s and click again.** Not a real error.
   (The login now shows a "server waking up" message in this case.)
2. **One role per browser.** Logging in as a second role ends the first session.
   To test two roles at once, use a **second browser** or an **Incognito window**.
3. **Switch roles:** go to `https://gtproject-red.vercel.app/api/auth/signout` →
   click **Sign out** → open the next role's login page.
4. **Where data lives (why some things reflect and some don't):**
   - **Backend (shows in every browser):** logins, women-KYC approval, provisioned
     accounts, password resets.
   - **Browser-local + step-gated:** SOW, projects, tasks, settings. These appear
     for the *next* role **only after the workflow advances them**, and stay in the
     **same browser**. Example: a new SOW reaches the Super Admin's Commercial gate
     **only after** Enterprise approves the Finance stage.
5. **Payments are simulated** (no real money) — by design.

---

## PART A — LOGIN ACCOUNTS

### A.1 Seeded accounts — password `glimmora123`
| Role | Login URL | Email |
|---|---|---|
| Super Admin | /admin/login | superadmin@glimmora.dev |
| Enterprise | /enterprise/login | enterprise@glimmora.dev |
| Contributor | /contributor/login | contributor@glimmora.dev |
| Mentor | /mentor/login | mentor@glimmora.dev |
| Reviewer | /reviewer/login | reviewer@glimmora.dev |

### A.2 Provisioned accounts (your 5 emails)
| Role | Login URL | Email | Password |
|---|---|---|---|
| Enterprise | /enterprise/login | iotcourseiot@gmail.com | `Iot@Course2026` |
| Freelancer | /contributor/login | mychatgptcourse@gmail.com | `Freelance@2026` |
| Women | /contributor/login | mdeepika0998@gmail.com | `VLP290LTJgE&` *(temp → reset on 1st login)* |
| Mentor | /mentor/login | solutions0678@gmail.com | `TbGoxIAdaWC&` *(temp → reset on 1st login)* |
| Reviewer | /reviewer/login | rnageshwari345@gmail.com | `Review@2026` |

> Full login URL = the app URL + the path, e.g.
> `https://gtproject-red.vercel.app/enterprise/login`

### Test A1 — Each login works
For each account: open the URL → type email + password → click **Continue**.
**Expect:** lands on that role's dashboard. A role can't open another role's pages
(e.g. Contributor opening `/admin/...` is bounced).

### Test A2 — Forced password reset (temp-password accounts)
Log in with a temp password (Women or Mentor above).
**Expect:** redirects to **"Set your password"** (`/auth/change-password`). Enter the
temp password as **Current**, set a **New password** + confirm → **Save password** →
routed onward (onboarding or dashboard). You won't be asked to reset again.

### Test A3 — Forgot password (OTP, on-screen dev code)
1. On any login page click **Forgot password?** → `/auth/forgot-password`.
2. Enter an email → **Send code** → the page **shows a dev OTP code** (email is off,
   so the code is displayed instead of emailed).
3. Enter the code + a new password → submit.
**Expect:** "Password reset" success; you can log in with the new password.

---

## PART B — MAIN FLOW: SOW → DELIVERY → PAYMENT

**The most important test. Spans 4 roles. Do the steps in order.**
"Switch to X" = sign out, log in as X (or use a separate browser per role).

### B1 — Enterprise: create a SOW
1. Log in **Enterprise** (`enterprise@glimmora.dev`).
2. Sidebar → **SOW Workspace** → **New SOW** (top right) → `/enterprise/sow/intake`.
3. Drag a PDF/DOC onto the box, or click **choose one** (any PDF works).
4. Pick a **Confidentiality** option (Internal / Confidential / Restricted),
   optional project tag.
5. Click **Upload + extract**.
   **Expect:** processes briefly → jumps to the **Submit** step showing
   **"Your SOW will go through these 5 stages"** = Finance, Commercial, Legal,
   Security, Final sign-off.
6. Click **Submit for approval**.
   **Expect:** "Submitted for approval" with an id like `sow-xxxx`.
7. Sidebar → **SOW Workspace** → the SOW is listed at stage **Finance**.

### B2 — Enterprise: approve the Finance stage
1. Open the SOW → **Sign off Finance** (or **Approve**).
2. Choose **Approve** → **Approve stage**.
   **Expect:** Finance = **Approved**; next stage **Commercial** (handled by
   Glimmora). The SOW now appears in the Super Admin's Commercial queue.

### B3 — Super Admin: Commercial approval + assign Mentor
1. **Switch to Super Admin.**
2. Sidebar → **Commercial gate** (`/admin/sow`) → open the SOW
   (shows "Finance ✓ · Stage 2/5").
3. Click **Approve Commercial**. In the dialog:
   - Tick the **3 checklist** boxes.
   - **Assign mentor** — pick a mentor from the dropdown (required).
   - Type a comment (min ~10 characters).
   - Click **Approve Commercial**.
   **Expect:** success; Commercial = approved; records
   "Mentor assigned by Glimmora: …".

### B4 — Enterprise: approve Legal → Security → Final
1. **Switch to Enterprise.** Open the SOW → approve **Legal**, then reopen and
   approve **Security**, then **Final sign-off**.
   **Expect:** after Final, SOW status = **Active**; all 5 stages show done.

### B5 — Enterprise: decompose the SOW into a project
1. Sidebar → **Decomposition** (`/enterprise/decomposition`).
2. Under **Awaiting decomposition**, find the SOW → **Decompose**.
   **Expect:** a plan is created (e.g. "3 milestones · 5 tasks").
3. Open the plan → **Submit for approval** → **Approve plan**.
   **Expect:** a **delivery project** is provisioned (`/enterprise/projects/...`);
   tasks are published as **Unassigned**.

### B6 — Enterprise: check task pricing (margin model)
1. Open the project → **Delivery** tab → click a task.
2. In the **Pricing** section: click **Use AI price**, OR type a number in
   **Manual base** → **Set manual price**.
   **Expect:**
   - **Enterprise invoice** = deal price **+ 18% GST**
   - **Glimmora internal** = actual cost **+ profit %**
   - **Contributor payout** = cheaper amount **− 18% GST** (net)

### B7 — Contributor: express interest
1. **Switch to Contributor.** Sidebar → **Opportunities**
   (`/contributor/opportunities`).
   **Expect:** published tasks shown **price-first**, with technologies, deadline,
   hours.
2. Click **I'm interested** on a task.
   **Expect:** button changes to **"Interest expressed"**.

### B8 — Enterprise: select contributor + assign reviewer
1. **Switch to Enterprise.** Open the same task detail page.
   **Expect:** an **Interested contributors** list showing the contributor who
   clicked interest.
2. Click **Select** next to the contributor.
   **Expect:** task becomes **Assigned**; an **Assign reviewer** dropdown appears.
3. Pick a reviewer → **Assign reviewer**.
   **Expect:** "Reviewer: … (assigned by Enterprise)".

### B9 — Contributor: submit work
1. **Switch to Contributor.** Sidebar → **Delivery** (`/contributor/delivery`).
   **Expect:** the assigned task shows "Assigned — submit your work".
2. Type a work summary + an artifact link → **Submit work**.
   **Expect:** status "Submitted — awaiting mentor"; **Version history (1)** = v1.

### B10 — Mentor gate (with revision loop)
1. **Switch to Mentor.** Sidebar → **Deliverables** (`/mentor/delivery-reviews`).
2. Open the submission → type a comment → **Request changes**.
   **Expect:** it leaves the queue.
3. **Switch to Contributor** → **Delivery** → task shows "Mentor requested changes"
   + the comment → type a new note → **Resubmit work** (saves **v2**).
4. **Switch to Mentor** → **Deliverables** → open → **Approve**.
   **Expect:** both v1 and v2 kept in history; status → "Mentor approved".

### B11 — Reviewer gate (final acceptance)
1. **Switch to Reviewer.** Sidebar → **Acceptance**
   (`/enterprise/reviewer/delivery`).
2. Open the mentor-approved task → **Accept** (or "Send back" to test rejection).
   **Expect:** status → "Accepted"; the milestone becomes payable.

### B12 — Enterprise: pay the milestone
1. **Switch to Enterprise.** Open the project → **Delivery** tab.
2. On the milestone: **Accept milestone** → **Pay milestone**.
   **Expect:** milestone → **Paid**; contributor payout recorded in
   Billing → Payouts.

✅ **If B1–B12 all pass, the entire Phase-1 core works.**

---

## PART C — WOMEN KYC FLOW (real backend, shows across browsers)

> **OTP note:** the email OTP step **shows the code on-screen** (dev fallback,
> because email is off). Use the displayed code.

### C1 — Women self-signup
1. Open `/auth/register?track=women` (or the register page → Women track).
2. Fill the details → at the **email OTP** step, the page **shows a dev code** →
   enter it → submit.
   **Expect:** "Application under review" — account created as **pending**.

### C2 — Login while pending = blocked
1. `/contributor/login`, log in with the women account (or use the pre-made
   `mdeepika0998@gmail.com`).
   **Expect:** an **"Application under review"** screen only — no dashboard.

### C3 — Super Admin approves the KYC
1. **Switch to Super Admin** → **KYC Reviews** (`/admin/kyc`).
   **Expect:** the woman appears in the **pending** queue (REAL backend data).
2. Open her case → **Decision** tab → **Approve** → record decision.
   **Expect:** approved.

### C4 — Login after approval = unlocked
1. Log in again as the women account.
   **Expect:** no more "under review"; she proceeds to onboarding/dashboard.

---

## PART D — DASHBOARDS, SEARCH & SUB-PAGES (open + confirm render)

### D1 — Dashboards (one per role)
Open after logging in as each: `/admin/dashboard`, `/enterprise/dashboard`,
`/contributor/dashboard`, `/mentor/dashboard`, `/enterprise/reviewer`.
**Expect:** each renders with no error; KPI cards / counts / recent activity.

### D2 — Search / command palette (Ctrl+K or ⌘K)
1. Click **"Search or ask AI"** in the top bar (or press Ctrl+K).
2. Type a few letters.
   **Expect:** a command palette opens — Go-to navigation, Quick actions, and
   AI-assist options; typing filters; Enter navigates.

### D3 — Enterprise sub-areas
- Billing `/enterprise/billing` (→ invoices, payouts, rate-cards)
- Workforce `/enterprise/workforce`
- Analytics `/enterprise/analytics` (→ economic, workforce)
- Audit `/enterprise/audit` · Compliance `/enterprise/compliance`
- Settings `/enterprise/settings` (→ tenant, security, policies, plan, integrations)
**Expect:** all render with data.

### D4 — Admin sub-areas
- Mentors `/admin/mentors` (+ pools, new) · Skill taxonomy `/admin/skill-taxonomy`
- Rubrics `/admin/rubric-templates` · Email templates `/admin/email-templates`
- Governance `/admin/governance` · Audit `/admin/audit`
- Payment rails `/admin/payment-rails` · System health `/admin/system-health`
- Partnerships `/admin/partnerships/universities`,
  `/admin/partnerships/women-workforce`
**Expect:** each renders.

### D5 — Mentor / Reviewer sub-areas
- Mentor: `/mentor/queue`, `/mentor/history`, `/mentor/mentorship`, `/mentor/settings`
- Reviewer: `/enterprise/reviewer/queue`, `/enterprise/reviewer/history`,
  `/enterprise/reviewer/metrics`
**Expect:** each renders (queues may show seeded review items).

---

## PART E — SETTINGS (what persists vs. what doesn't)

### E1 — Contributor settings (PERSIST after reload) ✅
*(Requires a KYC-approved contributor — approve one via Part C first if needed.)*
1. **Language:** `/contributor/settings/language` → change Currency + Date format →
   **Save** → reload. **Expect:** choices stay selected.
2. **Notifications:** `/contributor/settings/notifications` → toggle channels →
   **Save** → reload. **Expect:** toggles stay.
3. **MFA:** `/contributor/settings/account` → Set up / Turn off MFA → reload.
   **Expect:** state persists.

### E2 — Mentor notifications (PERSIST after reload) ✅
`/mentor/settings/notifications` → toggle a channel (e.g. SLA approaching · SMS) →
**Save preferences** → reload.
**Expect:** the toggle stays (persisted browser-locally).

### E3 — Enterprise Policies thresholds (PERSIST after reload) ✅
`/enterprise/settings/policies` → change "Min AI confidence %" and/or "Audit
retention" → **Save thresholds** → reload.
**Expect:** the values stay.

> Note: settings persist **browser-locally** (per browser). Full server-side
> persistence is a Phase-2 backend task.

---

## PART F — WHAT'S INTENTIONALLY A PLACEHOLDER (don't report as a bug)

- **AI document extraction** on SOW upload uses default values (no real AI yet) —
  the full workflow is built and ready for the AI/ML phase.
- **AI price** = actual cost × a fixed factor (placeholder for real AI pricing).
- **Payments** are simulated (no real gateway).
- **Email** is not delivered on the cloud backend (no SMTP) — OTPs are shown
  on-screen; provisioned-account passwords are given directly.
- **Analytics** is labeled "mock-backed until API ships".
- Some deep admin integrations (SSO test-login, ERP, webhooks) are display stubs.

---

## PART G — KNOWN ISSUES / NOTES

- **Cold-start login:** first login after idle may be slow or show a "server waking
  up" message — wait ~15s and retry.
- **Cross-session SOW state:** SOW/project/task data is per-browser; to carry a SOW
  across roles, use the **same browser** and advance the workflow (or expect the
  next role's queue to populate only after the prior gate is approved).
- **Settings persist per browser**, not yet on the server.

---

## PART H — TEST CHECKLIST (tick as you go)

- [ ] A1 — all logins work
- [ ] A2 — temp-password accounts force a reset
- [ ] A3 — forgot-password OTP (on-screen code) works
- [ ] B1 — SOW create → submit
- [ ] B2 — Finance approve
- [ ] B3 — Super Admin Commercial approve + mentor assign
- [ ] B4 — Legal / Security / Final → Active
- [ ] B5 — Decompose → project provisioned
- [ ] B6 — Pricing (AI + Manual) shows GST + margin correctly
- [ ] B7 — Contributor "I'm interested"
- [ ] B8 — Enterprise select + assign reviewer
- [ ] B9 — Contributor submit work (v1)
- [ ] B10 — Mentor request changes → resubmit v2 → approve
- [ ] B11 — Reviewer accept
- [ ] B12 — Accept + Pay milestone
- [ ] C1–C4 — Women signup → pending → admin approve → unlocked
- [ ] D1 — all dashboards render
- [ ] D2 — search / command palette works
- [ ] D3–D5 — Enterprise / Admin / Mentor / Reviewer sub-pages render
- [ ] E1–E3 — settings persist after reload
- [ ] I1–I6 — backend API endpoints respond (Part I)

---

## PART I — BACKEND API TESTS (direct, via curl)

The backend is one gateway that fronts 9 FastAPI services. Base URL:

```
https://gtproject-60jh.onrender.com
```

> **Cold start:** the very first call after idle may return `000`/timeout — just
> run it again; it returns 200 once the service is awake.
> Run these in **PowerShell** (curl.exe) or Git-Bash. PowerShell users: use
> `curl.exe` (not the `curl` alias) for these flags to work.

### I1 — Health check (no auth)
```bash
curl https://gtproject-60jh.onrender.com/healthz
```
**Expect:** `{"ok":true,"gateway":"unified"}`  (HTTP 200)

### I2 — Login → get an access token (no auth)
```bash
curl -X POST https://gtproject-60jh.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@glimmora.dev","password":"glimmora123"}'
```
**Expect:** HTTP 200 with JSON containing `access_token`, `refresh_token`,
`token_type:"bearer"`, and a `user` object (id, email, role, approvalStatus).
Copy the `access_token` value — call it `TOKEN` for the calls below.

Other roles work the same (all seeded password `glimmora123`):
`enterprise@glimmora.dev`, `contributor@glimmora.dev`, `mentor@glimmora.dev`,
`reviewer@glimmora.dev`.

### I3 — Wrong password is rejected (no auth)
```bash
curl -i -X POST https://gtproject-60jh.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@glimmora.dev","password":"wrong"}'
```
**Expect:** HTTP 401 (invalid credentials).

### I4 — Super Admin: list KYC queue (auth required)
```bash
curl https://gtproject-60jh.onrender.com/api/superadmin/kyc \
  -H "Authorization: Bearer TOKEN"
```
**Expect:** HTTP 200 with the KYC review queue (pending women/contributor cases).
Without the header → 401.

### I5 — Super Admin: provision a user (auth required, POST)
Creates an account with a random temp password and **must-change-password** set.
Email is off on the cloud backend, so the response **returns the temp password**.
```bash
curl -X POST https://gtproject-60jh.onrender.com/api/superadmin/users \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","role":"reviewer","name":"New User","sendCredentials":true}'
```
**Expect:** HTTP 201; JSON with `role`, `mustChangePassword:true`,
`emailSent:false`, and a `tempPassword` you can use to log in.
Roles accepted: `freelancer`, `women`, `contributor`, `mentor`, `reviewer`,
`enterprise`.
Note: `GET /api/superadmin/users` returns **405** (this endpoint is POST-only).

### I6 — Auth is enforced (negative test)
```bash
curl -i https://gtproject-60jh.onrender.com/api/superadmin/kyc
```
**Expect:** HTTP 401 — protected endpoints require the Bearer token.

### Endpoint reference (via the gateway)
| Prefix | Service | Example |
|---|---|---|
| `/api/v1/auth` | auth | `/api/v1/auth/login` |
| `/api/v1/auth/oauth`, `/api/v1/auth/contributor` | contributor | contributor auth/OAuth |
| `/api/contributor`, `/api/public/credentials` | contributor | contributor data |
| `/api/superadmin`, `/api/admin`, `/api/v1/users` | superadmin | users, KYC, settings |
| `/api/v1/reviewer`, `/api/v1/users/reviewers` | superadmin | reviewer admin |
| `/api/v1/sow`, `/api/v1/sows`, `/api/v1/approvals` | enterprise | SOW + approvals |
| `/api/v1/wizards`, `/api/v1/enterprise`, `/api/v1/portfolio` | enterprise | decomposition/portfolio |
| `/api/v1/projects`, `/api/v1/billing`, `/api/v1/review` | enterprise | projects/billing/review |
| `/api/universities` | universities | university partnerships |
| `/api/women` | women | women workforce |
| `/api/mentor` | mentor | mentor reviews |
| `/api/email` | email | email service (no SMTP on cloud) |
| `/api/files`, `/api/file` | file | uploads (ephemeral disk on cloud) |

> Tip: explore live docs at `https://gtproject-60jh.onrender.com/docs` if FastAPI
> Swagger is enabled for a service (per-service OpenAPI).
