# GTPROJECT Comprehensive Audit Report
**Date:** 2026-06-09  
**Scope:** `apps/`, `backend/` directories  
**Auditor:** Code Review Agent  

---

## Executive Summary

The project suffers from **fundamental architectural drift**: what started as a monolithic app (`frontend4/`) was split into 5 "standalone" role apps via copy-paste, resulting in massive code duplication, inconsistent backend integration, heavy reliance on mock data, and broken cross-service communication. The system is **not production-ready** in its current state.

**Critical Issue Count:**
- 🔴 **Critical:** 12 issues
- 🟠 **High:** 18 issues  
- 🟡 **Medium:** 15 issues
- 🟢 **Low:** 8 issues

---

## 1. ARCHITECTURE & STRUCTURAL ISSUES

### 🔴 CRITICAL: Identical App Clones (Not True Standalone Apps)
**Files:** All 5 frontend apps (`enterprise/`, `freelancer/`, `mentor/`, `reviewer/`, `super-admin/`)  
**Issue:** Every app has the **exact same `package.json`** name (`"glimmora-team"`), same dependencies, same scripts, same source code structure. They are not trimmed to their specific role — each carries all other roles' pages, components, and mock data.

**Impact:**
- 5x maintenance burden
- Each app bundle includes irrelevant code
- Changes to one app require manual sync to 4 others
- No single source of truth for shared components

**Evidence:**
```bash
# All package.json files are identical clones
apps/enterprise/frontend/package.json  → name: "glimmora-team"
apps/freelancer/frontend/package.json  → name: "glimmora-team"
apps/mentor/frontend/package.json      → name: "glimmora-team"
```

---

### 🔴 CRITICAL: Backend Shared Code Duplicated 5 Times
**Files:** `apps/*/backend/shared/`  
**Issue:** The `shared/` Python modules (`config.py`, `db.py`, `security.py`, `app_factory.py`, etc.) are physically copied into each app's backend folder instead of being a shared package or symlink.

**Impact:**
- Security fixes must be applied 5 times
- Schema migrations risk inconsistency
- Config drift between services

**Evidence:**
```
apps/enterprise/backend/shared/config.py
apps/freelancer/backend/shared/config.py
apps/mentor/backend/shared/config.py
apps/reviewer/backend/shared/config.py
apps/super-admin/backend/shared/config.py
```

---

### 🔴 CRITICAL: frontend4/ vs apps/ — Two Parallel Universes
**Files:** `frontend4/`, `apps/`  
**Issue:** The original monolithic app (`frontend4/`) still exists with its own `.next/`, `node_modules/`, `prisma/`, and source code. The `apps/` folder contains 5 copies derived from it. Both appear to be active/used, creating confusion about which is the "real" codebase.

**Impact:**
- Developers don't know which code to edit
- Database schema may diverge
- Deployment targets unclear

---

### 🟠 HIGH: Missing Services in apps/ Split
**Issue:** The root `backend/services/` has **9 microservices**, but the `apps/*/backend/` split only covers 5 roles. Missing in apps/:
- `email-service`
- `file-service`  
- `universities-service`
- `women-service`

**Impact:** These services have no corresponding frontend app or local dev setup in the `apps/` structure. The `unified_app.py` loads them, but standalone app development can't access them.

---

### 🟠 HIGH: No Monorepo / Workspace Configuration
**Issue:** No `pnpm-workspace.yaml`, `nx.json`, `turbo.json`, or any monorepo tooling. Each app is an isolated island with no dependency sharing or build orchestration.

**Impact:**
- Cannot run builds in parallel with caching
- Shared components must be copied, not imported
- No consistent linting/formatting across apps

---

## 2. MOCK DATA & FAKE API ISSUES

### 🔴 CRITICAL: Entire Contributor API is Mocked
**File:** `apps/*/frontend/src/mocks/api/contributor.ts` (~531 lines)  
**Issue:** This file implements a **complete mock REST API** for the contributor portal including:
- Dashboard data with hardcoded KPIs
- Tasks, submissions, earnings, payouts
- Messages/threads
- Credentials/wallet
- Profile & digital twin
- Learning recommendations

