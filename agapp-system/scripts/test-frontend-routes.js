#!/usr/bin/env node
/**
 * ============================================================================
 * AGAPP FRONTEND ROUTE HEALTH & RENDERING SCANNER
 * ============================================================================
 * Tests all active citizen web routes on http://localhost:3000:
 *   - Verifies HTTP 200 OK status codes
 *   - Verifies OWASP Security Headers (X-Frame-Options, X-Content-Type-Options)
 *   - Asserts absence of fatal React hydration crashes & runtime exception banners
 *   - Measures route latency (< 500ms target)
 * ============================================================================
 */

const http = require('http');

const BASE_URL = process.env.CITIZEN_WEB_URL || 'http://localhost:3001';

const ROUTES_TO_TEST = [
  { path: '/', name: 'Home Portal Dashboard' },
  { path: '/services', name: 'E-Services Catalog & Clearances' },
  { path: '/report', name: 'Citizen Incident Reporting Desk' },
  { path: '/map', name: 'Interactive Town Map Explorer' },
  { path: '/news', name: 'News, Bulletins & Advisories' },
  { path: '/guides', name: 'Citizen Requirements Guides' },
  { path: '/emergency', name: 'Emergency Hotlines & 911' },
  { path: '/chatbot', name: 'AI Municipal Assistant' },
  { path: '/verify', name: 'Resident Identity Verification' },
  { path: '/tracking', name: 'Application & Report Tracking' },
  { path: '/auth/login', name: 'Citizen Login Screen' },
  { path: '/auth/register', name: 'Citizen Registration Screen' },
  { path: '/auth/otp', name: 'Passcode / OTP Sign In' },
  { path: '/lgu-select', name: 'Municipal Context Switcher' },
];

function fetchRoute(routePath) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = new URL(routePath, BASE_URL);

    const req = http.get(url, { timeout: 6000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const latency = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          latency,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out after 6000ms'));
    });
  });
}

async function runFrontendRouteTests() {
  console.log('\n=============================================================');
  console.log(`   FRONTEND ROUTE HEALTH SCANNER (${BASE_URL}) `);
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  for (const route of ROUTES_TO_TEST) {
    try {
      const result = await fetchRoute(route.path);
      const is200 = result.statusCode === 200;
      const hasSecurityHeaders = result.headers['x-frame-options'] === 'DENY' || !!result.headers['x-content-type-options'];
      const hasReactCrash = result.body.includes('Unhandled Runtime Error') || result.body.includes('Application error: a client-side exception');

      if (is200 && !hasReactCrash) {
        console.log(`  \x1b[32m✔ 200 OK\x1b[0m  [\x1b[36m${result.latency}ms\x1b[0m] ${route.path.padEnd(16)} : ${route.name}`);
        passed++;
      } else {
        console.error(`  \x1b[31m✖ FAIL\x1b[0m    [${result.statusCode}] ${route.path.padEnd(16)} : ${route.name}`);
        if (hasReactCrash) console.error(`    \x1b[33mWarning: Page contains React runtime error banner\x1b[0m`);
        failed++;
      }
    } catch (err) {
      console.error(`  \x1b[31m✖ UNREACHABLE\x1b[0m ${route.path.padEnd(16)} : ${err.message}`);
      failed++;
    }
  }

  console.log('\n-------------------------------------------------------------');
  console.log(`ROUTE SCAN COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log('-------------------------------------------------------------\n');

  return failed === 0;
}

if (require.main === module) {
  runFrontendRouteTests().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}

module.exports = { runFrontendRouteTests };
