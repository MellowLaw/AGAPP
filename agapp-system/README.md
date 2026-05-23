# AGAPP System - Prototype (50% MVP for Mock Defense)

This is the prototype monorepo of the **Automated Governance and Public Service Platform (AGAPP)**. It contains the core components:
1.  **Shared Library (`packages/shared`)**: Interfaces, type definitions, and validator schemas.
2.  **API Backend Server (`apps/api`)**: Node.js/Express server providing authentication, LGU details, reporting, and service request processing (with mock database seeds and geofencing coordinates check).
3.  **Admin Dashboard (`apps/admin`)**: Next.js desktop web app representing the Super Admin and LGU Admin dashboard (logins, queues, maps, routing rules).
4.  **Citizen App Simulator (`apps/mobile`)**: Mobile app mockup running inside a custom web-viewport browser frame representing the citizen's mobile client.

---

## 🚀 How to Run the Applications

Ensure you have **Node.js (v18+)** and **npm** installed on your system.

### Step 1: Install Dependencies
Open a command prompt in the `/agapp-system` directory and run:
```bash
npm install
```

### Step 2: Build Shared Packages
Build the shared types library first so that the other apps can resolve the imports:
```bash
npm run build --workspace=packages/shared
```

### Step 3: Run All Applications Concurrently
Boot all three applications (API, Admin Dashboard, Citizen App) in parallel:
```bash
npm run dev
```

The apps will be available at:
*   **Citizen Mobile App Simulator**: [http://localhost:19006](http://localhost:19006)
*   **LGU / Super Admin Dashboard**: [http://localhost:3000](http://localhost:3000)
*   **API Server Endpoint**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔑 Demo Login Credentials

For convenience, you can click the **Quick Login** buttons on the login screens, or use:

| Role | Email | Password | Details |
|---|---|---|---|
| **Super Administrator** | `superadmin@agapp.gov.ph` | `password123` | Provision LGUs, check feature flags and billing tiers. |
| **LGU Administrator** | `admin@naga.gov.ph` | `password123` | Review issues, process documents, moderate forum. |
| **Citizen (Mobile)** | `lawrence@email.com` | (OTP: `123456`) | Apply for documents, submit pothole reports. |

---

## 💡 Mock Defense Walkthrough Script

Use this step-by-step flow to impress the defense panel:

### Scenario 1: On-Device YOLO Pothole Credibility (Mitigating DoS/DDoS)
1.  Open the **Citizen App** at `http://localhost:19006`. Use email `lawrence@email.com` and log in with OTP `123456`.
2.  Select **Naga City LGU**.
3.  Tap the **Report** button.
4.  Select **Pothole** and click **Open Camera Viewfinder**.
5.  *Demo Success*: Click **Snap Pothole Image**. You will see:
    `YOLO Check: Valid Road Damage (95%)` -> The Submit button becomes active.
6.  *Demo Spam Block*: Remove the photo and click **Open Camera** again. Click **Snap Random Image**. You will see:
    `YOLO Alert: Non-damage detected (18%)` -> An alert warns that submitting this may tag the account as spam.
7.  Submit the valid Pothole report.

### Scenario 2: LGU Admin SLA Auto-Routing (Republic Act No. 11032)
1.  Open the **Admin Dashboard** at `http://localhost:3000`. Login as **Naga LGU Admin**.
2.  Click **Issue Reports** on the left menu.
3.  Locate the newly submitted pothole report. Note that it has been **auto-assigned** to the *Engineering Office* with an SLA Tier of *Simple* (max 3 days resolution), in compliance with RA 11032.
4.  Click **Acknowledge & Route**.

### Scenario 3: Document Security & Processing (Data Privacy Act of 2012)
1.  Go back to the **Citizen App** and tap **Services**.
2.  Choose **Birth Certificate Request** and click **Apply Document**.
3.  Fill in the guided form details and submit. Note that the app generates a **Reference Number and QR Code** for in-person municipal hall collection.
4.  Switch to the **Admin Dashboard** and click **Service Requests**.
5.  Locate the birth certificate application. View the detail panel. Note that you can click **Mark Under Review** -> **Process** -> **Mark Released**.

### Scenario 4: Profanity Forum Moderation (RA 10175)
1.  Go to the **Citizen App** and tap **Forum**.
2.  Type a clean message (e.g. `"Good morning Naga!"`). It appears immediately.
3.  Type a message containing a flagged word: `"This is annoying, putang ina!"`.
4.  Notice the post is automatically flagged as **Awaiting Moderation** and hidden from public view.
5.  Switch to the **Admin Dashboard** under **Forum Moderation** to approve or delete the post.

---

## 🛠️ Folder Layout Architecture

```
/agapp-system
  ├── apps/
  │    ├── admin/            # Next.js Admin Dashboard (Super Admin & LGU Admin)
  │    ├── mobile/           # Expo Citizen App (runs on Mobile & Web Browser)
  │    └── api/              # Node.js TypeScript REST API Backend
  ├── packages/
  │    └── shared/           # Common interfaces, types, and schema validators (zod)
  ├── package.json           # Root workspace config (pnpm or npm)
  └── README.md              # Startup instruction
```
