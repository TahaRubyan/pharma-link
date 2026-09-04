import React from 'react';
import { X, History, CreditCard, Calendar } from 'lucide-react';
import { formatDateDDMMYYYY } from '../../context/AuthContext';

export const PaymentHistoryModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const logs = invoice.paymentLogs || [];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.15rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <History size={18} color="#047857" /> Payment Settlement History
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Invoice #{invoice.invoiceNo} • {invoice.shopName || invoice.customerName}
          </p>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date (DD-MM-YYYY)</th>
                <th>Time Log</th>
                <th>Amount Received</th>
                <th>Payment Mode</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
                    No partial cash settlements recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx}>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{formatDateDDMMYYYY(log.date)}</td>
                    <td style={{ fontSize: '11px', color: '#64748b' }}>{log.time || '12:00 PM'}</td>
                    <td style={{ fontWeight: 700, color: '#047857' }}>Rs. {Number(log.amountPaid || log.amount || 0).toLocaleString('en-PK')}</td>
                    <td style={{ fontSize: '12px' }}>{log.paymentMode || 'Cash'}</td>
                    <td style={{ fontSize: '11px' }}>{log.loggedBy || 'Cashier'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryModal;
