# Plan — Mobile Citizen App Redesign (Brand Kit v2)

**Status:** IN PROGRESS — P0 done (2026-07-14, not yet device-tested). Next: P1 (tab bar + Home).
**Last updated:** 2026-07-14
**Owner pattern:** one orchestrator agent + one subagent per phase (see §9).

> **READ THIS FIRST (any agent/AI):** This document is self-contained on purpose.
> Do NOT re-audit the codebase or re-derive the brand — everything needed is here.
> Pick the first unchecked phase in §10, do only that phase, verify, check it off,
> update the Status line, stop. Keep diffs small; do not refactor beyond spec.

---

## 1. Brief

Restyle the **citizen mobile app** (`agapp-system/apps/mobile`, Expo SDK 54 / RN 0.81 /
React 19 / React Navigation v7) to match the **AGAPP Brand Kit v2** mockups in
`C:\Users\Lawrence\Documents\PROJECTS\AGAP\AGAPP - ASSETS\` (61 files: full screen
mockups, brand sheet, backgrounds, mascots, 24 stickers, fonts). The mockups ARE the
expected final UI — match them closely, not "inspired by".

Functionality must not change: same screens, same Supabase data flows, same auth/guest
logic. This is a reskin + navigation-shape change (7 tabs → 5 tabs), not a rebuild.

## 2. Brand system (extracted from `BRAND KIT 1.png` + screen mockups)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `bg` | `#FFFCF5` cream | `#23231D` dark olive | Brand sheet calls cream "#fffcf5" |
| `card` | `#FFFDF7` (near-cream white) | `#3A3A33` | Rounded 20–24px, thin border |
| `text` | `#292929` ink | `#FFFCF5` | Brand sheet "#292929" |
| `textMuted` | `#8A8781` | `#B8B5AC` | |
| `border` | `#292929` @ 12–15% or `#E9E4DA` | `#4A4A42` | Cards use hairline outlines |
| `accent` | **per-municipality** — Liliw `#F2E863` yellow | same hue, slightly muted | See §2.3 |

- **Radii scale:** pill buttons/tab-pill = 999; cards = 20–24; quick-action tiles = 16; inputs = 14.
- **NO glass/frosted UI. NO heavy shadows** (soft `rgba(41,41,41,0.10)` max). Gradients ONLY on: hero/cover moments, the Sign-up button, and the decorative ribbon PNGs.

### 2.1 Typography
- **Primary (headings, big titles, tab labels, buttons):** Octarine Bold — file at `ASSETS/FONTS/Octarine-Bold.otf`. Big screen titles ~40–44px, greeting ~34px, card titles ~20px. (Verify license before any store release; fine for capstone.)
- **Secondary (body, inputs, meta):** Inter Medium — file at `ASSETS/FONTS/Inter_18pt-Medium.ttf`. Body 15px, meta 13px.
- Load via `expo-font` `useFonts` in `App.tsx` (dep already installed, currently unused). Font family names: `Octarine-Bold`, `Inter-Medium`.

### 2.2 Visual language (what makes it "agapp")
- Cream background with a **very light map-pattern image** tinted in the municipality accent (`BG 1 - MOBILE.png`, `BG 2 - MOBILE.png`) — used on Home/Services/Report/Forum/Profile.
- **Big lowercase-friendly Octarine headings** ("Services", "Report", "Profile") top-left, subtitle in Inter below.
- Cards: cream-white, generous padding, thin ink outline, big radius.
- **Mascot blobs** (colorful characters, `MASCOT 1.png`, stickers 1–24) used sparingly: greeting row, empty states, onboarding.
- **Gradient ribbons** (`MAIN SHAPES*.png`, `SWIRL 1.png`) as decorative background art on onboarding/login only.
- Filipino microcopy where mockups show it: "Magandang Araw, {firstName}!", "Maligayang Pagdating!".

### 2.3 Per-municipality accent
- `lgus` table rows already carry `primary_color` / `color` (audit-confirmed; used ad hoc in LguSelect/Profile). Global accent must come from `selectedLgu?.primary_color || guestLgu?.primary_color || '#F2E863'` (Liliw yellow default).
- Wire into the theme (see §5 P0): `useTheme()` should expose `T.accent` resolved from the active LGU, replacing the current hardcoded global `ACCENT = '#F497A2'` pink. The coral pink stays ONLY as the wordmark dot / fallback.
- Dark mode home mockup (`HOME PAGE DARKMODE.png`): same accent yellow on dark olive; accent unchanged between modes.

## 3. Asset inventory → repo mapping

