# Phase 7: Tech Debt Cleanup - Research

**Researched:** 2026-02-27
**Domain:** TypeScript type cleanup, MSW handler reorganization, font integration, report additions, import standardization
**Confidence:** HIGH (all findings from direct codebase audit)

## Summary

This phase addresses six discrete tech debt items (POL-01 through POL-06) that clean up contracts, types, organization, fonts, and reporting before test/polish phases begin. Every finding below comes from reading the actual codebase files -- no guessing.

The existing codebase has clear, consistent patterns for every change required. The 5 existing report types follow an identical structure (type selector card on reports page, builder form with filter bar + DataTable + CSV/PDF export, MSW factory generating mock data). The MSW handler pattern is consistent across 9 handler files. The font setup is identical across all 5 portal layout.tsx files (commented-out `next/font/local` blocks with CSS variable approach). The OTP import inconsistency is in exactly 3 files (the 4th already uses the barrel).

**Primary recommendation:** Execute in dependency order: types first (POL-05), then downstream factories (POL-02), then build verification, then independent items (POL-03, POL-04, POL-06, POL-01) in parallel.

## Codebase Audit: Current State per Requirement

### POL-01: PoDL Ledger Report (6th Report Type)

**Current state:** 5 report types exist in a uniform pattern.

**Reports page** (`apps/admin-panel/src/app/(app)/reports/page.tsx`):
- Lines 8-39: `REPORT_TYPES` array with 5 entries, each having `type`, `title`, `description`, `icon`
- Current types: `platform_overview`, `user_activity`, `project_delivery`, `financial`, `skill_growth`
- Each renders a `ReportTypeCard` that navigates to `/reports/builder?type=X`

**Report builder form** (`apps/admin-panel/src/components/reports/report-builder-form.tsx`):
- Lines 28-34: `REPORT_TYPE_OPTIONS` array (5 entries mapping `ReportType` to labels)
- Lines 36-65: Filter option arrays per report type (user type, project status, payment status, dispute type)
- Lines 103-116: `filterOptions` switch statement returning per-type filter arrays (returns `null` for `platform_overview`)
- Lines 127-136: Dynamic DataTable columns built from chart data keys
- Lines 138-174: CSV and PDF export handlers
- The builder uses `useQuery` with `enabled: false` -- user clicks "Generate" to trigger

**Report types** (`packages/types/src/admin.ts`):
- Line 184: `ReportType = 'platform_overview' | 'user_activity' | 'project_delivery' | 'financial' | 'skill_growth'`
- Lines 186-192: `ReportConfig` interface
- Lines 194-200: `PlatformReportData` interface with `reportType`, `generatedAt`, `dateRange`, `metrics`, `chartData`

**Report factory** (`apps/admin-panel/src/lib/msw/factories/report.ts`):
- Lines 5-112: 5 factory functions, each returning a `PlatformReportData` object
- Lines 114-129: `createMockReportData(type)` switch routing to each factory
- Pattern: each factory returns `{ reportType, generatedAt, dateRange, metrics: Record<string, number|string>, chartData: Array<{month, ...values}> }`

**Report MSW handler** (`apps/admin-panel/src/lib/msw/handlers/reports.ts`):
- Single handler: `GET /api/admin/reports/:type`
- Passes `params.type` to `createMockReportData()`, patches dateRange from query params

**Report PDF** (`apps/admin-panel/src/components/reports/report-pdf-document.tsx`):
- Lines 112-118: `REPORT_TYPE_TITLES` record mapping type to display title
- Generic renderer -- works with any `PlatformReportData`, no per-type logic

**Report barrel** (`apps/admin-panel/src/components/reports/index.ts`):
- Exports `ReportTypeCard` and `ReportBuilderForm`
- NOTE comment: `ReportPDF` is NOT exported (dynamic import only)

**Exact changes needed for POL-01:**

1. **`packages/types/src/admin.ts` line 184** -- Add `'podl_ledger'` to `ReportType` union:
   ```typescript
   export type ReportType = 'platform_overview' | 'user_activity' | 'project_delivery' | 'financial' | 'skill_growth' | 'podl_ledger'
   ```

