# Walkthrough: Citizen Web Desktop UI/UX Overhaul & Responsive Transition

We have completed the desktop UI/UX overhaul for **Citizen Web (`apps/citizen-web`)**, transitioning the app from its mobile-first viewport into a responsive multi-column desktop experience, featuring an **expanding frosted sidebar navigation** patterned directly after the Admin Panel (`apps/admin`).

---

## Key Achievements & Implementation Details

### 1. Desktop Navbar / Sidebar Pattern (Admin Parity)
- **Component**: [DesktopSidebar.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/components/layout/DesktopSidebar.tsx)
- **Behavior & Aesthetics**:
  - Fixed-left navbar with collapsible rail width (`w-[72px] hover:w-[300px] transition-all duration-300 ease-in-out h-screen z-40`).
  - Frosted gradient backdrop (`bg-gradient-to-r from-[#f6f4f1] via-[#f6f4f1]/95 to-transparent dark:from-[#292929] dark:via-[#292929]/95 to-transparent`).
  - Active link indicators with rounded pill backgrounds (`bg-accent/15 text-accent border border-accent/25`).
  - Official LGU Municipal Seal badge and selector button (`/lgu-select`).
  - Resident Profile card in the footer showing verification badge (*Verified / Unverified*) and resident full name.
  - Dark/Light Theme toggle switch built into the sidebar.
  - Smooth label animations using `opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap`.
- **Layout Integration**: [layout.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/layout.tsx)
  - `<DesktopSidebar className="hidden lg:flex" />` handles desktop navigation.
  - `<main className="flex-1 min-h-screen w-full relative lg:pl-[72px] pb-24 lg:pb-12">` accommodates sidebar width without layout shifting.
  - [BottomNav.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/components/layout/BottomNav.tsx) is rendered with `lg:hidden` (retaining full mobile experience for touch devices).

---

### 2. Multi-Column Responsive Page Overhauls

#### **Home Page (`/`)** — [page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/page.tsx)
- **Outer Layout**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6`
- **Asymmetric 2-Column Desktop Grid**:
  - **Left Column (`lg:col-span-7 xl:col-span-8`)**:
    - Resident greeting & location meta block with municipal mascot.
    - Expanded 8-Bento Quick Actions grid with wider touch/click targets.
    - Featured Updates Carousel with interactive preview cards.
    - Recent Activity & Applications tracker list.
  - **Right Sidebar Rail (`lg:col-span-5 xl:col-span-4 sticky top-6`)**:
    - Live Municipal Advisory & Announcement alert banner.
    - Trending Community Forum Discussion card with 1-click reply CTA.
    - Emergency Hotlines Quick Dial widget (MDRRMO 24/7 rescue desk).
    - Citizen's Charter guide quick link.

#### **E-Services (`/services`)** — [services/page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/services/page.tsx)
- **Outer Layout**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6`
- **Catalog Layout**:
  - **Left Rail (`lg:col-span-3 sticky top-6`)**: Vertical department filter rail with live badge count per office (*Civil Registrar, BPLO, Engineering, Social Welfare*).
  - **Right Grid (`lg:col-span-9`)**: 2-column responsive service cards (`grid grid-cols-1 md:grid-cols-2 gap-4`) with requirement lists, rates, processing times, and instant Claim QR modal flow.

#### **Hazard & Incident Reporting (`/report`)** — [report/page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/report/page.tsx)
- **Outer Layout**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6`
- **Category Selection**: 4-column responsive grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`) for pothole, drainage, stray pets, and utility poles.
- **Filing Form Split View**:
  - **Left Side (`lg:col-span-6`)**: Category switcher, incident description textarea, barangay dropdown, and live photo evidence capture / preview.
  - **Right Side (`lg:col-span-6`)**: Interactive Leaflet pinpoint map with live GPS locate button and submission trigger.

#### **Community Forum (`/forum`)** — [forum/page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/forum/page.tsx)
- **Outer Layout**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6`
- **3-Column Desktop Grid**:
  - **Left Column (`lg:col-span-3 sticky top-6`)**: Category tag rail (*General, Questions, Alerts, Suggestions, Events*) with topic count badges.
  - **Center Column (`lg:col-span-6`)**: Search input & discussion thread stream with avatar badges, likes toggle, and comment drawer.
  - **Right Column (`lg:col-span-3 sticky top-6`)**: Community standards guidelines and municipal activity statistics.

#### **Town Map Explorer (`/map`)** — [map/page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/map/page.tsx)
- Desktop floating search and category filter cards dock smoothly at `lg:left-6 lg:top-6 lg:max-w-md` without obstructing the full-viewport map.
- Selected facility details drawer docks to `lg:bottom-6 lg:left-6 lg:max-w-md`.

#### **AI Municipal Assistant (`/chatbot`)** — [chatbot/page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/citizen-web/src/app/chatbot/page.tsx)
- Expanded conversational container `max-w-4xl` with 2-column suggestions grid for wider desktop chat viewports.

---

## Verification & Type-Check Results

| Workspace | Command | Status |
| :--- | :--- | :--- |
| `apps/citizen-web` | `npx tsc --noEmit` | **PASS (0 errors)** |
| `apps/admin` | `npx tsc --noEmit` | **PASS (0 errors)** |
| `apps/mobile` | `npx tsc --noEmit` | **PASS (0 errors)** |