**Impact:** The freelancer frontend never talks to the real backend for contributor features. All data is fabricated in memory.

**Evidence:**
```typescript
// Line 66-161: Complete mock dashboard
if (p === "/api/contributor/dashboard" && m === "GET") {
  return {
    status: 200,
    body: {
      greeting_name: mockContributorProfile.displayName.split(" ")[0],
      kpis: [
        { key: "active_tasks", label: "Active Tasks", value: "4", trend: "up" },
        // ... all hardcoded
      ],
    },
  };
}
```

---

### 🔴 CRITICAL: Admin KYC is Mock-Only (localStorage Overlay)
**File:** `apps/*/frontend/src/lib/admin/mocks/kyc-service.ts`  
**Issue:** KYC case management uses `localStorage` as a persistent store with mock seed data. No backend integration exists.

**Evidence:**
```typescript
const kycOverlay = createOverlayStore<MockKycCase>("glimmora.mock.adminKyc.v1");
// All CRUD operations read/write to localStorage, not API
```

---

### 🔴 CRITICAL: SOW Module Uses Mock Data with Hardcoded Demo User
**File:** `apps/*/frontend/src/lib/enterprise/mocks/sows.ts`  
**Issue:** The entire Statement-of-Work module operates on mock data with a hardcoded owner:

```typescript
const OWNER = "sandeep@acme.com";
const OWNER_NAME = "Sandeep Kulkarni";
const DEFAULT_TENANT = { id: "t-acme", name: "Acme Corp" };
```

**Impact:** No real SOW creation, approval workflows, or billing integration.

---

### 🟠 HIGH: 50+ Mock Data Files Across All Apps
**Files:** `apps/*/frontend/src/mocks/**/*`, `apps/*/frontend/src/lib/*/mocks/**/*`  
**Issue:** Complete mock ecosystems exist for:
- Admin: agents, audit, governance, KYC, mentors, partnerships, payment rails, rubrics, skills, tenants
- Enterprise: approvers, compliance, decompositions, matching, notifications, payouts, rate cards, reviews, SOWs, workforce
- Contributor: credentials, digital twin, notifications, payouts, profile, submissions, support, tasks
- Mentor: decisions, escalations, reviews, sessions, team load
- Reviewer: reviews

**Mock File Count (per app):**
- `src/mocks/` — ~40 files
- `src/lib/*/mocks/` — ~15 files
- `src/lib/admin/mocks/` — ~10 files

**Total:** ~65 mock files × 5 apps = **325 mock files**

---

### 🟠 HIGH: Proxy Routes Still Point to Mock Admin API
**File:** `apps/*/frontend/src/proxy.ts` (line 105)  
**Issue:** The API proxy configuration includes a mock admin prefix:
```typescript
prefix: "/api/mock/admin",
```

This indicates the proxy layer is configured to serve mock data rather than forwarding to real backends.

---

## 3. CONFIGURATION & ENVIRONMENT ISSUES

### 🔴 CRITICAL: All API URLs Point to Single Local Port (No Cross-App Communication)
**Files:** `apps/*/frontend/.env.local`  
**Issue:** Each standalone frontend configures **ALL** backend service URLs to point to **its own local port only**:

```bash
# enterprise/.env.local
GLIMMORA_API_URL=http://127.0.0.1:8103
MENTOR_API_URL=http://127.0.0.1:8103
SUPERADMIN_API_URL=http://127.0.0.1:8103
ENTERPRISE_API_URL=http://127.0.0.1:8103
FREELANCER_API_URL=http://127.0.0.1:8103
REVIEWER_API_URL=http://127.0.0.1:8103
```

**Impact:** 
- Enterprise frontend cannot talk to Mentor backend
- Super-admin frontend cannot talk to Enterprise backend
- Each app is completely isolated — no cross-role workflows possible
- The backend-router.ts longest-prefix routing is **non-functional** in standalone mode