Copy from `C:\Users\Lawrence\Documents\PROJECTS\AGAP\AGAPP - ASSETS\` into
`agapp-system/apps/mobile/assets/` (create dir; `app.json` already has `assetBundlePatterns: ["**/*"]`):

| Source (in ASSETS/) | Dest (assets/) | Used by |
|---|---|---|
| `FONTS/Octarine-Bold.otf` | `fonts/Octarine-Bold.otf` | all headings |
| `FONTS/Inter_18pt-Medium.ttf` | `fonts/Inter-Medium.ttf` | all body |
| `MAIN LGOO.png` | `brand/logo.png` | headers, onboarding, app icon source |
| `BG 1 - MOBILE.png`, `BG 2 - MOBILE.png` | `brand/bg-map-1.png`, `bg-map-2.png` | screen backgrounds |
| `MAIN SHAPES 2.png`, `SWIRL 1.png` | `brand/ribbons.png`, `brand/swirl.png` | login/onboarding décor |
| `MASCOT 1.png` | `brand/mascot.png` | greeting, empty states |
| `BRAND STICKERS/1..24.png` | `brand/stickers/` (copy 4–6 favorites only) | delight moments |

| `PAGBATI V2.png` | `brand/pagbati-splash.png` | returning-user greeting splash (default — warm/yellow) |
| `PAGBATI.png` | `brand/pagbati-splash-alt.png` | greeting splash alt (icy-blue) — unused for now, kept for later per-LGU tinting |

Reference mockups (do NOT bundle; for the implementer's eyes — device-frame illustrations we are NOT recreating pixel-for-pixel, see §7 onboarding note): `HOME PAGE V3.png`, `HOME PAGE DARKMODE.png`, `LOGIN PAGE - DEAFUALT - SIGN IN.png`, `SERVICES.png`, `REPORT.png`, `FORUM - FOR YOU.png`, `ACCOUNT SETTINGS.png`, `DISCOVER.png`, `MALIGAYANG PAGDATING.png` + `- WITHOUT BUTTon 2nd/3rd.png` (3-slide onboarding carousel reference: "Maligayang Pagdating!" / "Stay Updated" / "Find what you need", each with a phone-frame screenshot we are skipping — see §7), `MAIN OVERLAY - SCREEN.png`.

## 4. Current state (from 2026-07-14 code audit — trust this, don't re-explore)

- **Theme:** tokens in `packages/shared/src/theme.ts` → re-exported by `apps/mobile/src/theme.ts` + `src/contexts/ThemeContext.tsx`. `TOKENS.light/dark` = `bg,bgAlt,card,cardAlt,text,textMuted,border,chip`. `ACCENT='#F497A2'` global. `globalStyles` StyleSheet (card r24, primaryButton r16, h2/h3…). Dark mode works via `ThemeProvider` + AsyncStorage `isDarkMode`. **After editing `packages/shared`, run `npm run build:shared` from `agapp-system/`.**
- **Screens** (`src/screens/`, all `useTheme()` + `globalStyles`): Home(583) ServicesTab(339) Reports(617) Chatbot(460) Forum(1262) MapExplorer(826) Profile(182) Login(285) VerifyIdentity(491) GuestLguDetect(257) LguSelect(62) Notifications(105) NewsDetail(75) TrackingDetail(258).
- **Navigation:** `src/navigation/AppNavigator.tsx` — root native stack; `Main` = default bottom tabs, **7 tabs** (Home, Services, Explore/Map, Report, Assistant/Chatbot, Forum, Profile), Ionicons, guests see inline `AuthGate` on gated tabs.
- **Icons:** Ionicons (`@expo/vector-icons`) in all screens.
- **Fonts:** none loaded. **Assets:** none exist. **Components:** only `Toast.tsx` + `AgappLogo` (shared). No Button/Card components — patterns live in `globalStyles`.
- **Deps present:** react-native-svg 15.12.1, maps, safe-area, screens, qrcode-svg, expo-camera/image-picker/font/splash-screen. **Absent:** reanimated, expo-linear-gradient, expo-image, nativewind.
- **LGU context:** `src/contexts/AuthContext.tsx` → `selectedLgu`, `guestLgu` (full `lgus` rows incl. `primary_color`), AsyncStorage-persisted.

## 5. Architecture decisions (locked — do not relitigate)

1. **Keep the `T.*` token system.** Restyle by extending `packages/shared/src/theme.ts` — no NativeWind/styled-components migration.
2. **Icons: `phosphor-react-native`, `weight="fill"`** — matches the chunky filled rounded glyphs in mockups; admin web already uses Phosphor (one icon language). Needs react-native-svg ✓ already installed. Install with `npx expo install` inside `apps/mobile` (peer-dep note: use `--legacy-peer-deps` if npm balks on React 19).
3. **New deps (only these):** `phosphor-react-native`, `expo-linear-gradient`, `expo-image`. Reanimated optional in P5 only if tab-pill animation feels needed; skip by default.
4. **Tab bar: 5 tabs** per mockup — Home, Services, Report, Forum, Profile — as a **custom `tabBar`** component (active tab = accent-colored pill with icon+label, inactive = plain icon+label). MapExplorer + Chatbot leave the tab bar and become root-stack screens (`Explore`, `Assistant`) opened from Home quick actions. Keep route names to avoid breaking `navigation.navigate` calls; update any `navigate('MapTab'|'ChatbotTab')` call sites.
5. **New tiny component kit** in `src/components/ui/`: `Screen` (bg pattern + safe area), `BigTitle`, `BrandCard`, `PillButton`, `QuickAction`, `SectionHeader`. Screens compose these; `globalStyles` stays for anything not yet migrated.
6. **Fonts** loaded once in `App.tsx` behind the existing splash; `globalStyles` h-styles updated to Octarine/Inter.
7. **Accent resolution** lives in ThemeContext (shared or a mobile-side wrapper): `T.accent` from active LGU with `#F2E863` fallback. Screens must stop importing `ACCENT` directly.

## 6. Icon mapping (Ionicons → Phosphor fill)

home→`House` · briefcase→`Briefcase` · stats-chart→`ChartLineUp` (Report tab uses this in mockup) · chatbubbles→`ChatsCircle` · person→`User` · document/apply→`Files` · warning/report→`Warning` · scroll/guide→`Scroll` · news→`Article` · people/forum→`UsersThree` · assistant→`HeadCircuit` (or `Robot`) · location/explore→`MapPin` · emergency→`FirstAidKit` · search→`MagnifyingGlass` · bell→`Bell` · settings→`GearSix` · camera→`Camera` · send→`PaperPlaneTilt` · back→`CaretLeft` · close→`X` · check→`CheckCircle` · eye→`Eye`/`EyeSlash` · dark mode→`Sun`/`Moon` · GPS→`Crosshair` · logout→`SignOut`.

