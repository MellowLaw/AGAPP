# AGAPP System Requirements - Complete Edition

> **Version**: 2.1 - Production Edition  
> **Date**: June 2026  
> **Based on**: Public APIs + Original Manuscript + User Feedback

---

## Executive Summary

Complete, production-ready AGAPP scope focusing on a fully working, feature-complete LGU system in the Philippines.

### Key Clarifications
- **Context7**: Developer tool only (NOT part of end-user system)
- **APIs**: Free/OpenSource only (OpenStreetMap, no paid services)
- **Weather**: Optional - skip unless disaster alerts needed
- **Payment**: None - pay at municipal hall
- **Authentication**: Email + Password (Supabase Auth) + GPS geofence

### Final Scope
- **Mobile**: 2 apps (Citizen + Field Officer)
- **Web**: 2 dashboards (LGU Admin + Super Admin)
- **Issue Reporting**: 3 categories only
- **Services**: 8 types (confirm with municipal hall first)
- **Forum**: Discord-style channels (text only)

---

## Current Implementation & Progress (June 2026)

This section details the actual implementation status of AGAPP.

### What AGAPP is
- **Digital front door for an LGU** where citizens can:
  - Submit road/drainage/stray pet reports with photos and GPS.
  - Request documents and permits (birth certificate, business permit, etc.).
  - Join text-only community channels (forum) and talk to a simple FAQ chatbot.
- **Back-office tools** for LGU staff and super admins to triage reports, process service requests, moderate the forum, and see cross-LGU analytics.

### What is implemented right now
- **Monorepo and Tech Stack**
  - Root at `agapp-system` with `apps/admin` (Next.js 14), `apps/mobile` (Expo SDK 54, React Native 0.81), `apps/api` (NestJS), and `supabase/` for Postgres schema/RLS policies.
  - Shared types and validation schemas in `packages/shared` consumed by all apps.

- **Web Admin (apps/admin)**
  - **Unified Login** wired to Supabase Auth with email-based role routing (`/super`, `/lgu/dashboard`, `/personnel/dashboard`).
  - **LGU Admin UI** (partially wired to Supabase):
    - Dashboard, Issue Reports, News/Announcements, and Service Requests are fully wired to read/write real-time data from Supabase.
    - Forum page is currently mock-data driven and needs to be connected to the database.
    - Assignment history log and status transition modals are fully functional.
  - **Super Admin UI**:
    - Cross-LGU analytics showing performance stats, timeframes, and CSV export.
    - LGU directory allowing activation/deactivation, adding new LGUs, and CSV export.
  - **Performance UX**:
    - Lazy loading for charts and icon sets to optimize bundles.
    - Responsive layouts for desktop, tablet, and mobile views.

- **API Layer (apps/api)**
  - NestJS project containing controllers for auth, LGUs, reports, services, forum, and chatbot.
  - `SupabaseService` initializes a client and queries Postgres tables directly. If env variables are absent, it falls back to a simulated mock-db in-memory.
  - Chatbot uses keyword-based FAQ scoring first and falls back to Gemini `gemini-1.5-flash` API.
  - PDF Generation backend ready for certificate requests.

- **Database (supabase/)**
  - `schema.sql` defines the full multi-tenant schema with PostGIS geofencing helper `verify_geofence()`, a forum profanity checking trigger, and Row-Level Security (RLS) policies.
  - `seed.sql` contains initial municipalities, users, FAQ entries, and sample reports.
  - `storage_setup.sql` configures Supabase Storage buckets for reports and services documents.

- **Mobile (apps/mobile)**
  - Expo application using React Native 0.81, running inside Expo Go with Metro.
  - Wired to Supabase Auth for Email + Password login and signup.
  - Citizen reports capture photos (via `expo-camera`), auto-fetch GPS location (via `expo-location`), verify geofencing, and submit to Supabase.
  - E-services request portal lets citizens apply for certificates and view reference codes.
  - Chatbot FAQ client and interactive suggestions.