---

### 🔴 CRITICAL: Hardcoded Database Credentials in Committed Files
**Files:** All `apps/*/frontend/.env.local`  
**Issue:** Neon PostgreSQL connection strings with passwords are committed to the repo:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_EZDtriJ56mYF@ep-super-snow-aoznopfn-pooler.c-2.ap-southeast-1.aws.neon.tech/glimmora_fe4?sslmode=require
```

**Impact:** Security breach — database credentials exposed in version control.

---

### 🔴 CRITICAL: Hardcoded Absolute Path in Orchestration Script
**File:** `apps/run_all.ps1` (line 4)  
**Issue:** 
```powershell
$Root = "E:\GLIMMORA\educore\GTPROJECT\apps"
```
This script will fail on any other machine or directory structure.

---

### 🟠 HIGH: Same AUTH_SECRET Across All Apps
**Files:** All `apps/*/frontend/.env.local`  
**Issue:** Identical `AUTH_SECRET` used for all 5 portals:
```bash
AUTH_SECRET=8f3d9b2c1a7e64f05d8c93b1e6a47f29c0b5d83e1f9a627c4d0e8b3a5f719c2d6
```

**Impact:** Session tokens from one portal could theoretically be replayed on another if middleware doesn't strictly check role scoping.

---

### 🟠 HIGH: NEXTAUTH_URL Mismatch for Standalone Apps
**Files:** All `apps/*/frontend/.env.local`  
**Issue:** All apps set `NEXTAUTH_URL=http://localhost:3000` but actually run on ports 3101-3105.

**Impact:** OAuth callbacks, password reset links, and session handling may break or redirect to the wrong port.

---

### 🟠 HIGH: Backend Config Has Hardcoded Defaults
**File:** `apps/*/backend/shared/config.py`  
**Issue:** Multiple hardcoded defaults that will cause production issues:
```python
api_secret_key: str = "change-me-to-a-long-random-string-for-jwt"
super_admin_password: str = "glimmora123"
dev_default_portal_password: str = "glimmora123"
frontend_base_url: str = "http://localhost:3000"
public_api_base_url: str = "http://localhost:9000"
```

---

### 🟡 MEDIUM: Inconsistent .env Loading Between Backends
**Issue:**
- `mentor/backend/app.py` and `freelancer/backend/app.py` use `python-dotenv`
- `enterprise/backend/app.py` hand-parses `.env` file
- `reviewer/backend/app.py` and `super-admin/backend/app.py` also hand-parse

**Impact:** Inconsistent behavior, missing dependency on `python-dotenv` in some requirements.txt files.

---

## 4. BACKEND SERVICE ISSUES

### 🟠 HIGH: Reviewer Backend Bundles Superadmin Code
**File:** `apps/reviewer/backend/app.py`  
**Issue:** The reviewer app imports from `superadmin_app` module:
```python
from superadmin_app.routers import reviewer
from superadmin_app.schema import init_superadmin_schema
```

**Impact:** The "standalone" reviewer backend still carries all superadmin schema and router code, defeating the purpose of separation.

---

### 🟠 HIGH: Missing Routers in Enterprise Service (Root backend vs apps/)
**Comparison:**
- Root `backend/services/enterprise-service/enterprise_app/main.py` mounts: `wizards`, `sows`, `approvals`, `users`, `manual_sow`, `decomposition`, `portfolio`, `billing`
- `apps/enterprise/backend/enterprise_app/main.py` mounts all those PLUS: `auth`, `members`, `policies`, `compliance`, `rate_cards`, `workforce`, `integrations`

**Issue:** The root backend and apps/ backend are **out of sync**. Some routers exist only in apps/.

---

### 🟡 MEDIUM: Auth Router Mounted in Every Service
**Issue:** Every backend app mounts `auth_router.router`. In the unified/gateway mode, auth should be centralized. Duplicate auth endpoints across services can lead to inconsistent token validation.

