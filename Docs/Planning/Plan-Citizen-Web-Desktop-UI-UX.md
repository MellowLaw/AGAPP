# Plan — AGAPP Citizen Web Desktop UI/UX Overhaul

> **Status**: APPROVED / PLANNING  
> **Target Workspace**: `apps/citizen-web`  
> **Reference Pattern**: `apps/admin/src/components/layout/Sidebar.tsx` & `DashboardLayout.tsx`  
> **Date**: 2026-08-16  

---

## 1. Executive Summary & Design Vision

Currently, `apps/citizen-web` renders all pages within a mobile-centered container (`max-w-xl mx-auto`) with a fixed bottom navigation bar (`BottomNav.tsx`). 

This plan defines the desktop UX transition:
1. **Desktop Navigation**: Adopt the **expanding frosted sidebar** design pattern from `apps/admin/src/components/layout/Sidebar.tsx`:
   - Collapsed state (`w-[72px]`): Compact icons with active badges, preserving screen real estate.
   - Expanded state (`hover:w-[300px]`): Smooth Framer Motion spring expansion with animated typography and full labels.
   - Frosted Glass Gradient: `bg-gradient-to-r from-[#f6f4f1] via-[#f6f4f1]/95 to-transparent dark:from-[#292929] dark:via-[#292929]/95 to-transparent`.
   - Top brand & LGU switcher + 8 navigation links + bottom resident profile & verification badge footer.
2. **Mobile / Desktop Breakpoint Strategy**:
   - **Mobile (`< lg` / `< 1024px`)**: Renders the Apple Liquid Glass `BottomNav.tsx` with floating mascot (`ai-floating.json`) and mobile single-column feeds.
   - **Desktop (`>= lg` / `>= 1024px`)**: Renders the `DesktopSidebar.tsx` on the left (`pl-[88px]`) with wide `max-w-7xl` multi-column desktop grids.
3. **Desktop Layout Multi-Column Transformations**:
   - **Home (`/`)**: 2-column layout (Hero + Bento quick actions on left, Trending Discussions + Announcements + Emergency hotlines on right).
   - **Services (`/services`)**: Department filter sidebar on left, 2-3 column responsive service card grid on right with document uploader modal.
   - **Report (`/report`)**: Side-by-side split layout (Reporting form & photo upload on left, interactive OpenStreetMap pin locator on right).
   - **Forum (`/forum`)**: 3-column discussion forum (Categories/Tags left, Thread stream center, Community rules & stats right).
   - **Map (`/map`)**: Full-height desktop map canvas with persistent category filter drawer.
   - **Chatbot (`/chatbot`)**: Wide conversational canvas with quick FAQ drawer and moving mascot avatar.

---

## 2. Proposed Changes & Architecture

### Layout & Navigation Layer

#### `DesktopSidebar.tsx` (`src/components/layout/DesktopSidebar.tsx`)
- Replicates the admin sidebar interaction model:
  - `w-[72px] hover:w-[300px] transition-all duration-300 ease-in-out h-screen fixed left-0 top-0 z-40`
  - Integrated `AgappLogo` with smooth fade-in text on hover.
  - Active LGU badge and modal selector trigger (`activeLgu`).
  - 8 Citizen Navigation Items:
    1. `Home` (`/`) — `Home` icon
    2. `E-Services` (`/services`) — `DocumentText` icon
    3. `Report Issue` (`/report`) — `Danger` icon
    4. `Community Forum` (`/forum`) — `Messages1` icon
    5. `Town Map` (`/map`) — `Location` icon
    6. `News & Advisories` (`/news`) — `NotificationBing` icon
    7. `Citizen Guides` (`/guides`) — `Book` icon
    8. `AI Assistant` (`/chatbot`) — `MessageQuestion` icon
  - User footer section: Resident avatar/initials, full name, barangay, verification badge (`Verified` / `Unverified`), theme toggle, and Sign In / Sign Out button.

#### `BottomNav.tsx` (`src/components/layout/BottomNav.tsx`)
- Add `lg:hidden` utility so the bottom navigation is only visible on mobile/tablet viewports and hides on desktop where the sidebar is active.

#### `layout.tsx` (`src/app/layout.tsx`)
- Update `<main>` container:
  - Replace static `max-w-xl mx-auto` with responsive layout wrapper:
  ```tsx
  <div className="flex min-h-screen">
    <DesktopSidebar className="hidden lg:flex" />
    <main className="flex-1 min-h-screen w-full relative lg:pl-[72px] pb-24 lg:pb-8">
      {children}
    </main>
    <BottomNav className="lg:hidden" />
  </div>
  ```

---

## 3. Screen-by-Screen Desktop Transformations

1. **Home Dashboard (`src/app/page.tsx`)**:
   - Left (65%): Wide Hero banner + 8-Bento Quick Actions grid (`grid-cols-4`) + Resident verification card.
   - Right (35%): "Trending in Liliw" forum discussion + Latest municipal advisories + Quick emergency hotlines.
2. **Services (`src/app/services/page.tsx`)**:
   - Left (25%): Sticky department selector + "My Requests" filter tab.
   - Right (75%): 2-to-3 column service catalog card grid (`grid md:grid-cols-2 xl:grid-cols-3 gap-4`) + document upload modal.
3. **Report (`src/app/report/page.tsx`)**:
   - Left (50%): Category selector + description & landmark inputs + photo uploader + verification alerts.
   - Right (50%): Interactive OpenStreetMap coordinate pin-drop canvas + recent municipal report feed.
4. **Forum (`src/app/forum/page.tsx`)**:
   - Left (20%): Category tags + "Start Discussion" button.
   - Center (55%): Discussion thread stream with expanded previews and comment drawers.
   - Right (25%): Community rules, forum stats, and search bar.
5. **Map (`src/app/map/page.tsx`)**:
   - Split view: Left facility search & category card drawer (`w-96`), Right full-bleed interactive Leaflet map canvas.
6. **Chatbot (`src/app/chatbot/page.tsx`)**:
   - Centered comfortable conversation studio (`max-w-4xl`) with quick FAQ sidebar drawer and moving mascot avatar.
