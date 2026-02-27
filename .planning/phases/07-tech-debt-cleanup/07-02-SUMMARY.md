---
phase: "07-tech-debt-cleanup"
plan: "02"
subsystem: "fonts-imports"
tags: ["google-fonts", "next-font", "barrel-imports", "otp", "layout"]
dependency-graph:
  requires: ["07-01"]
  provides: ["production-fonts-all-portals", "barrel-otp-imports"]
  affects: ["08-visual-polish"]
tech-stack:
  added: ["next/font/google (Playfair Display, DM Sans)"]
  patterns: ["CSS variable bridge naming for font swap"]
key-files:
  created: []
  modified:
    - "apps/women-portal/src/app/layout.tsx"
    - "apps/university-portal/src/app/layout.tsx"
    - "apps/enterprise-portal/src/app/layout.tsx"
    - "apps/mentor-portal/src/app/layout.tsx"
    - "apps/admin-panel/src/app/layout.tsx"
    - "apps/enterprise-portal/src/components/projects/bulk-payment-release.tsx"
    - "apps/enterprise-portal/src/components/payments/pending-approvals-table.tsx"
    - "apps/enterprise-portal/src/components/projects/payment-release-card.tsx"
decisions: []
metrics:
  duration: "8 min"
  completed: "2026-02-27"
---

# Phase 7 Plan 2: Font Integration and OTP Import Cleanup Summary

**Google Fonts (Playfair Display + DM Sans) integrated across all 5 portals with bridge CSS variables; enterprise OTP imports standardized to barrel pattern.**

## What Was Done

### Task 1: Add Playfair Display + DM Sans via next/font/google to all 5 portal layouts

Replaced commented-out localFont blocks (waiting for WOFF2 files) with next/font/google imports using Playfair Display (heading substitute for Miller Display) and DM Sans (body substitute for Avenir LT Std).

Key decisions in implementation:
- CSS variable names use bridge naming: `--font-miller-display` and `--font-avenir` (not `--font-playfair` / `--font-dm-sans`). This means the existing Tailwind config (`font-display` -> `var(--font-miller-display)`, `font-body` -> `var(--font-avenir)`) works without changes.
- When licensed Miller Display and Avenir LT Std WOFF2 files become available, swapping back is a single-file-per-portal change (replace the font loader, keep the variable names).
- Font variables injected on `<html>` element via className in all 5 layouts.

Portal-specific patterns preserved:
- **women-portal / university-portal**: Async layouts with next-intl and RTL direction support
- **enterprise-portal / mentor-portal / admin-panel**: Sync layouts

**Commit:** `1c378c0` -- feat(07-02): add Playfair Display + DM Sans via next/font/google to all 5 portals

### Task 2: Fix OTP import paths to use barrel pattern

Changed 3 enterprise portal files from direct path imports (`../shared/otp-confirmation-dialog`) to barrel imports (`@/components/shared`):
- `bulk-payment-release.tsx`
- `pending-approvals-table.tsx`
- `payment-release-card.tsx`

The barrel file (`apps/enterprise-portal/src/components/shared/index.ts`) already exported `OTPConfirmationDialog`. A 4th file (`blueprint-approval.tsx`) was already using the barrel pattern.

**Commit:** `8629c44` -- refactor(07-02): fix OTP imports to use barrel pattern in enterprise portal

## Verification Results

| Check | Result |
|-------|--------|
| `Playfair_Display` in 5 layout.tsx files | 5/5 |
| `font-miller-display` in 5 layout.tsx files | 5/5 |
| No commented-out local font code | 0 matches |
| No direct-path OTP imports | 0 matches |
| `pnpm turbo build` (all 5 portals) | 5/5 successful |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

Phase 7 (Tech Debt Cleanup) is now complete with all 3 plans (07-01, 07-02, 07-03) delivered. Ready for Phase 8.