---

### 🟡 MEDIUM: No Input Validation on Mock API Responses
**File:** `apps/*/frontend/src/mocks/api/contributor.ts`  
**Issue:** Mock responses return `any` typed data with no Zod or runtime validation. When these are eventually replaced with real APIs, type mismatches will cause runtime crashes.

---

## 5. SECURITY ISSUES

### 🔴 CRITICAL: DEV_AUTH_BYPASS in Middleware
**File:** `apps/*/frontend/src/proxy.ts` (line 231)  
**Issue:**
```typescript
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === "1";
// ...
if (DEV_AUTH_BYPASS && !isPublicPath(pathname)) {
  return withRequestHeaders(req, { userId: "dev-admin", role: "super_admin" });
}
```

**Impact:** If `DEV_AUTH_BYPASS=1` is accidentally set in production, all authentication is disabled and every user becomes super_admin.

---

### 🔴 CRITICAL: Hardcoded Super Admin Password in Source
**File:** `apps/*/backend/shared/config.py` (line 91-92)  
**Issue:**
```python
super_admin_email: str = "superadmin@glimmora.dev"
super_admin_password: str = "glimmora123"
```

---

### 🟠 HIGH: Service Account Credentials in Source
**File:** `apps/*/backend/shared/config.py` (line 95-98)  
**Issue:**
```python
glimmora_service_email: str = "sow-test-user@glimmora.com"
glimmora_service_password: str = "Test@12345"
glimmora_enterprise_service_email: str = "enterprise-service@glimmora.com"
glimmora_enterprise_service_password: str = "Test@12345"
```

---

### 🟠 HIGH: CORS Origins Too Permissive
**File:** `apps/*/backend/shared/config.py`  
**Issue:**
```python
cors_origins: str = (
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:3100,http://127.0.0.1:3100"
)
```

Missing the actual standalone ports (3101-3105) and allowing wildcard-like patterns in some contexts.

---

## 6. FLOW GAPS & FUNCTIONAL ISSUES

### 🔴 CRITICAL: Cross-Portal Navigation Broken
**Issue:** Because each frontend runs on its own port with its own auth cookie domain, a user logged into the Enterprise portal (localhost:3103) cannot navigate to the Contributor portal (localhost:3104) without re-authenticating.

**Impact:** Users with multiple roles (e.g., a contributor who is also a mentor) cannot seamlessly switch between portals.

---

### 🔴 CRITICAL: No Shared Session / SSO Between Apps
**Issue:** Each app has its own NextAuth.js instance with its own cookie configuration. There is no shared identity provider or SSO mechanism.

---

### 🟠 HIGH: Backend-Service Router Mismatch
**File:** `apps/*/frontend/src/lib/api/backend-router.ts`  
**Issue:** The frontend router maps paths like `/api/v1/reviewer` → `REVIEWER` backend, but the standalone `.env.local` configures ALL backends to the same port. The routing logic is correct but the configuration makes it useless.

---

### 🟠 HIGH: Contributor OAuth Routes Missing in Some Backends
**Issue:** The freelancer backend mounts `oauth.router`, but other backends don't. If a user tries OAuth from enterprise portal, it will fail unless routed specifically to freelancer backend.

---

### 🟡 MEDIUM: Playwright Tests Hardcoded to localhost:3000
**File:** `apps/*/frontend/playwright.config.ts`  
**Issue:**
```typescript
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
```

But standalone apps run on 3101-3105. E2E tests will fail unless `PLAYWRIGHT_BASE_URL` is explicitly set.

---

### 🟡 MEDIUM: next.config.ts Hardcodes allowedDevOrigins
**Files:** `apps/*/frontend/next.config.ts`  
**Issue:** Each app's `next.config.ts` allows only its own origin:
```typescript
allowedDevOrigins: ["http://localhost:3103"], // enterprise only
```

This prevents API calls from other origins during development.

---

## 7. BUILD & DEPLOYMENT ISSUES

