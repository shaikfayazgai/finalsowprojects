---
phase: "07-tech-debt-cleanup"
plan: "01"
subsystem: "shared-types"
tags: ["typescript", "podl", "evidence", "msw-factories", "api-contract"]
dependency-graph:
  requires: []
  provides:
    - "Clean PoDL interface without verifiedByMentorId"
    - "Evidence interface with optional contributorId"
    - "Correct enterprise evidence factory (no contributor identity)"
  affects:
    - "07-02 (Wave 1 downstream consumers)"
    - "07-03 (Wave 2 full cleanup)"
tech-stack:
  added: []
  patterns:
    - "Optional fields for privacy-sensitive data across portal boundaries"
key-files:
  created: []
  modified:
    - "packages/types/src/podl.ts"
    - "packages/types/src/evidence.ts"
    - "apps/university-portal/src/lib/msw/factories/podl.ts"
    - "apps/women-portal/src/lib/msw/factories/podl.ts"
    - "apps/enterprise-portal/src/lib/msw/factories/evidence.ts"
decisions:
  - id: "07-01-D1"
    description: "PoDL verifiedByMentorId removed entirely (not part of API contract)"
    rationale: "Mentor verification is tracked separately; PoDL is a contributor-facing credential"
  - id: "07-01-D2"
    description: "Evidence.contributorId made optional rather than removed"
    rationale: "Contributor portals need it (show own evidence); enterprise must not see it (privacy)"
metrics:
  duration: "2 min"
  completed: "2026-02-27"
---

# Phase 7 Plan 1: Fix PoDL and Evidence Type Contracts Summary

Clean PoDL interface (11 fields, no verifiedByMentorId) and Evidence interface with optional contributorId for cross-portal privacy boundary.

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|---------------|
| 1 | Remove verifiedByMentorId from PoDL type and factories | ad4d677 | packages/types/src/podl.ts, apps/university-portal/src/lib/msw/factories/podl.ts, apps/women-portal/src/lib/msw/factories/podl.ts |
| 2 | Make Evidence.contributorId optional and remove from enterprise factory | 7b0ac3d | packages/types/src/evidence.ts, apps/enterprise-portal/src/lib/msw/factories/evidence.ts |

## What Changed

### Task 1: PoDL Type Cleanup
- Removed `verifiedByMentorId: string` from the `PoDL` interface in `packages/types/src/podl.ts`
- PoDL interface now has exactly 11 fields: id, contributorId, taskId, projectId, issuedAt, title, description, skillsDemonstrated, evidenceHash, organizationName, isRevoked
- Removed `verifiedByMentorId` from all 5 credential objects in university-portal PoDL factory
- Removed `verifiedByMentorId` from all 3 credential objects in women-portal PoDL factory

### Task 2: Evidence Type Privacy Fix
- Changed `contributorId: string` to `contributorId?: string` (optional) in the `Evidence` interface
- Removed `contributorId` generation from enterprise-portal evidence factory
- This enforces the privacy boundary: enterprise never sees contributor identity in evidence responses
- Other portal factories (women, university, mentor) untouched -- they correctly provide contributorId for contributor-facing views

## Verification Results

1. `pnpm turbo build` -- all 5 portals build with zero errors
2. `verifiedByMentorId` grep on types + factories -- zero results
3. `contributorId` grep on enterprise evidence factory -- zero results
4. `contributorId?` grep on evidence type -- confirms optional field declaration

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **PoDL verifiedByMentorId removed entirely** -- Mentor verification is tracked via separate mechanisms; PoDL is a contributor-facing credential that does not need to reference the verifying mentor.

2. **Evidence.contributorId made optional (not removed)** -- The field is needed by contributor and mentor portals to display evidence in context. Making it optional allows the enterprise API contract to omit it for privacy while other portals continue providing it.

## Next Phase Readiness

Plans 07-02 and 07-03 can now build against correct type contracts. No blockers.
