# AGAPP Full-Stack Testing & Bug Prevention Guide

**Document ID**: `TEST-GUIDE-2026-08-01`  
**System Target**: AGAPP Monorepo (`apps/citizen-web`, `apps/admin`, `apps/api`)  
**Standard**: ISO/IEC/IEEE 29119 Software Testing Standard & OWASP Testing Framework  

---

## 1. Executive Overview & Testing Strategy

To ensure high reliability, zero visual glitches, and ironclad backend security, AGAPP employs a **3-Tiered Automated Testing Architecture**:

```
                  ┌──────────────────────────────┐
                  │    Tier 3: Frontend Routes   │  (14 Live Web Routes, Latency,
                  │      & Hydration Health      │   React Exception Crash Scans)
                  ├──────────────────────────────┤
                  │    Tier 2: Backend API &     │  (NestJS Guards, DTO Validation,
                  │      Contract Security       │   Auth Tokens, Rate Limiting)
                  ├──────────────────────────────┤
                  │    Tier 1: System Integrity  │  (Dynamic Geolocation, DB Triggers,
                  │      & Codebase Assertions   │   Security Headers, No Forum Links)
                  └──────────────────────────────┘
```

---

## 2. One-Click Test Execution

Run the complete test suite across all three tiers with a single command from `agapp-system`:

```bash
npm test
```

### Direct Component Scripts:
| Target Area | Command | Purpose |
| :--- | :--- | :--- |
| **All Test Suites** | `npm test` | Master runner orchestrating all test suites. |
| **System Integrity** | `node scripts/test-system-integrity.js` | Codebase assertions, database trigger checks, & security headers. |
| **Backend API** | `node scripts/test-api-contracts.js` | NestJS DTO validation, 401 guard verification, & token checks. |
| **Frontend Routes** | `node scripts/test-frontend-routes.js` | Scans all 14 citizen routes for 200 OK & hydration health. |
| **TypeScript Typecheck** | `npm run build:all` or `npx tsc --noEmit` | Static typing integrity across all workspaces. |

---

## 3. Test Suite Breakdown

### Tier 1: System & Security Integrity ([test-system-integrity.js](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/scripts/test-system-integrity.js))
- **Dynamic Geolocation**: Asserts that `/report` and `/map` derive coordinates dynamically from `activeLgu` rather than static fallbacks.
- **HTTP Security Headers**: Validates `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
- **Forum Decommissioning**: Asserts zero queries or navigation links to `/forum` remain in active UI components.
- **Database Trigger**: Validates that `003_secure_auth_trigger_and_rls.sql` enforces `role = 'CITIZEN'` and `SECURITY DEFINER`.

### Tier 2: Backend API Contracts ([test-api-contracts.js](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/scripts/test-api-contracts.js))
- **Authentication Guard**: Verifies `POST /api/chatbot/ask` and `POST /api/reports/verify-image` return `401 Unauthorized` without a valid Bearer token.
- **DTO Validation**: Ensures malformed or missing payload fields return `400 Bad Request` via NestJS `ValidationPipe`.
- **Forged Token Rejection**: Confirms invalid JWTs are rejected immediately.

### Tier 3: Frontend Route Scanner ([test-frontend-routes.js](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/scripts/test-frontend-routes.js))
- **Route Availability**: Hits all 14 routes on `http://localhost:3001` (`/`, `/services`, `/report`, `/map`, `/news`, `/guides`, `/emergency`, `/chatbot`, `/verify`, `/tracking`, `/auth/login`, `/auth/register`, `/auth/otp`, `/lgu-select`).
- **Hydration Crash Detection**: Scans HTML response bodies for Next.js runtime crash strings (`Unhandled Runtime Error`).
- **Performance Benchmarks**: Measures route latency (target: `< 250ms`).

---

## 4. How to Clean Up / Remove Tests

All test scripts are self-contained in `scripts/` and have **zero external binary dependencies**. If you ever wish to remove them:

```powershell
Remove-Item scripts/test-runner.js
Remove-Item scripts/test-system-integrity.js
Remove-Item scripts/test-api-contracts.js
Remove-Item scripts/test-frontend-routes.js
```
