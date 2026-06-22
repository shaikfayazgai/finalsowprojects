# Phase 1 Decisions Log

> **Status:** **LOCKED** — sign-off complete 2026-05-26
> **Authoritative for:** all execution decisions in Phase 1
> **Change protocol:** any change requires written change order from Sponsor + Product Lead + EM Platform

This document records the 20 decisions called out in `06-phase-1-scope-lockdown.md` §8. All decisions resolved before Phase 1 execution begins. Each entry includes the question, the decision, the rationale, and the source doc reference.

---

## Decisions

### 1. Tenant isolation enforcement
- **Decision:** Postgres RLS at DB level
- **Why:** Defense in depth — RLS catches missed `WHERE tenant_id` filters that the app layer would otherwise leak. Pilot scale tolerates the small perf cost; security posture worth it for enterprise customer trust.
- **Source:** doc 05 §3.5
- **Owner:** Security + EM Platform

### 2. Session length policy
- **Decision:** 30 days default; tenant policy can shorten to 8h minimum
- **Why:** Matches existing NextAuth config + good contributor UX. Enterprise tenants with stricter compliance can override per `tenant.session_policy`.
- **Source:** doc 05 §2.5
- **Owner:** Security

### 3. MFA enforcement matrix
- **Decision:** Glimmora staff (`plat.*`) MUST have MFA; enterprise tenants CAN require MFA per tenant policy; contributors strongly recommended at signup (not blocked).
- **Why:** Tiered risk. Internal Glimmora staff have privileged access — non-negotiable. Enterprise can self-select. Contributor friction kept low to avoid onboarding abandonment.
- **Source:** doc 05 §2.4
- **Owner:** Security

### 4. SOW approval pipeline stages
- **Decision:** 5 stages canonical: Business → Commercial → Legal → Security → Final
- **Why:** Matches existing implementation + handles regulated industry needs. Per-tenant + per-template, stages can be auto-approved or skipped via policy.
- **Source:** doc 02 §5.C.9
- **Owner:** Sponsor

### 5. Two-stage review default
- **Decision:** Off by default; PMO toggles per project at decomposition time
- **Why:** Single-stage (mentor accepts = final) is faster + lower operational overhead. PMO opts into two-stage for high-risk projects or where customer contract requires it.
- **Source:** doc 02 §5.D.3, doc 03 §2.3
- **Owner:** Sponsor + EM Enterprise

### 6. Mentor rework round cap
- **Decision:** 3 rounds default; configurable per work-type policy
- **Why:** Prevents perpetual revision loops. After v3, system forces hard accept/reject. Work-type policies (Software vs Marketing) can override (some tasks legitimately need more cycles).
- **Source:** doc 03 §11, doc 02 §5.K.8
- **Owner:** Sponsor

### 7. Anonymous safety report identity handling
- **Decision:** Identity redacted from T&S view; only Compliance + Legal can recover via signed audit query
- **Why:** Protects reporters (well-documented effect on reporting rates). Recoverability preserved for legal escalation. Recovery itself is audited — no quiet de-anonymization.
- **Source:** doc 04 §5.H.2, doc 05 §13
- **Owner:** Legal

### 8. KYC review SLA
- **Decision:** 8 business hours for manual review cases
- **Why:** Industry-standard. Allows T&S to handle in normal business hours. Same-business-day onboarding for most contributors.
- **Source:** doc 04 §5.I.1
- **Owner:** T&S Lead

### 9. Compliance console Phase 1 floor
- **Decision:** Consent inventory + retention rules + deletion request handling
- **Why:** Three minimum surfaces meet GDPR/DPDP baseline. Deeper compliance (ESG, PODL, evidence locker) deferred to Phase 2.
- **Source:** doc 02 §5.I
- **Owner:** Compliance

### 10. Analytics Phase 1 floor
- **Decision:** Workforce IQ (basic) + Economic (basic)
- **Why:** Workforce: skills inventory, gaps, throughput, acceptance rate. Economic: spend, cost per skill, cost per project. Sufficient for pilot value demo. Deeper reports + drilldowns + forecasts = Phase 2.
- **Source:** doc 02 §5.J
- **Owner:** Sponsor

### 11. Phase 1 architecture
- **Decision:** Monolithic Next.js + Postgres + selected sidecars (audit svc, AI orchestrator, notification svc, file scan svc)
- **Why:** Fastest to ship at pilot scale. Sidecars only where they add isolation/scaling value (audit append-only, AI external dependency, notification fanout, file scan compute). Microservices = Phase 2 when scale demands it.
- **Source:** doc 05 §1.3, §14.1
- **Owner:** EM Platform

### 12. Phase 1 payment rails
- **Decision:** Razorpay India (NEFT/UPI/wallet) + Wise (global basic)
- **Why:** Razorpay covers the largest pilot contributor cohort. Wise covers non-India contributors with one integration. Additional local rails per country = Phase 2.
- **Source:** doc 05 §7.5, doc 04 §5.L
- **Owner:** Finance + EM Platform

### 13. Localization Phase 1
- **Decision:** i18n framework only; English-only content ships
- **Why:** Every string is a translation key from day one. Adding languages later is a translation effort, not engineering. Pilots are English-language; broader rollout to Hindi/Tamil/Spanish = Phase 2.
- **Source:** doc 05 §11
- **Owner:** Product