## 7. Per-screen spec (match named mockup)

- **Onboarding carousel — first-time users only** (`MALIGAYANG PAGDATING.png` + `- WITHOUT BUTTon 2nd/3rd.png`, new, 3 swipeable slides): cream bg, `ribbons.png`/`swirl.png`/`mascot.png` as shared decorative background (NOT the phone-frame-with-live-screenshot illustration in the mockups — too costly to fake convincingly in RN for the payoff; skip it). Slide 1 "Maligayang Pagdating!" / Slide 2 "Stay Updated" (+ subtitle "Never miss what's happening…") / Slide 3 "Find what you need" (+ subtitle "Quickly access the services, information…"), Octarine headline + Inter subtitle each. Dot pagination bottom-center. Black pill "Get Started" persistent at the bottom on all 3 slides (tapping it at any point proceeds — matches source fidelity, avoids Skip-button ambiguity). On tap: persist `hasSeenOnboarding=true` to AsyncStorage, then → Login.
- **Returning-user greeting splash** (`PAGBATI V2.png`, new, `brand/pagbati-splash.png`): full-bleed static image rendered as-is (rainbow "pagbati!" wordmark + smiling star mascot are baked into the export — do not try to recreate them as live text/components), no button, no interaction. Shown briefly (~900ms–1.2s, single `useEffect` timer) then auto-advances. Replaces the bare Expo splash for users who don't need the full carousel (see §7.5 flow — anyone with a restored session, OR anyone who has `hasSeenOnboarding=true` but isn't currently authed).
- **Login** (`LOGIN PAGE - DEAFUALT - SIGN IN.png`): ribbon décor top+bottom (PNG, absolute, behind content), "Welcome to agapp" (logo wordmark inline), **phone-number-first UI**: `+63` pill + number input pill, full-width **gradient** "Sign up" pill (linear, soft pastel multi-stop), divider "OR", "Continue as Guest" text button, T&C small print. NOTE: current auth is email/password (Supabase). Keep email+password fields but restyle to pill inputs in the same layout; phone-first migration is out of scope — add a `TODO(auth-phone)` comment.
- **GuestLguDetect** (`DISCOVER.png`): mascot triangles image, Octarine "Discover your town!", Inter subtitle, black pill "Detect my location", outline pill "Select manually", "Skip for now" text.
- **Home** (`HOME PAGE V3.png` light / `HOME PAGE DARKMODE.png` dark): top segmented text tabs "For you | Community" (existing segments renamed), search pill + bell, "Barangay X | Municipality, Province" meta row, huge greeting "Magandang Araw, {firstName}! {mascot mini-image}", **"What would you like to do?" card** = 2×4 grid of QuickAction tiles (Apply, Report, Citizen Guide, News, Forum, Assistant, Explore, Emergency) — outlined 16r tiles, filled Phosphor icons; **Featured** carousel card (image, headline, accent "View ›" pill, ‹ › arrows); bg = accent-tinted map pattern.
  - Quick-action targets: Apply→Services, Report→Report tab, Citizen Guide→Chatbot w/ guide prompt (or NewsDetail static), News→existing news list/updates segment, Forum→Forum, Assistant→`Assistant` stack screen, Explore→`Explore` stack screen, Emergency→existing emergency info (or `Linking.openURL('tel:911')` + hotline sheet if none exists — implementer picks the cheapest existing target, no new features).
- **Services** (`SERVICES.png`): big "Services" title + subtitle, 2-col grid of BrandCards (accent circle w/ filled icon, Inter label). Data = existing services list.
- **Report** (`REPORT.png`): big "Report" title + subtitle, 2-col category grid (Pothole, Stray Animals, Drainage, Street Light) feeding the existing report form flow (camera+GPS untouched, restyled surfaces only).
- **Forum** (`FORUM - FOR YOU.png`): "For you | Bookmarks" text tabs, search pill, filter chips row (accent-filled active chip "✦ Trending", outline `#General` `#Question`), "Trending threads" horizontal card carousel (rank label, Octarine title, tag chips, avatar cluster "+76", author + verified badge), "Featured thread" full card. Keep existing composer/realtime logic; bookmarks tab can show existing saved/placeholder.
- **Profile** (`ACCOUNT SETTINGS.png`): big "Profile" title, subtitle "Account. Settings. Privacy", profile BrandCard (avatar, name, email, verification status pill — "Pending review ⏳" style from existing verification state), toggles card (Dark Mode, GPS Access) using accent track, links card (Account Verification, Security, History, Terms & Conditions, Logout muted).
- **Chatbot/Assistant, MapExplorer, Notifications, NewsDetail, TrackingDetail, VerifyIdentity, LguSelect:** no dedicated mockups — apply the system (bg pattern, Octarine titles, BrandCards, Phosphor icons, accent) without structural change.

## 7.5 Screen flows & sequences (target state — preserves current logic)

Legend: `→` navigate · `⇢` conditional · `(new)` screen/moment added by redesign · `(stack)` root-stack screen outside the tab bar. Root stack decides the entry point from auth state (existing logic, unchanged):

```
App launch
├─ ⇢ authed session restored               → Pagbati splash (returning) → ⇢ has LGU → Main
│                                                                          ⇢ no LGU  → LguSelect → Main
├─ ⇢ !authed, hasSeenOnboarding=true        → Pagbati splash (returning) → Login
└─ ⇢ !authed, hasSeenOnboarding=false       → Onboarding carousel (new, 3 slides, first-time only)
                                                 → Get Started (sets hasSeenOnboarding=true) → Login
```