### What still needs to be done (Roadmap / TODO)
- **Connect Admin Forum to Supabase:** Update the admin forum page to fetch and moderate real posts instead of using mock data.
- **Configure Mobile Env vars:** Update `apps/mobile/.env` with the actual Supabase URL and anon key to test full client-to-cloud connections.
- **Offline Mode & Sync:** Finish offline capability in the mobile app so inspection tasks can be saved locally and synced once connectivity is restored.
- **Real YOLO Model Integration:** Replace the mobile YOLOv11 mock confidence logic with a client-side or server-side inference pipeline.
- **Push Notification Pipeline:** Wire Expo Push / FCM notifications for status changes.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Citizen App      │  Field Officer App                       │
│  (Expo SDK 54)    │  (Expo SDK 54 - Offline capable)         │
│  • Reports        │  • Field inspections                     │
│  • Services       │  • Photo documentation                   │
│  • Forum          │  • Offline queue sync                    │
│  • Chatbot        │                                          │
├─────────────────────────────────────────────────────────────┤
│  LGU Admin Dashboard      │  Super Admin Dashboard            │
│  (Next.js 14)             │  (Next.js 14)                      │
│  • Service queue          │  • Multi-LGU management            │
│  • Report routing         │  • Analytics                       │
│  • Forum moderation       │  • User management                 │
│  • Staff management       │                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   API Layer (NestJS)      │   │   Supabase (PostgreSQL)   │
│   • Auth Controller         │   │   + PostGIS extension     │
│   • Report Controller       │   │                           │
│   • Service Controller      │   │   Tables:                 │
│   • Forum Controller        │   │   • lgus                  │
│   • Chatbot Controller      │   │   • users                 │
│   • LGU Controller          │   │   • reports               │
│                             │   │   • service_requests      │
│   External APIs:            │   │   • forum_channels        │
│   • Nominatim (OSM)         │   │   • forum_posts           │
│   • IP Geolocation          │   │   • audit_logs            │
└───────────────────────────┘   └───────────────────────────┘
```

---

## Authentication System (Priority #1) - All Roles

### Web Admin Portal - Unified Login
**Design Philosophy**: No public role selection, email auto-detects role

**Login Flow:**
```
1. User enters Email + Password on single login page (/)
2. System validates credentials
3. System looks up role in database:
   - SUPER_ADMIN → redirect to /super
   - LGU_ADMIN → redirect to /lgu/dashboard
   - LGU_PERSONNEL → redirect to /personnel/dashboard
