# Mentor Workspace V2 — Shared Workflow Primitives

This folder is the **operational consistency layer** for every mentor page.
Every page that surfaces governance, severity, AI signals, escalation,
hold, or rework lifecycle must import from here — **never inline a
tone color, a confidence chip, or a vocabulary string**.

## What lives here

| File | Purpose |
|---|---|
| `severity-tokens.ts` | Single source of truth for every tone map (SLA, severity, policy, impact, confidence, trend, kpi-emphasis, bucket-tone) + canonical `VOCAB` strings |
| `auditable-badge.tsx` | The "Auditable" badge stamped on every AI section |
| `confidence-gauge.tsx` | The AI confidence gauge (bar + inline variants) |
| `recommendation-block.tsx` | Forest-tinted AI recommendation callout (card + inline variants) |
| `ops-breadcrumb.tsx` | Operational breadcrumb under page headers in queue surfaces |
| `preview-empty-state.tsx` | Canonical empty state for right-rail preview/investigation panels |
| `workflow-state-chip.tsx` | Workflow state chip (existing) |
| `workflow-queue.tsx` | Generic workflow queue table (existing) |
| `workspace-drawer.tsx` | Side workspace drawer (existing) |
| `governance-timeline.tsx` | Governance timeline (existing) |
| `governance-banner.tsx` | Hold / blocked / policy banner (existing) |
| `clarification-thread.tsx` | Threaded contributor discussion (existing) |

## Canonical thresholds

These are platform-wide and must not drift:

- **AI confidence bands**: ≥85 high · ≥65 medium · <65 low
- **Reliability bands**: ≥80 strong · ≥65 watch · <65 at-risk
- **SLA pressure**: <0h breached · ≤2h critical · ≤6h warning · ≤18h watch · >18h healthy
- **Hold age**: >48h overdue
- **Stall threshold**: >4h without activity

## Canonical vocabulary

All operator-facing strings live in `severity-tokens.ts` → `VOCAB`. Add new
terms there before using them in components. Examples:

- Time / SLA — "Resolution SLA", "SLA breached", "Time on hold"
- Identity — "Governance owner", "Reviewer", "Mentor", "Contributor"
- States — "Awaiting clarification", "Governance consultation", "Workflow halted"
- Audit — "Auditable", "Signed · ledger-anchored", "Audit timeline"
- Risk — "Risk score", "Risk severity", "Policy risk", "Governance severity", "Impact tier"
- AI — "AI confidence", "Recommendation", "AI insight", "Model v3.2"

## Operational page scaffold (recommended order)

Every mentor operations-center page follows this top-down order:

1. **`OperationalPageHeader`** — sticky title, subtitle, context chips
2. **`OpsBreadcrumb`** — Reviews → {section}
3. **Summary KPI strip** — 6 tiles, max 2 with critical/warning emphasis
4. **Bucket bar** — 6 categorical buckets (uses `bucketToken`)
5. **2-column zone** — table + right-rail preview panel
6. **Supporting panels** — coordination · restrictions · clarifications · etc.
7. **AI insights** — final card grid, always last

## When in doubt

- Adding a new tone? Extend `severity-tokens.ts`.
- Adding a new operator label? Add to `VOCAB`.
- Adding a new operational primitive? Add a file here; document above.
