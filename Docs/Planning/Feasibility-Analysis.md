# AGAPP — Feasibility, Improvements, and Tech Stack Analysis

> Scope: Multi-tenant SaaS platform for LGUs composed of **(1) Super Admin Dashboard**, **(2) LGU Admin Dashboard (tenant)**, and **(3) Citizen Mobile App**. Client: pilot municipality, with a roadmap to onboard other LGUs.
> References: MyNaga App (EasybusPH), eGovPH Super App (DICT).

---

## 1. Feasibility Review of Proposed Features

Legend: ✅ feasible as-is · ⚠️ feasible with caveats · 🔴 re-scope recommended

| # | Feature | Verdict | Notes |
|---|---|---|---|
| 1 | **E-Services Portal** (documents) | ✅ | **Decision (per client scope):** No online payment in v1. App generates a pre-filled **application form (PDF) + reference number/QR**; citizen pays in person at the municipal hall. Status flow: *Submitted → For Payment → Ready for Pickup → Released*. Covered offices: **Civil Registrar** (birth/marriage/death records), **Municipal Assessor** (RPT declaration / tax dec copy), **Business Permits & Licensing Office (BPLO)** (business permit application/renewal). **Public Information / Citizen Help Desk** and **PESO** are folded into the *Announcements* + *Chatbot* modules. Online payment (PayMongo / Link.BizPortal) is deferred to v2. |
| 1 | **Service Directory** | ✅ | Pure CMS feature; easy win. |
| 2 | **Citizen Guide System** | ✅ | Static/semi-static content managed by LGU Admin. |
| 3 | **Emergency Assistance Access** | ✅ | Use `tel:` deep links + optional one-tap SOS with GPS payload. Avoid replacing the 911 hotline—complement it. |
| 4 | **News and Updates** | ✅ | CMS + push notifications. |
| 5 | **Pothole Detection (ML)** | ⚠️ | On-device inference via **TensorFlow Lite** with a fine-tuned **YOLOv8n / MobileNetV3** model; user confirms before submission (*confidence assist*). **Continual learning approach (recommended): Active Learning** — user-confirmed images + admin-reviewed labels are added to a server-side dataset; the model is **retrained periodically (e.g., monthly)** in Colab and pushed to the app via OTA model update. On-device training is technically possible but **not recommended** (limited TFLite support, hard to validate quality). |
| 5 | **Service Requests (e.g., garbage schedule)** | ✅ | Simple lookup + subscription to reminders. |
| 5 | **Utility/Power Line Reporting** | ✅ | **Decision:** Report goes to the LGU Admin only; the LGU's assigned department coordinates with Meralco / electric cooperative externally. No third-party API integration required. Renamed from *"Utility Pole (Meralco)"* to stay utility-agnostic across LGUs. |
| 5 | **Clogged Drain Reporting** | ✅ | Standard photo + geotag report to Engineering/Sanitation office. |
| 5 | **Stray & Missing Pets** | ✅ | Community-driven; route to City Veterinary Office. Add moderation. |
| 5 | **Lost & Found** | ✅ | Community board; moderation required to avoid abuse. |
| 6 | **Request/Report Tracking** | ✅ | Core workflow; status machine with audit log. |
| 7 | **User Personalization (dark/light)** | ✅ | Trivial. Extend to **language toggle (EN/FIL/local dialect)**. |
| 8 | **External Links & Social Media** | ✅ | Just outbound links; embed RSS/Facebook Graph for auto-news where possible. |
| 9 | **Community Forum** | ⚠️ | **Decision:** Implemented with **Facebook-style heavy moderation** since citizens are already used to that experience. Required toolkit: report/block button, profanity filter (PH wordlist), image NSFW scanner, post-approval queue for new accounts, shadow-ban, full audit log, and moderation console in the LGU Admin dashboard. Operates under DPA + RA 10175 (Cybercrime) takedown procedures. |
| 10 | **Chatbot Customer Support** | ✅ | **Decision:** Scope = answer basic questions about the LGU and its services. Implementation: **rule-based FAQ + RAG (Retrieval-Augmented Generation)** over the LGU's own service directory, citizen guide, and announcements. Fallback: *"I'm not sure — would you like to file a support ticket?"* which creates a ticket in LGU Admin. No freeform legal advice. |
| 11 | **Municipal Hall Interactive Map** | ✅ | SVG floor plan with tap-to-highlight office. Lightweight. |
| 12 | **Town Map with Landmarks** | ✅ | Mapbox / MapLibre / Leaflet + OSM tiles + LGU-curated POIs. |