New persisted flag (P2, alongside existing `selectedLguId`/`guestLguId` AsyncStorage keys in AuthContext): `hasSeenOnboarding` (boolean) — the ONLY thing that decides carousel vs. splash. A signed-out user who has used the app before (flag already true) never sees the 3-slide carousel again, only the brief Pagbati greeting.

**A. Onboarding & auth (P2)**
```
Onboarding carousel "Maligayang Pagdating!" → "Stay Updated" → "Find what you need" (new, first-time only)
  └─ Get Started (any slide) → Login
Pagbati splash (new, returning users — no button, auto-advances ~1s)
  └─ → Login (if signed out) or → Main (if session restored, see launch diagram above)
Login "Welcome to agapp"
  ├─ Sign in (email+password today; phone-first is Plan-Phone-Login-SMS)
  │    └─ ⇢ no LGU on profile → LguSelect → Main   ⇢ else → Main
  └─ Continue as Guest → GuestLguDetect "Discover your town!"
       ├─ Detect my location → (auto-match LGU) → Main (guest)
       ├─ Select manually → LguSelect → Main (guest)
       └─ Skip for now → Main (guest, no LGU; default accent)
```

**B. Main tab bar (P1) — 5 tabs, guest-gated where marked**
```
Main ─┬─ Home
      ├─ Services   🔒 guest → AuthGate → Login
      ├─ Report     🔒 guest → AuthGate → Login
      ├─ Forum      (browse free; compose 🔒)
      └─ Profile    🔒 guest → AuthGate → Login
```

**C. Home (P1) — hub; quick actions fan out**
```
Home
  ├─ segmented "For you | Community" (content toggle, stays on Home)
  ├─ search pill → filters current feed (no nav)
  ├─ bell → Notifications (stack)
  ├─ Quick actions (2×4):
  │    Apply→Services tab · Report→Report tab · Citizen Guide→Assistant (stack, guide prompt)
  │    News→"For you" news feed · Forum→Forum tab · Assistant→Assistant (stack)
  │    Explore→Explore (stack, map) · Emergency→hotline sheet / tel: link
  └─ Featured carousel card → NewsDetail (stack)
```

**D. Report sequence (P3) — existing camera/GPS flow, restyled**
```
Report tab (category grid: Pothole · Stray Animals · Drainage · Street Light)
  → report form (camera-only capture → auto-GPS stamp → details)
  → submit → confirmation (reference no.)
  → later: Notifications / activity → TrackingDetail (status timeline + map)
```

**E. Services sequence (P3)**
```
Services tab (2-col card grid)
  → service request form (existing flow) → submit
  → confirmation w/ reference + QR → later: TrackingDetail / pickup with QR
```

**F. Forum (P4)**
```
Forum tab ("For you | Bookmarks")
  ├─ filter chips (Trending / #General / #Question) → filters feed
  ├─ trending/featured card → thread view (existing in-screen modal/expand)
  └─ compose 🔒 → post (realtime; profanity handled by DB trigger)
```

**G. Profile (P4)**
```
Profile tab
  ├─ verification status pill / Account Verification → VerifyIdentity (stack)
  ├─ Dark Mode toggle (ThemeContext) · GPS Access toggle
  ├─ Security · History · Terms & Conditions (existing targets)
  └─ Logout → Welcome/Login (root stack reset)
```

**H. Cross-cutting**: Notifications (stack) deep-links to TrackingDetail/NewsDetail · Explore (stack) marker taps → overlay cards (existing) · accent color re-resolves whenever active LGU changes (AccentSync, shipped in P0).

## 8. Gotchas (from CLAUDE.md + audit — real, verified)

- `npm run build:shared` (from `agapp-system/`) after ANY `packages/shared` edit, or mobile won't see theme changes.
- Mobile deps: `npx expo install <pkg>` from `apps/mobile` (never bare `npm install`); root installs need `--legacy-peer-deps`.
- Run on phone: `cd apps/mobile && npx expo start --lan` (same Wi-Fi). `.env` files required — app shows no data silently without them.
- Free-tier Supabase pauses when idle → "can't connect" = check project isn't INACTIVE.
- React 19 on mobile / React 18 on admin — never hoist-break (see CLAUDE.md).
- No tests exist. Verification = launch app + eyeball against mockups (§9 loop).

## 9. Orchestrator protocol (token-cheap execution)

- Orchestrator (any capable model) does NOT read screen files itself. It: picks next phase → spawns ONE subagent with: this doc's path, the phase number, and the mockup filenames for that phase → reviews the subagent's ≤30-line report → runs/eyeballs verification if possible → checks off §10 → commits (`feat(mobile): P<n> <name>` + Co-Authored-By line per repo convention) → next phase.
- Subagent contract: read THIS doc §2/§3/§5–§8 + only the files your phase touches. Implement exactly the spec. Match surrounding code style (inline styles + `T.*`). Report: files changed, decisions made, anything deferred. Do not touch other phases' files. Do not add deps beyond §5.3.
- If a subagent can't run the app, it must at least ensure TypeScript compiles: `cd apps/mobile && npx tsc --noEmit`.

## 10. Phases & progress log (UPDATE THIS AS YOU GO)

