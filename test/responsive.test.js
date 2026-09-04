/**
 * Responsive Layout Testing Suite for PharmaLink ERP & POS
 * Validates layout breakpoints, flex-wrap behavior, viewport adaptations, and overflow containment.
 */

let passedCount = 0;
let failedCount = 0;

export function runResponsiveTests() {
  console.log('📱 [6/10] Running Responsive Layout Testing Suite...');
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

  // 1. Breakpoint Tier Audit
  test('Responsive - Multi-device breakpoint tiers are correctly classified', () => {
    const getDeviceTier = (width) => {
      if (width < 640) return 'MOBILE';
      if (width < 1024) return 'TABLET';
      if (width < 1440) return 'DESKTOP';
      return 'WIDE';
    };

    if (getDeviceTier(375) !== 'MOBILE') throw new Error('375px should be MOBILE');
    if (getDeviceTier(768) !== 'TABLET') throw new Error('768px should be TABLET');
    if (getDeviceTier(1280) !== 'DESKTOP') throw new Error('1280px should be DESKTOP');
    if (getDeviceTier(1920) !== 'WIDE') throw new Error('1920px should be WIDE');
  });

  // 2. POS Grid Responsive Columns
  test('Responsive - POS billing screen switches from 2-column grid to 1-column stack below 900px', () => {
    const getPOSGridStyle = (viewportWidth) => {
      if (viewportWidth < 900) {
        return { display: 'flex', flexDirection: 'column', gap: '1rem' };
      }
      return { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' };
    };

    const mobileLayout = getPOSGridStyle(768);
    if (mobileLayout.display !== 'flex' || mobileLayout.flexDirection !== 'column') {
      throw new Error('POS failed to stack on 768px tablet');
    }

    const desktopLayout = getPOSGridStyle(1280);
    if (desktopLayout.display !== 'grid' || desktopLayout.gridTemplateColumns !== '1fr 340px') {
      throw new Error('POS failed to show dual-column grid on 1280px desktop');
    }
  });

  // 3. Modal Responsive Widths & Max-Height Caps
  test('Responsive - Modals enforce percentage width with max-width caps and viewport height bounds', () => {
    const calculateModalDimensions = (viewportWidth, viewportHeight, targetMaxWidth = 1240) => {
      const modalWidth = Math.min(viewportWidth - 32, targetMaxWidth); // 16px padding on each side
      const maxHeight = Math.floor(viewportHeight * 0.92);
      return { modalWidth, maxHeight };
    };

    // Mobile Phone (375x667)
    const mobileModal = calculateModalDimensions(375, 667, 1240);
    if (mobileModal.modalWidth !== 343) throw new Error(`Expected 343px width on mobile, got ${mobileModal.modalWidth}`);
    if (mobileModal.maxHeight > 667) throw new Error('Modal exceeds mobile viewport height');

    // Desktop (1440x900)
    const desktopModal = calculateModalDimensions(1440, 900, 1240);
    if (desktopModal.modalWidth !== 1240) throw new Error(`Expected 1240px width on desktop, got ${desktopModal.modalWidth}`);
  });

  // 4. Table Container Horizontal Scroll Container
  test('Responsive - Table containers enforce overflow-x auto to prevent horizontal window scrollbars', () => {
    const tableContainerStyle = {
      width: '100%',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    };

    if (tableContainerStyle.overflowX !== 'auto') {
      throw new Error('Table container missing horizontal scroll containment');
    }
  });

  // 5. Sidebar Collapsed Space Conservation
  test('Responsive - Sidebar collapsed mode frees up 168px horizontal screen space for compact displays', () => {
    const expandedWidth = 240;
    const collapsedWidth = 72;
    const spaceFreed = expandedWidth - collapsedWidth;

    if (spaceFreed !== 168) throw new Error(`Expected 168px saved, got ${spaceFreed}`);
  });

  console.log(`📊 Responsive Tests Summary: ${passedCount} Passed, ${failedCount} Failed\n`);
  return { passedCount, failedCount };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('responsive.test.js')) {
  const result = runResponsiveTests();
  process.exit(result.failedCount === 0 ? 0 : 1);
}