4. User automatically lands on correct dashboard
```

**Benefits:**
- No public exposure of different admin levels
- Cleaner UX - single entry point
- More secure - role determined server-side
- Easier to maintain

**Demo Accounts:**
| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| superadmin@agapp.gov.ph | password123 | Super Admin | /super |
| admin@liliw.gov.ph | password123 | LGU Admin | /lgu/dashboard |
| staff@liliw.gov.ph | password123 | LGU Personnel | /personnel/dashboard |

---

### 1. CITIZEN (Mobile App)
**Login Method**: Email + Password (via Supabase Auth)

**First Time Registration:**
```
1. Consent to Privacy Notice (RA 10173) and GPS sharing
2. Enter Email and Password
3. Tap "Create an account" (calls Supabase signUp)
4. Select LGU from list (persists LGU profile reference)
5. Grant Camera & GPS location permissions
6. Done
```

**Returning Login:**
```
1. Enter Email and Password
2. Tap "Sign in"
3. Done
```

**Password Recovery:**
```
1. Tap "Forgot password"
2. Reset link sent to registered email
3. Set new password
```

---

### 2. LGU FIELD OFFICER (Mobile App)
**Login Method**: Email + Password (set by LGU Admin)

**Account Creation:**
```
Created by LGU Admin:
1. LGU Admin creates account (email, temp password, assign office)
2. Officer receives email with credentials
3. First login: Change temp password
4. Set up PIN for quick re-login (optional)
```

**Returning Login:**
```
Option A: Email + Password
Option B: PIN (if enabled)
```

---

### 3. LGU ADMIN (Web Dashboard)
**Login Method**: Email + Password

**Account Types:**
- **Primary LGU Admin**: Created by Super Admin when LGU is provisioned
- **Additional LGU Admins**: Created by Primary LGU Admin

**Login Flow:**
```
1. Enter Email
2. Enter Password
3. 2FA via Email (optional, configurable)
4. Dashboard access
```

**Password Recovery:**
```
1. Enter Email
2. Reset link sent to email
3. Set new password
```

---

### 4. LGU PERSONNEL (Web Dashboard)
**Login Method**: Email + Password (created by LGU Admin)

**Account Creation:**
```
LGU Admin creates account:
- Email
- Temporary password
- Office assignment (Engineering, Health, etc.)
- Permissions (view only, edit, approve)
```

**Login Flow:**
```
1. Enter Email
2. Enter Password
3. Access limited dashboard based on permissions
```

---

### 5. SUPER ADMIN (Web Dashboard)
**Login Method**: Email + Password + 2FA

**Account Creation:**
```
Manually created in database (highest security)
```

**Login Flow:**
```
1. Enter Email
2. Enter Password
3. 2FA Code (email or authenticator app)
4. Full system access
```

---

### Verification Methods Summary

| Role | Entry Point | Method | Verification |
|------|-------------|--------|--------------|
| **Citizen** | Mobile App | Email + Password | GPS Geofence Check on report submission |
| **Field Officer** | Mobile App | Email + Password | Created by LGU Admin |
| **LGU Personnel** | Web Portal (Unified) | Email + Password (auto-routed) | Created by LGU Admin |
| **LGU Admin** | Web Portal (Unified) | Email + Password (auto-routed) | Created by Super Admin |
| **Super Admin** | Web Portal (Unified) | Email + Password + 2FA | Manual database creation |

### Skip Barangay Certificate
- Too much friction for citizens
- GPS Geofence validation handles residency checking without certificates

---

## UI Design System (Minimalist)

### Design Principles
- **No gradients** - Flat colors only
- **Minimal borders** - 1px where necessary, none where possible
- **Necessary shadows only** - Subtle elevation when needed
- **Clean typography** - System fonts, clear hierarchy
- **Easy to use** - Obvious actions, clear feedback
- **Animations later** - Functional first, polish second

### Color Palette
```
Primary:    #1a1a1a    (Near black - text, primary buttons)
Secondary:  #f5f5f5    (Light gray - backgrounds, cards)
Accent:     #2563eb    (Blue - links, active states)
Success:    #16a34a    (Green - success states)
Warning:    #ca8a04    (Yellow - warnings)
Error:      #dc2626    (Red - errors, reject)
Background: #fafafa    (Off-white - page background)
Border:     #e5e5e5    (Light gray - borders)
Text:       #171717    (Dark - primary text)
TextMuted:  #737373    (Gray - secondary text)
```

### Layout Pattern (All Dashboards)
```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO]    Page Title                    [User Menu]     │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  NAV     │              MAIN CONTENT AREA                   │
│  SIDEBAR │                                                  │
│          │  ┌────────────────────────────────────────────┐  │
│  ─────   │  │  Cards / Tables / Forms                    │  │
│  ─────   │  │                                            │  │
│  ─────   │  │                                            │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Sidebar Navigation (All Roles)
- Width: 240px
- Background: white
- Border-right: 1px solid #e5e5e5
- Active item: Light background + left border accent
- Icons: Simple line icons (Phosphor icons)

### Components

#### Buttons
```
Primary:    bg-[#1a1a1a] text-white hover:bg-[#333]
Secondary:  bg-white border border-[#e5e5e5] hover:bg-[#f5f5f5]
Danger:     bg-[#dc2626] text-white hover:bg-[#b91d1d]
Ghost:      transparent hover:bg-[#f5f5f5]
```

#### Cards
```
- Background: white
- Border: 1px solid #e5e5e5 (or none if on white bg)
- Border-radius: 8px
- Padding: 24px
- Shadow: none (or subtle 0 1px 3px rgba(0,0,0,0.1) if elevated)
```

#### Tables
```
- Header: bg-[#f5f5f5], font-medium
- Rows: hover:bg-[#fafafa]
- Borders: 1px solid #e5e5e5 between rows
- Status badges: Colored pills
```

#### Forms
```
- Input: border-[#e5e5e5], rounded-md, focus:border-[#2563eb]
- Label: text-sm, text-[#737373]
- Helper text: text-xs, text-[#737373]
```

### Responsive Breakpoints
- Mobile: < 768px (sidebar becomes drawer)
- Tablet: 768px - 1024px
- Desktop: > 1024px (full sidebar)

---

## UI Pages Created (Admin Dashboard)

### 1. Login Page (`/app/page.tsx`)
- **Unified Login** - Single entry point for all web admin roles
- Email auto-detects role from database
- Automatic redirect based on role:
  - Super Admin → `/super`
  - LGU Admin → `/lgu/dashboard`
  - LGU Personnel → `/personnel/dashboard`
- Demo quick-login buttons (all 3 roles)
- Minimalist card-based design

### 2. LGU Admin Pages (`/app/lgu/`)

