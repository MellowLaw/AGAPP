# AGAPP — Citizen Native Mobile App

> **Workspace**: `apps/mobile`  
> **Tech Stack**: React Native 0.81, Expo SDK 54, React 19, TypeScript, Iconsax-React-Native, Lottie-React-Native  
> **Metro Port**: `8081`

The AGAPP Citizen Native Mobile App provides mobile residents with on-device hardware sensors (Camera, GPS Location, Push Notifications) for rapid civic engagement, instant incident reporting, and digital resident identification.

---

## 📱 Key Features

1. **Hardware-Locked Incident Reporting (`ReportsScreen.tsx`)**:
   - Live camera-only photo evidence capture with on-image GPS coordinate & timestamp stamping.
   - On-device Roboflow ML validity checks for Potholes and Stray Animals.
2. **E-Services & QR Claim Pass (`ServicesScreen.tsx`)**:
   - Complete LGU document directory and requirements browser.
   - Instant Claim QR Code generation for in-person municipal pickup.
3. **Interactive Town Map (`MapExplorerScreen.tsx`)**:
   - Native map view featuring municipal facilities, evacuation routes, and emergency landmarks.
4. **AI Municipal Companion (`ChatbotScreen.tsx`)**:
   - Moving Lottie character mascot (`chatbot-message.json`), typewriter text streaming, and direct action deep links.
5. **Digital Resident ID & Verification (`VerifyIdentityScreen.tsx`, `ProfileScreen.tsx`)**:
   - 4-step ID + live selfie capture flow with direct encrypted upload to `citizen-ids` storage bucket.

---

## 🤖 Context for AI Agents & Developers

- **React 19 Environment**:
  - `apps/mobile` uses **React 19** pinned at the monorepo root for Expo SDK 54.
  - Always install dependencies using `npx expo install <pkg>` to avoid version conflicts with Metro bundler.
- **Direct Supabase & Storage**:
  - Connects directly to Supabase via `supabaseClient.ts`.
  - ID verification photos are uploaded to private bucket `citizen-ids` under `${lguId}/${profile.id}/id_front_${Date.now()}.jpg`.
- **Hardware Sensor Mocking on Emulators**:
  - Incident filing requires GPS location and live camera capture. For testing on simulators without a physical camera, ensure emulator location permissions are granted.
- **Navigation & Gating**:
  - Stack and tab navigation defined in `src/navigation/AppNavigator.tsx`.
  - Root stack listener enforces immediate redirection to `BannedScreen` when `moderation_status === 'banned'` or `RestrictedScreen` when `moderation_status === 'restricted'`.

---

## 🛠️ Development & Environment

```bash
# From agapp-system/
npm run dev:mobile

# Or run with LAN IP directly for physical phone testing:
cd apps/mobile
npx expo start --lan --clear
```

Create `.env` from `.env.example`:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:3000/api
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_PC_LAN_IP>
```
