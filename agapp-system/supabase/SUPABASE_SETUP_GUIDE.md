# Supabase Setup Guide for AGAPP

This guide provides step-by-step instructions for creating a new Supabase project, executing the database scripts in the correct order, setting up authentication, and updating your local environment variables.

---

## Step 1: Create a New Supabase Project

1. Go to the [Supabase Dashboard](https://supabase.com/) and sign in.
2. Click **New project** and select your Organization.
3. Fill in the project details:
   - **Name:** `AGAPP` (or your preferred project name)
   - **Database Password:** Create a strong password (save this safely!)
   - **Region:** Select a region close to your target users (e.g., Singapore/Southeast Asia).
   - **Pricing Plan:** Select **Free** (or your preferred plan).
4. Click **Create new project** and wait for the database provisioning to complete (typically takes 1-2 minutes).

---

## Step 2: Configure Database Schema & Storage

Once your project is ready, navigate to the **SQL Editor** (the terminal icon in the left sidebar) on your Supabase dashboard and run the scripts in the following order:

### 1. Run `schema.sql` (Tables & RLS)
- Open [schema.sql](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/supabase/schema.sql) in your code editor.
- Copy the entire file content.
- In the Supabase SQL Editor, click **New query**, paste the SQL code, and click **Run**.
- *This installs the PostGIS spatial extension, creates the core tables (`lgus`, `users`, `reports`, `service_requests`, etc.), registers the forum bad-word filter triggers, and applies Row-Level Security (RLS) policies.*

### 2. Run `storage_setup.sql` (Storage Buckets)
- Open [storage_setup.sql](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/supabase/storage_setup.sql) in your code editor.
- Copy the content, create another **New query** in Supabase, paste it, and click **Run**.
- *This provisions two public storage buckets: `report-photos` (for citizen concern uploads) and `service-attachments` (for e-services PDF files/proofs), and sets up access policies.*

---

## Step 3: Setup Authentication & Seed Users

Since the database uses Row-Level Security (RLS) and maps profiles directly to Supabase Auth user IDs, you **MUST** create the Auth users first and copy their system-generated UUIDs into the seed script.

### 1. Create Users in the Supabase Dashboard
1. Go to **Authentication** (the key icon in the left sidebar) -> **Users**.
2. Click **Add user** -> **Create user** for the following test accounts:
   - **Super Admin:** `superadmin@agapp.gov.ph` / password: `password123` (Auto-confirms email)
   - **LGU Admin:** `admin@liliw.gov.ph` / password: `password123`
   - **Citizen Demo:** `citizen.demo@email.com` / password: `password123`
   - **Citizen Personal:** `dayolawrence754@gmail.com` / password: `password123`

### 2. Map Auth UUIDs to Database Seeds
1. In the **Users** table of the Authentication tab, you will see a **User UID** column containing UUID strings (e.g., `42fe0700-7c7c-4e20-bff0-d40adf329a84`).
2. Open [seed.sql](file:///c:/Users/Lawrence/Documents/PROJECTS/AGAP/agapp-system/supabase/seed.sql) in your code editor.
3. Locate lines 60-95 in the `seed.sql` script under `INSERT INTO users`.
4. Replace the placeholder UUIDs in `seed.sql` with the actual **User UID** strings you copied from the dashboard:
   - Line 61: Replace placeholder UUID for `superadmin@agapp.gov.ph`
   - Line 70: Replace placeholder UUID for `admin@liliw.gov.ph`
   - Line 79: Replace placeholder UUID for `citizen.demo@email.com`
   - Line 88: Replace placeholder UUID for `dayolawrence754@gmail.com`
5. Copy the updated content of `seed.sql`.
6. Open a **New query** in the Supabase SQL Editor, paste the updated script, and click **Run**.
7. *This seeds your database with your custom Auth-linked user records, registered municipalities (Liliw & Nagcarlan), sample reports, and e-service requests.*

---

## Step 4: Update Monorepo Environment Variables

To connect your NestJS API, Next.js Web Admin, and Expo Mobile App to your new Supabase project:

1. Go to **Project Settings** (the gear icon at the bottom of the left sidebar) -> **API**.
2. Copy your **Project URL** and your **anon/public API key** (and optionally the **service_role secret key** for the backend API).
3. Update the following configuration files in your repository:

### 1. Web Admin (`apps/admin/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-public-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. NestJS REST API (`apps/api/.env`)
```env
SUPABASE_URL=https://your-new-project-ref.supabase.co
SUPABASE_KEY=your-new-service-role-secret-key
GEMINI_API_KEY=your-google-gemini-key
PORT=5000
```
> **Security Note:** Always use the `service_role` key (bypass RLS) for `SUPABASE_KEY` on your backend server (`apps/api`), but only use the public `anon` key on client apps.

### 3. Mobile App Client (`apps/mobile/.env`)
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
EXPO_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-public-key
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.x.x
```
*(Replace `192.168.x.x` with your local computer's Wi-Fi network LAN IP so Expo Go can connect to your local server).*

---

## Step 5: Test & Verify

1. Run the local backend services:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000/` and attempt logging in with:
   - **Super Admin:** `superadmin@agapp.gov.ph` / `password123`
   - **LGU Admin:** `admin@liliw.gov.ph` / `password123`
3. Verify that the analytics, reports table, service requests list, and announcements query and display your seeded database rows dynamically!
