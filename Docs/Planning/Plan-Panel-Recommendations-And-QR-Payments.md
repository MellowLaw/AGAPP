# Comprehensive Implementation Plan: Panel Recommendations & System Enhancements
**AGAPP System — Automated Governance and Public Service Platform**
*Updated: August 18, 2026*

---

## 1. Master Task Breakdown & Execution Sequence

```
TASK 1: Desktop Auth Overhaul & Enhanced Registration Validation
├── Desktop Split-Screen Layout for Login & Sign-Up (Hero branding left, form right)
├── Password Complexity Checker (Min 8 chars, >=1 uppercase, >=1 number) with live status pills
└── Debounced Realtime Unique Email Check (Queries users table and alerts via Toast/Status)

TASK 2: Navigation Clean-up: Forum Removal & News/Announcements Elevation
├── Remove Forum link from DesktopSidebar.tsx, BottomNav.tsx, and CommandSearchModal.tsx
├── Elevate News & Advisories as the primary civic communications channel
└── Ensure Citizen Home Screen and Search reflect this streamlined focus

TASK 3: AI Confidence Threshold Gating & Smart Queue Prioritization
├── Implement Confidence Gating in apps/api (tau = 0.60):
│   ├── Score >= 0.65: "AI Verified", prioritized to top of department queue
│   ├── 0.45 <= Score < 0.65: Flagged with is_low_credibility = true (Needs Review)
│   └── Score < 0.45: Returned to citizen with prompt for clearer photo
└── Add multi-tier Urgency + Credibility sorting in Admin Reports queue

TASK 4: Practical Dual-Mode QR Payment Cashier System
├── Citizen Web / Mobile: Digital QR Payment Pass modal with Ref No., Amount, and QR code
└── Admin Portal: Dual-Mode "Treasury QR Scanner" Modal & Dedicated Cashier View
    ├── Mode A: Live Device Camera / Webcam Scanner (using standard HTML5 / Web API)
    ├── Mode B: Manual Barcode / Reference Number Search (for USB scanner guns & typing)
    └── Action: Enter Official Receipt (OR) Number -> Updates status to PAID / PROCESSING

TASK 5: Academic & Research Package (UAT & Load Benchmark)
├── Docs/Testing/User-Acceptance-Testing-Protocol.md (SUS + ISO/IEC 25010 Rubrics & Surveys)
└── Docs/Testing/Performance-Load-Testing-Benchmark.md (k6 2,000-user concurrency test script)
```

---

## 2. Detailed Technical Specifications

### A. Desktop Auth Overhaul (Login & Register Pages)
- **Responsive Split-Screen Grid**:
  - `lg:grid lg:grid-cols-12 min-h-screen`:
    - **Left Hero Column (7 cols)**: Ambient gradient/ribbons background, official LGU seal, municipal name, and key feature badges (Digital Clearances, QR Claim Passes, Realtime Hazard Tracking).
    - **Right Auth Column (5 cols)**: Centered glassmorphic card with smooth focus states, tab toggle, and responsive touch targets.
- **Password Complexity Validation**:
  - Live 3-rule validator rendered under password input:
    1. Minimum 8 characters (`pw.length >= 8`)
    2. At least one uppercase letter (`/[A-Z]/.test(pw)`)
    3. At least one number (`/[0-9]/.test(pw)`)
  - Each rule displays a dynamic check indicator (green checkmark when satisfied, neutral/muted when pending).
- **Live Debounced Email Uniqueness Check**:
  - Debounced (400ms) query against `supabase.from('users').select('id').eq('email', email.trim()).single()`.
  - Displays instant badge:
    - 🟢 *Email available*
    - 🔴 *Email already registered (Please sign in instead)* + Toast alert.

---

### B. Practical QR Payment System for Treasury
- **Challenge Addressed**: Municipalities often lack specialized 2D barcode hardware; officers work on laptops, desktops with basic webcams, or municipal smartphones/tablets.
- **Dual-Mode Solution**:
  1. **In-Browser Camera / Webcam Scanner**:
     - Uses standard browser `navigator.mediaDevices.getUserMedia` with high-performance QR decoding.
     - Supports camera switching (Front webcam for laptops, Rear camera for mobile/tablets).
  2. **Keyboard Barcode Reader & Manual Input**:
     - Standard USB handheld 1D/2D barcode scanners emulate keyboard keystrokes ending with `Enter`.
     - An auto-focused input field listens for scans or manual entry of reference numbers (e.g. `REQ-2026-0816`).
  3. **Instant Cashier Action Modal**:
     - Renders applicant name, service type, fee due (e.g. ₱150.00).
     - Input field for **Official Receipt (OR) Number** (e.g. `OR-2026-98124`).
     - Clicking **"Confirm Cash Payment"** updates database `payment_status = 'PAID'`, `or_number = '...'`, and pushes the request to the department's processing queue in realtime.

---

### C. AI Confidence Threshold & Smart Prioritization Matrix
- **Confidence Tiers**:
  - **Tier 1 (High Confidence $\ge 0.65$)**: Auto-tagged with `"AI Verified — [Pothole/Stray Animal] Detected (XX%)"`. Prioritized to the top of the department queue.
  - **Tier 2 (Borderline $0.45 - 0.64$)**: Status `submitted`, flagged with `is_low_credibility = true` and amber warning badge for manual officer verification.
  - **Tier 3 (Low Confidence $< 0.45$)**: Status `returned_for_review`. Citizen receives modal/toast prompting: *"Photo unclear or subject not recognized. Please capture a clear, well-lit photo of the hazard."*
- **Prioritization Algorithm**:
  $$\text{Priority Score} = (\text{Urgency Weight} \times 0.45) + (\text{AI Credibility} \times 0.35) + (\text{SLA Elapsed} \times 0.20)$$

---

### D. Navigation & Forum Removal
- Remove `Community Forum` navigation links from:
  - `apps/citizen-web/src/components/layout/DesktopSidebar.tsx`
  - `apps/citizen-web/src/components/layout/BottomNav.tsx`
  - `apps/citizen-web/src/components/search/CommandSearchModal.tsx`
  - `apps/mobile/src/navigation/`
- Elevate `News & Advisories` in its place.

---

### E. Academic Research Package (UAT & Load Testing)
- Complete paper-ready evaluation instruments:
  - **System Usability Scale (SUS)** with standard 10-item 5-point Likert table.
  - **ISO/IEC 25010 Evaluation Rubric** across Functional Suitability, Usability, Performance, and Security.
  - **k6 Load Test script** simulating 100 &rarr; 500 &rarr; 2,000 concurrent virtual users.

---

## 3. Verification Plan
- **Typecheck & Linting**: `npx tsc --noEmit` on `apps/citizen-web`, `apps/admin`, `apps/mobile`, and `apps/api`.
- **Flow Validation**: Test login/register responsive layouts, password validation, unique email check, QR scanner modal, and report threshold logic.
