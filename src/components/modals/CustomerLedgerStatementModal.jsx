import React from 'react';
import { X, Printer, Building, FileText, Calendar, DollarSign } from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const CustomerLedgerStatementModal = ({ customer, onClose }) => {
  const { invoices = [] } = useSales();
  const { currentShop } = useAuth();

  if (!customer) return null;

  // Filter invoices for this customer/shop
  const customerInvoices = invoices.filter((inv) => {
    const nameMatch = (inv.shopName || inv.customerName || '').toLowerCase().trim() === customer.shopName.toLowerCase().trim();
    return nameMatch;
  });

  const totalInvoicedNet = customerInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0);
  const totalRemainingDebt = customerInvoices.reduce((sum, inv) => sum + (inv.remainingDebt !== undefined ? Number(inv.remainingDebt) : Number(inv.netTotal || 0)), 0);
  const totalSettledCash = totalInvoicedNet - totalRemainingDebt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '840px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        {/* Action Header */}
        <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#047857" /> Wholesale Customer Credit Statement
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Official ledger statement for <strong>{customer.shopName}</strong> ({customer.regionName})
            </p>
          </div>

          <button onClick={handlePrint} className="btn btn-outline" style={{ borderRadius: '10px', fontSize: '12px' }}>
            <Printer size={15} /> Print Statement
          </button>
        </div>

        {/* STATEMENT HEADER PRINT BOX */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{currentShop ? currentShop.shopName : 'PharmaLink Wholesale Store'}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Drug License #: {currentShop ? currentShop.dlNumber : 'PK-DL-20-45812'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>STATEMENT DATE</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatDateDDMMYYYY(new Date())}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Invoiced Net</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>Rs. {totalInvoicedNet.toLocaleString('en-PK')}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Cash Settled</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginTop: '0.15rem' }}>Rs. {totalSettledCash.toLocaleString('en-PK')}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Balance Debt Outstanding</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#b45309', marginTop: '0.15rem' }}>Rs. {totalRemainingDebt.toLocaleString('en-PK')}</div>
            </div>
          </div>
        </div>

        {/* INVOICES & PAYMENTS LEDGER TABLE */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date (DD-MM-YYYY)</th>
                <th>Delivery Person</th>
                <th>Invoice Total</th>
                <th>Paid Amount</th>
                <th>Remaining Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customerInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
                    No invoice transactions found for this customer.
                  </td>
                </tr>
              ) : (
                customerInvoices.map((inv) => {
                  const net = Number(inv.netTotal || inv.subtotal || 0);
                  const rem = inv.remainingDebt !== undefined ? Number(inv.remainingDebt) : net;
                  const paid = net - rem;
                  const isPaid = rem === 0;

                  return (
                    <tr key={inv.invoiceNo}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNo}</td>
                      <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{formatDateDDMMYYYY(inv.date)}</td>
                      <td style={{ fontSize: '12px' }}>{inv.deliveryMan || 'Driver'}</td>
                      <td style={{ fontWeight: 700 }}>Rs. {net.toLocaleString('en-PK')}</td>
                      <td style={{ fontWeight: 700, color: '#047857' }}>Rs. {paid.toLocaleString('en-PK')}</td>
                      <td style={{ fontWeight: 700, color: rem > 0 ? '#b45309' : '#047857' }}>Rs. {rem.toLocaleString('en-PK')}</td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : rem < net ? 'badge-warning' : 'badge-danger'}`}>
                          {isPaid ? 'PAID' : rem < net ? 'PARTIAL DEBT' : 'UNPAID CREDIT'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedgerStatementModal;
