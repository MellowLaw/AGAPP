#!/usr/bin/env node
/**
 * ============================================================================
 * AGAPP MASTER AUTOMATED TEST RUNNER
 * ============================================================================
 * Orchestrates and executes all system test suites:
 *   1. System & Security Integrity Tests (Static & Database)
 *   2. Frontend Route Health & Hydration Scanner (Live UI)
 *   3. Backend API Contract & Security Guard Tests (NestJS)
 * 
 * Usage:
 *   npm test
 *   node scripts/test-runner.js
 * ============================================================================
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('\n╔═════════════════════════════════════════════════════════════╗');
console.log('║           AGAPP FULL-STACK AUTOMATED TEST RUNNER            ║');
console.log('╚═════════════════════════════════════════════════════════════╝\n');

const SUITES = [
  { name: 'System & Security Integrity', script: 'scripts/test-system-integrity.js' },
  { name: 'Backend API Contracts & Guards', script: 'scripts/test-api-contracts.js' },
  { name: 'Frontend Route Health & Rendering', script: 'scripts/test-frontend-routes.js' },
];

let totalPassed = 0;
let totalFailed = 0;

for (const suite of SUITES) {
  console.log(`\n\x1b[35m▶ Executing Test Suite: ${suite.name}...\x1b[0m`);
  try {
    execSync(`node "${path.join(rootDir, suite.script)}"`, {
      stdio: 'inherit',
      cwd: rootDir,
    });
    totalPassed++;
  } catch (err) {
    console.error(`\x1b[31m✖ Suite Failed: ${suite.name}\x1b[0m`);
    totalFailed++;
  }
}

console.log('\n=============================================================');
console.log(`           FINAL TEST EXECUTION SUMMARY                      `);
console.log('=============================================================');
console.log(`  Total Suites Executed : ${SUITES.length}`);
console.log(`  Suites Passed         : \x1b[32m${totalPassed}\x1b[0m`);
console.log(`  Suites Failed         : \x1b[${totalFailed > 0 ? '31' : '32'}m${totalFailed}\x1b[0m`);
console.log('=============================================================\n');

if (totalFailed > 0) {
  console.error('\x1b[31m✖ Some test suites encountered failures. Review logs above.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32m✔ ALL AGAPP SYSTEM SUITES PASSED FLAWLESSLY!\x1b[0m\n');
  process.exit(0);
}