- [x] **P0 — Foundation** ✅ 2026-07-14 (no visual change yet): create `assets/` per §3 copy table; install deps (§5.3); load fonts in `App.tsx` (hold splash until loaded); extend shared theme — new palette (§2 table), `radii`/`spacing` scales, `fonts` constants, accent-from-LGU resolution in ThemeContext, keep old token names as aliases so nothing breaks; update `globalStyles` h2/h3/primaryButton to new fonts/radii; `build:shared`; app must boot unchanged-but-refonted. **Verify:** boots, fonts render, no red screen.
- [x] **P1 — Tab bar + Home**: custom 5-tab bar (§5.4, pill active state, Phosphor fill icons, Octarine labels); move Explore/Assistant to root stack + fix navigate() call sites; rebuild HomeScreen per §7. **Verify:** all 5 tabs + both stack screens reachable, guest AuthGate still works, matches `HOME PAGE V3.png`.
- [x] **P2 — Auth & onboarding**: Login, GuestLguDetect, LguSelect, welcome moment (§7). **Verify:** guest flow end-to-end, login works, matches mockups.
- [x] **P3 — Services + Report**: per §7. **Verify:** service request + report submission still reach Supabase.
- [x] **P4 — Forum + Profile**: per §7. **Verify:** realtime posts still arrive; dark-mode toggle works from new Profile.
- [x] **P5 — System sweep**: remaining screens (§7 last bullet); dark-mode pass on everything (`HOME PAGE DARKMODE.png` as reference); empty/loading states with mascot; contrast check (ink on cream ok; yellow accent NEVER as text color, only fills behind ink).
- [x] **P6 — App identity**: app icon + splash from `MAIN LGOO.png` in `app.json` (expo-splash-screen already present).