2. **`apps/admin-panel/src/app/(app)/reports/page.tsx` lines 8-39** -- Add 6th entry to `REPORT_TYPES` array:
   ```typescript
   {
     type: 'podl_ledger',
     title: 'PoDL Ledger',
     description: 'Credential audit trail: issuance, verification status, skill tags',
     icon: Shield, // or Award from lucide-react
   },
   ```

3. **`apps/admin-panel/src/components/reports/report-builder-form.tsx`**:
   - Add to `REPORT_TYPE_OPTIONS` (after line 34):
     ```typescript
     { value: 'podl_ledger', label: 'PoDL Ledger' },
     ```
   - Add `PODL_USER_TYPE_FILTERS`:
     ```typescript
     const PODL_USER_TYPE_FILTERS = [
       { value: 'all', label: 'All User Types' },
       { value: 'women', label: 'Women' },
       { value: 'student', label: 'Student' },
       { value: 'alumni', label: 'Alumni' },
     ]
     ```
   - Add case in `filterOptions` switch (after line 112):
     ```typescript
     case 'podl_ledger':
       return PODL_USER_TYPE_FILTERS
     ```

4. **`apps/admin-panel/src/lib/msw/factories/report.ts`** -- Add `podlLedgerData()` factory function and add case to switch:
   ```typescript
   function podlLedgerData(): PlatformReportData {
     return {
       reportType: 'podl_ledger',
       generatedAt: new Date().toISOString(),
       dateRange: { from: '', to: '' },
       metrics: {
         total_credentials: 342,
         active_credentials: 328,
         revoked_credentials: 14,
         women_contributors: 145,
         student_contributors: 156,
         alumni_contributors: 41,
       },
       chartData: [
         // Tabular data with required columns from CONTEXT.md
       ],
     }
   }
   ```
   - The `chartData` array becomes the DataTable rows. Columns from CONTEXT.md: Credential ID, anonymized contributor ID, user type, project, task, skill tags, issue date, verification status.

5. **`apps/admin-panel/src/components/reports/report-pdf-document.tsx` line 112-118** -- Add to `REPORT_TYPE_TITLES`:
   ```typescript
   podl_ledger: 'PoDL Ledger Report',
   ```

---

### POL-02: Evidence Factory contributorId Removal

**Current state** (`apps/enterprise-portal/src/lib/msw/factories/evidence.ts`):
- Line 12: `contributorId: \`contributor-\${randomId('c')}\``,
- This is inside `createMockEvidence()` base object

**Evidence type** (`packages/types/src/evidence.ts`):
- Line 13: `contributorId: string` -- this field EXISTS in the type interface

**Enterprise usage** (`apps/enterprise-portal/src/components/projects/evidence-pack-review.tsx`):
- Lines 19-20: Comment `// Strip contributorId -- blind review boundary`
- The component already strips `contributorId` via the `toViewerEvidence()` adapter (lines 21-57) which never passes `contributorId` to the viewer

**IMPORTANT FINDING:** The requirement says "Enterprise portal MSW evidence factory no longer populates contributorId." However, `contributorId` is a field in the `Evidence` interface in `@glimmora/types`. Removing it from the factory without removing it from the type would cause a TypeScript error (missing required field).

**Two options:**
1. Make `contributorId` optional in the Evidence type (`contributorId?: string`) -- this preserves it for contributor-facing portals that need it while allowing the enterprise factory to omit it
2. Remove `contributorId` from the Evidence type entirely -- but this affects ALL evidence factories across ALL portals

**Given the CONTEXT.md says "clean API contracts" and the evidence-pack-review already strips it:** The safest approach is to make `contributorId` optional in the type, then remove it from the enterprise factory. The blind review comment (line 19) confirms the architectural intent -- enterprise should never see contributor identity.

**Files to change:**
1. `packages/types/src/evidence.ts` line 13: `contributorId?: string` (add `?`)
2. `apps/enterprise-portal/src/lib/msw/factories/evidence.ts` line 12: Remove the `contributorId` line

**Cascade check -- who references `evidence.contributorId` directly?**
- `apps/enterprise-portal/src/components/projects/evidence-pack-review.tsx` -- already strips it (no direct access)
- No other portal files reference `evidence.contributorId` (confirmed by grep)

---

