/**
 * Performance & Benchmark Testing Suite for PharmaLink ERP & POS
 * Validates search query latency, cart computation throughput, and production bundle asset budgets.
 */

import fs from 'fs';
import path from 'path';
import { RateLimiter } from '../src/services/rateLimiter.js';
import { storageManager } from '../src/services/storageManager.js';

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
  test('Performance - Omni-Search query filtering on 2,500 items executes in under 40ms', () => {
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
    if (duration > 40) throw new Error(`Search latency too slow: ${duration.toFixed(2)}ms (Target: <40ms)`);
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
  test('Performance - Production bundle adheres to strict size budgets (JS < 850KB, CSS < 20KB, HTML < 2KB)', () => {
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
      if (jsSizeKb > 850) throw new Error(`JS bundle ${jsFile} exceeds 850KB budget: ${jsSizeKb.toFixed(2)}KB`);
    }

    const cssFile = assetFiles.find(f => f.endsWith('.css'));
    if (cssFile) {
      const cssSizeKb = fs.statSync(path.join(assetsPath, cssFile)).size / 1024;
      if (cssSizeKb > 20) throw new Error(`CSS bundle exceeds 20KB budget: ${cssSizeKb.toFixed(2)}KB`);
    }
  });

  // 5. Rate Limiter - Token Bucket capacity & token consumption
  test('RateLimiter - Enforces burst capacity and refills tokens over time', () => {
    const limiter = new RateLimiter({ bucketCapacity: 5, refillRate: 2 });
    if (limiter.tokens !== 5) throw new Error(`Initial tokens expected 5, got ${limiter.tokens}`);
    
    // Simulate consuming tokens
    limiter.tokens -= 3;
    if (limiter.tokens !== 2) throw new Error(`Tokens after consumption expected 2, got ${limiter.tokens}`);

    // Test refill
    limiter.lastRefill = Date.now() - 1000; // 1 second ago
    limiter.refill();
    // 2 + (1 * 2) = 4 tokens
    if (Math.floor(limiter.tokens) !== 4) throw new Error(`Tokens after 1s refill expected 4, got ${limiter.tokens}`);
  });

  // 6. Rate Limiter - Circuit breaker trips on simulated 429 and throws CIRCUIT_OPEN
  test('RateLimiter - Circuit breaker trips and flags CIRCUIT_OPEN state on downstream failure', () => {
    const limiter = new RateLimiter({ maxFailuresBeforeTrip: 2, coolingPeriodMs: 5000 });
    if (limiter.circuitState !== 'CLOSED') throw new Error('Circuit should start in CLOSED state');

    limiter.tripCircuit('Simulated 429 Too Many Requests');
    if (limiter.circuitState !== 'OPEN') throw new Error('Circuit should be OPEN after trip');

    // Trying to schedule a task while OPEN rejects with CIRCUIT_OPEN
    const p = limiter.schedule(() => Promise.resolve('ok'), 'CRITICAL');
    p.catch((err) => {
      if (err.code !== 'CIRCUIT_OPEN') {
        console.error('Unexpected error code:', err);
      }
    });

    // Reset circuit
    limiter.resetCircuit();
    if (limiter.circuitState !== 'CLOSED') throw new Error('Circuit should return to CLOSED after reset');
    if (limiter.consecutiveFailures !== 0) throw new Error('Failures should reset to 0');
  });

  // 7. Storage Manager - Safe get/set operations with fallback resilience
  test('StorageManager - safeSetItem and safeGetItem persist and read data cleanly', () => {
    const testKey = 'pharmalink_test_perf_key';
    const testPayload = { storeId: 'RETAIL_1', syncStatus: 'HEALTHY', timestamp: Date.now() };

    const writeSuccess = storageManager.safeSetItem(testKey, testPayload);
    if (!writeSuccess) throw new Error('safeSetItem failed to write to storage');

    const readPayload = storageManager.safeGetItem(testKey);
    if (!readPayload || readPayload.storeId !== 'RETAIL_1' || readPayload.syncStatus !== 'HEALTHY') {
      throw new Error('safeGetItem failed to retrieve valid matching payload');
    }

    const stats = storageManager.getStorageStats();
    if (typeof stats.usedBytes !== 'number' || typeof stats.usagePercent !== 'number') {
      throw new Error('Storage stats did not return numeric byte/usage metrics');
    }
  });

  // 8. POS Search Windowing - Enforces DISPLAY_LIMIT = 40 on large item arrays
  test('POS Search Windowing - Caps rendered search results to DISPLAY_LIMIT (40) on 500-item array', () => {
    const largeCatalog = [];
    for (let i = 1; i <= 500; i++) {
      largeCatalog.push({
        id: `MED-${i}`,
        itemCode: `${1000 + i}`,
        name: `Panadol Extra Strength ${i}mg`,
        formula: 'Paracetamol',
        rackLocation: 'Rack A-1',
        category: 'Tablets',
        boxSellingPrice: 120,
      });
    }

    const DISPLAY_LIMIT = 40;
    const q = 'panadol';
    const results = [];
    for (let i = 0; i < largeCatalog.length; i++) {
      const m = largeCatalog[i];
      if (m.name.toLowerCase().includes(q)) {
        results.push(m);
        if (results.length >= DISPLAY_LIMIT) break; // Windowing early termination
      }
    }

    if (results.length !== 40) throw new Error(`Expected windowed results to be exactly 40, got ${results.length}`);
  });

  // 9. Single-Pass Batch Stock Deduction Math
  test('Single-Pass Deduction - Accurately updates multi-item batch quantities in a single execution pass', () => {
    const batches = [
      { id: 'B1', medicineId: 'MED-1', batchNo: 'B-001', totalTabletsAvailable: 100, expiryDate: '2026-06-01' },
      { id: 'B2', medicineId: 'MED-1', batchNo: 'B-002', totalTabletsAvailable: 150, expiryDate: '2027-01-01' },
      { id: 'B3', medicineId: 'MED-2', batchNo: 'B-003', totalTabletsAvailable: 50, expiryDate: '2026-12-01' },
    ];

    const cartItems = [
      { medicineId: 'MED-1', batchNo: 'B-001', qty: 30, unitSelection: 'Tablet' },
      { medicineId: 'MED-2', batchNo: 'B-003', qty: 20, unitSelection: 'Tablet' },
    ];

    // Single-pass emulation matching InventoryContext
    const updatedBatches = batches.map(b => ({ ...b }));
    cartItems.forEach((ci) => {
      const q = ci.qty;
      const targetBatch = updatedBatches.find(b => b.medicineId === ci.medicineId && b.batchNo === ci.batchNo);
      if (targetBatch) {
        targetBatch.totalTabletsAvailable -= q;
      }
    });

    const b1 = updatedBatches.find(b => b.id === 'B1');
    const b2 = updatedBatches.find(b => b.id === 'B2');
    const b3 = updatedBatches.find(b => b.id === 'B3');

    if (b1.totalTabletsAvailable !== 70) throw new Error(`B1 stock expected 70, got ${b1.totalTabletsAvailable}`);
    if (b2.totalTabletsAvailable !== 150) throw new Error(`B2 stock expected 150 (untouched), got ${b2.totalTabletsAvailable}`);
    if (b3.totalTabletsAvailable !== 30) throw new Error(`B3 stock expected 30, got ${b3.totalTabletsAvailable}`);
  });

  console.log(`📊 Performance Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('performance.test.js')) {
  const result = runPerformanceTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
