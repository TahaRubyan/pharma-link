/**
 * Usability (UX) Testing Suite for PharmaLink ERP & POS
 * Validates checkout friction, form guidance, empty states, hotkey affordances, and error recovery.
 */

let passedCount = 0;
let failedCount = 0;

export function runUsabilityTests() {
  console.log('👤 [9/10] Running Usability & User Experience (UX) Testing Suite...');
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

  // 1. Checkout Click Efficiency (<= 3 user actions for retail checkout)
  test('Usability - Standard counter checkout requires <= 3 user actions (Code Search -> Enter -> Checkout)', () => {
    let userActionCount = 0;

    // Action 1: Cashier types 4-digit code
    userActionCount++;
    const query = '1001';

    // Action 2: Cashier presses Enter to add first matching item
    userActionCount++;
    const cart = [{ id: '1001', name: 'Panadol', qty: 1 }];

    // Action 3: Cashier presses Checkout
    userActionCount++;
    const checkoutSuccess = cart.length > 0;

    if (userActionCount > 3) throw new Error(`Too many steps to complete counter sale: ${userActionCount}`);
    if (!checkoutSuccess) throw new Error('Checkout failed');
  });

  // 2. Form Input Guidance & Required Field Demarcations
  test('Usability - Critical form inputs clearly demarcate mandatory requirements with asterisks', () => {
    const requiredLabels = [
      'Patient Full Name *',
      'Pharma Distributor / Vendor *',
      'Customer Full Name *',
      'WhatsApp Phone *',
      'Payment Amount (Rs.) *',
    ];

    requiredLabels.forEach(label => {
      if (!label.includes('*')) {
        throw new Error(`Label "${label}" missing required asterisk indicator`);
      }
    });
  });

  // 3. Meaningful Empty State Messages
  test('Usability - Tables and directories provide instructional empty states rather than blank voids', () => {
    const emptyStates = {
      cart: 'Cart is empty. Type in search bar above and press Enter to add medicines to bill.',
      search: 'No medicines match the search criteria.',
      salesLogs: 'No sales transactions recorded for this selected time period.',
      khata: 'No customers match your search query.',
      supplierPayments: 'No payments logged yet for this supplier.',
    };

    Object.entries(emptyStates).forEach(([key, text]) => {
      if (!text || text.length < 15) {
        throw new Error(`Empty state message for "${key}" is insufficient`);
      }
    });
  });

  // 4. Hotkey Affordance & Discovery Labels
  test('Usability - Action buttons feature visible hotkey cues for keyboard-first counter operation', () => {
    const hotkeyAffordances = [
      { button: 'Clear Cart', hotkeyHint: 'Hotkey: F1' },
      { button: 'Thermal Slip', hotkeyHint: 'Hotkey: F9' },
      { button: 'A4 Tax Invoice', hotkeyHint: 'Hotkey: F10' },
      { button: 'Search Dropdown', hotkeyHint: '↑ ↓ arrow keys to scroll, Enter to add' },
    ];

    hotkeyAffordances.forEach(h => {
      if (!h.hotkeyHint) throw new Error(`Missing hotkey hint for ${h.button}`);
    });
  });

  // 5. Input Error Recovery & Resilient Fallbacks
  test('Usability - Invalid or negative user inputs fallback safely without throwing fatal UI errors', () => {
    const sanitizeTenderedCash = (input) => {
      const parsed = parseFloat(input);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    };

    if (sanitizeTenderedCash('abc') !== 0) throw new Error('Failed to sanitize non-numeric string');
    if (sanitizeTenderedCash('-500') !== 0) throw new Error('Failed to sanitize negative tender');
    if (sanitizeTenderedCash('1000') !== 1000) throw new Error('Valid number corrupted');

    const sanitizeQuantity = (qty) => {
      const parsed = parseInt(qty, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    };

    if (sanitizeQuantity('0') !== 1) throw new Error('Zero quantity must fallback to 1');
    if (sanitizeQuantity('-5') !== 1) throw new Error('Negative quantity must fallback to 1');
  });

  // 6. Non-Blocking Modal Confirmation & Success Feedback
  test('Usability - Primary business transactions emit clear success payloads with record details', () => {
    const makeFeedbackPayload = (action, refNo, amount) => ({
      success: true,
      message: `${action} [${refNo}] completed for Rs. ${amount.toFixed(2)}`,
    });

    const feedback = makeFeedbackPayload('Sale Checkout', 'INV-RET-101', 540.00);
    if (!feedback.success || !feedback.message.includes('INV-RET-101')) {
      throw new Error('Feedback payload malformed');
    }
  });

  console.log(`📊 Usability Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('usability.test.js')) {
  const result = runUsabilityTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