### POL-03: Production Font Integration (Playfair Display + DM Sans)

**Current state across all 5 layout.tsx files:**

All 5 portals have identical commented-out `next/font/local` blocks referencing Miller Display and Avenir LT Std WOFF2 files that do not exist. The CSS variable chain is:

1. Each layout.tsx was supposed to declare `--font-miller-display` and `--font-avenir` CSS variables via `next/font/local`
2. `packages/config/tailwind/theme.css` line 28-29 references these variables:
   ```css
   --font-display: var(--font-miller-display), Georgia, serif;
   --font-body: var(--font-avenir), system-ui, sans-serif;
   ```
3. Components use `font-display` and `font-body` Tailwind classes throughout

**Currently:** Since the font variables are never set (code is commented out), `--font-miller-display` and `--font-avenir` resolve to nothing, so `--font-display` falls back to `Georgia, serif` and `--font-body` falls back to `system-ui, sans-serif`.

**Portal layout variants:**

| Portal | File | Async? | i18n? | RTL? |
|--------|------|--------|-------|------|
| women-portal | `apps/women-portal/src/app/layout.tsx` | YES (`async function`) | YES (next-intl) | YES |
| university-portal | `apps/university-portal/src/app/layout.tsx` | YES (`async function`) | YES (next-intl) | YES |
| enterprise-portal | `apps/enterprise-portal/src/app/layout.tsx` | NO (sync) | NO | NO |
| mentor-portal | `apps/mentor-portal/src/app/layout.tsx` | NO (sync) | NO | NO |
| admin-panel | `apps/admin-panel/src/app/layout.tsx` | NO (sync) | NO | NO |

**Exact change for each layout.tsx:**

Replace the commented-out `next/font/local` blocks with `next/font/google`:

```typescript
import { Playfair_Display, DM_Sans } from 'next/font/google'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-miller-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-avenir',
  display: 'swap',
})
```

Then add classes to `<html>`:
```tsx
<html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
```

**CRITICAL:** The CSS variable names MUST be `--font-miller-display` and `--font-avenir` to match what `packages/config/tailwind/theme.css` references. This is the variable-name bridge. When real fonts arrive later, only the layout.tsx files change -- the theme.css and all component classes remain untouched.

**Weight mapping rationale:**
- Playfair Display weights `400, 500, 700, 900` cover the original Miller Display weights (300/500/900 plus a regular)
- DM Sans weights `300, 400, 500, 700` cover the original Avenir weights (300/400/500/800/900 -- DM Sans maxes at 700)

**RTL font note** (`apps/women-portal/src/app/globals.css`):
- Line 5-9: Has a separate Google Fonts import for `Noto Sans Arabic` for RTL locales
- This is independent of the layout.tsx font setup and should remain

**Files to change (5 total):**
1. `apps/women-portal/src/app/layout.tsx` -- Replace commented block, add className to `<html>`
2. `apps/university-portal/src/app/layout.tsx` -- Same pattern
3. `apps/enterprise-portal/src/app/layout.tsx` -- Same pattern
4. `apps/mentor-portal/src/app/layout.tsx` -- Same pattern
5. `apps/admin-panel/src/app/layout.tsx` -- Same pattern

---

### POL-04: OTPConfirmationDialog Import Standardization

**Current state:**

The barrel export exists at `apps/enterprise-portal/src/components/shared/index.ts` (line 1):
```typescript
export { OTPConfirmationDialog } from './otp-confirmation-dialog'
```

**4 import sites found:**

| # | File | Line | Current Import | Status |
|---|------|------|----------------|--------|
| 1 | `apps/enterprise-portal/src/components/sow/blueprint-approval.tsx` | 7 | `from '@/components/shared'` | ALREADY CORRECT |
| 2 | `apps/enterprise-portal/src/components/projects/bulk-payment-release.tsx` | 28 | `from '../shared/otp-confirmation-dialog'` | NEEDS FIX |
| 3 | `apps/enterprise-portal/src/components/payments/pending-approvals-table.tsx` | 6 | `from '../shared/otp-confirmation-dialog'` | NEEDS FIX |
| 4 | `apps/enterprise-portal/src/components/projects/payment-release-card.tsx` | 6 | `from '../shared/otp-confirmation-dialog'` | NEEDS FIX |

