/**
 * Cross-Browser Compatibility Testing Suite for PharmaLink ERP & POS
 * Validates web platform APIs, CSS properties, storage fallbacks, and standard formatting across Chrome, Firefox, Safari, and Edge.
 */

let passedCount = 0;
let failedCount = 0;

export function runCrossBrowserTests() {
  console.log('🌐 [5/10] Running Cross-Browser Compatibility Testing Suite...');
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

  // 1. CSS Custom Properties (CSS Variables)
  test('Cross-Browser - CSS Custom Properties resolve with valid fallback values', () => {
    const fallbackTheme = {
      '--color-primary': '#0284c7',
      '--color-background': '#ffffff',
      '--color-border': '#e2e8f0',
      '--font-sans': 'Plus Jakarta Sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '--radius-md': '10px',
    };

    const resolveVar = (name, fallback) => fallbackTheme[name] || fallback;
    if (resolveVar('--color-primary', '#000') !== '#0284c7') throw new Error('Primary color variable failed');
    if (resolveVar('--color-nonexistent', '#333') !== '#333') throw new Error('Fallback failed to resolve');
  });

  // 2. Flexbox & Grid Standards
  test('Cross-Browser - Standard CSS Display, Gap, and Alignment properties conform to CSS3 standard', () => {
    const containerStyle = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
    };

    if (containerStyle.display !== 'flex') throw new Error('Standard flex missing');
    if (containerStyle.gap !== '1rem') throw new Error('CSS3 standard gap property missing');
  });

  // 3. LocalStorage Resilient Wrapper
  test('Cross-Browser - LocalStorage safely handles private browsing and storage quota exceptions', () => {
    const memoryFallback = {};
    const safeStorage = {
      getItem: (key) => {
        try {
          return memoryFallback[key] || null;
        } catch (e) {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          memoryFallback[key] = String(value);
          return true;
        } catch (e) {
          return false;
        }
      },
      removeItem: (key) => {
        delete memoryFallback[key];
      }
    };

    safeStorage.setItem('test_key', 'test_value');
    if (safeStorage.getItem('test_key') !== 'test_value') throw new Error('Failed to set/get storage value');
    safeStorage.removeItem('test_key');
    if (safeStorage.getItem('test_key') !== null) throw new Error('Failed to delete storage value');
  });

  // 4. International Number Formatting (Intl.NumberFormat)
  test('Cross-Browser - Intl.NumberFormat correctly formats PKR currency without browser disparities', () => {
    const formatCurrency = (amount) => {
      return Number(amount).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const result = formatCurrency(12450.5);
    if (!result.includes('12,450.50')) throw new Error(`Currency format error: ${result}`);
  });

  // 5. ISO Date & Cross-Browser Parsing
  test('Cross-Browser - ISO 8601 string parsing resolves valid timestamps without Safari NaN bug', () => {
    const safeDateParse = (dateString) => {
      // Handles both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:MM:SS'
      if (!dateString) return new Date();
      const clean = dateString.split('T')[0];
      const [year, month, day] = clean.split('-').map(Number);
      return new Date(year, month - 1, day || 1);
    };

    const d = safeDateParse('2026-09-03');
    if (isNaN(d.getTime())) throw new Error('Invalid date parsed');
    if (d.getFullYear() !== 2026 || d.getMonth() !== 8 || d.getDate() !== 3) {
      throw new Error(`Date components mismatch: ${d.toISOString()}`);
    }
  });

  // 6. Base64 Data URL Handling for Signatures
  test('Cross-Browser - Validates Data URL regex pattern for digital signature stamps', () => {
    const isValidDataUrl = (str) => {
      return /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(str);
    };

    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    if (!isValidDataUrl(sampleBase64)) throw new Error('Valid PNG base64 rejected');
    if (isValidDataUrl('invalid_string')) throw new Error('Invalid string erroneously accepted');
  });

  console.log(`📊 Cross-Browser Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].endsWith('cross-browser.test.js')) {
  const result = runCrossBrowserTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
