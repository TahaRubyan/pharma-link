/**
 * Master Unified Test Runner & Quality Dashboard for PharmaLink ERP & POS
 * Aggregates all 10 testing dimensions:
 * Unit, Integration, E2E, Interface, Cross-Browser, Responsive, Visual Regression, Performance, Usability, Accessibility.
 */

import { runUnitTests } from './unit.test.js';
import { runIntegrationTests } from './integration.test.js';
import { runE2ETests } from './e2e.test.js';
import { runInterfaceTests } from './interface.test.js';
import { runCrossBrowserTests } from './cross-browser.test.js';
import { runResponsiveTests } from './responsive.test.js';
import { runVisualRegressionTests } from './visual-regression.test.js';
import { runPerformanceTests } from './performance.test.js';
import { runUsabilityTests } from './usability.test.js';
import { runAccessibilityTests } from './accessibility.test.js';
import { runWholesaleMathLoadTests } from './wholesale-math-load.test.js';

console.log('================================================================================');
console.log(' 🏥 PHARMALINK MEDICAL STORE ERP & POS - 11-DIMENSION VERIFICATION & WHOLESALE LOAD SUITE');
console.log('================================================================================\n');

const startTime = performance.now();

const suites = [
  { name: '1. UNIT TESTING', run: runUnitTests, desc: 'Pricing math, taxes, FEFO, formatting, validators' },
  { name: '2. INTEGRATION TESTING', run: runIntegrationTests, desc: 'Cross-context lifecycles: POS, Inventory, Khata, POs' },
  { name: '3. END-TO-END (E2E)', run: runE2ETests, desc: 'Retail counter sale, Khata debt clearance, PO inward, RBAC' },
  { name: '4. INTERFACE & DOM', run: runInterfaceTests, desc: 'Sidebar collapse, search dropdown, hotkeys F1-F10' },
  { name: '5. CROSS-BROWSER', run: runCrossBrowserTests, desc: 'CSS standards, storage fallback, Intl formatting, dates' },
  { name: '6. RESPONSIVE LAYOUT', run: runResponsiveTests, desc: 'Mobile, tablet, desktop viewports & overflow bounds' },
  { name: '7. VISUAL REGRESSION', run: runVisualRegressionTests, desc: 'Design tokens, color contrast ratios, badge consistency' },
  { name: '8. PERFORMANCE', run: runPerformanceTests, desc: 'Search latency <15ms, cart math <5ms, bundle budget' },
  { name: '9. USABILITY (UX)', run: runUsabilityTests, desc: 'Click efficiency, field guidance, empty states, hotkeys' },
  { name: '10. ACCESSIBILITY', run: runAccessibilityTests, desc: 'WCAG 2.1 AA compliance, ARIA names, keyboard focus' },
  { name: '11. WHOLESALE LOAD & MATH', run: runWholesaleMathLoadTests, desc: '1,000 rapid orders, 18%/19% tax precision, batch deductions' },
];

const results = [];
let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  try {
    const res = suite.run();
    results.push({ name: suite.name, desc: suite.desc, ...res });
    totalPassed += res.passedCount;
    totalFailed += res.failedCount;
  } catch (err) {
    console.error(`💥 Suite execution error in ${suite.name}:`, err);
    results.push({ name: suite.name, desc: suite.desc, passedCount: 0, failedCount: 1 });
    totalFailed += 1;
  }
}

const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);

console.log('================================================================================');
console.log(' 📊 EXECUTIVE QUALITY & VERIFICATION SUMMARY REPORT');
console.log('================================================================================');

results.forEach((r, idx) => {
  const status = r.failedCount === 0 ? '✅ PASS' : '❌ FAIL';
  const paddedName = r.name.padEnd(24, ' ');
  const counts = `${r.passedCount} Passed, ${r.failedCount} Failed`.padEnd(22, ' ');
  console.log(`  ${status} | ${paddedName} | ${counts} | ${r.desc}`);
});

console.log('--------------------------------------------------------------------------------');
console.log(` 🎯 TOTAL TESTS EXECUTED: ${totalPassed + totalFailed}`);
console.log(` 🟢 PASSED: ${totalPassed}`);
console.log(` 🔴 FAILED: ${totalFailed}`);
console.log(` ⏱️  TOTAL EXECUTION TIME: ${totalDuration}s`);

if (totalFailed === 0) {
  console.log('================================================================================');
  console.log(' 🌟 100% QUALITY ASSURANCE COMPLETE — SYSTEM IS DEMO READY!');
  console.log('================================================================================\n');
  process.exit(0);
} else {
  console.log('================================================================================');
  console.log(' ⚠️ ATTENTION: SOME QUALITY CHECKS FAILED. REVIEW DETAILS ABOVE.');
  console.log('================================================================================\n');
  process.exit(1);
}
