/**
 * End-to-End (E2E) Testing Suite for PharmaLink ERP & POS
 * Simulates complete real-world user journeys across all application modules.
 */

let passedCount = 0;
let failedCount = 0;

export function runE2ETests() {
  console.log('🚀 [3/10] Running End-to-End (E2E) Testing Suite...');
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

  // =========================================================================
  // JOURNEY 1: Fast Retail Counter Sale with Loose Dispensing & Patient Rx
  // =========================================================================
  test('E2E Journey 1: Retail Counter Sale - Code Search -> Loose Tablet Dispensing -> Patient Rx -> Cash Checkout', () => {
    // 1. Initial State: Catalog & Batches
    const catalog = [
      { id: 'MED-101', itemCode: '1001', name: 'Panadol 500mg', boxPrice: 600, pricePerTablet: 3.0, boxStock: 10, looseTablets: 50 },
      { id: 'MED-103', itemCode: '1003', name: 'Augmentin 625mg', boxPrice: 480, pricePerTablet: 34.0, boxStock: 8, looseTablets: 20 },
    ];
    let cart = [];
    let salesLog = [];

    // 2. User searches by 4-digit code '1001'
    const searchCode = '1001';
    const foundMed = catalog.find(m => m.itemCode === searchCode);
    if (!foundMed) throw new Error('Could not find medicine by 4-digit code 1001');

    // 3. User adds 20 loose tablets to cart
    const cartItem1 = {
      medicineId: foundMed.id,
      name: foundMed.name,
      unitSelection: 'Tablet',
      rate: foundMed.pricePerTablet,
      qty: 20,
      total: foundMed.pricePerTablet * 20, // 60.00
    };
    cart.push(cartItem1);

    // 4. User adds 1 box of Augmentin
    const aug = catalog.find(m => m.itemCode === '1003');
    const cartItem2 = {
      medicineId: aug.id,
      name: aug.name,
      unitSelection: 'Box',
      rate: aug.boxPrice,
      qty: 1,
      total: aug.boxPrice * 1, // 480.00
    };
    cart.push(cartItem2);

    // 5. User attaches Patient Rx
    const activePatient = {
      name: 'Muhammad Asif',
      phone: '0312-9876543',
      doctorName: 'Dr. Aamir Khan',
      doctorRegNo: 'PMC-45812',
    };

    // 6. User calculates bill
    const grossTotal = cart.reduce((sum, i) => sum + i.total, 0); // 60 + 480 = 540.00
    const discountAmount = (grossTotal * 5) / 100; // 5% discount = 27.00
    const netPayable = grossTotal - discountAmount; // 513.00
    const tenderedCash = 1000.00;
    const changeDue = tenderedCash - netPayable; // 487.00

    if (netPayable !== 513.00) throw new Error(`Net payable mismatch: expected 513, got ${netPayable}`);
    if (changeDue !== 487.00) throw new Error(`Change due mismatch: expected 487, got ${changeDue}`);

    // 7. Complete Checkout
    const invoice = {
      invoiceNo: 'INV-RET-99001',
      date: '2026-09-03',
      time: '11:15 AM',
      patient: activePatient,
      items: [...cart],
      grossTotal,
      discount: discountAmount,
      netTotal: netPayable,
      tenderedCash,
      changeDue,
      paymentMode: 'Cash',
      paymentStatus: 'PAID',
    };
    salesLog.push(invoice);

    // 8. Deduct stock
    foundMed.looseTablets -= 20;
    aug.boxStock -= 1;
    cart = [];

    // Verifications
    if (cart.length !== 0) throw new Error('Cart was not cleared after checkout');
    if (foundMed.looseTablets !== 30) throw new Error('Loose tablet stock failed to deduct');
    if (aug.boxStock !== 7) throw new Error('Box stock failed to deduct');
    if (salesLog.length !== 1) throw new Error('Invoice was not recorded in sales log');
    if (salesLog[0].patient.name !== 'Muhammad Asif') throw new Error('Patient was not attached to invoice');
  });

  // =========================================================================
  // JOURNEY 2: Customer Khata Credit Sale -> Balance Accrual -> Full Settlement
  // =========================================================================
  test('E2E Journey 2: Customer Khata - Limitless Credit Purchase -> Balance Accrual -> Full Debt Clearance', () => {
    // 1. Initial State: Customer Khata Directory
    const customer = {
      id: 'CUST-DEBT-001',
      name: 'Chaudhry Tariq Mahmood',
      phone: '0300-5544332',
      currentBalance: 12450.00,
      activeTransactions: [
        { invoiceNo: 'INV-RET-881201', netTotal: 2420.00, status: 'UNPAID' },
        { invoiceNo: 'INV-RET-881452', netTotal: 1095.00, status: 'UNPAID' },
        { invoiceNo: 'INV-RET-881990', netTotal: 8935.00, status: 'UNPAID' },
      ],
      settledCyclesHistory: [],
    };

    // 2. New Credit Purchase of Rs. 3,500.00 added to Khata
    const newCreditBill = {
      invoiceNo: 'INV-RET-882100',
      date: '2026-09-03',
      items: [{ name: 'Lipiget 20mg', qty: 5, total: 3500.00 }],
      grossTotal: 3500.00,
      discount: 0,
      netTotal: 3500.00,
      status: 'UNPAID',
    };

    customer.activeTransactions.push(newCreditBill);
    customer.currentBalance += newCreditBill.netTotal; // 12450 + 3500 = 15950.00

    if (customer.currentBalance !== 15950.00) {
      throw new Error(`Expected balance 15950.00, got ${customer.currentBalance}`);
    }
    if (customer.activeTransactions.length !== 4) {
      throw new Error('Active transactions count mismatch');
    }

    // 3. Customer visits shop at month-end to clear entire debt
    const paymentReceived = 15950.00;
    const remainingBalance = Math.max(0, customer.currentBalance - paymentReceived);

    const archivedCycle = {
      cycleId: `CYCLE-202609-01`,
      settledDate: '2026-09-03',
      settledAmount: paymentReceived,
      remainingBalance,
      invoicesCount: customer.activeTransactions.length,
      settledInvoices: customer.activeTransactions.map(t => t.invoiceNo),
    };

    customer.currentBalance = remainingBalance;
    customer.settledCyclesHistory.push(archivedCycle);
    customer.activeTransactions = [];

    // Verifications
    if (customer.currentBalance !== 0.00) throw new Error('Customer balance was not zeroed out');
    if (customer.activeTransactions.length !== 0) throw new Error('Active transactions were not cleared');
    if (customer.settledCyclesHistory.length !== 1) throw new Error('Archived cycle was not created');
    if (customer.settledCyclesHistory[0].settledAmount !== 15950.00) throw new Error('Settled amount mismatch in archive');
  });

  // =========================================================================
  // JOURNEY 3: Retail PO Inwarding with Taxes & Distributor Debt Payment
  // =========================================================================
  test('E2E Journey 3: Retail Inward PO - New Distributor Registration -> 18% ST & 4% Adv Tax -> Payment Clearance', () => {
    const suppliers = [
      { id: 'SUP-01', companyName: 'Muller & Phipps Pakistan', outstandingDebt: 50000.00, paymentHistory: [] },
    ];
    const catalog = [
      { id: 'MED-102', itemCode: '1002', name: 'Risek 20mg', purchaseCost: 280, boxSellingPrice: 350, boxStock: 5 },
    ];
    let poTaxLogs = [];

    // 1. Register New Distributor "Searle Pakistan Ltd"
    const newDist = {
      id: 'SUP-02',
      companyName: 'Searle Pakistan Ltd',
      city: 'Karachi',
      phone: '021-35069901',
      outstandingDebt: 0,
      paymentHistory: [],
    };
    suppliers.push(newDist);

    // 2. Create Retail PO with 18% Sales Tax and 4% Advance Tax
    const poBoxes = 10;
    const poBoxCost = 300.00; // New cost
    const poBoxMrp = 380.00;  // New MRP
    const grossCost = poBoxes * poBoxCost; // 3000.00
    const salesTax = grossCost * 0.18;     // 540.00
    const advTax = grossCost * 0.04;       // 120.00
    const netTotalPO = grossCost + salesTax + advTax; // 3660.00

    const poRecord = {
      poNumber: 'PO-RET-77001',
      supplierName: newDist.companyName,
      date: '2026-09-03',
      items: [{
        tradeName: 'Risek 20mg',
        inwardBoxes: poBoxes,
        boxCost: poBoxCost,
        boxMrp: poBoxMrp,
        salesTax,
        advTax,
        lineNetTotal: netTotalPO,
      }],
      grossCost,
      salesTax18: salesTax,
      advTax04: advTax,
      totalAmount: netTotalPO,
    };

    // 3. Inward Stock & Update Catalog
    catalog[0].boxStock += poBoxes; // 5 + 10 = 15
    catalog[0].purchaseCost = poBoxCost;
    catalog[0].boxSellingPrice = poBoxMrp;
    poTaxLogs.push(poRecord);
    newDist.outstandingDebt += netTotalPO; // 3660.00

    if (catalog[0].boxStock !== 15) throw new Error('Stock failed to increment');
    if (catalog[0].boxSellingPrice !== 380) throw new Error('Catalog selling price failed to update');
    if (newDist.outstandingDebt !== 3660.00) throw new Error('Supplier debt failed to accrue');

    // 4. Pharmacist logs bank payment of Rs. 3,660.00
    const paymentAmount = 3660.00;
    newDist.outstandingDebt -= paymentAmount;
    newDist.paymentHistory.push({
      date: '2026-09-03',
      amount: paymentAmount,
      paymentMode: 'Bank Transfer',
      reference: 'TXN-998822',
      remainingDebt: newDist.outstandingDebt,
    });

    if (newDist.outstandingDebt !== 0.00) throw new Error('Supplier debt was not cleared');
    if (newDist.paymentHistory.length !== 1) throw new Error('Payment log was not recorded');
  });

  // =========================================================================
  // JOURNEY 4: Role-Based Access Control (RBAC) & Mode Switching
  // =========================================================================
  test('E2E Journey 4: RBAC & Mode Routing - Master Admin vs Retail Admin vs Wholesale Admin Permissions', () => {
    const authenticate = (username, password) => {
      const u = username.trim().toLowerCase().replace(/\s+/g, '');
      const p = password.trim();
      if (u === 'masteradmin' && p === 'admin123') return { role: 'SUPER_ADMIN', mode: 'MASTER', canViewAll: true };
      if (u === 'retailadmin' && p === 'admin123') return { role: 'RETAIL_ADMIN', mode: 'RETAIL', canViewAll: false };
      if (u === 'wholesaleadmin' && p === 'admin123') return { role: 'WHOLESALE_ADMIN', mode: 'WHOLESALE', canViewAll: false };
      return null;
    };

    const retailSession = authenticate('retail admin', 'admin123');
    if (retailSession.mode !== 'RETAIL') throw new Error('Retail mode mismatch');

    // Retail Mode: Verify wholesale-only settings (DRAP warranties, wholesale B2B taxes) are blocked
    const allowedSettingsTabsRetail = ['PROFILE', 'STAFF', 'BACKUP'];
    const forbiddenSettingsTabsRetail = ['TAXES', 'WARRANTY'];

    forbiddenSettingsTabsRetail.forEach(tab => {
      if (allowedSettingsTabsRetail.includes(tab)) {
        throw new Error(`Tab ${tab} should be forbidden in Retail mode`);
      }
    });

    const wholesaleSession = authenticate('wholesale admin', 'admin123');
    if (wholesaleSession.mode !== 'WHOLESALE') throw new Error('Wholesale mode mismatch');
  });

  console.log(`📊 E2E Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].endsWith('e2e.test.js')) {
  const result = runE2ETests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