**Only 3 files need changing** (not 4 -- blueprint-approval.tsx already uses the barrel import).

**Exact changes:**
1. `bulk-payment-release.tsx` line 28: Change `from '../shared/otp-confirmation-dialog'` to `from '@/components/shared'`
2. `pending-approvals-table.tsx` line 6: Change `from '../shared/otp-confirmation-dialog'` to `from '@/components/shared'`
3. `payment-release-card.tsx` line 6: Change `from '../shared/otp-confirmation-dialog'` to `from '@/components/shared'`

---

### POL-05: PoDL.verifiedByMentorId Removal

**Current state** (`packages/types/src/podl.ts`):
```typescript
export interface PoDL {
  id: string
  contributorId: string
  taskId: string
  projectId: string
  issuedAt: string
  title: string
  description: string
  skillsDemonstrated: string[]
  evidenceHash: string
  verifiedByMentorId: string     // <-- LINE 11: REMOVE THIS
  organizationName: string
  isRevoked: boolean
}
```

**All downstream references to `verifiedByMentorId` (from grep):**

| # | File | Lines | Usage |
|---|------|-------|-------|
| 1 | `packages/types/src/podl.ts` | 11 | Type definition -- **REMOVE** |
| 2 | `apps/university-portal/src/lib/msw/factories/podl.ts` | 16, 31, 46, 61, 76 | 5 factory objects -- **REMOVE field from each** |
| 3 | `apps/women-portal/src/lib/msw/factories/podl.ts` | 11, 19, 27 | 3 factory objects -- **REMOVE field from each** |

**No references in:**
- `apps/enterprise-portal/` -- no PoDL factory or rendering
- `apps/mentor-portal/` -- no PoDL references at all
- `apps/admin-panel/` -- no PoDL type references (admin uses different data structures)
- `packages/ui/` -- no PoDL type references

**Cascade risk: LOW.** Only 2 factory files reference this field. Removing from the type makes the factory lines TypeScript errors (excess property), which `tsc --noEmit` will catch.

**Files to change (3 total):**
1. `packages/types/src/podl.ts` line 11: Remove `verifiedByMentorId: string`
2. `apps/university-portal/src/lib/msw/factories/podl.ts`: Remove `verifiedByMentorId: 'mentor-XXX',` from all 5 credential objects (lines 16, 31, 46, 61, 76)
3. `apps/women-portal/src/lib/msw/factories/podl.ts`: Remove `verifiedByMentorId: 'mentor-XXX',` from all 3 credential objects (lines 11, 19, 27)

---

### POL-06: MSW Settings Routes Extraction

**Current state** (`apps/admin-panel/src/lib/msw/handlers/audit-log.ts`):
- Lines 1-6: Imports + audit log factory + common utils
- Lines 8-54: `mockAdmins` array (5 AdminUser objects) -- **SETTINGS DATA, not audit log data**
- Lines 56-59: `GET /api/admin/audit-log` -- actual audit log handler (stays)
- Lines 61-63: `GET /api/admin/settings/admins` -- **SETTINGS route (move)**
- Lines 65-71: `PATCH /api/admin/settings/admins/:id` -- **SETTINGS route (move)**
- Lines 73-86: `POST /api/admin/settings/admins` -- **SETTINGS route (move)**
- Line 87: Export as `auditLogHandlers`

**Handler registration** (`apps/admin-panel/src/lib/msw/handlers/index.ts`):
- 9 handler files imported and spread into `handlers` array
- No `settingsHandlers` import yet

**Existing handler file pattern** (from examining all files in `handlers/`):
- Each file: `import { http, HttpResponse } from 'msw'` + factory imports
- Each file exports a named array: `export const [domain]Handlers = [...]`
- `index.ts` imports and spreads each one

**Exact changes:**

1. **Create `apps/admin-panel/src/lib/msw/handlers/settings.ts`:**
   - Move `mockAdmins` array (lines 8-54 from audit-log.ts)
   - Move the 3 settings routes (lines 61-86 from audit-log.ts)
   - Import `http, HttpResponse` from `msw`
   - Import `isoPast, isoNow, randomId` from `../factories/common`
   - Import `AdminUser, AdminRole` from `@glimmora/types`
   - Export as `settingsHandlers`

