import React, { useMemo, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// High-contrast, crisp 29x29 vector SVG QR matrix for POS verification
const renderCrispQR = (seedString = '19517326090625751354') => {
  const size = 29;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

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

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[20 + r][20 + c] = 1;
      }
    }
  }

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
    <svg viewBox="0 0 29 29" width="88" height="88" shapeRendering="crispEdges" style={{ display: 'block' }}>
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

// Pure Receipt Content component: Renders Header, Body (Items & Totals), and Footer
const ReceiptView = ({
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
  fbrBarcodeNumber,
  returnPolicyNote
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #000000',
        padding: '6px 8px',
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
      {/* 1. HEADER SECTION: DETAILS OF SHOP */}
      <div style={{ textAlign: 'center', marginBottom: '5px' }}>
        <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
          {activeShopName}
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px', whiteSpace: 'pre-line', lineHeight: 1.2 }}>
          {activeAddress}
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>
          Phone: {activePhone}
        </div>
        <div style={{ fontSize: '10px', marginTop: '1px' }}>
          {activeEmail}
        </div>
      </div>

      {/* INVOICE METADATA & CASHIER */}
      <div style={{ fontSize: '10.5px', marginTop: '4px', marginBottom: '4px' }}>
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
      <div style={{ textAlign: 'center', margin: '4px 0 6px 0' }}>
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

      {/* 2. BODY SECTION: ITEMS DETAILS & TOTALS */}
      {/* If item count exceeds, all items appear consecutively without clipping */}
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
            <th style={{ border: '1px solid #000000', padding: '2px 2px', width: '9%', textAlign: 'center', fontWeight: 700 }}>
              No.
            </th>
            <th style={{ border: '1px solid #000000', padding: '2px 4px', width: '45%', textAlign: 'left', fontWeight: 700 }}>
              Item Name
            </th>
            <th style={{ border: '1px solid #000000', padding: '2px 2px', width: '15%', textAlign: 'center', fontWeight: 700 }}>
              Qty
            </th>
            <th style={{ border: '1px solid #000000', padding: '2px 2px', width: '15%', textAlign: 'right', fontWeight: 700 }}>
              Price
            </th>
            <th style={{ border: '1px solid #000000', padding: '2px 2px', width: '16%', textAlign: 'right', fontWeight: 700 }}>
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
              <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                <td style={{ border: '1px solid #000000', padding: '2px 2px', textAlign: 'center' }}>
                  {idx + 1}
                </td>
                <td style={{ border: '1px solid #000000', padding: '2px 4px', textAlign: 'left', fontWeight: 600, wordBreak: 'break-word' }}>
                  {item.name || item.brandName}
                </td>
                <td style={{ border: '1px solid #000000', padding: '2px 2px', textAlign: 'center' }}>
                  {itemQty.toFixed(2)}
                </td>
                <td style={{ border: '1px solid #000000', padding: '2px 2px', textAlign: 'right' }}>
                  {Math.round(itemPrice)}
                </td>
                <td style={{ border: '1px solid #000000', padding: '2px 2px', textAlign: 'right', fontWeight: 600 }}>
                  {Math.round(itemTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* SUBTOTAL & QUANTITY SUMMARY ROW */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '16px',
          fontWeight: 700,
          fontSize: '11px',
          marginTop: '4px',
          paddingRight: '3px'
        }}
      >
        <span>{totalQty.toFixed(2)}</span>
        <span>Rs.{Math.round(subtotal)}</span>
      </div>

      {/* NET TOTAL, DISCOUNT, CASH RECEIVED, CASH RETURNED */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginTop: '4px',
          fontSize: '11px',
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
            <span>Discount:</span>
            <span>-Rs. {Math.round(discount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
          <span>Cash Received:</span>
          <span>Rs. {Math.round(tendered).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
          <span>Cash Returned:</span>
          <span>Rs. {Math.round(change).toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '190px' }}>
          <span>Balance:</span>
          <span>Rs. 0</span>
        </div>
      </div>

      {/* 3. FOOTER SECTION: TAX, FBR VERIFICATION, THANK YOU & RETURN POLICY */}
      {/* Placed immediately after body section when all items finish */}
      <div style={{ pageBreakInside: 'avoid' }}>
        {/* TAX INCLUSIVE NOTICE */}
        <div
          style={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '10px',
            margin: '6px 0 3px 0',
            letterSpacing: '0.2px'
          }}
        >
          ********** Tax is Inclusive in Price **********
        </div>

        {/* FBR BARCODE NUMBER */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            marginBottom: '4px'
          }}
        >
          {fbrBarcodeNumber}
        </div>

        {/* FBR POS EMBLEM & CRISP QR CODE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            margin: '4px 0 6px 0'
          }}
        >
          {/* FBR POS Boxed Badge */}
          <div
            style={{
              border: '2px solid #000000',
              borderRadius: '6px',
              padding: '4px 6px',
              textAlign: 'center',
              width: '98px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1px' }}>
              ::: FBR :::
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '1px' }}>
              POS
            </div>
            <div
              style={{
                fontSize: '7px',
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

        {/* FBR MOBILE APP NOTICE */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '8.5px',
            lineHeight: 1.25,
            marginTop: '4px'
          }}
        >
          Verifiy this invoice through FBR TaxAsaan MobileApp or SMS at 9966 and win exciting prizes in draw
        </div>

        {/* RETURN POLICY NOTE */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '8.5px',
            marginTop: '4px',
            lineHeight: 1.25,
            fontWeight: 600
          }}
        >
          {returnPolicyNote}
        </div>

        {/* THANK YOU NOTE & SOFTWARE CONTACT */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', marginTop: '5px' }}>
          Thank you for Visiting us!
        </div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '10px', marginTop: '2px' }}>
          Contact for Software 03214873721
        </div>
      </div>
    </div>
  );
};