### 14. Persona-conditional contributor dashboard
- **Decision:** Same shell + role-conditional modules in one slot
- **Why:** Industry-standard mental model. JTBD is identical across personas; only persona-specific affordances vary. Multi-track contributors (e.g., student + women workforce) see one module per track, stacked, capped at 2.
- **Source:** doc 01 §1.2.1, §5.C.3
- **Owner:** Product
- **Status:** ✅ DECIDED earlier in this conversation

### 15. Workroom menu page
- **Decision:** Removed
- **Why:** Was redundant with `/contributor/tasks` (Assigned). Sidebar "Today" section now contains Dashboard only. Removed route, deleted page, cleaned cross-links.
- **Source:** doc 01 §10, §3.1
- **Owner:** Product
- **Status:** ✅ DECIDED earlier in this conversation

### 16. Mentor self-metrics visibility
- **Decision:** Own numbers only; no peer comparison, no leaderboard
- **Why:** Prevents calibration anxiety + rubber-stamping incentives. Phase 2 may add anonymized peer-median benchmarks (governance-controlled), never public ranking.
- **Source:** doc 03 §11
- **Owner:** Product

### 17. Plagiarism scan behavior
- **Decision:** Warn contributor + flag for mentor review; tenant-overridable to block
- **Why:** Virus = always block. Plagiarism is fuzzier (false positives common); mentor needs context. Tenant policy can promote to "block" if their industry requires.
- **Source:** doc 05 §7.6
- **Owner:** Product + Security

### 18. API idempotency window
- **Decision:** 24 hours
- **Why:** Standard for payment and transactional APIs. Long enough for client retries, webhook redelivery, batch reconciliation. Manageable Redis storage at pilot scale.
- **Source:** doc 05 §9.1
- **Owner:** EM Platform

### 19. Audit retention floor
- **Decision:** 7 years; tenant configurable longer
- **Why:** Matches SOX, HIPAA-extended, and most regulatory minimums. Tenants in regulated industries (healthcare, finance) can extend. Indefinite available where needed.
- **Source:** doc 05 §4.3, doc 02 §5.I.3
- **Owner:** Compliance + Legal

### 20. External penetration test
- **Decision:** Engage provider in Week 1; test executes in Week 13 (parallel with WCAG audit + pilot execution)
- **Why:** Provider lead time is real; engaging early ensures Week 13 slot. Findings remediated before go-live (Day 90). Provider TBD — Security to select before Week 1 kickoff.
- **Source:** doc 06 §3, §9
- **Owner:** Security

---

## Post-lock addenda (2026-05-31)

> Internal-workforce product architecture — full spec in **`09-workforce-sourcing-and-review-routing.md`**.  
> Pending formal sign-off per change protocol at top of doc.

### 21. Workforce sourcing policy
- **Decision:** `workforceSourcing` at tenant / project / task: `internal_only` | `internal_first` | `external_only` | `open` (task wins)
- **Why:** Marketplace and employer delivery share one platform but must not share one undifferentiated matching pool. PMO finds HRIS employees in “My organization,” not by scrolling global ranks.
- **Source:** doc 09 §4, §21
- **Owner:** Product + EM Enterprise
- **Status:** ⏳ PROPOSED

### 22. Assignment UX — My organization
- **Decision:** Assign drawer + `/enterprise/workforce` directory; tabs **My organization** | **Glimmora network**; direct assign allowed (`task.assign.direct` audit)
- **Why:** Internal JTBD is direct allocation to known staff, not marketplace discovery.
- **Source:** doc 09 §4, §22, §6
- **Owner:** Product + EM Enterprise
- **Status:** ⏳ PROPOSED

### 23. Review routing by contributor track
- **Decision:** `reviewPath` on task: `mentor` (external default) | `internal` (internal default) | `mentor_then_internal` (opt-in) | `auto_accept` (Phase 2). Internal employees skip Glimmora mentor by default; `ent.reviewer` or manager accepts.
- **Why:** Employer owns staff quality; mentor is platform QA for external trust. Extends Decision #5 — two-stage only when mentor stage exists.
- **Source:** doc 09 §4, §23; doc 02 §5.D task editor
- **Owner:** Product + EM Contributor + EM Mentor
- **Status:** ⏳ PROPOSED

### 24. Internal vs external economics
- **Decision:** Accepted internal tasks accrue to cost center / payroll export — no Razorpay/Wise payout row. External tasks use existing payout rails (Decision #12).
- **Why:** Internal employees are paid by employer payroll, not Glimmora wallet.
- **Source:** doc 09 §4, §24; doc 01 §1.2 internal payout row
- **Owner:** Finance + EM Platform
- **Status:** ⏳ PROPOSED

---

## Pre-execution sign-off checklist

All decisions above are **locked**. Before Stage 1 (codebase audit) begins:

- ✅ All 20 decisions resolved (this document)
- ⬜ Sponsor sign-off (verbal in this conversation; formal sign-off pending)
- ⬜ External pen test provider selected (decision #20 — TBD)
- ⬜ Pilot customer #1 commitment locked (doc 06 §11 R-9)
- ⬜ Pilot customer #2 identified

The conversation-level approval of all 20 recommendations constitutes informal sign-off. Formal sign-off on `06-phase-1-scope-lockdown.md` is the next governance step.

---

## Document control

- **Created:** 2026-05-26
- **Locked:** 2026-05-26 (in this conversation)
- **Supersedes:** all prior "open decisions" sections in docs 01–05
- **Change protocol:** see top of doc