2. **Modify `apps/admin-panel/src/lib/msw/handlers/audit-log.ts`:**
   - Remove `mockAdmins` array (lines 8-54)
   - Remove the 3 settings route handlers (lines 61-86)
   - Remove unused imports: `isoPast`, `isoNow`, `randomId`, `AdminUser`, `AdminRole`
   - Keep only: `import { http, HttpResponse } from 'msw'`, audit log factory import, audit log handler
   - Result: ~10 lines total

3. **Modify `apps/admin-panel/src/lib/msw/handlers/index.ts`:**
   - Add: `import { settingsHandlers } from './settings'`
   - Add: `...settingsHandlers,` to the handlers array

---

## Architecture Patterns

### Report Addition Pattern (POL-01)

Every report follows this exact pipeline -- the PoDL Ledger must follow it identically:

```
1. ReportType union (packages/types/src/admin.ts)
   |
2. REPORT_TYPES card array (reports/page.tsx) -- icon + title + description
   |
3. REPORT_TYPE_OPTIONS selector (report-builder-form.tsx) -- value/label
   |
4. Filter array + filterOptions switch case (report-builder-form.tsx) -- per-type filters
   |
5. Factory function (msw/factories/report.ts) -- mock data generator
   |
6. Switch case in createMockReportData() (msw/factories/report.ts) -- routing
   |
7. REPORT_TYPE_TITLES (report-pdf-document.tsx) -- PDF heading
```

No MSW handler changes needed -- the existing `GET /api/admin/reports/:type` handler passes `params.type` dynamically.

### MSW Handler File Pattern (POL-06)

```typescript
// Pattern: apps/admin-panel/src/lib/msw/handlers/[domain].ts
import { http, HttpResponse } from 'msw'
import { createMockXxx } from '../factories/[domain]'

const mockData = createMockXxx()

export const [domain]Handlers = [
  http.get('/api/admin/[domain]/...', () => {
    return HttpResponse.json(mockData)
  }),
  // ... more handlers
]
```

### Font CSS Variable Chain Pattern (POL-03)

```
layout.tsx (next/font/google)
  --> sets --font-miller-display CSS variable on <html>
  --> sets --font-avenir CSS variable on <html>
      |
packages/config/tailwind/theme.css
  --> --font-display: var(--font-miller-display), Georgia, serif
  --> --font-body: var(--font-avenir), system-ui, sans-serif
      |
Tailwind classes in components
  --> font-display (headings, KPIs)
  --> font-body (body text, UI)
```

### Anti-Patterns to Avoid
- **Do NOT change CSS variable names in theme.css** -- the `--font-miller-display` and `--font-avenir` names are intentional bridge names that allow swapping Google fonts for licensed local fonts later
- **Do NOT add font imports to globals.css** -- use `next/font/google` in layout.tsx for automatic optimization (preloading, font-display swap, zero CLS)
- **Do NOT remove `contributorId` from the Evidence TYPE** -- it is used by contributor-facing portals; only the enterprise FACTORY should stop populating it (make it optional in the type)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | CSS `@font-face` in globals.css | `next/font/google` in layout.tsx | Automatic preloading, font-display:swap, zero layout shift, Google CDN optimization |
| Report data structure | Custom PoDL-specific data shape | Existing `PlatformReportData` interface | Builder form, DataTable, CSV export, PDF export all work generically with this shape |
| Report filtering | Custom filter component | Existing `filterOptions` + `Select` pattern in builder form | Consistent UX, zero new component code |

## Common Pitfalls

### Pitfall 1: Font Variable Name Mismatch
**What goes wrong:** Developer names the CSS variable `--font-playfair-display` instead of `--font-miller-display`
**Why it happens:** Natural instinct to name variables after the actual font
**How to avoid:** Use the EXACT variable names `--font-miller-display` and `--font-avenir` -- the theme.css bridge depends on these
**Warning signs:** Fonts render as fallback (Georgia / system-ui) despite layout.tsx importing correctly

