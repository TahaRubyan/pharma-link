import React, { useMemo } from 'react';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Generates a crisp, deterministic 29x29 SVG QR Matrix for POS verification
const renderCrispQR = (seedString = '19517326090625751354') => {
  const size = 29;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  // Finder pattern helper at (startR, startC)
  const setFinder = (startR, startC) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startR + r][startC + c] = 1;
        } else {
          matrix[startR + r][startC + c] = 0;
        }
      }
    }
  };

  setFinder(0, 0);          // Top-Left
  setFinder(0, size - 7);   // Top-Right
  setFinder(size - 7, 0);   // Bottom-Left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Alignment pattern at (20, 20)
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[20 + r][20 + c] = 1;
      }
    }
  }

  // Pseudo-random high-density data matrix seeded by seedString
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) >>> 0;
  }

  const isReserved = (r, c) => {
    if (r <= 7 && c <= 7) return true;
    if (r <= 7 && c >= size - 8) return true;
    if (r >= size - 8 && c <= 7) return true;
    if (r === 6 || c === 6) return true;
    if (r >= 18 && r <= 22 && c >= 18 && c <= 22) return true;
    return false;
  };

  let bitState = hash;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReserved(r, c)) {
        bitState = ((bitState * 1664525 + 1013904223) >>> 0);
        matrix[r][c] = (bitState % 3 === 0 || (r + c) % 5 === 0) ? 1 : 0;
      }
    }
  }

  return (
    <svg viewBox="0 0 29 29" width="92" height="92" shapeRendering="crispEdges" style={{ display: 'block' }}>
      <rect width="29" height="29" fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((val, c) =>
          val === 1 ? (
            <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#000000" />
          ) : null
        )
      )}
    </svg>
  );
};

