# Portal Specs — Phase 1 Rebuild Reference

> **Status:** Draft v1.0
> **Last updated:** 2026-05-26
> **Supersedes:** all prior docs in `docs/architecture/`, `docs/audits/`, `docs/strategy/`, `docs/phase-1/` for purposes of Phase 1 build-out

This directory is the **source of truth** for what we build in Phase 1 of the GlimmoraTeam™ Global Workforce Intelligence Platform, per the SOW v1.1.

---

## Read order

1. **`06-phase-1-scope-lockdown.md`** — read this first. It's the 90-day execution plan and the contract.
2. **`01-contributor-portal.md`** — Contributor portal spec (~80 screens)
3. **`02-enterprise-portal.md`** — Enterprise portal spec (~60 screens) — includes reviewer sub-portal
4. **`03-mentor-portal.md`** — Mentor & reviewer workspace
5. **`04-platform-admin-portal.md`** — Glimmora-side internal admin
6. **`05-cross-functional.md`** — Auth, RBAC, audit, AI, notifications, integrations, security, accessibility, i18n, observability

---

## How these docs are used

| Audience | Read |
|---|---|
| **Sponsor / Leadership** | 06 (Phase 1 plan), per-portal §1 (purpose), §2 (scope), §10/§14 (exit criteria) |
| **PM** | 06 entirely + every portal's §2, §10, §11/§16 (open decisions) |
| **Engineering Lead** | 06 §4–7 (workstreams) + the portal(s) you own |
| **Engineer** | The screen specs (§5 of each portal doc); patterns (§6); state machines (§7); cross-portal (§8); data model (§9) of your portal + cross-functional doc 05 |
| **Designer** | Portal §3 (IA) + §5 (wireframes) + §6 (patterns); §10 (accessibility) in doc 05 |
| **QA** | Each portal's §2.3 (exit criteria) + §5 (states + edge cases per screen); 06 §10 (integrated exit criteria) |
| **Security** | 05 (cross-functional) entirely; 06 §9 (security gates) |

---

## What's in scope (Phase 1)

134 commitments across the six docs:

| Doc | Phase 1 capabilities |
|---|---|
| Contributor | 29 |
| Enterprise | 38 |
| Mentor | 30 |
| Platform Admin | 18 |
| Cross-functional | 19 |

Out-of-scope items are explicitly listed in each portal's §2.2 and in 06 §12. If it's not in the docs, it's not Phase 1.

---

## SOW anchor

Every Phase 1 capability cites a SOW section reference (e.g., §3.1.MVP.5). The canonical document is:

`GLIMMORATEAM™ – Global Workforce Intelligence Platform_V1.1 with MVP.docx`

Reference path: `/Users/kavi/Downloads/Glimmora Sow's/GLIMMORATEAM™ – Global Workforce Intelligence Platform_V1.1 with MVP.docx`

---

## Conventions

- **§** = SOW section reference
- **P1 / P2** = Phase 1 / Phase 2
- **🔒 SEAL** = exists in code today but hidden / route-removed for Phase 1
- **🚧 BUILD** = does not exist; must be built
- **🔧 WIRE** = exists in code as mock; must be persisted/integrated
- **✅ KEEP** = exists in code and is Phase 1-ready

---

## Change control

Once `06-phase-1-scope-lockdown.md` is signed, scope changes require:

1. Written change order from Sponsor + Product Lead + EM Platform
2. Updated revision of the relevant portal doc + 06
3. New version number on the doc(s)
4. Communication to all workstream owners

Decisions flagged in each portal's §10 or §11 are pre-execution decisions. They must be closed before Phase 1 starts; see `06-phase-1-scope-lockdown.md` §8.

---

## File sizes (reference)

| Doc | Lines | KB |
|---|---|---|
| 01 Contributor | 2,956 | 172 |
| 02 Enterprise | 2,257 | 156 |
| 03 Mentor | 1,405 | 92 |
| 04 Platform Admin | 1,581 | 101 |
| 05 Cross-functional | 1,321 | 59 |
| 06 Scope lockdown | ~900 | ~50 |
| **Total** | **~10,400** | **~630** |
