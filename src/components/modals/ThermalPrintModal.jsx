import React, { useMemo, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Pure Receipt Content component: Renders Header, Body (Items & Totals), and Footer
const ReceiptView = React.forwardRef(({
  invoice,
  activeShopName,
  activeAddress,
  activePhone,
  activeEmail,
  activeCashier,
  formattedNo,
  formattedDateTime,
  items,
  totalQty,
  subtotal,
  discount,
  netTotal,
  tendered,
  change,
  returnPolicyNote,
  isPrintVersion = false
}, ref) => {
  return (
    <div
      ref={ref}
      id={isPrintVersion ? 'thermal-receipt-print-box' : 'thermal-receipt-preview-box'}
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #000000',
        padding: '6px 8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#000000',
        fontSize: '11px',
        lineHeight: 1.25,
        width: '100%',
        maxWidth: isPrintVersion ? '76mm' : '320px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. HEADER SECTION: SHOP DETAILS PROMINENT & HIGH-CONTRAST */}
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '0.4px', textTransform: 'uppercase', lineHeight: 1.2 }}>
          {activeShopName}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '3px', whiteSpace: 'pre-line', lineHeight: 1.25 }}>
          {activeAddress}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
          Phone: {activePhone}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '1px' }}>
          {activeEmail}
        </div>
      </div>

      {/* INVOICE METADATA & CASHIER: CRISP DASHED SEPARATOR & BOLD LABELS */}
      <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '6px', marginBottom: '6px', borderTop: '1px dashed #000000', paddingTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Invoice #: <strong>{formattedNo}</strong></span>
          <span>Date: <strong>{formattedDateTime}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
          <span>Counter: <strong>Main</strong></span>
          <span>Cashier: <strong>{activeCashier}</strong></span>
        </div>
      </div>

      {/* CUSTOMER COPY BADGE */}
      <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
        <div
          style={{
            display: 'inline-block',
            border: '1.5px solid #000000',
            padding: '2px 18px',
            fontWeight: 800,
            fontSize: '11.5px',
            letterSpacing: '0.5px'
          }}
        >
          Customer Copy
        </div>
      </div>

      {/* 2. BODY SECTION: ITEMS DETAILS & TOTALS */}
      {/* All items appear consecutively without clipping or page-break splits */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #000000',
          fontSize: '11px',
          boxSizing: 'border-box'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#ffffff' }}>
            <th style={{ border: '1px solid #000000', padding: '4px 2px', width: '8%', textAlign: 'center', fontWeight: 800 }}>
              No.
            </th>
            <th style={{ border: '1px solid #000000', padding: '4px 4px', width: '46%', textAlign: 'left', fontWeight: 800 }}>
              Item Name
            </th>
            <th style={{ border: '1px solid #000000', padding: '4px 2px', width: '14%', textAlign: 'center', fontWeight: 800 }}>
              Qty
            </th>
            <th style={{ border: '1px solid #000000', padding: '4px 2px', width: '16%', textAlign: 'right', fontWeight: 800 }}>
              Price
            </th>
            <th style={{ border: '1px solid #000000', padding: '4px 2px', width: '16%', textAlign: 'right', fontWeight: 800 }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const itemQty = Number(item.qty || item.quantity || 1);
            let itemPrice = Number(item.boxPrice || item.price || item.unitPrice || 0);

            if (item.unitSelection === 'Tablet') {
              itemPrice = Number(item.pricePerTablet || (itemPrice / (item.tabletsPerBox || 200)) || 0);
            } else if (item.unitSelection === 'Strip') {
              itemPrice = Number(item.stripPrice || (itemPrice / (item.stripsPerBox || 10)) || 0);
            }

            const itemTotal = itemPrice * itemQty;

            return (
              <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'center', fontWeight: 700 }}>
                  {idx + 1}
                </td>
                <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'left', fontWeight: 700, wordBreak: 'break-word' }}>
                  {item.name || item.brandName}
                </td>
                <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'center', fontWeight: 700 }}>
                  {itemQty.toFixed(2)}
                </td>
                <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'right', fontWeight: 700 }}>
                  {Math.round(itemPrice)}
                </td>
                <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'right', fontWeight: 800 }}>
                  {Math.round(itemTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Table footer aligns Quantity and Subtotal directly beneath Qty and Amount columns */}
        <tfoot>
          <tr style={{ borderTop: '1px solid #000000' }}>
            <td colSpan={2} style={{ border: 'none', padding: '4px 2px' }}></td>
            <td style={{ border: 'none', textAlign: 'center', fontWeight: 800, padding: '4px 2px' }}>
              {totalQty.toFixed(2)}
            </td>
            <td style={{ border: 'none' }}></td>
            <td style={{ border: 'none', textAlign: 'right', fontWeight: 800, padding: '4px 2px' }}>
              Rs.{Math.round(subtotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* NET TOTAL, DISCOUNT, CASH RECEIVED, CASH RETURNED */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginTop: '2px',
          fontSize: '11.5px',
          fontWeight: 800
        }}
      >
        <div style={{ width: '185px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Net Receivable:</span>
            <span>{Math.round(netTotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>-Rs. {Math.round(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cash Received:</span>
            <span>Rs. {Math.round(tendered).toLocaleString()}</span>
          </div>
          {change > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cash Returned:</span>
              <span>Rs. {Math.round(change).toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Balance:</span>
            <span>Rs. 0</span>
          </div>
        </div>
      </div>

      {/* 3. FOOTER SECTION: RETURN POLICY, STAY HEALTHY NOTE & THANK YOU (NO TAX, NO FBR) */}
      <div style={{ pageBreakInside: 'avoid', marginTop: '6px' }}>
        {/* RETURN POLICY NOTE */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '9px',
            marginTop: '6px',
            lineHeight: 1.3,
            fontWeight: 600
          }}
        >
          {returnPolicyNote}
        </div>

        {/* STAY HEALTHY NOTE */}
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11px', marginTop: '4px', color: '#000000' }}>
          Wish you good health & stay safe!
        </div>

        {/* THANK YOU NOTE */}
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11.5px', marginTop: '2px', color: '#000000' }}>
          Thank you for Visiting us!
        </div>
      </div>
    </div>
  );
});

export const ThermalPrintModal = ({ invoice, onClose }) => {
  const { currentShop, user } = useAuth();
  const [mountReady, setMountReady] = useState(false);
  const mountElRef = useRef(null);
  const previewRef = useRef(null);

  const items = invoice?.items || [];
  const subtotal = Number(invoice?.subtotal || invoice?.grossTotal || 0);
  const discount = Number(invoice?.discount || invoice?.discountAmount || 0);
  const netTotal = Number(invoice?.netTotal || invoice?.grandTotal || (subtotal - discount));
  const tendered = Number(invoice?.cashTendered || invoice?.tendered || netTotal);
  const change = Number(invoice?.changeDue || invoice?.change || Math.max(0, tendered - netTotal));

  // Dynamic Store Data with exact sample defaults
  const activeShopName = currentShop?.shopName || invoice?.shopName || 'TESTING SHOP';
  const activeAddress = currentShop?.address || invoice?.shopAddress || 'Main Commercial Market, Lahore';
  const activePhone = currentShop?.phone || invoice?.shopPhone || '0300-1234567';
  const activeEmail = currentShop?.email || invoice?.shopEmail || 'contact@testingshop.pk';
  const activeCashier = invoice?.cashierName || user?.name || 'Testing Shop Admin';

  // Format Invoice Number: 8 digits formatted
  const formattedNo = useMemo(() => {
    const rawNo = String(invoice?.invoiceNo || '00416960');
    const digits = rawNo.replace(/[^0-9]/g, '');
    return digits ? digits.padStart(8, '0').slice(-8) : rawNo;
  }, [invoice?.invoiceNo]);

  // Format Date & Time: 06-Sep-2026 1:26 am
  const formattedDateTime = useMemo(() => {
    if (!invoice?.date) return '06-Sep-2026 1:26 am';
    try {
      const dt = new Date(`${invoice.date} ${invoice.time || ''}`);
      if (!isNaN(dt.getTime())) {
        const day = String(dt.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[dt.getMonth()];
        const year = dt.getFullYear();
        let hours = dt.getHours();
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
      }
    } catch (e) {}
    return `${invoice.date} ${invoice.time || ''}`.trim();
  }, [invoice?.date, invoice?.time]);

  // Calculate Total Quantity
  const totalQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.qty || it.quantity || 1), 0);
  }, [items]);

  const returnPolicyNote = (typeof window !== 'undefined' && localStorage.getItem('pharmalink_receipt_footer')) ||
    '* Medicines once sold can be returned/exchanged within 7 days with original receipt. *';

  // Synchronously inject or update the @page size in document.head (WITHOUT !important descriptor to ensure 100% valid CSS)
  const syncPageStyle = (heightInMm) => {
    if (typeof document === 'undefined') return;
    let styleEl = document.getElementById('thermal-dynamic-page-size');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'thermal-dynamic-page-size';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @page {
        size: 80mm ${heightInMm}mm;
        margin: 0mm;
      }
      html, body {
        width: 80mm !important;
        max-width: 80mm !important;
        height: ${heightInMm}mm !important;
        max-height: ${heightInMm}mm !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      #thermal-print-mount {
        width: 100% !important;
        max-width: 80mm !important;
        height: ${heightInMm}mm !important;
        max-height: ${heightInMm}mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #thermal-receipt-print-box {
        width: 76mm !important;
        max-width: 76mm !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }
    `;
  };

  const measureAndSync = () => {
    const el = document.getElementById('thermal-receipt-print-box') || previewRef.current;
    if (el) {
      const px = el.offsetHeight;
      if (px > 0) {
        const mm = Math.ceil(px * 0.264583) + 4;
        const finalMm = Math.max(65, mm);
        syncPageStyle(finalMm);
        return finalMm;
      }
    }
    syncPageStyle(115);
    return 115;
  };

  useEffect(() => {
    if (!invoice) return;
    measureAndSync();
    const timer = setTimeout(measureAndSync, 50);

    const handleBeforePrint = () => {
      document.body.classList.add('printing-thermal');
      measureAndSync();
    };

    const handleAfterPrint = () => {
      // Keep style ready or clean up
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      const styleEl = document.getElementById('thermal-dynamic-page-size');
      if (styleEl) styleEl.remove();
    };
  }, [invoice, items]);

  // Mount dedicated portal container outside root and activate printing-thermal class
  useEffect(() => {
    if (!invoice) return;
    let mountEl = document.getElementById('thermal-print-mount');
    if (!mountEl && typeof document !== 'undefined') {
      mountEl = document.createElement('div');
      mountEl.id = 'thermal-print-mount';
      mountEl.className = 'thermal-print-only';
      document.body.appendChild(mountEl);
    }
    mountElRef.current = mountEl;
    document.body.classList.add('printing-thermal');
    setMountReady(true);

    return () => {
      document.body.classList.remove('printing-thermal');
      if (mountEl) {
        mountEl.innerHTML = '';
      }
    };
  }, [invoice]);

  const receiptProps = {
    invoice,
    activeShopName,
    activeAddress,
    activePhone,
    activeEmail,
    activeCashier,
    formattedNo,
    formattedDateTime,
    items,
    totalQty,
    subtotal,
    discount,
    netTotal,
    tendered,
    change,
    returnPolicyNote
  };

  // Isolated window print: re-measures immediately before trigger
  const handlePrint = () => {
    document.body.classList.add('printing-thermal');
    measureAndSync();
    setTimeout(() => {
      window.print();
    }, 50);
  };

  if (!invoice) return null;

  return (
    <>
      {/* 1. PORTAL RENDER: Renders strictly outside #root into #thermal-print-mount for 100% isolated print */}
      {mountReady && mountElRef.current && ReactDOM.createPortal(
        <ReceiptView {...receiptProps} isPrintVersion={true} />,
        mountElRef.current
      )}

      {/* 2. ON-SCREEN MODAL PREVIEW (Inside #root, hidden during print) */}
      <div
        className="thermal-no-print"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '360px',
            padding: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: '94vh',
            overflowY: 'auto'
          }}
        >
          {/* Modal Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Printer size={18} color="#10B981" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                80mm Thermal Receipt Preview
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#64748b' }}
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>

          {/* Screen Preview Container */}
          <div style={{ overflowY: 'auto', maxHeight: '72vh' }}>
            <ReceiptView ref={previewRef} {...receiptProps} isPrintVersion={false} />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ flex: 1, borderRadius: '8px', fontSize: '12px' }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                flex: 1.4,
                backgroundColor: '#10B981',
                borderColor: '#10B981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <Printer size={15} /> Print 80mm Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThermalPrintModal;