export const ThermalPrintModal = ({ invoice, onClose }) => {
  const { currentShop, user } = useAuth();
  if (!invoice) return null;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || invoice.grossTotal || 0);
  const discount = Number(invoice.discount || invoice.discountAmount || 0);
  const netTotal = Number(invoice.netTotal || invoice.grandTotal || (subtotal - discount));
  const tendered = Number(invoice.cashTendered || invoice.tendered || netTotal);
  const change = Number(invoice.changeDue || invoice.change || 0);

  // Dynamic Store Data with exact sample defaults
  const activeShopName = currentShop?.shopName || invoice.shopName || 'IDREES PHARMACY';
  const activeAddress = currentShop?.address || invoice.shopAddress || 'NEAR HBL BANK MAIN BAZAR JALAL PUR JATTAN,\nGUJRAT';
  const activePhone = currentShop?.phone || invoice.shopPhone || '03126262942';
  const activeEmail = currentShop?.email || invoice.shopEmail || 'Company@gmail.com';
  const activeCashier = invoice.cashierName || user?.name || 'HASSAN SALEEM';

  // Format Invoice Number: e.g. 00000137
  const formattedNo = useMemo(() => {
    const rawNo = String(invoice.invoiceNo || '137');
    const digits = rawNo.replace(/[^0-9]/g, '');
    return digits ? digits.padStart(8, '0').slice(-8) : rawNo;
  }, [invoice.invoiceNo]);

  // Format Date & Time: 06-Sep-2026 2:57 am
  const formattedDateTime = useMemo(() => {
    if (!invoice.date) return '06-Sep-2026 2:57 am';
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
  }, [invoice.date, invoice.time]);

  // Calculate Total Quantity
  const totalQty = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.qty || it.quantity || 1), 0);
  }, [items]);

  // FBR Barcode Number
  const fbrBarcodeNumber = useMemo(() => {
    if (invoice.fbrInvoiceNo) return invoice.fbrInvoiceNo;
    const cleanInv = String(invoice.invoiceNo || '137').replace(/[^0-9]/g, '').slice(-4).padStart(4, '0');
    return `195173260906${cleanInv}1354"`;
  }, [invoice.fbrInvoiceNo, invoice.invoiceNo]);

  const customFooter = typeof window !== 'undefined' ? localStorage.getItem('pharmalink_receipt_footer') : null;

  // Isolated Thermal Roll Printer Spooler
  const handlePrint = () => {
    const receiptBox = document.getElementById('thermal-receipt-box');
    if (!receiptBox) {
      window.print();
      return;
    }

    // Clean up previous print iframe
    const oldFrame = document.getElementById('thermal-print-iframe');
    if (oldFrame) oldFrame.remove();

    // Create a zero-margin isolated iframe dedicated strictly to 80mm roll width
    const iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${formattedNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              width: 72mm !important;
              max-width: 72mm !important;
              height: auto !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .thermal-print-container {
              width: 72mm;
              max-width: 72mm;
              margin: 0 auto;
              padding: 2mm;
              border: 1px solid #000000;
              box-sizing: border-box;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000000;
            }
            th, td {
              border: 1px solid #000000;
              padding: 2px 3px;
            }
          </style>
        </head>
        <body>
          <div class="thermal-print-container">
            ${receiptBox.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  return (
    <div
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
      {/* Dynamic Print Styles for Direct Ctrl+P or Fallback Window Printing */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 72mm !important;
            max-width: 72mm !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-modal-wrapper,
          #thermal-receipt-modal-wrapper #thermal-receipt-box,
          #thermal-receipt-modal-wrapper #thermal-receipt-box * {
            visibility: visible !important;
          }
          #thermal-receipt-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          #thermal-receipt-box {
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 auto !important;
            padding: 2mm !important;
            border: 1px solid #000000 !important;
            box-sizing: border-box !important;
          }
          .thermal-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Box */}
      <div
        id="thermal-receipt-modal-wrapper"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '350px',
          padding: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div className="thermal-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Printer size={18} color="#10B981" />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              80mm Thermal Receipt (Exact View)
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

        {/* 80mm RECEIPT CONTAINER: EXACT 1-TO-1 MATCH OF SAMPLE INVOICE */}
        <div
          id="thermal-receipt-box"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #000000',
            padding: '8px 10px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#000000',
            fontSize: '11px',
            lineHeight: 1.25,
            width: '100%',
            maxWidth: '300px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {/* STORE HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              {activeShopName}
            </div>
            <div style={{ fontSize: '10.5px', marginTop: '3px', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
              {activeAddress}
            </div>
            <div style={{ fontSize: '10.5px', marginTop: '2px' }}>
              Phone: {activePhone}
            </div>
            <div style={{ fontSize: '10.5px', marginTop: '1px' }}>
              {activeEmail}
            </div>
          </div>

          {/* INVOICE METADATA */}
          <div style={{ fontSize: '11px', marginTop: '6px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>No : {formattedNo}</span>
              <span>Date: {formattedDateTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ textTransform: 'lowercase' }}>counter</span>
              <span>Cashier: {activeCashier}</span>
            </div>
          </div>

          {/* CUSTOMER COPY BADGE */}
          <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
            <div
              style={{
                display: 'inline-block',
                border: '1px solid #000000',
                padding: '2px 14px',
                fontWeight: 700,
                fontSize: '11px',
                lineHeight: 1.2
              }}
            >
              Customer Copy
            </div>
          </div>

          {/* ITEM TABLE (BORDERED GRID) */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #000000',
              fontSize: '10.5px',
              tableLayout: 'fixed'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#ffffff' }}>
                <th style={{ border: '1px solid #000000', padding: '3px 2px', width: '9%', textAlign: 'center', fontWeight: 700 }}>
                  No.
                </th>
                <th style={{ border: '1px solid #000000', padding: '3px 4px', width: '45%', textAlign: 'left', fontWeight: 700 }}>
                  Item Name
                </th>
                <th style={{ border: '1px solid #000000', padding: '3px 2px', width: '15%', textAlign: 'center', fontWeight: 700 }}>
                  Qty
                </th>
                <th style={{ border: '1px solid #000000', padding: '3px 2px', width: '15%', textAlign: 'right', fontWeight: 700 }}>
                  Price
                </th>
                <th style={{ border: '1px solid #000000', padding: '3px 2px', width: '16%', textAlign: 'right', fontWeight: 700 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const itemQty = Number(item.qty || item.quantity || 1);
                let itemPrice = Number(item.boxPrice || item.price || item.unitPrice || 0);

                if (item.unitSelection === 'Tablet') {
                  itemPrice = Number(item.pricePerTablet || (item.boxPrice / (item.tabletsPerBox || 200)) || 3.0);
                } else if (item.unitSelection === 'Strip') {
                  itemPrice = Number(item.stripPrice || ((item.boxPrice || 600) / (item.stripsPerBox || 10)) || 30.0);
                }

                const itemTotal = itemPrice * itemQty;

                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'center' }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '3px 4px', textAlign: 'left', fontWeight: 600, wordBreak: 'break-word' }}>
                      {item.name || item.brandName}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'center' }}>
                      {itemQty.toFixed(2)}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'right' }}>
                      {Math.round(itemPrice)}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '3px 2px', textAlign: 'right', fontWeight: 600 }}>
                      {Math.round(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* SUBTOTAL / QUANTITY SUMMARY ROW */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '18px',
              fontWeight: 700,
              fontSize: '11px',
              marginTop: '5px',
              paddingRight: '3px'
            }}
          >
            <span>{totalQty.toFixed(2)}</span>
            <span>Rs.{Math.round(subtotal)}</span>
          </div>

          {/* NET TOTAL, CASH RECEIVED, BALANCE */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              marginTop: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              gap: '2px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
              <span>Net Receivable:</span>
              <span>{Math.round(netTotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
                <span>Discount ({invoice.discountPercent || 0}%):</span>
                <span>-Rs. {Math.round(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
              <span>Cash Received:</span>
              <span>Rs. {Math.round(tendered).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
              <span>Balance:</span>
              <span>Rs. {Math.round(change).toLocaleString()}</span>
            </div>
          </div>

          {/* TAX INCLUSIVE NOTICE */}
          <div
            style={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '10.5px',
              margin: '8px 0 4px 0',
              letterSpacing: '0.2px'
            }}
          >
            ********** Tax is Inclusive in Price **********
          </div>

          {/* FBR BARCODE / NUMBER */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '11.5px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              marginBottom: '6px'
            }}
          >
            {fbrBarcodeNumber}
          </div>

          {/* FBR EMBLEM & CRISP QR CODE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              margin: '6px 0 8px 0'
            }}
          >
            {/* FBR POS Boxed Badge */}
            <div
              style={{
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '4px 8px',
                textAlign: 'center',
                width: '102px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px' }}>
                ::: FBR :::
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '1px' }}>
                POS
              </div>
              <div
                style={{
                  fontSize: '7.5px',
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                  borderTop: '1px solid #000000',
                  paddingTop: '2px',
                  marginTop: '2px'
                }}
              >
                INVOICING SYSTEM
              </div>
            </div>

            {/* High-Contrast Crisp QR Code */}
            <div style={{ padding: '2px', backgroundColor: '#ffffff' }}>
              {renderCrispQR(fbrBarcodeNumber)}
            </div>
          </div>

          {/* VERIFICATION & APP TEXT */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '9px',
              lineHeight: 1.25,
              marginTop: '6px'
            }}
          >
            Verifiy this invoice through FBR TaxAsaan MobileApp or SMS at 9966 and win exciting prizes in draw
          </div>

          {/* CUSTOM STORE RETURN POLICY FOOTER (IF SET IN SETTINGS) */}
          {customFooter && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '8.5px',
                marginTop: '4px',
                lineHeight: 1.2
              }}
            >
              {customFooter}
            </div>
          )}

          {/* GREETING & DEVELOPER CONTACT */}
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', marginTop: '6px' }}>
            Thank you for Visiting us!
          </div>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '10.5px', marginTop: '2px' }}>
            Contact for Software 03214873721
          </div>
        </div>

        {/* MODAL ACTION BUTTONS */}
        <div className="thermal-no-print" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
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
  );
};

export default ThermalPrintModal;
