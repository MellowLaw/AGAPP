#!/usr/bin/env node
/**
 * ============================================================================
 * AGAPP SYSTEM INTEGRITY & SECURITY HARDENING TEST SUITE
 * ============================================================================
 * Purpose: Automated, self-contained verification testing for:
 *   1. Dynamic Geolocation Centering (No hardcoded coordinates)
 *   2. Next.js HTTP Security Headers (X-Frame-Options, X-Content-Type-Options)
 *   3. Forum Decommissioning (0 legacy forum links in active UI navigation)
 *   4. API DTO Validation & Schema Safety
 *   5. Database Trigger Security Patch Verification
 * 
 * Run command: node scripts/test-system-integrity.js
 * (Easily removable at any time)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m : ${testName}`);
    testsPassed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m : ${testName}`);
    if (details) console.error(`    \x1b[33m${details}\x1b[0m`);
    testsFailed++;
  }
}

console.log('\n=============================================================');
console.log('       RUNNING AGAPP SYSTEM & SECURITY TEST SUITE            ');
console.log('=============================================================\n');

// ----------------------------------------------------------------------------
// TEST SUITE 1: Dynamic Geolocation & Coordinate Centering
// ----------------------------------------------------------------------------
console.log('\x1b[36m[1/5] Testing Dynamic Geolocation & Map Centering...\x1b[0m');

const reportPagePath = path.join(__dirname, '../apps/citizen-web/src/app/report/page.tsx');
const mapPagePath = path.join(__dirname, '../apps/citizen-web/src/app/map/page.tsx');

if (fs.existsSync(reportPagePath)) {
  const reportCode = fs.readFileSync(reportPagePath, 'utf8');
  assert(
    reportCode.includes('activeLgu?.latitude') && reportCode.includes('setLatitude(activeLgu.latitude)'),
    'Report page dynamically centers coordinates on activeLgu',
    'Report page must update coordinates when activeLgu changes'
  );
} else {
  assert(false, 'Report page exists', `File not found: ${reportPagePath}`);
}

if (fs.existsSync(mapPagePath)) {
  const mapCode = fs.readFileSync(mapPagePath, 'utf8');
  assert(
    !mapCode.includes('const LGU_COORDINATES: Record'),
    'Town Map page has eliminated static LGU_COORDINATES dictionary',
    'Static coordinate dictionary should be replaced with activeLgu dynamic properties'
  );
  assert(
    mapCode.includes('activeLgu?.latitude') && mapCode.includes('activeLgu?.longitude'),
    'Town Map page derives lguCenter dynamically from activeLgu',
    'Town Map page must read latitude & longitude from activeLgu context'
  );
} else {
  assert(false, 'Town Map page exists', `File not found: ${mapPagePath}`);
}

// ----------------------------------------------------------------------------
// TEST SUITE 2: HTTP Security Headers Configuration
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m[2/5] Testing HTTP Security Headers...\x1b[0m');

const nextConfigPath = path.join(__dirname, '../apps/citizen-web/next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const configCode = fs.readFileSync(nextConfigPath, 'utf8');
  assert(
    configCode.includes('X-Frame-Options') && configCode.includes('DENY'),
    'Next.js config enforces X-Frame-Options: DENY (Clickjacking Defense)'
  );
  assert(
    configCode.includes('X-Content-Type-Options') && configCode.includes('nosniff'),
    'Next.js config enforces X-Content-Type-Options: nosniff (MIME Sniffing Defense)'
  );
  assert(
    configCode.includes('Referrer-Policy') && configCode.includes('strict-origin-when-cross-origin'),
    'Next.js config enforces Referrer-Policy: strict-origin-when-cross-origin'
  );
} else {
  assert(false, 'next.config.mjs exists', `File not found: ${nextConfigPath}`);
}

// ----------------------------------------------------------------------------
// TEST SUITE 3: Forum Decommissioning & UI Cleanliness
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m[3/5] Testing Legacy Forum Decommissioning...\x1b[0m');

const homePagePath = path.join(__dirname, '../apps/citizen-web/src/app/page.tsx');
const navbarPath = path.join(__dirname, '../apps/citizen-web/src/components/layout/Navbar.tsx');
const searchModalPath = path.join(__dirname, '../apps/citizen-web/src/components/search/CommandSearchModal.tsx');

if (fs.existsSync(homePagePath)) {
  const homeCode = fs.readFileSync(homePagePath, 'utf8');
  assert(
    !homeCode.includes("from('forum_posts')"),
    'Citizen home page does NOT perform backend queries to forum_posts'
  );
  assert(
    !homeCode.includes("href: '/forum'"),
    'Citizen home page quickActions bento does NOT link to /forum'
  );
}

if (fs.existsSync(navbarPath)) {
  const navCode = fs.readFileSync(navbarPath, 'utf8');
  assert(
    !navCode.includes("href: '/forum'"),
    'Citizen navbar does NOT contain /forum navigation link'
  );
}

if (fs.existsSync(searchModalPath)) {
  const searchCode = fs.readFileSync(searchModalPath, 'utf8');
  assert(
    !searchCode.includes("from('forum_posts')") && !searchCode.includes("'forum' |"),
    'Omni-search command palette does NOT query forum_posts or have forum category'
  );
}

// ----------------------------------------------------------------------------
// TEST SUITE 4: Backend API DTOs & AI Chatbot Prompt Safety
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m[4/5] Testing NestJS API Validation & AI Safety...\x1b[0m');

const apiControllersPath = path.join(__dirname, '../apps/api/src/app.controllers.ts');
if (fs.existsSync(apiControllersPath)) {
  const apiCode = fs.readFileSync(apiControllersPath, 'utf8');
  assert(
    apiCode.includes('class VerifyImageDto'),
    'ReportController implements dedicated VerifyImageDto class'
  );
  assert(
    apiCode.includes('@IsString()') && apiCode.includes('@MaxLength('),
    'VerifyImageDto uses class-validator decorators for payload sanitization'
  );
  assert(
    !apiCode.includes('"Forum" (Go to Forum)'),
    'Chatbot system prompt does NOT output legacy Forum redirect instructions'
  );
} else {
  assert(false, 'app.controllers.ts exists', `File not found: ${apiControllersPath}`);
}

// ----------------------------------------------------------------------------
// TEST SUITE 5: Database Security Patch & Trigger Verification
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m[5/5] Testing Database Security Patch...\x1b[0m');

const patchSqlPath = path.join(__dirname, '../supabase/patches/003_secure_auth_trigger_and_rls.sql');
if (fs.existsSync(patchSqlPath)) {
  const sqlCode = fs.readFileSync(patchSqlPath, 'utf8');
  assert(
    sqlCode.includes('FUNCTION public.handle_new_citizen()') && sqlCode.includes('SECURITY DEFINER'),
    'Security patch defines SECURITY DEFINER function for automated user provisioning'
  );
  assert(
    sqlCode.includes("'CITIZEN'") && sqlCode.includes("'unverified'"),
    'Security patch strictly hardcodes role=CITIZEN to prevent client privilege escalation'
  );
  assert(
    sqlCode.includes('CREATE TRIGGER on_auth_user_created'),
    'Security patch establishes trigger on auth.users table'
  );
} else {
  assert(false, '003_secure_auth_trigger_and_rls.sql exists', `File not found: ${patchSqlPath}`);
}

// ----------------------------------------------------------------------------
// TEST SUMMARY & EXIT CODE
// ----------------------------------------------------------------------------
console.log('\n=============================================================');
console.log(`TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('=============================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All system hardening & security integrity tests PASSED!\x1b[0m\n');
  process.exit(0);
}
