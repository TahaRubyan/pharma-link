import React from 'react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { STORE_INFO } from '../../data/mockData';
import { FileText, Printer, Building2, CheckCircle2 } from 'lucide-react';

function numberToWords(num) {
  const rounded = Math.round(num * 100) / 100;
  if (rounded === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);
  let result = inWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + inWords(paise) + ' Paise';
  }
  return result + ' Only';
}

export const A4InvoiceModal = () => {
  const { activeModal, closeModal, lastCompletedSale, cart, calculations, rxPatient, addToast } = useCart();

  const isOpen = activeModal === 'a4';

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-a4');
      const handleAfterPrint = () => {
        // print done
      };
      window.addEventListener('afterprint', handleAfterPrint);
      return () => {
        document.body.classList.remove('printing-a4');
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isOpen]);

  // Use last completed sale if available, otherwise construct preview from active cart
  const sale = lastCompletedSale || {
    invoiceNo: 'TAX-2026-PREVIEW',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cashier: 'Dr. Vikrant Sharma',
    patient: rxPatient || { name: 'Rajesh Kumar', phone: '+91 98700 12345', doctorName: 'Dr. S. K. Gupta (MD)' },
    items: cart,
    subtotal: calculations.subtotal,
    discountAmount: calculations.discountAmount,
    taxableAmount: calculations.taxableAmount,
    gstTotal: calculations.gstTotal,
    gstBreakdown: calculations.gstBreakdown,
    grandTotal: calculations.grandTotal,
    paymentMode: 'Cash'
  };

  const handlePrint = () => {
    addToast('Printing', 'A4 Tax Invoice dispatched to system printer.', 'success');
    document.body.classList.add('printing-a4');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="A4 Printable GST Tax Invoice (F10)"
      subtitle="Full page GST compliant retail tax invoice format"
      icon={FileText}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* A4 Tax Invoice Container */}
        <div
          id="printable-a4-invoice"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            fontSize: '0.825rem',
            lineHeight: 1.5,
            color: '#0F172A',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Header Block */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid var(--color-primary)',
              paddingBottom: '0.875rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 color="var(--color-primary)" size={24} />
                <h3 style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
                  {STORE_INFO.name}
                </h3>
              </div>
              <div style={{ fontSize: '0.775rem', color: '#475569', marginTop: '0.2rem' }}>
                {STORE_INFO.address}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
                Phone: {STORE_INFO.phone} | Email: {STORE_INFO.email}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem' }}>
                DL Lic No: {STORE_INFO.dlNumber}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.9rem', display: 'inline-block' }}>
                RETAIL TAX INVOICE
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem', color: '#0F172A' }}>
                Invoice #: {sale.invoiceNo}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                GSTIN: <strong>{STORE_INFO.gstin}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Date: {sale.date} ({sale.time})
              </div>
            </div>
          </div>

          {/* Billed To / Supply Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              marginBottom: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#334155', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                BILLED TO / PATIENT DETAILS
              </div>
              <div><strong>Name:</strong> {sale.patient?.name || 'Walk-in Cash Patient'}</div>
              <div><strong>Contact:</strong> {sale.patient?.phone || '-'}</div>
              {sale.patient?.doctorName && sale.patient.doctorName !== '-' && (
                <div><strong>Prescribing Dr:</strong> {sale.patient.doctorName}</div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#334155', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.2rem', marginBottom: '0.35rem' }}>
                SUPPLY & PAYMENT DETAILS
              </div>
              <div><strong>Place of Supply:</strong> Maharashtra (27)</div>
              <div><strong>Payment Mode:</strong> {sale.paymentMode || 'Cash'}</div>
              <div><strong>Pharmacist in Charge:</strong> {STORE_INFO.pharmacistInCharge}</div>
            </div>
          </div>

          {/* Itemized Products Table */}
          <table className="table" style={{ fontSize: '0.75rem', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9' }}>
                <th style={{ width: '30px' }}>#</th>
                <th>Item Description</th>
                <th>HSN</th>
                <th>Batch</th>
                <th>Exp Date</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>MRP</th>
                <th style={{ textAlign: 'center' }}>GST %</th>
                <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items && sale.items.length > 0 ? (
                sale.items.map((item, idx) => {
                  const lineTotal = item.mrp * item.quantity;
                  const rate = item.gstPercentage || 12;
                  const lineTaxable = lineTotal / (1 + rate / 100);
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.name}</div>
                        <div style={{ fontSize: '0.675rem', color: '#64748B' }}>{item.genericName}</div>
                      </td>
                      <td>{item.hsnCode || '3004'}</td>
                      <td>{item.batchNumber}</td>
                      <td>{item.expiryDate}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(item.mrp).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{rate}%</td>
                      <td style={{ textAlign: 'right' }}>₹{lineTaxable.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: '#94A3B8', padding: '1rem' }}>
                    No items in invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* GST Breakdown Table & Totals Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* HSN-wise GST Breakdown */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)', padding: '0.6rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                HSN / GST Tax Summary
              </div>
              <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #CBD5E1', textAlign: 'left', color: '#64748B' }}>
                    <th>Rate</th>
                    <th>Taxable Value</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th style={{ textAlign: 'right' }}>Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {['5%', '12%', '18%'].map((rateKey) => {
                    const data = sale.gstBreakdown?.[rateKey] || { taxable: 0, cgst: 0, sgst: 0, total: 0 };
                    if (data.taxable <= 0) return null;
                    return (
                      <tr key={rateKey} style={{ borderBottom: '1px dotted #E2E8F0' }}>
                        <td style={{ fontWeight: 600 }}>{rateKey}</td>
                        <td>₹{data.taxable.toFixed(2)}</td>
                        <td>₹{data.cgst.toFixed(2)}</td>
                        <td>₹{data.sgst.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{data.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: 700, borderTop: '1px solid #94A3B8' }}>
                    <td>Total</td>
                    <td>₹{Number(sale.taxableAmount || 0).toFixed(2)}</td>
                    <td>₹{(Number(sale.gstTotal || 0) / 2).toFixed(2)}</td>
                    <td>₹{(Number(sale.gstTotal || 0) / 2).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(sale.gstTotal || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invoice Financial Summary */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.775rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal (Gross MRP):</span>
                <span>₹{Number(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706' }}>
                  <span>Discount:</span>
                  <span>-₹{Number(sale.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Total Taxable Base:</span>
                <span>₹{Number(sale.taxableAmount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Total GST (CGST + SGST):</span>
                <span>₹{Number(sale.gstTotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '2px solid var(--color-primary)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
                <span>GRAND TOTAL:</span>
                <span>₹{Number(sale.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#0369A1', marginBottom: '1rem' }}>
            Amount in Words: <em>{numberToWords(sale.grandTotal || 0)}</em>
          </div>

          {/* Terms & Authorized Signatory Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', fontSize: '0.7rem', color: '#64748B' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>Terms & Conditions:</div>
              <ol style={{ paddingLeft: '1rem', margin: 0, lineHeight: 1.3 }}>
                <li>Goods once sold will not be taken back without original tax invoice.</li>
                <li>Prescription drugs dispensed strictly per registered medical practitioner advice.</li>
                <li>Storage: Store in a cool & dry place.</li>
              </ol>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '70px' }}>
              <div style={{ fontWeight: 700, color: '#334155' }}>For {STORE_INFO.name}</div>
              <div style={{ fontStyle: 'italic', borderTop: '1px dashed #CBD5E1', paddingTop: '0.25rem', color: '#475569' }}>
                Authorized Registered Pharmacist Signatory
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={closeModal}>
            Close (Esc)
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print A4 Invoice
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default A4InvoiceModal;