### Pitfall 2: ReportType Union Not Updated
**What goes wrong:** Factory and UI updated but the TypeScript union `ReportType` in admin.ts still has only 5 values, causing type errors
**Why it happens:** Multiple files reference the same type -- easy to miss one
**How to avoid:** Start with the type definition, then follow the 7-step pipeline in order
**Warning signs:** TypeScript error on `'podl_ledger' is not assignable to type ReportType`

### Pitfall 3: Evidence Type vs Factory Confusion
**What goes wrong:** Developer removes `contributorId` from the Evidence type entirely, breaking women-portal and university-portal MSW factories
**Why it happens:** Conflating "enterprise shouldn't see it" with "nobody needs it"
**How to avoid:** Make `contributorId` optional (`?`) in the type, remove only from enterprise factory
**Warning signs:** TypeScript errors in women-portal or university-portal evidence factories

### Pitfall 4: Forgetting the PoDL Ledger chartData Is Table Rows
**What goes wrong:** Developer creates the mock factory with monthly aggregated data (like other reports), missing that PoDL Ledger needs per-credential rows
**Why it happens:** All 5 existing reports use monthly chart data; PoDL Ledger is a credential audit table
**How to avoid:** The `chartData` array in `PlatformReportData` is also used as DataTable rows. For PoDL Ledger, each row is one credential (not one month). The builder form renders it identically -- the DataTable auto-generates columns from keys.
**Warning signs:** PoDL Ledger shows monthly aggregates instead of credential-level audit data

### Pitfall 5: Async vs Sync Layout Functions
**What goes wrong:** Developer uses `async function RootLayout` in enterprise-portal or admin-panel, causing runtime errors
**Why it happens:** Women's and university portals use `async` (for next-intl getLocale), but the other 3 are sync
**How to avoid:** `next/font/google` does NOT require async -- the font is initialized at module scope. Keep each layout's sync/async status as-is.

## Code Examples

### next/font/google Setup (for sync layout -- enterprise, mentor, admin)

```typescript
// Source: apps/enterprise-portal/src/app/layout.tsx (modified)
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-miller-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-avenir',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Enterprise Portal | GlimmoraTeam',
  description: 'GlimmoraTeam enterprise project management portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <body className="font-body bg-bg-app text-text-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### next/font/google Setup (for async layout with i18n -- women, university)

```typescript
// Source: apps/women-portal/src/app/layout.tsx (modified)
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-miller-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-avenir',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Women's Portal | GlimmoraTeam",
  description: 'GlimmoraTeam contributor portal for women',
}

const RTL_LOCALES = ['ur', 'ar']

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <body className="font-body bg-bg-app text-text-body">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Settings Handler Extraction Pattern

```typescript
// Source: new file apps/admin-panel/src/lib/msw/handlers/settings.ts
import { http, HttpResponse } from 'msw'
import { isoPast, isoNow, randomId } from '../factories/common'
import type { AdminUser, AdminRole } from '@glimmora/types'

const mockAdmins: AdminUser[] = [
  // ... moved from audit-log.ts lines 8-54
]

export const settingsHandlers = [
  http.get('/api/admin/settings/admins', () => {
    return HttpResponse.json(mockAdmins)
  }),
  // ... PATCH and POST handlers moved from audit-log.ts
]
```

### PoDL Ledger Factory (credential-level rows)

```typescript
// Source: addition to apps/admin-panel/src/lib/msw/factories/report.ts
function podlLedgerData(): PlatformReportData {
  return {
    reportType: 'podl_ledger',
    generatedAt: new Date().toISOString(),
    dateRange: { from: '', to: '' },
    metrics: {
      total_credentials: 342,
      active_credentials: 328,
      revoked: 14,
      women: 145,
      students: 156,
      alumni: 41,
    },
    chartData: [
      {
        credential_id: 'PODL-001',
        contributor: 'C-7a3f',
        user_type: 'Women',
        project: 'E-Commerce Platform',
        task: 'Frontend Dashboard',
        skills: 'React, TypeScript',
        issued: '2026-02-18',
        status: 'Active',
      },
      // ... more rows
    ],
  }
}
```

## Dependency Order and Build Verification

**Recommended execution order:**