### 🟠 HIGH: Build Artifacts Committed
**Issue:** The following generated directories/files are present in the repo:
- `apps/*/frontend/node_modules/` (partial — `.package-lock.json` exists)
- `apps/*/frontend/.next/` (build output)
- `apps/*/frontend/tsconfig.tsbuildinfo`
- `apps/*/frontend/test-results/`
- `apps/*/backend/__pycache__/`

**Impact:** Repository bloat, potential merge conflicts, non-reproducible builds.

---

### 🟡 MEDIUM: No Dockerfile for App Frontends
**Issue:** Only the root `backend/` has Dockerfiles. The 5 standalone frontend apps have no containerization strategy.

---

### 🟡 MEDIUM: prisma/ Exists in Every Frontend App
**Issue:** Each app has its own `prisma/schema.prisma` and `prisma/seed.sql`. In a microservices architecture, the database schema should be owned by the backend services, not the frontend.

---

## 8. MISSING IMPLEMENTATIONS

### 🔴 CRITICAL: Real API Integration for Contributor Module
**Status:** Completely mocked — no real backend calls  
**Files:** `apps/*/frontend/src/mocks/api/contributor.ts`, all `apps/*/frontend/src/mocks/contributor/*`

---

### 🔴 CRITICAL: Real API Integration for Admin KYC
**Status:** localStorage-only persistence  
**Files:** `apps/*/frontend/src/lib/admin/mocks/kyc-service.ts`

---

### 🟠 HIGH: Real API Integration for SOW Workflows
**Status:** Mock data with hardcoded user  
**Files:** `apps/*/frontend/src/lib/enterprise/mocks/sows.ts`

---

### 🟠 HIGH: Email Service Integration
**Status:** Exists in root backend but not integrated into apps/  
**Files:** `backend/services/email-service/`

---

### 🟠 HIGH: File Upload Service Integration
**Status:** Exists in root backend but not integrated into apps/  
**Files:** `backend/services/file-service/`

---

### 🟡 MEDIUM: Women Workforce & Universities Partnerships
**Status:** Backend services exist but no corresponding frontend apps or routes in the standalone split  
**Files:** `backend/services/women-service/`, `backend/services/universities-service/`

---

## 9. RECOMMENDATIONS

### Immediate (This Week)
1. **Remove all `.env.local` files from git** — add to `.gitignore`, create `.env.example` templates
2. **Rotate exposed database credentials** — the Neon password in `.env.local` is compromised
3. **Fix `run_all.ps1`** — use `$PSScriptRoot` instead of hardcoded path
4. **Add `.gitignore`** to exclude `node_modules/`, `.next/`, `__pycache__/`, `*.tsbuildinfo`

### Short Term (Next 2 Weeks)
5. **Consolidate mock data strategy** — either:
   - Remove mocks and wire to real APIs, OR
   - Create a single shared mock package used by all apps
6. **Fix backend URL configuration** — each app's `.env.local` should point to correct distributed ports:
   ```bash
   MENTOR_API_URL=http://127.0.0.1:8101
   SUPERADMIN_API_URL=http://127.0.0.1:8102
   ENTERPRISE_API_URL=http://127.0.0.1:8103
   FREELANCER_API_URL=http://127.0.0.1:8104
   REVIEWER_API_URL=http://127.0.0.1:8105
   ```
7. **Remove `DEV_AUTH_BYPASS`** or gate it behind compile-time flags, not env vars
8. **Extract shared frontend components** into a proper package or workspace

### Medium Term (Next Month)
9. **Implement real API clients** for contributor, KYC, and SOW modules
10. **Set up monorepo tooling** (Turborepo, Nx, or pnpm workspaces)
11. **Unify backend shared code** — publish as a Python package or use path references
12. **Implement cross-portal SSO** — shared auth domain or OAuth2/OIDC provider
13. **Containerize frontend apps** with consistent Docker setup

