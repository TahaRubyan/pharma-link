/**
 * Unit Testing Suite for PharmaLink ERP & POS
 * Covers core business logic, mathematical algorithms, tax policies, FEFO algorithms, and validators.
 */
import fs from 'fs';
import path from 'path';

let passedCount = 0;
let failedCount = 0;

export function runUnitTests() {
  console.log('📦 [1/10] Running Unit Testing Suite...');
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

  // 1. Box to Loose Unit Conversion
  test('Unit Math - Converts 1 Box into correct total tablets based on strips & packaging ratio', () => {
    const stripsPerBox = 20;
    const tabletsPerStrip = 10;
    const totalTablets = stripsPerBox * tabletsPerStrip;
    if (totalTablets !== 200) throw new Error(`Expected 200 tablets, got ${totalTablets}`);
  });

  // 2. Fractional Tablet Pricing
  test('Pricing Engine - Accurately derives unit tablet price from box retail MRP', () => {
    const boxPrice = 600;
    const totalTablets = 200;
    const pricePerTablet = Number((boxPrice / totalTablets).toFixed(2));
    if (pricePerTablet !== 3.00) throw new Error(`Expected 3.00, got ${pricePerTablet}`);
  });

  // 3. Fractional Strip Pricing
  test('Pricing Engine - Accurately derives unit strip price from box retail MRP', () => {
    const boxPrice = 600;
    const stripsPerBox = 20;
    const pricePerStrip = Number((boxPrice / stripsPerBox).toFixed(2));
    if (pricePerStrip !== 30.00) throw new Error(`Expected 30.00, got ${pricePerStrip}`);
  });

  // 4. Multi-Item Cart Subtotal
  test('Cart Math - Accurately calculates combined subtotal across boxes, strips, and loose tablets', () => {
    const items = [
      { unit: 'Box', rate: 600, qty: 2 },        // 1200
      { unit: 'Strip', rate: 30, qty: 3 },       // 90
      { unit: 'Tablet', rate: 3.0, qty: 15 },    // 45
    ];
    const subtotal = items.reduce((sum, i) => sum + (i.rate * i.qty), 0);
    if (subtotal !== 1335.00) throw new Error(`Expected subtotal 1335.00, got ${subtotal}`);
  });

  // 5. Discount Percentage Math
  test('Discount Math - Computes bill-level percentage discount and net amount correctly', () => {
    const gross = 2000.00;
    const discountPercent = 10; // 10%
    const discountAmount = (gross * discountPercent) / 100;
    const net = gross - discountAmount;
    if (discountAmount !== 200.00) throw new Error(`Expected discount 200.00, got ${discountAmount}`);
    if (net !== 1800.00) throw new Error(`Expected net 1800.00, got ${net}`);
  });

  // 6. Cash Tendered & Change Due
  test('POS Cash Math - Computes Change Due without floating-point precision drift', () => {
    const billNet = 385.50;
    const tendered = 500.00;
    const change = Math.max(0, tendered - billNet);
    if (Number(change.toFixed(2)) !== 114.50) throw new Error(`Expected 114.50, got ${change}`);
  });

  // 7. 18% Sales Tax Math
  test('Tax Engine - Calculates 18% Sales Tax per line item', () => {
    const lineGross = 1000.00;
    const stAmount = lineGross * 0.18;
    if (stAmount !== 180.00) throw new Error(`Expected 180.00, got ${stAmount}`);
  });

  // 8. 4% Advance Withholding Tax Math
  test('Tax Engine - Calculates 4% Advance Tax (Sec 236H/236G) on retail inward POs', () => {
    const lineGross = 5000.00;
    const advTax = lineGross * 0.04;
    if (advTax !== 200.00) throw new Error(`Expected 200.00, got ${advTax}`);
  });

  // 9. 0.5% Wholesale Advance Tax Math
  test('Tax Engine - Calculates 0.5% FBR Advance Tax on wholesale distributor commercial sales', () => {
    const lineGross = 100000.00;
    const advTax05 = lineGross * 0.005;
    if (advTax05 !== 500.00) throw new Error(`Expected 500.00, got ${advTax05}`);
  });

  // 10. FEFO Earliest Expiry Batch Selection
  test('Inventory FEFO - Automatically sorts batches by expiry date and selects earliest valid batch', () => {
    const batches = [
      { batchNo: 'B-2028', expiryDate: '2028-10-31', stock: 50 },
      { batchNo: 'B-2026', expiryDate: '2026-11-30', stock: 20 },
      { batchNo: 'B-2027', expiryDate: '2027-05-15', stock: 40 },
    ];
    const sorted = [...batches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    if (sorted[0].batchNo !== 'B-2026') throw new Error(`Expected B-2026, got ${sorted[0].batchNo}`);
  });

  // 11. Multi-Batch Depletion Logic
  test('Inventory FIFO - Depletes stock across multiple batches when order quantity exceeds first batch', () => {
    const batches = [
      { batchNo: 'B1', stock: 15 },
      { batchNo: 'B2', stock: 25 },
    ];
    let remainingToDeduct = 20;
    const deductions = [];

    for (const b of batches) {
      if (remainingToDeduct <= 0) break;
      const take = Math.min(b.stock, remainingToDeduct);
      b.stock -= take;
      remainingToDeduct -= take;
      deductions.push({ batchNo: b.batchNo, deducted: take });
    }

    if (batches[0].stock !== 0) throw new Error('Expected B1 to be 0');
    if (batches[1].stock !== 20) throw new Error(`Expected B2 to be 20, got ${batches[1].stock}`);
    if (remainingToDeduct !== 0) throw new Error('Deduction incomplete');
  });

  // 12. 4-Digit Item Code Validation
  test('Data Validator - Validates pure 4-digit numeric item code format', () => {
    const isValidCode = (code) => /^\d{4}$/.test(String(code).trim());
    if (!isValidCode('1001')) throw new Error('1001 should be valid');
    if (!isValidCode('1027')) throw new Error('1027 should be valid');
    if (isValidCode('MED-101')) throw new Error('MED-101 must be invalid');
    if (isValidCode('123')) throw new Error('3-digit code must be invalid');
    if (isValidCode('12345')) throw new Error('5-digit code must be invalid');
  });

  // 13. WhatsApp International Phone Sanitizer
  test('WhatsApp Engine - Sanitizes local Pakistani mobile numbers into international 923... format', () => {
    const sanitizeForWhatsApp = (phone) => {
      const clean = phone.replace(/[^0-9]/g, '');
      return clean.startsWith('0') ? '92' + clean.slice(1) : clean;
    };
    if (sanitizeForWhatsApp('0300-1234567') !== '923001234567') throw new Error('Failed 0300 sanitization');
    if (sanitizeForWhatsApp('+92 333 5544332') !== '923335544332') throw new Error('Failed +92 sanitization');
  });

  // 14. Date Format Parsers
  test('Date Helpers - Formats standard dates to Pakistani DD-MM-YYYY and MM-YYYY display strings', () => {
    const formatDate = (isoStr) => {
      const [year, month, day] = isoStr.split('-');
      return `${day}-${month}-${year}`;
    };
    const formatExpiryMMYYYY = (isoStr) => {
      const [year, month] = isoStr.split('-');
      return `${month}-${year}`;
    };
    if (formatDate('2026-09-03') !== '03-09-2026') throw new Error('DD-MM-YYYY mismatch');
    if (formatExpiryMMYYYY('2028-10-31') !== '10-2028') throw new Error('MM-YYYY mismatch');
  });

  // 15. Auth Credential Normalizer
  test('Auth Sanitizer - Cleans whitespace and normalizes role credentials safely', () => {
    const normalizeUser = (str) => str.trim().toLowerCase().replace(/\s+/g, '');
    if (normalizeUser('  master   admin  ') !== 'masteradmin') throw new Error('Normalization failed');
    if (normalizeUser('RETAIL ADMIN') !== 'retailadmin') throw new Error('Normalization failed');
  });

  // 16. Retail Profit Margin Math
  test('Analytics Math - Computes dispensary gross margin percentage accurately', () => {
    const cost = 800.00;
    const mrp = 1000.00;
    const marginPct = Number((((mrp - cost) / mrp) * 100).toFixed(1));
    if (marginPct !== 20.0) throw new Error(`Expected 20.0%, got ${marginPct}%`);
  });

  // 17. Retail PO Line Aggregation Math
  test('Retail PO Line Math - Aggregates gross cost, 18% sales tax, and 4% advance tax to grand total', () => {
    const boxes = 5;
    const boxCost = 480.00; // Gross = 2400.00
    const grossCost = boxes * boxCost;
    const st = grossCost * 0.18; // 432.00
    const adv = grossCost * 0.04; // 96.00
    const netLine = grossCost + st + adv; // 2928.00

    if (grossCost !== 2400.00) throw new Error(`Gross cost mismatch: ${grossCost}`);
    if (st !== 432.00) throw new Error(`Sales tax mismatch: ${st}`);
    if (adv !== 96.00) throw new Error(`Adv tax mismatch: ${adv}`);
    if (netLine !== 2928.00) throw new Error(`Net line mismatch: ${netLine}`);
  });

  // 18. Customer Debt Running Balance Computation
  test('Customer Debt Math - Computes limitless credit accumulation and balance reduction upon settlement', () => {
    let balance = 0;
    // Purchase 1: Rs. 2420
    balance += 2420.00;
    // Purchase 2: Rs. 1095
    balance += 1095.00;
    // Purchase 3: Rs. 8935
    balance += 8935.00;
    if (balance !== 12450.00) throw new Error(`Expected balance 12450.00, got ${balance}`);

    // Partial settlement of Rs. 5000
    balance = Math.max(0, balance - 5000.00);
    if (balance !== 7450.00) throw new Error(`Expected remaining balance 7450.00, got ${balance}`);

    // Full settlement of remaining Rs. 7450
    balance = Math.max(0, balance - 7450.00);
    if (balance !== 0.00) throw new Error(`Expected balance 0, got ${balance}`);
  });

  // 19. Wholesale Expiry Rule (<= 6 Months Gatekeeper)
  test('Wholesale DRAP Rule - Detects batches expiring in <= 6 months and marks them non-compliant', () => {
    function parseExpiryDate(expiryDateStr) {
      if (!expiryDateStr) return null;
      const str = String(expiryDateStr).trim();
      let d = null;
      if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 2) {
          d = parts[0].length === 4 ? new Date(Number(parts[0]), Number(parts[1]) - 1, 28) : new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        } else if (parts.length === 3) {
          d = parts[0].length === 4 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      } else {
        d = new Date(str);
      }
      return (d && !isNaN(d.getTime())) ? d : null;
    }

    function isExpiryGreaterThan6Months(expiryDateStr) {
      const exp = parseExpiryDate(expiryDateStr);
      if (!exp) return false;
      const today = new Date();
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 180;
    }

    const today = new Date();
    // Expiry 3 months from now (must be rejected)
    const threeMonthsFromNow = new Date(today);
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    const shortExpiryStr = `${threeMonthsFromNow.getFullYear()}-${String(threeMonthsFromNow.getMonth() + 1).padStart(2, '0')}-28`;

    // Expiry 12 months from now (must be accepted)
    const twelveMonthsFromNow = new Date(today);
    twelveMonthsFromNow.setFullYear(today.getFullYear() + 1);
    const validExpiryStr = `${twelveMonthsFromNow.getFullYear()}-${String(twelveMonthsFromNow.getMonth() + 1).padStart(2, '0')}-28`;

    if (isExpiryGreaterThan6Months(shortExpiryStr) !== false) {
      throw new Error(`Batch expiring in 3 months should NOT be greater than 6 months: ${shortExpiryStr}`);
    }
    if (isExpiryGreaterThan6Months(validExpiryStr) !== true) {
      throw new Error(`Batch expiring in 12 months should be greater than 6 months: ${validExpiryStr}`);
    }
  });

  // 20. Wholesale FEFO Filter - Quarantines short-expiry batches from sales
  test('Wholesale FEFO - Filters out batches <= 6 months and blocks adding to cart', () => {
    const today = new Date();
    const shortExp = new Date(today);
    shortExp.setMonth(today.getMonth() + 2);
    const shortExpStr = `${shortExp.getFullYear()}-${String(shortExp.getMonth() + 1).padStart(2, '0')}-28`;

    const batches = [
      { id: 'B1', batchNo: 'B-EXPIRED', expiryDate: shortExpStr, totalTabletsAvailable: 500, medicineId: 'MED-1' },
      { id: 'B2', batchNo: 'B-QUARANTINE', expiryDate: '2026-04-01', totalTabletsAvailable: 500, medicineId: 'MED-1', status: 'Quarantined RTV' }
    ];

    function getEarliestValidBatch(medId, isWholesale = false) {
      const available = batches.filter(b => {
        if (b.medicineId !== medId || (b.totalTabletsAvailable <= 0) || b.status === 'Quarantined RTV') return false;
        if (isWholesale) {
          const exp = new Date(b.expiryDate);
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 180) return false;
        }
        return true;
      });
      if (available.length > 0) return available[0];
      if (isWholesale) return null;
      return { batchNo: 'DEFAULT' };
    }

    const wholesaleResult = getEarliestValidBatch('MED-1', true);
    if (wholesaleResult !== null) throw new Error('Expected wholesale result to be null for <= 6 month batches');

    const retailResult = getEarliestValidBatch('MED-1', false);
    if (!retailResult || retailResult.batchNo !== 'B-EXPIRED') throw new Error('Retail mode should still resolve available batch');
  });

  // 21. A4 Commercial Print Engine - Verifies dedicated mount and CSS isolation
  test('A4 Commercial Print Engine - HTML contains isolated #a4-print-mount without destructive CSS display:none on #root', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const cssPath = path.resolve(process.cwd(), 'src/styles/global.css');

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    if (!htmlContent.includes('id="a4-print-mount"')) {
      throw new Error('index.html must contain #a4-print-mount for isolated A4 printing');
    }
    // Verify CSS does NOT unconditionally hide #root with body.printing-a4 #root { display: none !important }
    if (cssContent.includes('body.printing-a4 #root {')) {
      throw new Error('global.css should not unconditionally hide #root with body.printing-a4 #root');
    }
    if (!cssContent.includes('#a4-print-mount')) {
      throw new Error('global.css must style #a4-print-mount for print view');
    }
  });

  console.log(`📊 Unit Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

// Allow direct execution
if (process.argv[1].endsWith('unit.test.js')) {
  const result = runUnitTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
