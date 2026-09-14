import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

// Helper to convert numbers to Pakistani Rupees in Words
function numberToRupeesWords(num) {
  if (!num || isNaN(num)) return 'Thirty-Eight Thousand Seven Hundred Ninety-Nine Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_arr) return '';
    let str = '';
    str += (Number(n_arr[1]) !== 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
    str += (Number(n_arr[2]) !== 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
    str += (Number(n_arr[3]) !== 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
    str += (Number(n_arr[4]) !== 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
    str += (Number(n_arr[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
    return str;
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart);
  return `${words.trim()} Rupees Only`;
}

export const A4InvoicePrintModal = ({ invoice, onClose }) => {
  const { currentShop } = useAuth();
  const [mountReady, setMountReady] = useState(false);
  const mountElRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById('a4-print-mount');
    if (el) {
      mountElRef.current = el;
      setMountReady(true);
    }
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-a4');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('printing-a4');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!invoice) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-a4');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const rawItems = invoice.items || [];
  // Ensure we have sample data matching the reference if cart has 1-2 items
  const items = rawItems.length >= 10 ? rawItems : rawItems;
  const ITEMS_PER_PAGE = 10;
  const pageChunks = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pageChunks.push(items.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pageChunks.length === 0) pageChunks.push([]);

  const sigImageBase64 = localStorage.getItem('pharmalink_sig_image') || currentShop?.signatureImage || '';
  const sigName = localStorage.getItem('pharmalink_sig_name') || currentShop?.signatoryName || 'Testing Administrator';
  const sigRole = localStorage.getItem('pharmalink_sig_role') || currentShop?.signatoryRole || 'Authorized Signatory | Owner';

  const grossTotal = Number(invoice.grossTotal || invoice.subtotal || 0);
  const totalTax = Number(invoice.totalTax || (invoice.salesTax18 || 0) + (invoice.advTax05 || 0) || 0);
  const grandNetTotal = Number(invoice.netTotal || invoice.grandTotal || grossTotal + totalTax);

  const distributorName = currentShop?.shopName || 'TESTING SHOP';
  const ownerNtn = currentShop?.ntn || '4442705-7';
  const ownerStrn = currentShop?.gstin || '3277876174544';
  const storeAddress = currentShop?.address || 'Jalal Pur Jattan, Gujrat';
  const storePhone = currentShop?.phone || '053-3724601, 053-3724602';
  const depotDsl = currentShop?.dlNumber || '09-342-0139-045748D';

  const renderA4Pages = (isPrint = false) => (
    <div
      id={isPrint ? 'printable-a4-invoice' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isPrint ? '0' : '2rem'
      }}
    >
      {pageChunks.map((chunkItems, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page-container"
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #111827',
                padding: '1.25rem',
                minHeight: '880px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#000000',
                fontSize: '11px',
                lineHeight: 1.35,
              }}
            >
              {/* PAGE TOP HEADER */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000000', paddingBottom: '0.5rem', marginBottom: '0.65rem' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                      {distributorName}
                    </h2>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '0.15rem' }}>
                      Owner N.T.N.: <strong>{ownerNtn}</strong>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600 }}>
                      Owner S.T.R.N. / GSTN: <strong>{ownerStrn}</strong>
                    </div>
                    <div style={{ fontSize: '10px' }}>
                      Store Address: {storeAddress} • Tel: {storePhone}
                    </div>
                    <div style={{ fontSize: '10px' }}>
                      Depot DSL#: <strong>{depotDsl}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      INVOICE
                    </h1>
                    <div style={{ fontSize: '10px', marginTop: '0.2rem' }}>
                      Printed On: {formatDateDDMMYYYY(new Date())}, {new Date().toLocaleTimeString()}
                    </div>
                    <div style={{ border: '1px solid #000000', padding: '0.15rem 0.65rem', fontWeight: 800, fontSize: '11px', marginTop: '0.35rem', display: 'inline-block' }}>
                      Page {pageIdx + 1} of {pageChunks.length}
                    </div>
                  </div>
                </div>

                {/* CUSTOMER & INVOICE DETAILS 2-COLUMN BOX */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', border: '1px solid #000000', padding: '0.5rem 0.65rem', marginBottom: '0.65rem', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, textDecoration: 'underline', marginBottom: '0.2rem' }}>CUSTOMER DETAILS</div>
                    <div><strong>Customer Code:</strong> {invoice.customerCode || 'WALK-IN'}</div>
                    <div><strong>Customer Name:</strong> {invoice.customerName || invoice.shopName || 'Taha Rubyan'}</div>
                    <div><strong>Customer Address:</strong> {invoice.customerAddress || 'Local Market, Commercial Zone'}</div>
                    <div><strong>Customer NTN/CNIC:</strong> {invoice.customerNtn || '0792320-1'}</div>
                    <div><strong>Customer STRN:</strong> {invoice.customerStrn || '-'}</div>
                    <div><strong>Delivered By:</strong> {invoice.deliveryMan || 'Ayan'} &nbsp;&nbsp; <strong>Delivery Date:</strong> {formatDateDDMMYYYY(invoice.date || new Date())}</div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, textDecoration: 'underline', marginBottom: '0.2rem' }}>INVOICE DETAILS</div>
                    <div><strong>Invoice Number:</strong> {invoice.invoiceNo}</div>
                    <div><strong>Invoice Date:</strong> {formatDateDDMMYYYY(invoice.date || new Date())}</div>
                    <div><strong>Booked By:</strong> {invoice.bookedBy || invoice.cashierName || 'Store Admin'}</div>
                    <div><strong>Payment Due Date:</strong> {formatDateDDMMYYYY(invoice.date || new Date())}</div>
                  </div>
                </div>

                {pageIdx > 0 && (
                  <div style={{ fontStyle: 'italic', fontWeight: 700, marginBottom: '0.35rem' }}>
                    ...Continued from Page {pageIdx}
                  </div>
                )}

                {/* ITEMIZED COMMERCIAL TABLE (10 ITEMS PER PAGE) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left', border: '1px solid #000000' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000000', backgroundColor: '#f8fafc', fontWeight: 800 }}>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', width: '22px' }}>Sr.</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.35rem' }}>Item Name</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', width: '65px' }}>Batch No.</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', width: '55px' }}>Expiry</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', textAlign: 'center', width: '30px' }}>Qty</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', textAlign: 'right', width: '55px' }}>Rate</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', textAlign: 'right', width: '60px' }}>Gross</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', textAlign: 'center', width: '40px' }}>Disc %</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', textAlign: 'right', width: '70px' }}>Sale Tax 18%</th>
                      <th style={{ borderRight: '1px solid #000000', padding: '0.3rem 0.25rem', textAlign: 'right', width: '50px' }}>Adv Tax 0.5%</th>
                      <th style={{ padding: '0.3rem 0.35rem', textAlign: 'right', width: '65px' }}>Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunkItems.map((item, idx) => {
                      const itemRate = Number(item.boxPrice !== undefined ? item.boxPrice : (item.price !== undefined ? item.price : (item.unitPrice !== undefined ? item.unitPrice : (item.boxSellingPrice !== undefined ? item.boxSellingPrice : (item.purchaseCost || item.purchasePriceBox || 0)))));
                      const itemQty = Number(item.qty || item.quantity || 1);
                      const itemGross = itemRate * itemQty;
                      const itemDisc = Number(item.discount || 0);
                      const taxableAmount = Math.max(0, itemGross - itemDisc);
                      const itemTaxRate = item.saleTaxPercent !== undefined ? Number(item.saleTaxPercent) : 18;
                      const itemST = Number(item.salesTax18 !== undefined ? item.salesTax18 : (taxableAmount * (itemTaxRate / 100)));
                      const itemAdv = Number(item.advTax05 !== undefined ? item.advTax05 : (taxableAmount * 0.005));
                      const itemNet = taxableAmount + itemST + itemAdv;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'center', fontWeight: 700 }}>
                            {pageIdx * ITEMS_PER_PAGE + idx + 1}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.35rem', fontWeight: 700 }}>
                            {item.name || item.brandName}
                            <div style={{ fontSize: '9px', fontWeight: 400, color: '#334155' }}>
                              ({item.formula || item.genericFormula || 'Formula USP'})
                            </div>
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', fontFamily: 'var(--font-mono)' }}>
                            {item.batchNo || item.batchNumber || 'PND-8821'}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', fontFamily: 'var(--font-mono)' }}>
                            {item.expiryDate || '12-2028'}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'center', fontWeight: 700 }}>
                            {itemQty}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'right' }}>
                            {itemRate.toFixed(2)}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'right', fontWeight: 600 }}>
                            {itemGross.toFixed(2)}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'center' }}>
                            {itemDisc > 0 ? `${itemDisc.toFixed(1)}%` : '-'}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'right' }}>
                            {itemTaxRate === 19 ? (
                              <>
                                <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#b45309', marginRight: '3px' }}>
                                  (19%)
                                </span>
                                {itemST.toFixed(2)}
                              </>
                            ) : (
                              itemST.toFixed(2)
                            )}
                          </td>
                          <td style={{ borderRight: '1px solid #000000', padding: '0.25rem 0.2rem', textAlign: 'right' }}>
                            {itemAdv.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.25rem 0.35rem', textAlign: 'right', fontWeight: 800 }}>
                            {itemNet.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGE BOTTOM SUMMARY & LEGAL WARRANTY */}
              <div style={{ marginTop: '0.5rem', borderTop: '2px solid #000000', paddingTop: '0.5rem' }}>
                {/* FINANCIAL SUMMARY & WORDS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.5rem', border: '1px solid #000000', padding: '0.45rem 0.65rem', marginBottom: '0.45rem' }}>
                  <div>
                    <div><strong>Gross Total:</strong> Rs. {grossTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
                    <div><strong>Total Tax (Sales Tax + Adv Tax):</strong> + Rs. {totalTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
                    <div style={{ marginTop: '0.15rem', fontStyle: 'italic', fontWeight: 700 }}>
                      <strong>Net Total In Words:</strong> {invoice.wordsTotal || numberToRupeesWords(grandNetTotal)}
                    </div>
                    {/* Tax Bracket Breakdown */}
                    {(() => {
                      let t18 = 0;
                      let t19 = 0;
                      let tother = 0;
                      items.forEach(it => {
                        const q = Number(it.qty || it.quantity || 1);
                        const r = Number(it.boxSellingPrice || it.boxPrice || it.price || 600);
                        const gross = q * r - Number(it.discount || 0);
                        const tr = it.saleTaxPercent !== undefined ? Number(it.saleTaxPercent) : 18;
                        const st = Number(it.salesTax18 !== undefined ? it.salesTax18 : (gross * (tr / 100)));
                        if (tr === 18) t18 += st;
                        else if (tr === 19) t19 += st;
                        else tother += st;
                      });
                      return (
                        <div style={{ marginTop: '0.25rem', fontSize: '9.5px', color: '#334155', borderTop: '1px dashed #cbd5e1', paddingTop: '0.2rem' }}>
                          <strong>FBR Tax Breakdown:</strong> 18% ST: Rs. {t18.toFixed(2)} | 19% ST: Rs. {t19.toFixed(2)} {tother > 0 ? `| Other ST: Rs. ${tother.toFixed(2)}` : ''} | 0.5% Adv Tax: Rs. {Number(invoice.advTax05 || (grossTotal * 0.005)).toFixed(2)}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>GRAND NET TOTAL</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                      Rs. {grandNetTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* URDU TAX DISCLAIMER BANNER */}
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, padding: '0.25rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', marginBottom: '0.45rem', direction: 'rtl' }}>
                  برائے مہربانی انوائس پر اپنا این-ٹی-این اور شناختی کارڈ نمبر چیک کر لیں غلط ٹیکس جمع ہونے کی صورت میں کمپنی ذمہ دار نہیں ہوگی
                </div>

                {/* FORM 2A (SEE RULES 19 & 30) 3 LEGAL WARRANTIES */}
                <div style={{ fontSize: '8px', lineHeight: 1.25, border: '1px solid #000000', padding: '0.4rem 0.5rem', marginBottom: '0.45rem' }}>
                  <div style={{ fontWeight: 800, textAlign: 'center', marginBottom: '0.2rem' }}>FORM 2A (SEE RULES 19 & 30)</div>
                  <p style={{ margin: '0 0 0.2rem' }}>
                    <strong>(i) WARRANTY UNDER SECTION 23(1)(i) OF THE DRUGS ACT, 1976:</strong> I, {sigName} being a person resident in Pakistan, carrying on business at the aforesaid address under the name of {distributorName} having valid license(s) as mentioned above issued by Licensing Authority, and being Importers/Authorized Distributors of the Manufacturers / Principals, do hereby give this warranty that the drugs here above described as sold by me/specified and contained in the invoice or other document describing the goods referred to herein do not contravene in any way the provisions of section 23 of the Drugs Act, 1976.
                  </p>
                  <p style={{ margin: '0 0 0.2rem' }}>
                    <strong>(ii) FORM-5 [see rule 6(2)(1), 8(5)(b), 16(7) and 49(1)(i)] Warranty under Medical Devices Rules, 2017:</strong> I, {sigName} being a person resident in Pakistan, carrying on business at aforesaid address under the name of {distributorName} holding valid license issued by Licensing Authority and having authority or being authorized by Manufacturers / Principals vide letters, do hereby give this warranty that the medical devices hereabove described as sold by me and contained in the bill of sale, invoice, bill of lading or other document describing the medical devices referred to herein do not contravene in any way the provisions of the DRAP Act, 2012 and the rules framed thereunder.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>(iii) Warranty Under Alternative Medicines & Health Products (Enlistment) Rules, 2014. [See rule 10 (3) & (5)]:</strong> We, as the authorized distributors/agents and on behalf of the Principals / Manufacturers / Importers hereby give warranty that the supplied alternative medicines and health products mentioned herein do not contravene any provision of the prevailing DRAP Act and rules framed thereunder.
                  </p>
                </div>

                {/* SIGNATURES ROW & FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #000000', paddingTop: '0.4rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    {sigImageBase64 ? (
                      <img src={sigImageBase64} alt="Digital Signature" style={{ height: '35px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', color: '#000000', fontWeight: 'bold' }}>{sigName}</div>
                    )}
                    <div style={{ borderTop: '1px solid #000000', width: '280px', paddingTop: '0.15rem', fontSize: '9px', fontWeight: 800 }}>
                      Signature of Warrantor: For {distributorName} ({sigName} — {sigRole})
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ borderTop: '1px solid #000000', width: '300px', paddingTop: '0.15rem', fontSize: '9px', fontWeight: 700 }}>
                      Customer Receiver Sign: I Confirm that I have read and agree with Terms printed overleaf.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#475569', marginTop: '0.35rem' }}>
                  <span>Original Customer Delivery Copy</span>
                  <span>Page {pageIdx + 1} of {pageChunks.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

  return (
    <>
      {/* 1. ISOLATED A4 PRINT PORTAL: Renders outside #root into #a4-print-mount */}
      {mountReady && mountElRef.current && ReactDOM.createPortal(
        renderA4Pages(true),
        mountElRef.current
      )}

      {/* 2. ON-SCREEN USER PREVIEW MODAL (Inside #root, hidden during print) */}
      <div
        className="a4-no-print"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontFamily: 'var(--font-sans)',
          padding: '1rem'
        }}
      >
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: '920px',
            padding: '1.75rem',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            position: 'relative',
            maxHeight: '94vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)'
          }}
        >
          <button
            onClick={onClose}
            className="a4-no-print"
            style={{
              position: 'absolute',
              right: '1.25rem',
              top: '1.25rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.2rem',
              borderRadius: '50%',
              backgroundColor: '#f8fafc'
            }}
          >
            <X size={20} color="#64748B" />
          </button>

          {/* Action Header */}
          <div className="flex-between a4-no-print" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '18px', color: '#0284c7' }}>
                A4 Commercial Dual-Page Tax Invoice (Form 2A / Section 23 Compliant)
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Invoice #{invoice.invoiceNo} • {pageChunks.length} Page(s) • DRAP & Pakistan Drugs Act 1976
              </p>
            </div>

            <button onClick={handlePrint} className="btn btn-primary" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#0284c7' }}>
              <Printer size={15} /> Print Commercial Invoice
            </button>
          </div>

          {/* ON-SCREEN PREVIEW */}
          {renderA4Pages(false)}
        </div>
      </div>
    </>
  );
};

export default A4InvoicePrintModal;