| Page | Path | Features |
|------|------|----------|
| **Dashboard** | `/lgu/dashboard` | Stats cards, bar charts, recent submissions table |
| **Issue Reports** | `/lgu/reports` | Split view: list + detail panel, filter by status, AI detection badge |
| **Forum Moderation** | `/lgu/forum` | Pending/Flagged/All tabs, approve/reject/edit actions |
| **News/Announcements** | `/lgu/news` | Create form + mobile preview, schedule/publish |
| **Service Requests** | `/lgu/services` | Queue management, QR tracking, payment confirmation |

### 3. Super Admin Pages (`/app/super/`)

| Page | Path | Features |
|------|------|----------|
| **Cross-LGU Analytics** | `/super/page.tsx` | Multi-LGU filter tabs, stats, charts, performance leaderboard |

### 4. Shared Components (`/components/`)

| Component | Location | Props | Features |
|-----------|----------|-------|----------|
| **Button** | `ui/Button.tsx` | variant, size, isLoading | Primary, Secondary, Danger, Ghost variants |
| **Card** | `ui/Card.tsx` | padding, noBorder, onClick | Container with hover states |
| **CardHeader** | `ui/Card.tsx` | title, subtitle, action | Header with optional action |
| **Input** | `ui/Input.tsx` | label, error, helperText | Form input with validation |
| **TextArea** | `ui/Input.tsx` | label, error, helperText | Multi-line input |
| **Badge** | `ui/Badge.tsx` | variant | Status indicators |
| **BarChart** | `ui/Chart.tsx` | data | Horizontal bar chart |
| **LineChart** | `ui/Chart.tsx` | data | Line graph with trends |
| **PieChart** | `ui/Chart.tsx` | data | Pie chart with legend |
| **Toast** | `ui/Toast.tsx` | message, type, onClose | Auto-dismiss notifications |
| **useToast** | `ui/Toast.tsx` | - | Toast state management hook |
| **Modal** | `ui/Modal.tsx` | isOpen, onClose, title, footer | Dialog with backdrop |
| **ConfirmModal** | `ui/Modal.tsx` | isOpen, onClose, onConfirm | Confirmation dialog |
| **Pagination** | `ui/Pagination.tsx` | currentPage, totalPages, onPageChange | Page navigation |
| **Search** | `ui/Search.tsx` | value, onChange, onSearch | Debounced search input |
| **useSearch** | `ui/Search.tsx` | items, searchFields | Search with filtering hook |
| **LoadingSpinner** | `ui/LoadingSpinner.tsx` | size | Loading indicator |
| **Sidebar** | `layout/Sidebar.tsx` | role, lguName | Navigation sidebar |
| **Header** | `layout/Header.tsx` | title, action, role | Top bar with UserMenu |
| **UserMenu** | `layout/UserMenu.tsx` | role | User dropdown with sign out |
| **DashboardLayout** | `layout/DashboardLayout.tsx` | role, lguName, title, action | Page wrapper |

### 5. Authentication Components (`/components/auth/`)

| Component | Purpose |
|-----------|---------|
| **UnifiedLogin** | Single login form for all web admin roles (auto-routes based on role) |
| **LoginLayout** | Centered card wrapper for login pages |

**Note**: Separate login components for each role are no longer needed since we use unified login with email-based role detection.

---

## Issue Reporting (3 Categories Only)

### Categories & Sub-Types

| Category | Sub-Types | Auto-Routing |
|----------|-----------|--------------|
| **1. Road Damage** | Pothole, Crack, Faded markings, Damaged pole | Engineering Office |
| **2. Drainage/Canal** | Clogged, Broken cover, Flooding | Engineering Office |
| **3. Stray/Lost Pets** | Dog, Cat | Agriculture/MDRRMO |

### YOLOv8 Detection
- **Scope**: Road damage only (pothole, crack detection)
- **Skip**: Pet detection, drainage detection (manual report)
- **Confidence**: 0.85 threshold

### Report Flow
```
Citizen submits report
        ↓
GPS Check: Within LGU? 
        ↓
Yes → AI Check: Road damage detected?
        ↓
Yes → Auto-acknowledge + route to Engineering
No  → Queue for manual review
        ↓
Status Tracking: Pending → Acknowledged → In Progress → Resolved
        ↓
Citizen gets push notification at each step
```

---

## E-Services Portal