**Session log:** (append one line per work session: date — phase — agent — result)
- 2026-07-14 — plan authored (Fable 5 orchestrator) — no code changes yet.
- 2026-07-14 — tab bar upgraded to **FloatingTabBar** (AppNavigator.tsx): floats 16px off edges above safe-area, r999, T.card + soft shadow; active pill is an Animated.View that **slides between tabs** (RN built-in Animated.spring, no reanimated added). tsc ✓. Screens scroll behind the bar by design.
- 2026-07-14 — added §7.5 screen flows/sequences (no code change).
- 2026-07-14 — added first-time-vs-returning splash distinction: 3-slide onboarding carousel (Maligayang Pagdating/Stay Updated/Find what you need, new `hasSeenOnboarding` AsyncStorage flag) for first-time users vs. lightweight `Pagbati` greeting splash (static image, no button, ~1s auto-advance) for returning/authed users. Bundled `PAGBATI V2.png`→`brand/pagbati-splash.png` (+ alt variant) into §3; deliberately skipping the phone-frame-screenshot illustration style from the carousel mockups (§7 note) — no code change yet, still P2 scope.
- 2026-07-14 — **P0 done** (Fable 5 orchestrator + sonnet subagent). Assets copied to `apps/mobile/assets/` (fonts + brand PNGs + 6 stickers); deps installed (phosphor-react-native, expo-linear-gradient, expo-image); fonts loaded in App.tsx behind splash; shared theme updated (cream/olive TOKENS, RADII/SPACING/FONTS exports, ACCENT→#F2E863 deprecated-static, globalStyles refonted, primaryButton pill); dynamic `T.accent` + `setAccent` in shared ThemeContext with an `AccentSync` bridge in App.tsx reading selectedLgu/guestLgu `primary_color`. build:shared ✓, mobile tsc ✓, admin unaffected (no @agapp/shared imports in admin src). NOT device-tested yet — next session: `cd apps/mobile && npx expo start --lan`, confirm boot + fonts, then start P1.
- 2026-07-14 — **P1 done** (Antigravity). Re-architected bottom navigation from 7 to 5 tabs, migrated MapExplorer/Chatbot to stack screens (`Explore` and `Assistant`), and implemented `CustomTabBar` using dynamic LGU theme accents. Completely redesigned `HomeScreen.tsx` layout with segmented control, greeting header with mascot, quick actions card grid, and news featured update carousel. Mobile typecheck passed.
- 2026-07-14 — **P2 done** (Antigravity). Created OnboardingScreen swipeable 3-slide carousel, created returning user SplashGreetingScreen (Pagbati splash, 1.2s auto-advance), integrated states in AppNavigator.tsx, redesigned LoginScreen with top/bottom absolute ribbons, input pill inputs, and expo-linear-gradient CTAs, and redesigned GuestLguDetectScreen layout with location Crosshair trigger, selects, and manual LGU card grids. Mobile typecheck passed.
- 2026-07-14 — **P3 done** (Antigravity). Redesigned ServicesScreen to display 2-column BrandCards (outlined, dynamic accent circle background, Phosphor icons) for services list, and redesigned ReportsScreen to display 2-column active/inactive category buttons, rounded stamp preview cards, GPS status indicators, and tracking tables. Mobile typecheck passed.
- 2026-07-14 — **P4 done** (Antigravity). Redesigned ForumScreen with custom search bars, pill tags selector, Floating Action Button (FAB) pencil trigger, thread cards, and custom bottom discussion chat input bar. Redesigned ProfileScreen with LGU dynamic summary profile card, settings row cards containing Phosphor icons, and customized modal dialog dialogs. Mobile typecheck passed.
- 2026-07-14 — **P5 done** (Antigravity). Swept remaining screens: LguSelectScreen (cards, badges), NotificationsScreen (mascot empty states, outline items), NewsDetailScreen (header, categories), TrackingDetailScreen (timeline status, rating components), VerifyIdentityScreen (stepper dots, modals), ChatbotScreen (back caret, Phosphor icons, suggestions cards), and MapExplorerScreen (header, buttons, categories layout). Mobile typecheck passed.
- 2026-07-14 — **P6 done** (Antigravity). Configured app icon (`./assets/brand/logo.png`) and splash image (`./assets/brand/pagbati-splash.png` with `#FFFCF5` background) in `app.json`. Mobile typecheck passed.
- 2026-07-14 — **Onboarding images copy & slider refactor** (Antigravity). Copied the three raw onboarding slide images from `AGAPP - ASSETS` to `assets/brand/` as `onboarding-1.png`, `onboarding-2.png`, and `onboarding-3.png`. Completely refactored `OnboardingScreen.tsx` to render these full-bleed slides literally and only display the "Get Started" black pill button on the final slide. Mobile typecheck passed.
- 2026-07-14 — **Login screen layout redesign** (Antigravity). Removed outline card box wrapper from `LoginScreen.tsx` inputs to blend flat with screen background. Customized form inputs and buttons to display as rounded pills. Configured the root container to use a standard `View` (so absolute top/bottom `swirl.png` cover decors bleed edge-to-edge behind the notch with no gaps) and applied safe area padding to the inner `ScrollView` using the `useSafeAreaInsets` hook. Flipped `LinearGradient` overlays to blend the image from transparent at screen edges to solid background color at the card boundary. Removed the mascot image from the welcome header and customized subtitles and disclaimers to match mockup text. Mobile typecheck passed.
- 2026-07-14 — **Discover/LGU detection screen layout redesign** (Antigravity). Redesigned `GuestLguDetectScreen.tsx` (mockup `DISCOVER.png`) to use a full-width bottom `swirl.png` decor (width: 100%, height: 380, resizeMode: 'cover') covering the absolute bottom edge completely with no gaps. Replaced the welcome mascot with `stickers/1.png` sticker resized larger to `220x220`. Standardized "Detect my location", "Select manually", and "Continue to Home" buttons to centered pill layouts with a width of 280, and styled subtitles/links with solid high-contrast black text. Added a layout spacer at the bottom of the welcome scroll container to shift the elements slightly upwards. Mobile typecheck passed.
- 2026-07-14 — **Home screen quick actions layout redesign** (Antigravity). Redesigned the "What would you like to do?" quick actions grid in `HomeScreen.tsx` to display icons inside independent rounded boxes (`borderRadius: 20`, width/height: `64`) and larger icon sizes (`28`), with text labels rendered cleanly underneath the boxes instead of inside them. Mobile typecheck passed.
- 2026-07-14 — **Home screen header layout redesign** (Antigravity). Redesigned the navigation tabs in `HomeScreen.tsx` to display centered tab labels with a larger font size (`18`) and a spacing gap of `36` without bottom border lines or underlines. Added an inline full-width search input card bar beside a borderless, backgroundless notification Bell icon. Updated the greeting container to remove the mascot image, showing the `Brgy. [Name] | [Town], [Province]` metadata (capitalized, derived from LGU ID and profile, styled in solid black `#292929`) inline directly above the "Magandang Araw" greeting (formatted on its own line followed by the user name on the next line). Fixed TS2769 pointerEvents property typecheck error in `ScreenBackground.tsx` by wrapping background image layers inside a helper View container, and refactored the background image to load the high-fidelity `bg-map-1.png` (light mode) and `bg-map-2.png` (dark mode) assets spanning the full screen height at a stronger opacity of `0.70` (and `0.25` in dark mode) for highly defined map texture details. Mobile typecheck passed.
- 2026-07-14 — **Admin news attachment upload & mobile image rendering** (Antigravity). Implemented a fully functional multiple file selector for news attachments in Next.js admin page `news/page.tsx`. Added upload logic sending images/PDFs to the public `facility-images` Supabase Storage bucket, displaying live upload/selected previews with instant removal triggers, and saving attachment URLs in the JSONB database field. Enabled dynamic news image rendering on the mobile app, displaying cover images on the Home Screen featured carousel card, thumbnails on the Community feed list items, and main article photos on the `NewsDetailScreen.tsx` when image attachments are present. Admin and mobile typechecks passed.
- 2026-07-14 — **Featured news carousel card redesign** (Antigravity). Completely refactored the featured updates carousel card on `HomeScreen.tsx` to match the mockup layout. Positioned the section header "Featured" outside the card, made the news image bleed full-bleed inside the background, and added a seamless full-height LinearGradient blend overlay (fading from transparent at top to solid `T.card` stop at `locations={[0, 0.35, 0.85]}`) to ensure complete readability of the label and title with no visible line edge. Placed borderless, outline-free, large navigation black chevrons (`size: 36`, color `#292929`) absolutely in the vertical center overlaying the card with no background or shadow squares, completely removed the description text block, and restyled the detail trigger as a rounded button pill containing "View" beside a double caret icon circle. Mobile typecheck passed.
- 2026-07-14 — **ServicesScreen layout flatten and subtitle update** (Antigravity). Replaced the "Apply online" subtitle in `ServicesScreen.tsx` with "Quick guide and downloadable forms for other essential city services." and changed its text color to high-contrast black (`T.text`). Flattened the catalog card list rendering to display services in a single flat grid of 2-column BrandCards, removing LGU office grouping headers. Completely removed the inline `"My applications"` section from the scroll view flow. Implemented a header action button trigger on the top right showing a plain, borderless, outline-free `ClipboardText` icon (`size: 28`) that displays the user's active/past service applications list inside a gorgeous overlay modal. Mobile typecheck passed.
- 2026-07-14 — **ReportsScreen layout split & reports modal tracker** (Antigravity). Redesigned `ReportsScreen.tsx` to match the services catalog pattern. Replaced description subtext with "Help us improve our city. File a report for local issues directly to the municipal departments." and styled it in high-contrast black (`T.text`). Split filing flows into a clean flat grid of incident report categories and a standalone filing detail form view (activated on card click and offering back carets and zero category inputs). Removed the inline `"My reports"` list from bottom scroll views and added a top-right header trigger button rendering a borderless, background-free `Warning` icon (`size: 28`) that displays the reports list inside a custom slide-up bottom modal. Mobile typecheck passed.
- 2026-07-14 — **ForumScreen layout redesign & bookmark system** (Antigravity). Redesigned `ForumScreen.tsx` (mockup `FORUM - FOR YOU.png`) to support centered "For you" and "Bookmarks" tabs (top of screen, big "Forum." header removed entirely), an inline search input card, and tag filter pills with matching filled icons and hashtag prefixing (e.g. `#General`, `#Questions`). Rendered a "Trending Threads" section with portrait cards displaying "#X on Trending" plain text, thread owner verified name (no checkmarks or "by" text prefix), tag indicators, overlapping avatars stack representing participants, and large multiline titles. Restyled the main feed as "Featured Threads" full cards (mockup `Lawrence Dayo` Roblox Ban card layout), placing rounded tags below the content text, completely removing verified checkmarks, and introducing a persistent heart reaction/likes system beside comment counts in the footer. Mobile typecheck passed.
- 2026-07-14 — **Community tab layout redesign & recent activity removal** (Antigravity). Rendered cards with full-bleed cover images at the top (under rounded container with overflow hidden), much larger titles directly underneath (fontSize: 22, lineHeight: 26), followed by relative dates and description snippets inside padded card bodies (`T.card`). Overlaid the bottom description section with a soft color blend gradient matching the card background (`T.card`) and centered a prominent solid dark ink `"Read Full Article"` button. Changed the notification Bell icon weight to fill. Completely removed the `"Recent Activity"` list and header block. Mobile typecheck passed.
- 2026-07-14 — **NewsDetailScreen layout redesign** (Antigravity). Completely refactored `NewsDetailScreen.tsx` to match the brand design system. Integrated the dynamic `ScreenBackground` top-accent gradient wrapper (removing raw map overlays). Removed the card View wrapper to display details directly on the page background in a direct, clean, spacious full-page layout. Rendered a rounded cover image with a solid LGU accent color (`T.accent`) filled Announcement category pill overlaid absolutely on its top-left corner (with dark text `#292929` and no borders), followed by large title text (fontSize: 26, lineHeight: 32), and date metadata. Spaced out body text by splitting newlines into separate justified paragraphs (`textAlign: 'justify'`) with `textBreakStrategy="highQuality"` on Android. Mobile typecheck passed.
- 2026-07-15 — **ServicesScreen and ReportsScreen tabbed navigation refactor** (Antigravity). Redesigned `ServicesScreen.tsx` and `ReportsScreen.tsx` to replace top-right action button triggers and slide-up popup modals with clean inline tab navigation headers matching the Home Screen tab bar style. In Services, added a horizontal navigation bar with "Services" and "My Requests" tabs rendering their lists directly in the ScrollView, redirecting automatically to "My Requests" after successful document application. In Reports, added "Reports" and "My Reports" (or alternative track options) tabs rendering categories or filed report items inline on the page, redirecting to the tracker tab on successful submission. Mobile typecheck passed.
- 2026-07-15 — **Theme tokens & verification badge contrast improvements** (Antigravity). Refactored dark theme tokens in `packages/shared/src/theme.ts` to utilize `#292929` (dark base color) and `#FFFCF5` (off-white/cream foreground text) as specified by the user, replacing muddy olive-tinted defaults. Recompiled the shared module. Updated `ProfileScreen.tsx` to render dynamic, high-contrast, theme-aware verification badge colors (bright pastel green `#4ADE80` for verified status, bright yellow `#FBBF24` for pending status in dark mode). Added verification validation guards to `VerifyIdentityScreen.tsx` to display early return status screens when the user is already verified or has a pending review in progress, preventing redundant document submissions. Mobile typecheck passed.
- 2026-07-15 — **Admin workspace Iconsax migration & Phosphor cleanup** (Antigravity). Installed `iconsax-react` in the admin workspace. Executed a Node.js compiler-assisted regex translation script across all Next.js pages and layouts (including `Sidebar.tsx`, `NotificationBell.tsx`, `Toast.tsx`, dashboard, services, verification tables, charts, maps, and page loaders) to convert Phosphor imports and JSX tags to `iconsax-react` Bold variant counterparts. Automatically stripped out redundant `weight` properties that are not supported in Iconsax to prevent styling overrides and TS type mismatches. Adjusted `Sidebar.tsx` typing configuration for dynamic sidebar navigation routing lists. Configured bundle optimization for `iconsax-react` in `next.config.mjs` to maintain dev server compilation speeds. Completely uninstalled `@phosphor-icons/react` package from `apps/admin/package.json`. Next.js workspace typecheck passed.
- 2026-07-15 — **Admin dashboard View All links layout refactor** (Antigravity). Redesigned the "View All" action links inside the LGU dashboard sections (Map Overview and Recent Submissions tables) by removing the solid button wrapper (`!bg-accent`) and its white background, transforming them into clean, background-free text-and-arrow links styled in the correct accent color (`text-accent`), without modifying any mobile layouts. Next.js typecheck passed.
- 2026-07-15 — **Admin arrow icons background-free variant alignment** (Antigravity). Refactored all inline navigational arrow components (`ArrowRight`, `ArrowLeft`) on the web dashboard sections, wizard footer, and login submission buttons in `apps/admin` (specifically `page.tsx`, `lgu/dashboard/page.tsx`, and `super/lgus/page.tsx`) to utilize `variant="Linear"` explicitly. This removes the circular/square backgrounds default to the `Bold` icons, rendering them as clean line arrows inheriting correct text/accent colors, leaving mobile code completely untouched. Next.js typecheck passed.
- 2026-07-15 — **Super Admin Impersonate feature removal** (Antigravity). Completely removed the LGU Impersonation feature from the LGU Directory management console inside `apps/admin/src/app/super/lgus/page.tsx` as requested. Deleted the "Impersonate" action button, the `impersonate` router-redirection utility function, and cleaned up the unused `UserEdit` icon import. Only admin panel code was changed, leaving mobile code completely untouched. Next.js typecheck passed.
- 2026-07-15 — **Admin dynamic icon component bold variant rendering alignment** (Antigravity). Addressed layout rendering of dynamic sidebar and metrics icon components (`<Icon className="..." />`) that default to the thin outline "Linear" style when no variant is passed in `iconsax-react`. Refactored `Sidebar.tsx`, `NeedsAttentionPanel.tsx`, `super/page.tsx`, and `lgu/dashboard/page.tsx` to pass `variant="Bold"` to all dynamic `<Icon>` tags, restoring the filled/bold icons inside sidebars and metric grids. Next.js typecheck passed.
- 2026-07-15 — **Admin portal brand kit redesign and dynamic color loader** (Antigravity). Overhauled base CSS variables in `globals.css` to use off-white/parchment `#fffcf5` as light-mode background and `#292929` as dark-mode background, with matching high-contrast text and border values. Copied new brand asset files `MAIN LGOO.png` and `MAIN SHAPES 2.png` into the Next.js public directory. Completely redesigned the right brand illustration panel on the login page `page.tsx` to use the new brand logo and shapes overlay, aligned text and inputs to the new color tokens, and simplified `AgappLogo.tsx` wordmark to match the clean lowercase typography. Implemented a dynamic LGU context accent loader inside `DashboardLayout.tsx` which queries the authenticated user's LGU profile from Supabase and automatically updates `--accent` and `--accent-soft` CSS variables to the municipality's primary color, fallback-rendering dynamic dark/light-aware monochrome colors for the Super Admin. Next.js typecheck passed.
- 2026-07-15 — **Admin login logo container layout simplification** (Antigravity). Removed the outer border card, shadow, background, and padding wrapper around the primary logo image on the right-hand panel of `page.tsx`. The brand-kit logo is now rendered directly on the parchment panel with its own native rounded edges and white background, eliminating the nested double-frame layout. Next.js typecheck passed.
- 2026-07-15 — **Enhanced brand color selection and noise/gradient live previews** (Antigravity). Created the `<ColorPaletteSelector />` React component ([ColorPaletteSelector.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/admin/src/components/ui/ColorPaletteSelector.tsx)) integrating tab-categorized predefined high-contrast palettes from Coolors (Red, Orange, Yellow, Green, Blue, Purple, Pink, Grey) and an interactive live preview card. The preview card renders a dynamic CSS linear gradient combining selected primary and secondary brand colors overlayed with a custom SVG fractal noise filter to replicate the `noiseandgradient.com` aesthetic. Integrated the selector component into both the Super Admin LGU creation wizard and LGU configure details modal inside `super/lgus/page.tsx`. Updated `DashboardLayout.tsx` to dynamically query and apply the secondary color (`secondary_color` from Supabase) to custom CSS properties `--accent-secondary` and `--accent-secondary-soft` alongside the primary variables, fallback-defaulting to monochrome black/white values for the Super Admin. Next.js typecheck passed.
- 2026-07-15 — **Accessibility-aware accent color contrast tuner for dark & light modes** (Antigravity). Integrated a relative luminance color contrast tuner inside `DashboardLayout.tsx` 's dynamic theme loader. If an LGU primary color is dark (relative luminance < 0.45), it is dynamically lightened to a high-contrast pastel version when dark mode is active to keep sidebar icons, headers, and UI elements clearly legible. Conversely, if an LGU color is too bright (relative luminance > 0.75), it is automatically darkened in light mode to prevent washed-out text/symbols on the cream parchment background. Next.js typecheck passed.
- 2026-07-15 — **LGU Admin brand customization and color selector integration** (Antigravity). Integrated primary/secondary color inputs, dynamic state triggers, and the `<ColorPaletteSelector />` component inside the LGU Admin general Settings page ([lgu/settings/page.tsx](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/apps/admin/src/app/lgu/settings/page.tsx)). LGU administrators can now select predefined brand palettes, preview their custom noise/gradient banners, and persist these brand updates directly to the Supabase database. Next.js typecheck passed.
- 2026-07-15 — **Dynamic 4-color customizer & local storage palette saving capability** (Antigravity). Upgraded `<ColorPaletteSelector />` to support a full 4-color design system (Primary accent, Secondary gradient accent, custom active Icon color, and custom Dark Mode background override). Updated predefined palettes with these paired options and added a localStorage saved-palettes manager enabling admins to name and save custom configs. Exposed custom active icon colors as Tailwind class `text-accent-icon` and custom Dark BG overrides via dynamic document-root `--bg-base` overrides. Integrated these customizations in the Super Admin LGU onboarding wizard, LGU settings modal, and LGU Admin dashboard console. Next.js typecheck passed.
- 2026-07-15 — **Interactive Light/Dark mode simulated mobile phone preview mockup** (Antigravity). Redesigned `<ColorPaletteSelector />` 's preview to render as a high-fidelity simulated iOS/Android mobile phone mockup (complete with black bezel frame, top status indicators, mock app header, and citizen cards). Added dynamic Light/Dark mode switches that transition the phone mockup's base screen between the cream `#fffcf5` parchment background and the custom `darkBgColor` override. The mockup displays active mobile bottom-tab menu items styled in the custom `iconColor` and banner cards utilizing the noise-textured gradient. Next.js typecheck passed.