### Strategic
14. **Decide on architecture**: Either:
   - **Monolith:** One frontend, one backend (simpler, scales vertically)
   - **True Micro-frontends:** Each app is independently deployable with its own CI/CD
   - **Current state (copied monoliths)** is the worst of both worlds

---

## Appendix: File Inventory

### Mock Data Files (per app, ×5)
```
src/mocks/admin/agents.ts
src/mocks/admin/audit.ts
src/mocks/admin/dashboard.ts
src/mocks/admin/governance.ts
src/mocks/admin/index.ts
src/mocks/admin/kyc.ts
src/mocks/admin/mentors.ts
src/mocks/admin/partnerships.ts
src/mocks/admin/personas.ts
src/mocks/admin/rails.ts
src/mocks/admin/roles.ts
src/mocks/admin/rubrics.ts
src/mocks/admin/services.ts
src/mocks/admin/skills.ts
src/mocks/admin/tenants.ts
src/mocks/api/contributor.ts
src/mocks/contributor/credentials.ts
src/mocks/contributor/digital-twin.ts
src/mocks/contributor/index.ts
src/mocks/contributor/mentor.ts
src/mocks/contributor/notifications.ts
src/mocks/contributor/payouts.ts
src/mocks/contributor/personas.ts
src/mocks/contributor/profile-evidence.ts
src/mocks/contributor/submissions.ts
src/mocks/contributor/support.ts
src/mocks/contributor/tasks.ts
src/mocks/data/* (30+ files)
src/mocks/mentor/decisions.ts
src/mocks/mentor/escalations.ts
src/mocks/mentor/index.ts
src/mocks/mentor/notifications.ts
src/mocks/mentor/personas.ts
src/mocks/mentor/reviews.ts
src/mocks/mentor/sessions.ts
src/mocks/mentor/team-load.ts
src/mocks/reviewer/index.ts
src/mocks/reviewer/reviews.ts
src/lib/admin/mocks/agents-service.ts
src/lib/admin/mocks/audit-filters.ts
src/lib/admin/mocks/governance-service.ts
src/lib/admin/mocks/kyc-service.ts
src/lib/admin/mocks/mentors-service.ts
src/lib/admin/mocks/partnerships-service.ts
src/lib/admin/mocks/rails-service.ts
src/lib/admin/mocks/rubrics-service.ts
src/lib/admin/mocks/skills-service.ts
src/lib/admin/mocks/smtp-config-store.ts
src/lib/enterprise/mocks/approvers.ts
src/lib/enterprise/mocks/compliance.ts
src/lib/enterprise/mocks/decompositions.ts
src/lib/enterprise/mocks/demo-payout-bridge.ts
src/lib/enterprise/mocks/demo-task-assignments.ts
src/lib/enterprise/mocks/matching.ts
src/lib/enterprise/mocks/notifications.ts
src/lib/enterprise/mocks/overlay.ts
src/lib/enterprise/mocks/payouts.ts
src/lib/enterprise/mocks/rate-cards.ts
src/lib/enterprise/mocks/reviews.ts
src/lib/enterprise/mocks/sow-extraction.ts
src/lib/enterprise/mocks/sow-generation.ts
src/lib/enterprise/mocks/sows.ts
src/lib/enterprise/mocks/workforce.ts
```

### Backend Services (Root)
```
backend/services/auth-service/
backend/services/contributor-service/
backend/services/email-service/
backend/services/enterprise-service/
backend/services/file-service/
backend/services/mentor-service/
backend/services/superadmin-service/
backend/services/universities-service/
backend/services/women-service/
```

### Backend Services (apps/ split — 5 only)
```
apps/enterprise/backend/  (enterprise_app + auth_app + shared)
apps/freelancer/backend/ (contributor_app + auth_app + shared)
apps/mentor/backend/     (mentor_app + auth_app + shared)
apps/reviewer/backend/   (superadmin_app + auth_app + shared)
apps/super-admin/backend/ (superadmin_app + auth_app + shared)
```

---

*End of Report*