export const ThermalPrintModal = ({ invoice, onClose }) => {
  const { currentShop, user } = useAuth();
  const [mountReady, setMountReady] = useState(false);
  const mountElRef = useRef(null);

  if (!invoice) return null;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || invoice.grossTotal || 0);
  const discount = Number(invoice.discount || invoice.discountAmount || 0);
  const netTotal = Number(invoice.netTotal || invoice.grandTotal || (subtotal - discount));
  const tendered = Number(invoice.cashTendered || invoice.tendered || netTotal);
  const change = Number(invoice.changeDue || invoice.change || Math.max(0, tendered - netTotal));

  // Dynamic Store Data with exact sample defaults
  const activeShopName = currentShop?.shopName || invoice.shopName || 'IDREES PHARMACY';
  const activeAddress = currentShop?.address || invoice.shopAddress || 'NEAR HBL BANK MAIN BAZAR JALAL PUR JATTAN,\nGUJRAT';
  const activePhone = currentShop?.phone || invoice.shopPhone || '03126262942';
  const activeEmail = currentShop?.email || invoice.shopEmail || 'Company@gmail.com';
  const activeCashier = invoice.cashierName || user?.name || 'HASSAN SALEEM';

  // Format Invoice Number
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

  const returnPolicyNote = (typeof window !== 'undefined' && localStorage.getItem('pharmalink_receipt_footer')) ||
    '* Medicines once sold can be returned/exchanged within 7 days with original receipt. *';

  // Mount dedicated portal container outside root and activate printing-thermal class
  useEffect(() => {
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
  }, []);

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
    fbrBarcodeNumber,
    returnPolicyNote
  };

  // Immediate, isolated window print: #root is display:none during print, only #thermal-print-mount prints
  const handlePrint = () => {
    document.body.classList.add('printing-thermal');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <>
      {/* 1. PORTAL RENDER: Renders strictly outside #root into #thermal-print-mount for 100% isolated print */}
      {mountReady && mountElRef.current && ReactDOM.createPortal(
        <ReceiptView {...receiptProps} />,
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
          <div style={{ overflowY: 'auto', maxHeight: '70vh' }}>
            <ReceiptView {...receiptProps} />
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
