# Phase 1 Release Readiness Runbook

## Purpose

This runbook defines the exact checks to run before promoting the Phase 1 flow to production.

Locked Phase 1 flow:

1. Sponsor submits SOW
2. Platform admin approves Commercial
3. Enterprise admin (non-owner) gives final sign-off
4. PMO decomposes approved SOW
5. Enterprise admin approves plan
6. Project is provisioned

## CI Run vs Staging Run

- CI run: Execute Playwright suite on a clean runner for deterministic signal.
- Staging run: Execute the same suite against deployed staging URL with production-like config and data.

Both are required for go-live.

## Prerequisites

- Staging frontend URL available (example: `https://staging.glimmorateam.ai`)
- Test accounts seeded and active:
  - `admin@glimmora.ai`
  - `sandeep@acme.com`
  - `anjali@acme.com`
  - `rahul@acme.com`
  - `karthik@acme.com`
  - `priya@glimmora.dev`
  - `priya@glimmora.team`
  - `amelia@glimmora.team`
- Browser automation allowed from CI runner/IP
- Disk space healthy on runner and local machine

## Commands

Run from `frontend/`.

### 1) Local/CI release regression

```bash
npm run test:e2e:release
```

### 2) Staging release regression

```bash
PLAYWRIGHT_BASE_URL="https://<staging-host>" npm run test:e2e:release:staging
```

### 3) Single critical flow (hotfix verification)

```bash
PLAYWRIGHT_BASE_URL="https://<staging-host>" PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test e2e/flows/sow-two-gate-approval.spec.ts --reporter=list
```

## GitHub Actions Automation

Workflow file:

- `.github/workflows/release-regression.yml`

How to run:

1. Open Actions → **Release Regression**
2. Click **Run workflow**
3. Choose `run_target`:
   - `ci` for clean-runner release regression
   - `staging` for deployed staging verification
4. If `staging`, provide `staging_base_url`

Artifacts produced:

- Playwright HTML report
- JSON test results
- App log (on CI failure)

## Required Pass Criteria

All items below must pass:

- `e2e/flows/sow-two-gate-approval.spec.ts`
- `e2e/flows/enterprise-four-roles-smoke.spec.ts`
- `e2e/flows/enterprise-stakeholder-rbac.spec.ts`
- `e2e/admin.spec.ts`
- `e2e/contributor.spec.ts`
- `e2e/mentor.spec.ts`
- `e2e/enterprise-reviewer-smoke.spec.ts`

No critical RBAC bypass, auth failures, or blocking 5xx errors.

## Manual Spot-Checks on Staging

Do these after automated suite:

1. PMO direct URL guard
   - Login as PMO (`rahul@acme.com`)
   - Open `/enterprise/sow/intake`
   - Expected: redirected away (cannot stay on intake page)

2. Mentor least-privilege gate
   - Login as base mentor (`amelia@glimmora.team`)
   - Open `/mentor/dashboard`
   - Expected: Escalation nav hidden

3. Sponsor four-eyes rule
   - Login as sponsor (`sandeep@acme.com`)
   - Open own SOW approval page
   - Expected: no final approve action for own SOW

## Sign-Off Template

Use this exact template in release ticket:

```txt
Phase 1 Release Candidate: <build/version>
Date: <YYYY-MM-DD>
Environment: <staging URL>

Automated Suite:
- test:e2e:release:staging => <passed/failed>, <x>/<y> tests

Critical Flows:
- SOW two-gate flow: <pass/fail>
- RBAC stakeholder flow: <pass/fail>
- Four role smoke: <pass/fail>

Manual Spot Checks:
- PMO intake direct URL blocked: <pass/fail>
- Mentor escalation hidden for base mentor: <pass/fail>
- Sponsor cannot final-approve own SOW: <pass/fail>

Decision:
- Go / No-Go
- Notes:
```

## Known Non-Blocking Warning

- Prisma `P3009` may appear in local setup logs if a local migration failed previously.
- Current E2E global setup continues with seed scripts.
- Resolve migration history in DB maintenance track; do not ignore for long-term environment health.