**Overall verdict:** The feature set is appropriate and aligns with MyNaga/eGovPH conventions. The main capstone-scope risks are the **E-payments**, **ML pothole detector quality**, and **forum moderation**.

---

## 2. Recommended Additional/Improved Features

### 2.1 Platform & Multi-Tenancy (critical for your "scalable / sell to other LGUs" goal)
- **Multi-tenant architecture** with `lgu_id` on every record; single codebase, one mobile app that **switches LGU context** on first launch (like eGovPH choosing an agency).
- **Feature flags per LGU** — each LGU Admin can toggle modules on/off (e.g., some LGUs don't need pothole detection but want tourism).
- **Theming per LGU** — logo, colors, banner, seal set from LGU Admin dashboard and fetched by the mobile app at runtime.
- **Custom service builder** — no-code form builder so LGU Admins can add their *own* unique services (e.g., "Senior Citizen Medicine Request") without developer intervention. This directly answers your "unique services per LGU" requirement.
- **Tenant onboarding workflow** — Super Admin can provision a new LGU, create the first LGU Admin, set subscription tier.

### 2.2 Citizen-Facing Additions
- **Unified Citizen Profile / Digital ID wallet** — one-time KYC (PhilSys/National ID optional), reused across all service requests. Inspired by eGovPH SSO.
- **Appointment / Queue Management** — book a slot at City Hall, get a QR code; reduces walk-in congestion. (MyNaga-style.)
- **Push + SMS fallback notifications** — SMS is critical for low-end phones (Semaphore / Movider / Twilio).
- **Disaster & Weather Alerts** — PAGASA + PHIVOLCS feeds, evacuation center locator, pre-disaster checklist.
- **Tourism & Local Business module** — promotes local MSMEs; aligns with "promotional" services you mentioned.
- **Transparency / Budget module** — publish SOCE, annual budget, procurement (Open Data). **Optional blockchain anchoring (per adviser suggestion):** when an LGU publishes a record, the backend computes a **SHA-256 hash** of the JSON record and writes `(record_id, hash, timestamp, publisher_address)` to a tiny smart contract on **Polygon** (~$0.001/anchor) using `ethers.js`. The mobile app shows a *"Verify"* button that re-hashes the current record and compares it with the on-chain hash → *"✓ Untampered. Anchored on [date] · [tx link]"*. This gives tamper-evidence without storing PII on-chain. Cheaper alternative: publish a signed **Merkle root** to a public append-only log (e.g., GitHub).
- **Feedback & Rating per transaction** — **CSAT** (Customer Satisfaction Score, a 1–5 star or 👍/👎 rating after each completed request) collected per transaction. CSAT is a **KPI** (Key Performance Indicator) — a metric used to judge success; the Super Admin dashboard ranks LGUs by avg. CSAT.
- **Offline mode** — cached directory, guide, maps for low-connectivity barangays.
- **Accessibility** — screen-reader labels, dynamic font scaling, high-contrast theme. Aligned with **BP 344** (*Batas Pambansa 344*, the Accessibility Law of 1983, which requires public services and facilities to be accessible to PWDs). The digital equivalent is **WCAG 2.1 AA** compliance.

### 2.3 LGU Admin Dashboard Additions
- **Role-based access** (Mayor/Office Head/Encoder/Moderator) with per-department queues.
- **Assignment & SLA tracking** — **SLA** (*Service Level Agreement*) is a promised response/resolution time, e.g., *"potholes acknowledged in 2 days, resolved in 14 days."* This aligns the system with **RA 11032** (Ease of Doing Business Act), which mandates 3/7/20 working-day processing for simple/complex/highly-technical transactions. **Auto-routing** is rule-based: each report has a `category` and `location`; the LGU Admin defines mapping rules (e.g., *category = pothole → Engineering Office*; *category = stray_pet → City Veterinary*; *barangay = X → notify Barangay X captain*). Rules are editable per LGU.
- **Content scheduler** for news/advisories.
- **Bulk CSV import** for directory, hotlines, offices.
- **Audit log** (who changed what, when).
- **Moderation console** for forum/lost-found/pets.

### 2.4 Super Admin Dashboard Additions
- **Cross-LGU analytics** — active users, report volumes, resolution time, **CSAT** leaderboard (Customer Satisfaction Score, see §2.2).
- **Tenant lifecycle management** — provision, suspend, **billing tier**. A *billing tier* is the subscription plan assigned to each LGU (e.g., **Free Pilot / Standard / Premium**), differing in features such as max admin seats, advanced analytics, custom branding, and ML modules (pothole detector). Tiers are enforced by **feature flags** on each `lgu_id`. For the capstone, this can be stubbed as *Free Pilot vs. Paid* just to demonstrate the architecture; real pricing is set when the platform is offered to other LGUs.
- **Global content templates** — push "default service catalog" to new LGUs.
- **Feature catalog & pricing plans.**
- **System health monitoring** — uptime, error rates, storage usage per tenant.
- **Compliance dashboard** — DPA consent records, data retention schedule, DSAR (Data Subject Access Request) queue.

### 2.5 Research/Capstone Differentiators
- The **ML pothole detector** is the strongest novelty; lean into it with a documented dataset, metrics (precision/recall), and an offline model.
- Add **auto-categorization of citizen reports** via a lightweight text classifier to reduce admin triage time.
- **Heatmap analytics** of reports (reveals hotspots) — a visually impressive capstone output.

---

## 3. Recommended Tech Stack

### 3.1 Overall Architecture
```
┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────┐
│  Citizen Mobile App    │  │  LGU Admin Dashboard   │  │ Super Admin Dashboard│
│  (React Native/Expo)   │  │  (Next.js web)         │  │ (Next.js web)        │
└───────────┬────────────┘  └───────────┬────────────┘  └──────────┬───────────┘
            │                           │                           │
            └──────────────┬────────────┴─────────────┬─────────────┘
                           │                          │
                    ┌──────▼──────┐            ┌──────▼──────┐
                    │  API Layer  │◄──────────►│  Auth / SSO │
                    │  (NestJS /  │            │ (Supabase / │
                    │   FastAPI)  │            │  Auth.js)   │
                    └──────┬──────┘            └─────────────┘
                           │
          ┌────────────────┼───────────────────────────────┐
          │                │                               │
    ┌─────▼─────┐   ┌──────▼──────┐                 ┌──────▼───────┐
    │ Postgres  │   │ Object Store│                 │ Redis / Queue│
    │ (+PostGIS)│   │ (S3/R2/Supa)│                 │ (BullMQ)     │
    └───────────┘   └─────────────┘                 └──────────────┘
```

### 3.2 Recommended Core Stack (capstone-friendly + scalable)

| Layer | Primary Choice | Alternatives | Why |
|---|---|---|---|
| Mobile app | **React Native + Expo (TypeScript)** | Flutter | One codebase iOS/Android, OTA updates, huge ecosystem, easy for a student team. |
| Admin web apps | **Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui** | SvelteKit, Nuxt | Fast dev, SSR, excellent DX, matches capstone expectations. |
| Backend API | **NestJS (Node/TS)** *or* **FastAPI (Python)** | Django, Laravel | NestJS pairs naturally with TS stack; FastAPI if you want Python for ML features. |
| Database | **PostgreSQL + PostGIS** (via Supabase or self-hosted) | MySQL | PostGIS is essential for geo-queries (reports, maps, heatmaps). Multi-tenancy via `lgu_id` + Row-Level Security. |
| Auth | **Supabase Auth** or **Auth.js + JWT** | Firebase Auth, Clerk | Email/phone OTP, social login, MFA; supports Row-Level Security directly. |
| File storage | **Supabase Storage / Cloudflare R2 / AWS S3** | Firebase Storage | Stores report photos, IDs, documents; cheap + presigned URLs. |
| Realtime | **Supabase Realtime** or **Socket.IO** | Pusher, Ably | For status updates, forum, admin notifications. |
| Background jobs | **BullMQ (Redis)** / **Celery** (if FastAPI) | Inngest | Image processing, SMS dispatch, report routing. |
| Push notifications | **Expo Push** + **Firebase Cloud Messaging (FCM)** | OneSignal | Free tiers, covers both platforms. |
| Maps | **MapLibre GL** + **OpenStreetMap** tiles (free), upgrade to **Mapbox** if budget allows | Google Maps | Cheaper and open; Google Maps only where Places/Directions are strictly needed. |
| Geocoding | **Nominatim (OSM)** / **Photon** | Google Geocoding | Free; Google for higher accuracy if budget allows. |
| Payments (PH) | **PayMongo** (cards, GCash, Maya, GrabPay) | Maya Business, Xendit, LandBank Link.BizPortal | PayMongo has the smoothest dev experience for startups; Link.BizPortal is the *official* government collection platform (ideal long-term). |
| SMS | **Semaphore** (PH) / **Movider** | Twilio | Semaphore is cheapest locally and widely used by PH gov/NGOs. |
| Email | **Resend** / **SendGrid** / **Amazon SES** | Mailgun | Transactional emails, OTP, receipts. |
| Chatbot | **Dialogflow CX** (rule+NLU) or **OpenAI + RAG** (pgvector / Pinecone) over LGU knowledge base | Rasa (self-host) | RAG ensures answers stay grounded in LGU-published docs. |
| ML (Pothole detector) | **TensorFlow Lite** / **PyTorch Mobile**, base model **YOLOv8-nano** or **MobileNetV3** fine-tuned; training in **Google Colab**; label with **Roboflow** | MediaPipe | On-device inference keeps costs zero and preserves privacy. |
| Analytics | **PostHog** (self-hostable, privacy-friendly) | Mixpanel, GA4 | Product analytics + feature flags in one. |
| Error monitoring | **Sentry** | Bugsnag | Free tier sufficient for capstone. |
| CI/CD | **GitHub Actions** + **EAS Build** (Expo) + **Vercel** (web) + **Fly.io/Render/Railway** (API) | GitLab CI | Free tiers cover capstone scale. |
| Containers / hosting | **Docker** + **Render/Railway/Fly.io**; production: **AWS / GCP / Azure** | DigitalOcean App Platform | Easy to demo, scales later. |
| Secrets | **Doppler** / **GitHub Secrets** | HashiCorp Vault | Simple and free. |
| Testing | **Jest**, **Playwright** (web), **Detox/Maestro** (mobile), **Pytest** (if FastAPI) | — | Standard. |

### 3.3 Feature-by-Feature Tech Mapping

| Feature | APIs / Services / Libraries |
|---|---|
| **E-Services Portal** | Next.js admin for forms → NestJS REST/GraphQL → Postgres; **PayMongo** (or Maya/Xendit) for online fees; **PDF generation** via `pdf-lib` or Puppeteer; **e-sign** optional via DocuSign or DICT-accredited PNPKI down the road. |
| **Service Directory / Citizen Guide** | Headless CMS pattern in Postgres; optional **Strapi** or **Payload CMS** if you want a ready UI; cached to mobile via Expo Updates / SWR. |
| **Emergency Assistance** | `tel:`, `sms:` deep links; optional SOS → Twilio/Semaphore + push to LGU admin; GPS via `expo-location`. |
| **News & Updates** | Postgres + Admin CMS; push via **FCM / Expo Push**; RSS export; optional **Facebook Graph API** to auto-import Page posts. |
| **Pothole Detection** | **TFLite** model in app (`react-native-fast-tflite` or `@tensorflow/tfjs-react-native`); training with **Roboflow + YOLOv8n**; geotag via `expo-location`; upload via presigned S3/R2 URL. |
| **Service Requests (e.g., garbage)** | CRUD + scheduled reminders via `expo-notifications`; cron jobs in BullMQ. |
| **Utility Pole / Clogged Drain Reports** | Same pipeline: camera (`expo-camera`) → EXIF/GPS → upload to object storage → record in PostGIS (`geography(Point)`) → assignment to department → status machine. |
| **Stray/Missing Pets, Lost & Found** | Same report pipeline + **moderation queue** in LGU Admin; optional image duplicate detection via perceptual hash (`sharp` + pHash). |
| **Request/Report Tracking** | Finite state machine (`xstate` optional); Supabase Realtime / Socket.IO for live updates; push notifications on transitions. |
| **User Personalization** | Local storage (`MMKV` / AsyncStorage); server-side prefs in Postgres; i18n via **i18next** (EN/FIL). |
| **External Links & Social** | Simple link list; **Facebook Graph API** for page feed; **YouTube Data API** for channel uploads. |
| **Community Forum** | Postgres threads/comments; moderation tools; profanity filter (`bad-words` PH wordlist); image scan via **Google Cloud Vision SafeSearch** or open-source NSFW model. |
| **Chatbot** | **Dialogflow CX** for intents + **RAG** pipeline (pgvector + OpenAI / local `llama.cpp`) over LGU knowledge base; fallback to human (ticket → Admin). |
| **Municipal Hall Interactive Map** | SVG + `react-native-svg`; tap handlers highlight offices; JSON layout editable via admin. |
| **Town Map w/ Landmarks** | **MapLibre GL Native** + OSM tiles; POIs from Postgres/PostGIS; clustering via `supercluster`. |
| **Super Admin analytics** | **PostHog** dashboards + custom SQL views on Postgres; charts in admin via **Recharts** / **Tremor**. |
| **Heatmap of reports** | PostGIS `ST_ClusterKMeans` / client-side heatmap layer in MapLibre. |

### 3.4 Notes on Laravel, eGovPH, and MyNaga Stacks

- **Is Laravel OK?** Yes — Laravel is mature, cheap to host in PH, and gives you *Filament* or *Nova* for instant admin dashboards. The tradeoffs vs. the recommended TS stack:
  - Mixing PHP backend with JS/TS mobile app means **no shared types/validators** between client and server.
  - **Realtime** (report status, forum live updates) is easier on Node (Socket.IO) or Supabase Realtime than on Laravel Reverb/Echo.
  - **ML** (pothole detector training) lives naturally in Python, so you may still need a Python microservice regardless of main backend.
  - **Verdict:** If the team is stronger in PHP, `Laravel + Filament (admin) + Laravel API + small Python ML service` is a defendable, valid stack. If the team is comfortable in TypeScript, `NestJS + Next.js + Expo` gives better end-to-end code sharing.
- **What do eGovPH and MyNaga use?** Neither publishes their stack officially. Public signals only:
  - **eGovPH** (DICT) — appears to be a hybrid/native Android shell; DICT's other systems lean on Java/Kotlin + Spring Boot. *Not officially confirmed.*
  - **MyNaga** (EasybusPH) — EasybusPH's other apps are consistent with **Flutter** front-ends and a Node/Laravel backend, inferred from store listings, not disclosed.
  - **Takeaway:** Do not pick a stack based on what they *might* use. Pick based on team skills + constraints above.

---

## 4. Testing & Deployment Strategy

### 4.1 Testing Layers

| Layer | Tool | What to test |
|---|---|---|
| Unit | **Jest** (TS) / **Pytest** (if FastAPI) / **PHPUnit** (if Laravel) | Pure functions, validators, state machines (report status transitions), permission checks. |
| Integration | **Supertest** (NestJS) / **Pytest + httpx** / **Laravel HTTP tests** | API endpoints with a test Postgres DB (Docker). Covers auth, tenant isolation (RLS), CRUD. |
| E2E Web | **Playwright** | LGU Admin & Super Admin flows: login → create service → approve report → publish news. |
| E2E Mobile | **Maestro** (easiest) or **Detox** | Citizen flows: register → file report → track status → receive push. |
| Contract | **OpenAPI schema** + **Dredd** or **Schemathesis** | Ensures mobile and admin clients stay in sync with API. |
| Load | **k6** or **Artillery** | Simulate 1k concurrent report submissions; check p95 latency. |
| Security | **OWASP ZAP** (DAST), **npm audit / Snyk** (SCA), **Semgrep** (SAST) | Required for DPA compliance narrative in your paper. |
| ML model | **Pytest** + held-out test set → precision/recall/F1; confusion matrix per class | Pothole detector metrics; retrain regression check. |
| Accessibility | **axe-core** (web), **Accessibility Scanner** (Android) | WCAG 2.1 AA checks. |

### 4.2 Test Data & Environments

- **Environments:** `local` → `dev` → `staging` → `production`. Each has its own Postgres + object storage + API domain.
- **Seed data:** a `seed.ts`/`seed.py` script that creates 1 Super Admin, 2 mock LGUs, 3 LGU Admins, 10 citizens, sample reports/news. Critical for demo + tests.
- **Test tenants:** always run E2E against a dedicated `lgu_test` tenant so prod-like data is never touched.

### 4.3 CI Pipeline (GitHub Actions)

Pipeline on every PR:
1. `install` (pnpm install / pip install)
2. `lint` (ESLint + Prettier / Ruff)
3. `typecheck` (tsc / mypy)
4. `unit + integration tests` against ephemeral Postgres (GitHub Actions service container)
5. `build` web apps + API Docker image
6. `e2e` (Playwright) against preview deployment
7. `security scan` (Semgrep + npm audit)

On merge to `main`: auto-deploy to `staging`. On tagged release: deploy to `production` with manual approval.

### 4.4 Deployment

**Recommended (budget-friendly, capstone-appropriate):**

| Component | Host | Notes |
|---|---|---|
| API (NestJS/FastAPI/Laravel) | **Render / Railway / Fly.io** | Docker-based, free tiers, easy autoscale. |
| Postgres + PostGIS | **Supabase** or **Neon** (with PostGIS) | Managed; daily backups; point-in-time recovery. |
| Object storage | **Cloudflare R2** or **Supabase Storage** | Cheap egress; presigned uploads. |
| Redis (queues) | **Upstash Redis** | Serverless, generous free tier. |
| Admin web apps (Next.js) | **Vercel** | Zero-config; preview deploys per PR. |
| Mobile app | **Expo EAS Build + EAS Submit** | Builds signed `.aab` / `.ipa`; submits to Play Store / App Store. **EAS Update** lets you push JS-only fixes without a store re-review. |
| Domain + CDN + WAF | **Cloudflare** | Free TLS, DDoS, basic WAF. |
| CI/CD | **GitHub Actions** | Covers all of the above. |
| Monitoring | **Sentry** (errors) + **PostHog** (product) + **UptimeRobot** (uptime) | All have free tiers. |
| Secrets | **Doppler** or GitHub Actions encrypted secrets | Never commit `.env`. |

**If you must self-host on an LGU server** (some LGUs require on-prem under DICT Cloud First guidelines for sensitive data):
- Single Ubuntu VM with Docker Compose: `api`, `postgres+postgis`, `redis`, `nginx`, `minio` (S3-compat).
- Backups: `pg_dump` → encrypted tarball → offsite (S3/Dropbox) daily.
- Put Cloudflare Tunnel in front to avoid exposing the VM's public IP.

### 4.5 Release Strategy

- **Mobile:** Use **Expo EAS Update channels** — `development`, `staging`, `production`. Roll out to `production` gradually (25% → 50% → 100%) so you can halt if Sentry errors spike.
- **Web:** Vercel preview deployments per PR → stakeholder reviews → merge → auto-deploy.
- **API:** Blue/green or rolling restarts. Database migrations: use **expand-and-contract** (never drop a column in the same release that stops using it).
- **Versioning:** Semantic versioning on API (`/api/v1`). Mobile app checks minimum supported API version on launch.

### 4.6 Demo Day Checklist (Capstone Defense)

- [ ] Seed data loaded with realistic PH sample (Filipino names, Bicol addresses if piloting there).
- [ ] 2 LGUs visible in Super Admin to prove multi-tenancy.
- [ ] One end-to-end flow recorded as backup video (in case live demo fails).
- [ ] Pothole model has a documented test set with precision/recall in your paper.
- [ ] DPA compliance artifacts printed: Privacy Notice, PIA, DPO appointment letter (template).
- [ ] Offline-mode demo (turn Wi-Fi off, show cached directory/guide).
- [ ] Accessibility demo (screen reader on one screen).

---

## 5. Compliance — RA 10173 (Data Privacy Act of 2012) & Related Laws

This is **not optional** — an LGU app collecting citizen PII must comply, and your adviser will likely check this.

### 5.1 Governance
- Appoint a **Data Protection Officer (DPO)** per tenant LGU; the platform itself should also have a Super-Admin-level DPO contact. Register the DPO(s) with the **National Privacy Commission (NPC)**.
- Maintain a **Privacy Management Program** and a **Privacy Impact Assessment (PIA)** per LGU deployment (NPC Advisory 2017-03).
- Publish a clear **Privacy Notice / Policy** and **Terms of Service** accessible from the app's first-run and settings.

### 5.2 Lawful Basis & Consent
- Collect **explicit, granular, revocable consent** at sign-up for each purpose (service delivery, analytics, forum, marketing). Store consent records (timestamp, version, IP/device).
- Provide **age gating** — minors require parental consent; consider restricting forum/reporting features to 18+.

### 5.3 Data Subject Rights (implement endpoints + admin tooling)
- Right to be **informed, access, object, erase/block, rectify, data portability, file a complaint, damages**.
- Build a **DSAR workflow** in the Super Admin/LGU Admin dashboards: export user data, delete user data, rectify fields.

### 5.4 Security Measures (NPC Circular 16-01)
- **Organizational**: access control matrix, staff NDA, training logs.
- **Physical**: for on-prem LGU servers, access logs to server rooms.
- **Technical**:
  - TLS 1.2+ everywhere; HSTS on web.
  - Encryption **at rest** (Postgres TDE / disk encryption / `pgcrypto` for sensitive columns like National ID).
  - Hashed passwords (`argon2id`).
  - **Row-Level Security** to enforce tenant isolation.
  - Audit logs (append-only) for admin actions.
  - MFA for all admin roles.
  - Rate limiting & WAF (Cloudflare).
  - Regular **vulnerability assessments / penetration tests**.
- **Data minimization** — don't collect National ID or birthdate unless the specific service requires it.
- **Retention schedule** — auto-purge draft reports, expired OTPs, inactive accounts per policy.

### 5.5 Breach Management
- Build an **incident response plan** with 72-hour NPC notification capability (NPC Circular 16-03).
- In-app and email **breach notification** to affected data subjects.

### 5.6 Related Philippine Laws to Note
- **RA 11055 (PhilSys Act)** — if integrating National ID, follow PSA guidelines; do not store the PhilSys Number (PSN) in plaintext.
- **RA 8792 (E-Commerce Act)** — validity of electronic documents/signatures.
- **RA 11032 (Ease of Doing Business & Efficient Gov't Service Delivery Act)** — mandates processing timelines (3/7/20 working days) which your SLA tracking should mirror.
- **RA 10175 (Cybercrime Prevention Act)** — forum moderation & takedown process.
- **DICT MC 008 s.2020 (Cloud First Policy)** — guides where government data may be hosted.
- **BP 344 / RA 7277 (Accessibility)** — UI must be accessible to PWDs; follow WCAG 2.1 AA.
- **Anti-Red Tape Authority (ARTA)** standards — display citizen's charter inside the app.

### 5.7 Platform-Level Practical Checklist
- [ ] Privacy Notice + consent screens on first launch
- [ ] Granular consent toggles in Settings (marketing, analytics, forum)
- [ ] "Download my data" + "Delete my account" buttons
- [ ] Admin audit log viewer
- [ ] MFA for admins, password policy, session timeout
- [ ] Row-Level Security policies per `lgu_id` and per role
- [ ] Encrypted backups + retention policy documented
- [ ] DPO contact in About screen of app
- [ ] Breach notification template & runbook
- [ ] PIA document per LGU (template provided to LGU Admin)

---

## 6. Suggested Next Steps

1. **Lock feature scope** for capstone MVP (recommend: Service Directory, Citizen Guide, Emergency, News, Reports w/ Pothole ML, Tracking, Chatbot-FAQ, Maps, LGU Admin, Super Admin analytics). Defer e-payments and open forum to v2.
2. **Draft multi-tenant data model** (`lgus`, `users`, `user_lgu_roles`, `services`, `reports`, `news`, `consents`, `audit_logs`). I can generate the ERD + initial Prisma/SQL schema on request.
3. **Set up monorepo** (pnpm workspaces): `apps/mobile` (Expo), `apps/admin-lgu` (Next.js), `apps/admin-super` (Next.js), `apps/api` (NestJS), `packages/ui`, `packages/types`.
4. **Pilot with one LGU** → collect usage metrics via PostHog → iterate before offering to other LGUs.
5. **Prepare compliance artifacts** early (Privacy Notice, PIA template, DPA checklist) — these are part of the defense.

Let me know which section you want to drill into next (e.g., ERD, monorepo scaffold, pothole model pipeline, or admin dashboard wireframes) and I'll build it out.
