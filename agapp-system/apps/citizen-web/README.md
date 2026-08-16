# AGAPP — Citizen Web Portal & Progressive Web App (PWA)

> **Workspace**: `apps/citizen-web`  
> **Tech Stack**: Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript, Supabase JS, Iconsax, Lottie-React  
> **Default Port**: `3001` (`http://localhost:3001`)

The Citizen Web Portal provides full browser and mobile-device PWA parity with the native AGAPP mobile experience, enabling residents and guests to access e-governance services on desktops, laptops, tablets, and smartphones without requiring app store installation.

---

## 🌟 Key Features

1. **E-Services Catalog & Document Uploader (`/services`)**:
   - 28 standardized Philippine LGU services across Civil Registry, BPLO, Treasury, Barangay Affairs, Assessor, MPDO, OBO, Health, and Social Welfare.
   - Interactive requirement document uploader storing files in `service-attachments`.
   - Real-time application tracking with printable QR Claim Stubs (`/tracking/service/[id]`).
2. **Community Incident Reporting (`/report`)**:
   - Geotagged civic issue reporting (Potholes, Clogged Drainage, Stray Pets, Damaged Poles).
   - Live camera photo upload, map pin dragging, and automatic GPS coordinate stamping.
3. **Community Forum (`/forum`)**:
   - Neighborhood discussions, announcements, and polls with tag filtering and search.
   - Profanity checking and moderation guardrails.
4. **Interactive Facilities Map (`/map`)**:
   - OpenStreetMap / Leaflet mapping of Municipal Hall, Barangay Halls, Evacuation Centers, RHU Health Centers, Police Stations, and Public Parks.
5. **AI Municipal Assistant Chatbot (`/chatbot`)**:
   - RAG chatbot powered by local municipal ordinances and Mistral AI fallback via `/api/chat` proxy.
   - Animated Lottie assistant mascot (`chatbot-message.json`) and in-app navigation cards.
6. **4-Step Identity Verification (`/verify`)**:
   - Government ID selection + photo upload &rarr; Residency declaration &rarr; Live selfie &rarr; Review & RA 10173 consent.
   - Private storage bucket `citizen-ids` upload and `submit_verification_request` RPC.
7. **Progressive Web App (PWA)**:
   - Full offline manifest, responsive mobile-frame container on desktop, and Apple Liquid Glass bottom navigation.

---

## 🔒 5-State Access Control Matrix

- **Guest (`!user`)**: Read-only access to catalog, forum, news, map, guides. Attempting gated actions opens animated `<AuthGate />`.
- **Unverified Resident (`user && !isVerified`)**: Can like/comment on forum; Services apply and Report submit buttons show `"Verify to Submit"` routing to `/verify`.
- **Verified Resident (`user && isVerified`)**: Full unrestricted submission of service applications and incident reports.
- **Restricted (`moderation_status === 'restricted'`)**: Forum interactions locked; access to emergency hotlines and services preserved.
- **Banned (`moderation_status === 'banned'`)**: Immediate security lockout routing to `/banned`.

---

## 🤖 Context for AI Agents & Developers

- **Mobile Parity Rule**:
  - `apps/citizen-web` is built to be a 100% faithful web counterpart to `apps/mobile`. Any feature added to mobile MUST have a corresponding web implementation following the same data contracts and visual hierarchy.
- **Direct Supabase & Realtime**:
  - Web client talks directly to Supabase over PostgreSQL Row-Level Security.
  - `AuthContext.tsx` maintains a real-time listener on the current user's row in `users`. Moderation changes (`banned` / `restricted`) trigger instantaneous UI lockouts/redirects.
- **Lottie Mascot Assets**:
  - `/brand/ai-floating.json`: Floating mascot on Home `/` (placed in `BottomNav.tsx` at `-top-[62px] -left-3`).
  - `/brand/chatbot-message.json`: Assistant avatar on `/chatbot`.
  - `/brand/sign-up-animation.json`: Auth gate mascot companion on all `<AuthGate />` views.
- **No Emojis Rule**:
  - Never introduce hardcoded emojis in status badges, assistant suggestions, or navigation tabs. Use `iconsax-react` glyphs.

---

## 🛠️ Development & Environment

```bash
# From agapp-system/
npm run dev:citizen-web
```

Create `.env.local` from `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3001
```