### Important: Interview Municipal Hall First
Before implementing, confirm with LGU:
1. What documents do they actually process?
2. What information is required for each?
3. Current workflow (so we don't break it)
4. Which office handles what

### Tentative 8 Service Types

| Category | Services | Office |
|----------|----------|--------|
| **Civil Registry** | Birth Cert, Marriage Cert, Death Cert, CENOMAR | Civil Registrar |
| **Business** | Business Permit New/Renewal | Business Permit |
| **Taxation** | Cedula (Community Tax Cert) | Treasurer |
| **Health** | Sanitary Permit, Health Certificate | Health Office |

### NO Online Payment
- Request online → Get reference number
- Pay at municipal hall cashier
- Upload proof of payment (receipt photo)
- Continue processing

---

## Forum System (Flat Feed)

### Structure
A unified post feed per LGU (no separate channels). Users can submit text posts to the community board.

### Features
- Citizens write and publish text-only posts.
- Text only (no images for now).
- Moderation filter checks for bad words.

### Moderation
- PostgreSQL trigger (`check_forum_profanity`) automatically intercepts new/updated posts and flags them.
- If flagged, `is_approved` becomes `false` and offending keywords are recorded.
- LGU Admin can review and approve flagged posts, edit content, or delete posts from the dashboard.

---

## Chatbot

### Simple 2-Tier Pipeline
```
User Query
    ↓
1. Keyword Match (FAQs) → Match? Return answer
    ↓
2. Gemini AI (gemini-1.5-flash) → Generate response
    ↓
Fallback: "Would you like to speak with LGU staff?"
```

### Skip Context7 Integration
- Just use Gemini + predefined FAQ list
- Context7 is for developers, not end users

---

## LGU Field Officer App

### Purpose
For LGU personnel who do field inspections (Engineering, Agriculture, etc.)

### Key Features
| Feature | Description |
|---------|-------------|
| **Offline Mode** | Download daily tasks, sync when connected |
| **Task Queue** | Assigned reports to inspect |
| **Photo Documentation** | Before/after photos |
| **Status Update** | Update report status from field |
| **Signature** | Digital signature for verification |

---

## API Integrations (Free Only)

### Maps & Geocoding

| Service | Use Case | Cost |
|---------|----------|------|
| **OpenStreetMap (Nominatim)** | Free geocoding, map tiles | **FREE** |
| **IP Geolocation** | Auto-detect approximate location | Free tier |
| **react-native-maps** | Map component for mobile | FREE (OSM tiles) |

### Skip These (Too Complex/Expensive)
- ❌ Mapbox (requires API key, billing)
- ❌ Google Maps (expensive at scale)
- ❌ Weather APIs (unless needed)
- ❌ SMS APIs (use email/OTP instead)

---

## Notification System (Simple)

### Push Notifications Only
- Expo Push (free tier: ~10k/month)
- Firebase FCM (free)

### Notification Types
- Report status updates
- Service request updates
- Forum replies
- LGU announcements (news)

### Skip SMS/Email
- Push is sufficient
- Add later if needed

---

## Database Schema (Clean & Simple)

### Tables

```sql
-- 1. LGUS (Local Government Units)
CREATE TABLE lgus (
    id text PRIMARY KEY, -- 'liliw-laguna', 'nagcarlan-laguna', etc.
    name text NOT NULL,
    logo text NOT NULL,
    banner_url text,
    primary_color text NOT NULL,
    secondary_color text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    boundary_geojson jsonb, -- Polygon for geofence
    is_active boolean DEFAULT true,
    onboarding_fee_paid boolean DEFAULT false,
    feature_flags jsonb DEFAULT '{"chatbot": true, "potholeDetection": true, "forum": true}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 2. USERS (Unified Auth accounts)
CREATE TABLE users (
    id uuid PRIMARY KEY, -- Syncs with Supabase Auth
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (role IN ('SUPER_ADMIN', 'LGU_ADMIN', 'LGU_PERSONNEL', 'CITIZEN')),
    lgu_id text REFERENCES lgus(id) ON DELETE SET NULL,
    barangay text,
    notification_preferences jsonb DEFAULT '{"push": true, "sms": true, "email": true}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. OFFICES (per-LGU departments)
CREATE TABLE offices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type text, -- e.g., 'Engineering', 'Civil Registry'
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 4. REPORTS (Issue Reporting - 3 categories)
CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    category text NOT NULL CHECK (category IN ('pothole', 'clogged_drainage', 'stray_animal')),
    description text,
    photo_url text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    barangay text NOT NULL,
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected')),
    assigned_office text, -- office name string
    assigned_office_id uuid REFERENCES offices(id) ON DELETE SET NULL,
    sla_tier text CHECK (sla_tier IN ('simple', 'complex', 'highly_technical')),
    sla_due_date timestamptz,
    ml_confidence double precision DEFAULT 1.0,
    ml_verified boolean DEFAULT true,
    is_low_credibility boolean DEFAULT false,
    rating integer CHECK (rating BETWEEN 1 AND 5),
    feedback text,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 5. SERVICE_REQUESTS (E-Services)
CREATE TABLE service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number text UNIQUE NOT NULL,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    service_type text NOT NULL, -- e.g. "Birth Certificate Request"
    office_name text NOT NULL, -- e.g. "Civil Registrar"
    office_id uuid REFERENCES offices(id) ON DELETE SET NULL,
    status text DEFAULT 'Submitted' NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'In Progress', 'Released', 'Rejected')),
    form_details jsonb NOT NULL,
    qr_code_url text NOT NULL,
    attachment_url text,
    assigned_personnel text,
    reject_reason text,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. FORUM_POSTS
CREATE TABLE forum_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    citizen_id uuid REFERENCES users(id) ON DELETE SET NULL,
    citizen_name text NOT NULL,
    content text NOT NULL,
    is_approved boolean DEFAULT true,
    flagged_keywords text[] DEFAULT '{}'::text[],
    created_at timestamptz DEFAULT now()
);

-- 7. AUDIT_LOGS
CREATE TABLE audit_logs (
    id bigserial PRIMARY KEY,
    lgu_id text REFERENCES lgus(id) ON DELETE SET NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    user_email text NOT NULL,
    user_role text NOT NULL,
    action text NOT NULL,
    ip_address text NOT NULL,
    details text NOT NULL,
    timestamp timestamptz DEFAULT now()
);

-- 8. NEWS_ANNOUNCEMENTS
CREATE TABLE news_announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE NOT NULL,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    title text NOT NULL,
    content text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
    scheduled_for timestamptz,
    published_at timestamptz,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    views integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 9. NOTIFICATIONS
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text,
    body text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 10. CHATBOT_FAQS (Predefined FAQ lists)
CREATE TABLE chatbot_faqs (
    id bigserial PRIMARY KEY,
    lgu_id text REFERENCES lgus(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    source text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    created_at timestamptz DEFAULT now()
);
```
    hit_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
```

---

## Implementation Roadmap

### Phase 1: Database & API Setup
- **Supabase Integration:** Setup Postgres instance and load schemas/seed data.
- **Unified Auth Flow:** Validate Next.js web unified router and Expo signup/login flows using Supabase Auth.
- **REST APIs:** Test all API endpoints in `apps/api` (NestJS) for data persistence.

### Phase 2: Feature Integration
- **Wired Web Components:** Connect LGU dashboard, reports table, service requests table, and announcements to real database query layers.
- **LGU Forum Moderator:** Replace mock forum feed inside admin with actual posts and enable moderation flows.
- **Mobile Reports Feed:** Enable reporting submissions inside the mobile app to sync with the database and pass PostGIS geofencing verification.

### Phase 3: Mobile Polishing & Offline Capabilities
- **Offline Storage Queue:** Store submitted reports locally when off-grid and sync when connectivity returns.
- **Task Assignments for Field Officers:** Fetch assigned issues list to the inspection app.
- **Live Notifications:** Set up push notification pipelines for SLA status changes and forum approvals.

---

## Environment Variables

```env
# apps/api/.env
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
JWT_SECRET=

# apps/mobile/.env
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# apps/admin/.env.local
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Key Decisions Summary

| Decision | Rationale |
|----------|-----------|
| **Email + Password** | Simpler integration using Supabase Auth natively |
| **GPS Geofence** | Ensures citizen belongs to LGU without barangay certificate |
| **3 Report Categories** | Focus on most common issues |
| **No Online Payment** | LGU may not have payment gateway; pay at hall |
| **Flat Forum Feed** | Simplified board interface, easier community moderation |
| **Free APIs Only** | OSM, no paid services needed |
| **No Context7 in System** | Developer tool only |
| **Field Officer App** | For actual LGU field work |

---

## Next Steps

1. **Verify Database Connectivity:** Apply `schema.sql` and `seed.sql` to the configured Supabase instance and test API queries.
2. **Wire Admin Forum page to Supabase:** Transition `/lgu/forum` page from mock data to real Supabase tables.
3. **Configure Mobile Client keys:** Update `apps/mobile/.env` with active credentials to test mobile client signup, report submissions, and document requests.
4. **Implement Mobile Offline Storage:** Add persistent SQLite/AsyncStorage queuing for offline geofence reports.
