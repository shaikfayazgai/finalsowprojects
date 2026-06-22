# GlimmoraTeam E2E Tests

Automated **Playwright** end-to-end tests for all portals. Tests are labeled by honesty tier:

| Tag | Meaning |
|-----|---------|
| `@ui-mock` | Page loads; data from mocks / Zustand / in-memory stores |
| `@ui-real` | Auth + session + some Prisma-backed APIs |
| `@partial` | UI works; persistence incomplete or runtime-only |
| `@blocked` | **Explicitly skipped** — flow not wired; documents the gap |

## Prerequisites

```bash
# From repo root — Postgres running, DATABASE_URL in frontend/.env.local
cd frontend && npm run db:generate && npm run db:migrate

# Seed users (also run automatically via e2e global-setup)
npx tsx scripts/ensure-admin.ts
npx tsx scripts/ensure-enterprise.ts
npx tsx scripts/ensure-reviewer.ts
npx tsx scripts/ensure-contributor.ts
npx tsx scripts/ensure-mentor.ts
npx tsx scripts/ensure-mentorship-flow.ts
```

## Run

```bash
cd frontend
npm run test:e2e              # full suite (starts dev server if not running)
npm run test:e2e:smoke        # route smoke + auth only
npm run test:e2e:flows        # golden paths, cross-portal, edge cases
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e   # reuse existing :3000
npm run test:e2e:report       # open HTML report
npm run test:e2e:flow-report  # regenerate docs/e2e/FLOW-REPORT.md
```

## Project layout

| Project | Specs | Auth storage |
|---------|-------|--------------|
| `setup` | `auth.setup.ts` | Creates `.auth/*.json` |
| `auth` | `auth.spec.ts` | Fresh login per test |
| `smoke-*` | `admin`, `contributor`, `enterprise`, `mentor`, `enterprise-reviewer-smoke`, `analytics`, `public` | Per portal |
| `flows` | `flows/*.spec.ts`, `mentorship-assignment.spec.ts`, `edge-cases.spec.ts` | Mixed / multi-context |

Route inventory: [`e2e/helpers/routes.ts`](../../frontend/e2e/helpers/routes.ts) (`SMOKE_ROUTES`).

## Seed users

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@glimmora.ai` | `admin1234` |
| Enterprise | `sandeep@acme.com` | `acme1234` |
| Enterprise reviewer | `karthik@acme.com` | `acme1234` |
| Contributor | `priya@glimmora.dev` | `contrib1234` |
| Mentor (lead) | `priya@glimmora.team` | `mentor1234` |
| Mentor (base) | `amelia@glimmora.team` | `mentor1234` |

## What is NOT claimed (frontend + Prisma scope)

- Enterprise SOW real backend (`:4000` proxy)
- Contributor task submit from workroom UI
- OAuth (Google/Microsoft)
- Payout / Razorpay withdraw
- Full two-stage routing until decomposition UI wired

See [`MANUAL-QA-CHECKLIST.md`](MANUAL-QA-CHECKLIST.md) for manual verification of blocked flows.

## Mentorship assignment (real E2E)

- Contributor opt-in: `/contributor/settings/mentorship`
- System assignment: `POST /api/contributor/mentorship/opt-in`
- Mentor UI: `/mentor/mentorship` → `GET /api/mentor/sessions`
- Spec: `e2e/mentorship-assignment.spec.ts` + `e2e/flows/review-routing.spec.ts`

After schema changes run `npx prisma generate` and restart the dev server.

See [`FLOW-REPORT.md`](FLOW-REPORT.md) after each run.
