# Manual QA Checklist

> Flows that cannot be automated in Playwright (frontend + Prisma scope).  
> Map each item to Phase 1 exit criteria in [`docs/portal-specs/06-phase-1-scope-lockdown.md`](../portal-specs/06-phase-1-scope-lockdown.md) §10.1.

## Auth and SSO

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-1 | Google OAuth login → correct portal landing | Auth | ☐ |
| M-2 | Microsoft Entra OAuth login → correct portal landing | Auth | ☐ |
| M-3 | MFA setup and challenge on sensitive routes | Security | ☐ |
| M-4 | Password reset email received and link works | Auth | ☐ |

## Enterprise SOW and approval

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-5 | Upload SOW PDF → parse metadata → validate fields | #3 | ☐ |
| M-6 | Complete 5-stage approval pipeline with audit trail | #4 | ☐ |
| M-7 | Decomposition: AI suggests tasks → PMO edits → sponsor approves | #5 | ☐ |
| M-8 | Two-stage review toggle visible and saved per task | #12 | ☐ |

## Contributor delivery

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-9 | Accept task → workroom → upload evidence → submit | #8–10 | ☐ |
| M-10 | File virus/plagiarism scan completes before review | #9 | ☐ |
| M-11 | Rework loop: v2 submission shows prior feedback | #10 | ☐ |
| M-12 | Contributor sees under_review status after submit | #10 | ☐ |

## Review routing (mentor vs reviewer)

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-13 | External contributor submit → **mentor queue first** | #10–11 | ☐ |
| M-14 | Two-stage ON: mentor accept → **enterprise reviewer queue** | #12 | ☐ |
| M-15 | Internal employee submit → **reviewer only** (no mentor) | Doc 09 | ☐ |
| M-16 | Two-stage OFF: mentor accept → no reviewer queue | #12 | ☐ |

## Payout and credentials

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-17 | Final acceptance → payout eligible → Razorpay withdraw | #13–14 | ☐ |
| M-18 | Credential issued and visible in contributor wallet | #13 | ☐ |

## Mentorship

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-19 | Contributor opt-in → mentor sees session (automated E2E covers) | #16 | ☐ |
| M-20 | Mentor marks session held → coaching note visible | #16 | ☐ |

## Accessibility and security

| # | Check | Criterion | Pass |
|---|--------|-----------|:----:|
| M-21 | WCAG 2.1 AA spot-check: login, contributor task, mentor queue, enterprise SOW, admin tenants | #25 | ☐ |
| M-22 | Pen test: no high+ unaddressed findings | #24 | ☐ |

## How to use

1. Run automated suite first: `cd frontend && npm run test:e2e`
2. Work through this checklist for blocked flows.
3. Record pass/fail in your release notes or pilot acceptance pack.

Automated coverage tags: `@ui-mock`, `@ui-real`, `@partial`, `@blocked` — see [`README.md`](README.md).
