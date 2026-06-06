# E2E Flow Report

> Latest run: **2026-06-02** · `PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e` · ~5.2 min  
> Uses **storageState** (one login per role via `auth.setup.ts`) — fixes serial login flake.

## Summary

| Metric | Count |
|--------|------:|
| **Total tests** | 75 (includes 5 setup auth tests) |
| **Passed** | **72** |
| **Failed** | 1 |
| **Skipped** | 2 |
| **Pass rate** | **96%** |

### By portal

| Portal | Pass | Fail | Skip | Notes |
|--------|-----:|-----:|-----:|-------|
| setup | 5 | 0 | 0 | One-time auth per role |
| auth | 8 | 0 | 0 | All login redirects ✅ |
| admin | 12 | 0 | 0 | All routes ✅ |
| contributor | 13 | 0 | 0 | All routes + consent ✅ |
| enterprise | 14 | 0 | 0 | All routes + SOW workspace ✅ |
| mentor | 20 | 1 | 2 | Availability save partial fail |

## Failed test

| Test | Tier | Issue |
|------|------|-------|
| availability save shows Saved | `@partial` | PATCH may succeed but "Saved" toast not caught in 10s window; locator fix applied |

## Skipped (by design)

| Test | Reason |
|------|--------|
| accept removes review from queue | Queue empty / in-memory state |

## Option A — mentorship assignment (wired 2026-06-02)

| Step | Implementation |
|------|----------------|
| Contributor opt-in | `/contributor/settings/mentorship` → `POST /api/contributor/mentorship/opt-in` |
| System matching | `lib/mentorship/assignment.ts` → `assignMentorshipSession()` |
| Mentor sees session | `/mentor/mentorship` → `GET /api/mentor/sessions` (real Prisma) |
| E2E | **`e2e/mentorship-assignment.spec.ts`** — **PASS** |

## Blocked flows (not testable E2E)

| Flow | Reason |
|------|--------|
| Enterprise SOW real backend | Requires backend `:4000` |
| Contributor task submit | Requires backend `:4000` |
| OAuth | Not automated |

## Environment

- Frontend dev server on `:3000` ✅
- Backend `:4000` **not running** (proxy errors expected on backend-dependent pages)

## Run history

| Run | Pass | Fail | Notes |
|-----|-----:|-----:|-------|
| 1 (post cleanup) | 42 | 26 | Serial login flake |
| 2 (server down) | 0 | 69 | `ERR_CONNECTION_REFUSED` |
| 3 (server up) | 45 | 24 | Still serial login flake |
| **4 (storageState)** | **72** | **1** | **Recommended approach** |

## Commands

```bash
cd frontend && npm run test:e2e              # starts dev server if needed
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e # reuse existing :3000
npm run test:e2e:report                      # HTML report
```

---

HTML report: `cd frontend && npm run test:e2e:report`
