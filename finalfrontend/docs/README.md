# Documentation

Project documentation, organized by purpose.

## Quick links

| Doc | Description |
|-----|-------------|
| [`architecture/MONOREPO_ARCHITECTURE.md`](architecture/MONOREPO_ARCHITECTURE.md) | **Start here** — monorepo layout, request flow, migrated vs remaining APIs |
| [`guides/login-and-onboarding-user-flows.md`](guides/login-and-onboarding-user-flows.md) | Role-by-role login + onboarding (user-facing) |
| [`guides/auth-flow.md`](guides/auth-flow.md) | Technical IAM / auth reference |
| [`backend-handoff/`](backend-handoff/) | Subscription + tenant API specs |
| [`phase-2/README.md`](phase-2/README.md) | Backend extraction status |
| [`../backend/README.md`](../backend/README.md) | Migrated endpoint table + backend commands |
| [`../README.md`](../README.md) | Project quick start |
| [`../CLAUDE.md`](../CLAUDE.md) | Developer / AI conventions (repo root) |

## `architecture/`

System-level design, route maps, surface plans, wireframes.

- `MONOREPO_ARCHITECTURE.md` — frontend/backend split + proxy pattern (authoritative)
- `ENTERPRISE_PORTAL_V2_REORGANIZATION.md` — enterprise V2 IA + locked Profile/Settings scopes
- `ENTERPRISE_PORTAL_V2_MVP_SURFACE_PLAN.md` — MVP surfaces vs deferred
- `CONTRIBUTOR_PORTAL_V2_OPERATIONAL_ARCHITECTURE.md` — contributor portal architecture
- `RBAC_MATRIX_V1.md` — role × permission matrix
- `MENTOR_WORKSPACE_UX_EXECUTION_BLUEPRINT.md` — mentor execution plan
- `MENTOR_WORKSPACE_WIREFRAMES_AND_SCREEN_ARCHITECTURE.md` — mentor wireframes
- `MENTOR_PORTAL_DOCUMENTATION.html` — mentor docs (rendered HTML)
- `SYSTEM_ARCHITECTURE_AND_WORKFLOW.md` — cross-portal system view
- `FSD.md` — functional spec document

## `guides/`

How-to and flow documentation for developers and QA.

- `auth-flow.md` — technical auth + onboarding by role
- `login-and-onboarding-user-flows.md` — user-facing login/onboarding flows

## `audits/`

Findings from architecture, UX, and lifecycle audits.

- `AUDIT_CONTEXT.md` — context for current audit pass
- `ENTERPRISE_PORTAL_REORGANIZED_ARCHITECTURE_AUDIT.md` — enterprise portal compliance
- `ENTERPRISE_INTERACTION_AUDIT.md` — interaction-level findings
- `ENTERPRISE_MATRIX_AUDIT.md` — surface × dimension matrix
- `ENTERPRISE_UX_AUDIT.md` — UX findings
- `CONTRIBUTOR_PORTAL_V2_AUDIT_REPORT.md` — contributor portal audit
- `CONTRIBUTOR_PORTAL_AUDIT.md` — earlier contributor audit
- `CONTRIBUTOR_PORTAL_V2_LEGACY_CLEANUP_AUDIT.md` — dead-code cleanup
- `CONTRIBUTOR_PORTAL_V2_LIFECYCLE_VALIDATION.md` — end-to-end lifecycle validation
- `enterprise-dashboard-audit.md`, `sow-intake-step3-detail.md`, `sow-upload-state.md` — scratch audit notes
- `audit-account-menu.yml` — account menu audit checklist

## `backend-handoff/`

Backend integration specs for external services.

- `SUBSCRIPTION_PHASE1.md` — subscription phase 1 scope
- `SUBSCRIPTION_TENANT_API.md` — tenant/subscription API contract

## `portal-specs/`

Per-portal functional specifications and checklists.

- `00-README.md` — index
- `01-contributor-portal.md`, `02-enterprise-portal.md`, … — portal specs
- `09-workforce-sourcing-and-review-routing.md` — workforce + review routing

## `strategy/`

Product strategy and stakeholder materials.

- `PRODUCT_UNDERSTANDING.md` — high-level product framing
- `PRODUCTION_READINESS_ROADMAP.md` — production readiness
- `STAKEHOLDER_WALKTHROUGH_SCRIPT.md` — demo script
- Contributor and mentor strategy / CEO presentation docs

## `phase-1/`

Phase 1 closure artifacts and hardening passes.

- `PHASE_1_CLOSURE_CHECKLIST.md`, `PHASE_1_CLOSURE_REPORT.md`
- `PAYMENT_SAFETY_PASS_1.md`, `PERSISTENCE_PASS_1.md`, `SECURITY_HARDENING_PASS_1.md`
- `CONTRIBUTOR_PORTAL_V2_FINAL_HARDENING.md`

## `phase-2/`

Backend extraction (Hono service) notes and closure criteria.

- `README.md` — status, key files, remaining work

## Other repo folders

- `../samples/` — sample data (e.g. `ai-sow-sample-dataset.json`)
- `../ux-research/` — SOW deep analysis, competitive analysis, user flows
