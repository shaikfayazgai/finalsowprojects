# Phase 7: Tech Debt Cleanup - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate all v1.0 tech debt before test and polish work begins: clean API contracts (remove `contributorId` from evidence factory, remove `verifiedByMentorId` from PoDL type), standardize OTPConfirmationDialog imports, organize MSW settings handlers, integrate production fonts in all 5 portal runtimes, and add PoDL Ledger as a 6th Admin report type.

No new portal features beyond what's listed. No backend changes. No testing infrastructure (that's Phase 8+).

</domain>

<decisions>
## Implementation Decisions

### PoDL Ledger Report (POL-01)
- Follows the same pattern as the existing 5 Admin report types (filter bar, DataTable, CSV + PDF export)
- **Columns**: Credential ID, anonymized contributor ID, user type (Women/Student/Alumni), project name, task name, primary skill tags, issue date, verification status
- **Filters**: Date range picker + Project dropdown + User type tabs (Women / Student / Alumni) — matches requirement spec
- **Export**: CSV + PDF export buttons — consistent with all other reports
- **Row interaction**: No drill-down — read-only audit table (same pattern as immutable audit log, not dispute detail)

### Font Sourcing (POL-03)
- Real Miller Display and Avenir LT Std license files are NOT available yet
- **Approach**: Use open-source substitutes via `next/font/google` in all 5 portal `layout.tsx` files:
  - Miller Display → **Playfair Display** (editorial serif, closest aesthetic match)
  - Avenir LT Std → **DM Sans** (geometric sans, closest aesthetic match)
- Applied in: women-portal, university-portal, enterprise-portal, mentor-portal, admin-panel layouts
- When real font files arrive later, swap `next/font/google` for `next/font/local` with the licensed files

### Type Cleanup Cascade (POL-02, POL-05)
- **Order**: Fix the type/interface first (@glimmora/types), then fix all downstream TypeScript errors
- **Zero tolerance**: After all POL changes, `pnpm turbo build` must pass clean across all 5 portals — zero TypeScript errors
- **Method**: Run `pnpm turbo type-check` or `tsc --noEmit` per package after type changes; hunt and fix every error before committing
- Build health is non-negotiable — errors compound and break Phase 8 test setup

### MSW Handler Organization (POL-06)
- Extract settings routes from `audit-log.ts` into `settings.ts`, following the same handler file pattern
- Register as `settingsHandlers` in `handlers/index.ts`
- Claude's discretion on exact file structure within that pattern

### Import Standardization (POL-04)
- All 4 OTPConfirmationDialog import sites in enterprise-portal → barrel import `@/components/shared`
- Claude's discretion on identifying all import sites (grep for direct path imports)

### Claude's Discretion
- PoDL Ledger report column widths, sort order defaults, empty state copy
- Exact grep/search strategy for finding all downstream usages of removed fields
- How to handle any `@ts-ignore` or `as any` casts that hide field usage

</decisions>

<specifics>
## Specific Ideas

- The PoDL Ledger report should feel like the other 5 reports — no visual distinction, just a 6th entry in the report type selector
- Font substitutes should be declared at the layout level and passed via CSS variables (same pattern Storybook already uses) — don't hardcode font names in components
- The zero-errors build requirement is absolute: if a type change causes a cascade, fix every error before moving to the next POL item

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-tech-debt-cleanup*
*Context gathered: 2026-02-27*
