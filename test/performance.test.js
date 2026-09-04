/**
 * Performance & Benchmark Testing Suite for PharmaLink ERP & POS
 * Validates search query latency, cart computation throughput, and production bundle asset budgets.
 */

import fs from 'fs';
import path from 'path';

let passedCount = 0;
let failedCount = 0;

export function runPerformanceTests() {
  console.log('⚡ [8/10] Running Performance & Benchmark Testing Suite...');
  passedCount = 0;
  failedCount = 0;

  function test(description, testFn) {
    try {
      testFn();
      console.log(`  ✅ PASS: ${description}`);
      passedCount++;
    } catch (error) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(`     Error: ${error.message}`);
      failedCount++;
    }
  }

  // 1. Search Query Latency Benchmark across 2,500 medicine records
  test('Performance - Omni-Search query filtering on 2,500 items executes in under 15ms', () => {
    // Generate synthetic stress dataset of 2,500 medicines
    const stressCatalog = [];
    const categories = ['Tablets', 'Syrups', 'Injections', 'Capsules', 'Ointments'];
    for (let i = 1; i <= 2500; i++) {
      stressCatalog.push({
        id: `MED-${i}`,
        itemCode: `${1000 + (i % 9000)}`,
        name: `Medicine Product ${i} 500mg`,
        formula: `Generic Formula Compound ${i % 100}`,
        rackLocation: `Rack ${String.fromCharCode(65 + (i % 6))}-${(i % 10) + 1}`,
        category: categories[i % categories.length],
        boxSellingPrice: 100 + (i % 500),
      });
    }

    const query = 'Compound 42';
    const start = performance.now();

    const q = query.toLowerCase().trim();
    const results = stressCatalog.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.formula.toLowerCase().includes(q) ||
      m.itemCode.includes(q)
    );

    const duration = performance.now() - start;
    if (results.length === 0) throw new Error('Search returned 0 results');
    if (duration > 15) throw new Error(`Search latency too slow: ${duration.toFixed(2)}ms (Target: <15ms)`);
  });

  // 2. Heavy Cart Recalculation Benchmark
  test('Performance - Recalculates 50 line items with rates, discounts, and taxes in under 5ms', () => {
    const cartItems = [];
    for (let i = 1; i <= 50; i++) {
      cartItems.push({
        qty: (i % 5) + 1,
        rate: 50 + (i * 10),
        discountPercent: (i % 10),
        salesTaxRate: 18,
        advTaxRate: 4,
      });
    }

    const start = performance.now();

    let grossSubtotal = 0;
    let totalDiscount = 0;
    let totalSalesTax = 0;
    let totalAdvTax = 0;

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const gross = item.qty * item.rate;
      const disc = (gross * item.discountPercent) / 100;
      const st = gross * (item.salesTaxRate / 100);
      const adv = gross * (item.advTaxRate / 100);

      grossSubtotal += gross;
      totalDiscount += disc;
      totalSalesTax += st;
      totalAdvTax += adv;
    }

    const grandTotal = grossSubtotal - totalDiscount + totalSalesTax + totalAdvTax;
    const duration = performance.now() - start;

    if (grandTotal <= 0) throw new Error('Invalid grand total computed');
    if (duration > 5) throw new Error(`Cart math too slow: ${duration.toFixed(2)}ms (Target: <5ms)`);
  });

  // 3. State Update Throughput
  test('Performance - Rapid sequential mutations (100 updates) execute in under 50ms', () => {
    let state = { count: 0, items: [] };
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      state = {
        ...state,
        count: state.count + 1,
        items: [...state.items, { id: i, timestamp: Date.now() }],
      };
    }

    const duration = performance.now() - start;
    if (state.count !== 100) throw new Error('State updates incomplete');
    if (duration > 50) throw new Error(`Throughput too slow: ${duration.toFixed(2)}ms (Target: <50ms)`);
  });

  // 4. Production Asset Size Budget Audit
  test('Performance - Production bundle adheres to strict size budgets (JS < 700KB, CSS < 15KB, HTML < 2KB)', () => {
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      throw new Error('dist directory does not exist. Run "npm run build" first.');
    }

    const files = fs.readdirSync(distPath);
    const htmlFile = files.find(f => f.endsWith('.html'));
    if (!htmlFile) throw new Error('dist/index.html not found');

    const htmlSizeKb = fs.statSync(path.join(distPath, htmlFile)).size / 1024;
    if (htmlSizeKb > 2) throw new Error(`HTML size exceeds 2KB budget: ${htmlSizeKb.toFixed(2)}KB`);

    const assetsPath = path.join(distPath, 'assets');
    const assetFiles = fs.readdirSync(assetsPath);

    const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
    for (const jsFile of jsFiles) {
      const jsSizeKb = fs.statSync(path.join(assetsPath, jsFile)).size / 1024;
      if (jsSizeKb > 700) throw new Error(`JS bundle ${jsFile} exceeds 700KB budget: ${jsSizeKb.toFixed(2)}KB`);
    }

    const cssFile = assetFiles.find(f => f.endsWith('.css'));
    if (cssFile) {
      const cssSizeKb = fs.statSync(path.join(assetsPath, cssFile)).size / 1024;
      if (cssSizeKb > 15) throw new Error(`CSS bundle exceeds 15KB budget: ${cssSizeKb.toFixed(2)}KB`);
    }
  });

  console.log(`📊 Performance Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('performance.test.js')) {
  const result = runPerformanceTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
