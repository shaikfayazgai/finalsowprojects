# GlimmoraTeam E2E Tests

Automated **Playwright** end-to-end tests for all portals. Tests are labeled by honesty tier:

| Tag | Meaning |
|-----|---------|
| `@ui-mock` | Page loads; data from mocks / Zustand / in-memory stores |
| `@ui-real` | Auth + session + some Prisma-backed APIs |
| `@partial` | UI works; persistence incomplete or backend optional |
| `@blocked` | **Explicitly skipped** — flow not wired; documents the gap |

## Prerequisites

```bash
# From repo root
npm run ensure:admin -w frontend   # or: npx tsx frontend/scripts/ensure-admin.ts
npm run ensure:enterprise -w frontend
npm run ensure:contributor -w frontend
npx tsx frontend/scripts/ensure-mentor.ts

# Postgres migrated + .env.local DATABASE_URL set
cd frontend && npm run db:migrate
```

## Run

```bash
cd frontend
npm run test:e2e              # starts dev server if not running
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e   # reuse existing :3000
npm run test:e2e:report        # open HTML report
```

## What is NOT claimed

- **Enterprise SOW → backend** — UI mock path only unless `/api/sow` integration is enabled.
- **OAuth** — not automated (no CI secrets).

## Mentorship assignment (Option A — wired)

- Contributor opt-in: `/contributor/settings/mentorship`
- System assignment: `POST /api/contributor/mentorship/opt-in` → `assignMentorshipSession()`
- Mentor UI: `/mentor/mentorship` uses real `GET /api/mentor/sessions`
- E2E: `e2e/mentorship-assignment.spec.ts` (`--project=flows`)

After schema changes run `npx prisma generate` and restart the dev server.

See `docs/e2e/FLOW-REPORT.md` after each run for pass/fail/skip matrix.