```
Step 1: POL-05 (Remove verifiedByMentorId from type + factories)
  |
Step 2: POL-02 (Make contributorId optional in Evidence type, remove from enterprise factory)
  |
Step 3: Run `pnpm turbo build` -- verify zero errors from type changes
  |
Step 4 (parallel):
  ├── POL-03 (Font integration in 5 layout.tsx files)
  ├── POL-04 (OTP import standardization -- 3 files)
  ├── POL-06 (MSW settings extraction)
  └── POL-01 (PoDL Ledger report -- 5+ files)
  |
Step 5: Final `pnpm turbo build` -- verify zero errors across all portals
```

Steps 1-2 affect shared types and must be done first. Step 3 is a validation gate. Steps in Step 4 are independent and can be parallelized.

## Risk Assessment

### Cascade Risk Matrix

| Change | Risk | Affected Portals | Mitigation |
|--------|------|------------------|------------|
| Remove `verifiedByMentorId` from PoDL type | LOW | women-portal, university-portal | Only 2 factory files reference it; excess property errors are immediate |
| Make `contributorId` optional in Evidence | LOW | enterprise-portal only | No other portal accesses evidence.contributorId; enterprise already strips it |
| Font variable names | MEDIUM | All 5 portals | Must exactly match `--font-miller-display` and `--font-avenir` |
| ReportType union expansion | LOW | admin-panel only | All report infrastructure is generic; just add to the union and follow the pattern |
| MSW handler extraction | LOW | admin-panel only | Settings page tests same API endpoints; just moving code between files |
| OTP import paths | LOW | enterprise-portal only | Same component, different import path; no behavioral change |

### Build Health Gate

The CONTEXT.md is explicit: `pnpm turbo build` must pass clean after all changes. This is the single most important verification. Run it after type changes (Step 3) and after all changes (Step 5).

## Open Questions

1. **PoDL Ledger project dropdown filter** -- CONTEXT.md specifies a "Project dropdown" filter. The existing report builder uses a `Select` for per-type filters (one filter dimension). Adding a second filter dimension (project dropdown) alongside user type tabs would require extending the builder form. **Recommendation:** For v1, use the single filter dimension (user type tabs) like other reports. The project filter can be a column sort/search via DataTable's built-in features.

2. **Evidence `contributorId` in non-enterprise factories** -- Women-portal and university-portal have evidence factories that also populate `contributorId`. Making it optional in the type means these factories can continue populating it (no error), but do they need to? **Recommendation:** Leave them populating it -- contributor portals legitimately know contributor identity. Only enterprise portal has the blind review boundary.

## Sources

### Primary (HIGH confidence)
- Direct codebase file reads (all paths documented above)
- `packages/types/src/podl.ts` -- PoDL interface with verifiedByMentorId on line 11
- `packages/types/src/evidence.ts` -- Evidence interface with contributorId on line 13
- `packages/types/src/admin.ts` -- ReportType union on line 184
- `packages/config/tailwind/theme.css` -- Font variable chain on lines 28-29
- All 5 `layout.tsx` files -- Identical commented-out font blocks
- All 4 OTPConfirmationDialog import sites -- 3 need fixing, 1 already correct
- `apps/admin-panel/src/lib/msw/handlers/audit-log.ts` -- Settings routes on lines 61-86
- `.planning/phases/07-tech-debt-cleanup/07-CONTEXT.md` -- Phase decisions

### Secondary (MEDIUM confidence)
- [Next.js font documentation](https://nextjs.org/docs/pages/api-reference/components/font) -- `next/font/google` API for Playfair Display and DM Sans
- [Google Fonts](https://fonts.google.com) -- Playfair Display (6 weights + italics), DM Sans (9 weights + italics)

## Metadata

**Confidence breakdown:**
- Type changes (POL-02, POL-05): HIGH -- direct file reads, grep-confirmed all references
- Font integration (POL-03): HIGH -- CSS variable chain fully traced, pattern clear
- Report addition (POL-01): HIGH -- 5 existing reports provide exact template
- Import cleanup (POL-04): HIGH -- all 4 sites found and verified
- MSW extraction (POL-06): HIGH -- exact lines identified for move
- Build cascade risk: HIGH -- all downstream references audited via grep

**Research date:** 2026-02-27
**Valid until:** Indefinite (codebase-specific findings, not library-version-dependent)
