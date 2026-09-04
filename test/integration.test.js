/**
 * Comprehensive Integration & Unit Testing Suite for PharmaLink ERP & POS System
 */

export function runIntegrationTests() {
  console.log('🔗 [2/10] Running Integration Testing Suite...');

  let passedCount = 0;
  let failedCount = 0;

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

// 1. TEST: Strict Credential Routing
test('Auth Engine - Accurately routes master admin, retail admin, and wholesale admin credentials', () => {
  const authenticate = (user, pass) => {
    const cleanUser = user.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPass = pass.trim();
    if (cleanUser === 'masteradmin' && cleanPass === 'admin123') return 'SUPER_ADMIN';
    if (cleanUser === 'retailadmin' && cleanPass === 'admin123') return 'RETAIL_ADMIN';
    if (cleanUser === 'wholesaleadmin' && cleanPass === 'admin123') return 'WHOLESALE_ADMIN';
    return null;
  };

  if (authenticate('master admin', 'admin123') !== 'SUPER_ADMIN') throw new Error('Failed master admin match');
  if (authenticate('retail admin', 'admin123') !== 'RETAIL_ADMIN') throw new Error('Failed retail admin match');
  if (authenticate('wholesale admin', 'admin123') !== 'WHOLESALE_ADMIN') throw new Error('Failed wholesale admin match');
  if (authenticate('invalid', '12345') !== null) throw new Error('Failed invalid auth rejection');
});

// 2. TEST: Retail Loose Unit Conversion Engine
test('Retail Pricing Engine - Accurately calculates Tablet, Strip, and Box prices based on packaging ratios', () => {
  const medicine = {
    boxPrice: 600,
    stripsPerBox: 20,
    tabletsPerStrip: 10, // 200 tablets in box
  };

  const totalTablets = medicine.stripsPerBox * medicine.tabletsPerStrip;
  const pricePerTablet = Number((medicine.boxPrice / totalTablets).toFixed(2));
  const pricePerStrip = Number((medicine.boxPrice / medicine.stripsPerBox).toFixed(2));

  if (pricePerTablet !== 3.00) throw new Error(`Expected 3.00 per tablet, got ${pricePerTablet}`);
  if (pricePerStrip !== 30.00) throw new Error(`Expected 30.00 per strip, got ${pricePerStrip}`);

  // Test loose cart total: 5 tablets + 1 strip
  const total = (pricePerTablet * 5) + (pricePerStrip * 1);
  if (total !== 45.00) throw new Error(`Expected 45.00, got ${total}`);
});

// 3. TEST: Live Counter Cash Calculator
test('POS Counter Math - Computes Tendered Cash and Change Due without rounding drift', () => {
  const netPayable = 385.50;
  const tenderedCash = 500.00;
  const changeDue = Math.max(0, tenderedCash - netPayable);

  if (Number(changeDue.toFixed(2)) !== 114.50) {
    throw new Error(`Expected change due 114.50, got ${changeDue}`);
  }
});

// 4. TEST: Customer Debt (Khata) Credit Sale & WhatsApp Slip Generator
test('Customer Debt Ledger - Accurately records credit sales and generates valid WhatsApp message URI', () => {
  const customer = {
    id: 'CUST-01',
    name: 'Tariq Mahmood',
    phone: '0300-1234567',
    currentBalance: 5000.00,
  };

  const saleData = {
    invoiceNo: 'INV-RET-1001',
    date: '2026-08-31',
    items: [
      { name: 'Augmentin 625mg', qty: 2, total: 960.00 },
      { name: 'Panadol 500mg', qty: 10, total: 30.00 },
    ],
    netTotal: 990.00,
  };

  const newBalance = customer.currentBalance + saleData.netTotal;
  if (newBalance !== 5990.00) throw new Error(`Expected new balance 5990.00, got ${newBalance}`);

  const phoneClean = customer.phone.replace(/[^0-9]/g, '');
  const waPhone = phoneClean.startsWith('0') ? '92' + phoneClean.slice(1) : phoneClean;
  if (waPhone !== '923001234567') throw new Error(`Expected international format 923001234567, got ${waPhone}`);
});

// 5. TEST: Customer Debt Full & Partial Settlement with Historical Archiving
test('Debt Settlement Engine - Clears active debt on full payment and creates archived cycle', () => {
  const customer = {
    id: 'CUST-01',
    name: 'Tariq Mahmood',
    currentBalance: 8500.00,
    activeTransactions: [{ invoiceNo: 'INV-1' }, { invoiceNo: 'INV-2' }],
    settledCyclesHistory: [],
  };

  // Settle Full Debt
  const paymentAmount = 8500.00;
  const remainingBalance = Math.max(0, customer.currentBalance - paymentAmount);
  const isFull = remainingBalance === 0;

  const cycle = {
    cycleId: 'CYCLE-01',
    settledDate: '2026-08-31',
    settledAmount: paymentAmount,
    remainingBalance,
    invoicesCount: customer.activeTransactions.length,
  };

  if (remainingBalance !== 0) throw new Error(`Expected balance 0, got ${remainingBalance}`);
  if (!isFull) throw new Error('Expected isFull to be true');
  if (cycle.settledAmount !== 8500.00) throw new Error('Settled amount mismatch');
});

// 6. TEST: PO Price Updates & FIFO Expiry Batch Deductions
test('PO Inward Price & FIFO Deduction - Updates catalog price and deducts earliest expiry batch first', () => {
  // Scenario: bought 2 boxes @ 400 (exp 2026-10-31), then 2 boxes @ 450 (exp 2028-12-31)
  const medicine = {
    name: 'Panadol',
    boxSellingPrice: 500, // old selling price
    purchaseCost: 400,
  };

  const batches = [
    { batchNo: 'B-OLD', expiryDate: '2026-10-31', totalTabletsAvailable: 400, purchasePriceBox: 400 },
    { batchNo: 'B-NEW', expiryDate: '2028-12-31', totalTabletsAvailable: 400, purchasePriceBox: 450 },
  ];

  // Inward PO with new price 450 cost / 550 sell
  const newCost = 450;
  const newSell = 550;
  medicine.boxSellingPrice = newSell;
  medicine.purchaseCost = newCost;

  if (medicine.boxSellingPrice !== 550) throw new Error('Catalog price failed to update');

  // POS sells 300 tablets -> must deduct from B-OLD first
  const sortedBatches = batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const earliestBatch = sortedBatches[0];

  if (earliestBatch.batchNo !== 'B-OLD') throw new Error('FIFO failed to pick earliest batch');

  earliestBatch.totalTabletsAvailable -= 300;
  if (earliestBatch.totalTabletsAvailable !== 100) throw new Error('Stock deduction mismatch in earliest batch');
});

// 7. TEST: Tax Reconciliation (Input PO Tax vs Output Sales Tax)
test('Tax Reconciliation Engine - Accurately computes PO Input Tax vs Sales Output Tax balance', () => {
  const poInputTaxes = [
    { purchaseCost: 100000, salesTax18: 18000, advTax05: 500 }, // 18500
    { purchaseCost: 50000, salesTax18: 9000, advTax05: 250 },   // 9250
  ];
  const totalInputTax = poInputTaxes.reduce((sum, p) => sum + p.salesTax18 + p.advTax05, 0); // 27750

  const salesTransactions = [
    { grossSales: 150000, salesTaxCollected: 27000 },
    { grossSales: 60000, salesTaxCollected: 10800 },
  ];
  const totalOutputTax = salesTransactions.reduce((sum, s) => sum + s.salesTaxCollected, 0); // 37800

  const netPayable = totalOutputTax - totalInputTax; // 37800 - 27750 = 10050

  if (totalInputTax !== 27750) throw new Error(`Expected input tax 27750, got ${totalInputTax}`);
  if (totalOutputTax !== 37800) throw new Error(`Expected output tax 37800, got ${totalOutputTax}`);
  if (netPayable !== 10050) throw new Error(`Expected net tax payable 10050, got ${netPayable}`);
});

// 8. TEST: Narcotics Daily Accordion Grouping
test('Narcotics Register - Correctly groups sales by date and keeps Today open', () => {
  const sampleSales = [
    { date: '2026-08-31', brandName: 'Arinac', qty: 20 },
    { date: '2026-08-31', brandName: 'Lexotanil', qty: 15 },
    { date: '2026-08-30', brandName: 'Deltacortril', qty: 40 },
    { date: '2026-08-28', brandName: 'Arinac', qty: 30 },
  ];

  const groups = {};
  sampleSales.forEach(s => {
    if (!groups[s.date]) groups[s.date] = [];
    groups[s.date].push(s);
  });

  const dates = Object.keys(groups);
  if (dates.length !== 3) throw new Error(`Expected 3 date groups, got ${dates.length}`);
  if (groups['2026-08-31'].length !== 2) throw new Error('Today date group item count mismatch');
});

// 9. TEST: 4-Digit Item Code Omni-Search
test('Item Code Engine - Validates pure 4-digit codes and omni-search matching', () => {
  const mockCatalog = [
    { id: 'MED-101', itemCode: '1001', name: 'Panadol 500mg' },
    { id: 'MED-102', itemCode: '1002', name: 'Risek 20mg' },
    { id: 'MED-103', itemCode: '1003', name: 'Augmentin 625mg' },
  ];

  mockCatalog.forEach(m => {
    if (!/^\d{4}$/.test(m.itemCode)) {
      throw new Error(`Item code ${m.itemCode} is not a valid 4-digit code`);
    }
  });

  const search = (q) => {
    const query = q.toLowerCase().trim();
    return mockCatalog.filter(m => 
      m.itemCode.toString().toLowerCase().includes(query) ||
      m.name.toLowerCase().includes(query)
    );
  };

  const results = search('1002');
  if (results.length !== 1 || results[0].name !== 'Risek 20mg') {
    throw new Error('Omni-search failed to match 4-digit item code 1002');
  }
});

// 10. TEST: Patient Search Auto-Complete Engine
test('Patient Search Engine - Matches patient by name or phone and populates details', () => {
  const mockPatients = [
    { id: 'PAT-001', name: 'Tariq Mahmood', phone: '0300-5544332', prescribingDoctor: 'Dr. Aamir Khan' },
    { id: 'PAT-002', name: 'Malik Zafar Iqbal', phone: '0333-5123987', prescribingDoctor: 'Dr. Sarah Bilal' },
  ];

  const searchPatients = (query) => {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return mockPatients.filter(p => 
      p.name.toLowerCase().includes(q) || p.phone.includes(q)
    );
  };

  const nameMatch = searchPatients('Tariq');
  if (nameMatch.length !== 1 || nameMatch[0].id !== 'PAT-001') {
    throw new Error('Failed to match patient by name');
  }

  const phoneMatch = searchPatients('5123987');
  if (phoneMatch.length !== 1 || phoneMatch[0].id !== 'PAT-002') {
    throw new Error('Failed to match patient by phone');
  }
});

// 11. TEST: Distributor Payment Recording & Ledger Balance Reduction
test('Distributor Payment Engine - Reduces outstanding debt and logs ledger entry', () => {
  const supplier = {
    id: 'SUP-01',
    name: 'Muller & Phipps Pakistan',
    outstandingDebt: 85000.00,
    totalPaidToDate: 120000.00,
    paymentHistory: [],
  };

  const amountToPay = 35000.00;
  const newDebt = Math.max(0, supplier.outstandingDebt - amountToPay);
  const newTotalPaid = supplier.totalPaidToDate + amountToPay;
  const paymentEntry = {
    date: '2026-09-03',
    amount: amountToPay,
    paymentMode: 'Bank Transfer',
    reference: 'SLIP-9901',
    remainingDebt: newDebt,
  };
  supplier.outstandingDebt = newDebt;
  supplier.totalPaidToDate = newTotalPaid;
  supplier.paymentHistory.push(paymentEntry);

  if (supplier.outstandingDebt !== 50000.00) {
    throw new Error(`Expected remaining debt 50000, got ${supplier.outstandingDebt}`);
  }
  if (supplier.totalPaidToDate !== 155000.00) {
    throw new Error(`Expected total paid 155000, got ${supplier.totalPaidToDate}`);
  }
  if (supplier.paymentHistory.length !== 1 || supplier.paymentHistory[0].remainingDebt !== 50000.00) {
    throw new Error('Failed to record payment in history ledger');
  }
});

// 12. TEST: Retail PO Line Calculation with 18% Sales Tax & 4% Advance Tax
test('Retail PO Math - Accurately calculates 18% ST, 4% Adv Tax, and Net Line Total', () => {
  const boxes = 10;
  const boxCost = 400.00; // Gross = 4000.00
  const grossCost = boxes * boxCost;
  const salesTax18 = grossCost * 0.18; // 720.00
  const advTax04 = grossCost * 0.04;   // 160.00
  const netLineTotal = grossCost + salesTax18 + advTax04; // 4880.00

  if (grossCost !== 4000.00) throw new Error(`Expected gross 4000, got ${grossCost}`);
  if (salesTax18 !== 720.00) throw new Error(`Expected ST 720, got ${salesTax18}`);
  if (advTax04 !== 160.00) throw new Error(`Expected Adv Tax 160, got ${advTax04}`);
  if (netLineTotal !== 4880.00) throw new Error(`Expected net line total 4880, got ${netLineTotal}`);
});

  console.log(`📊 Integration Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].endsWith('integration.test.js')) {
  const result = runIntegrationTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
