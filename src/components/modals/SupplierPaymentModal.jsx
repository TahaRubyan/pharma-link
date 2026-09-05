import React, { useState } from 'react';
import { X, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';

export const SupplierPaymentModal = ({ isOpen, supplier, onClose }) => {
  const { recordSupplierPayment } = useSupplier();
  const [amount, setAmount] = useState(supplier?.outstandingDebt || supplier?.pendingBalance || '');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [reference, setReference] = useState(`PAY-${Date.now().toString().slice(-4)}`);

  if (!isOpen || !supplier) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof recordSupplierPayment === 'function') {
      recordSupplierPayment(supplier.id, Number(amount) || 0, paymentMode, reference);
    }
    alert(`Payment of Rs. ${Number(amount).toLocaleString('en-PK')} recorded for ${supplier.name || supplier.companyName}!`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a' }}>
            <DollarSign size={18} color="#16a34a" /> Settle Supplier Account Debt ($ Pay)
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            {supplier.name || supplier.companyName} — Outstanding: Rs. {Number(supplier.outstandingDebt || supplier.pendingBalance || 0).toLocaleString('en-PK')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Payment Amount (Rs.) *:
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 800, outline: 'none' }}
              required
            />
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Payment Mode:
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Bank Transfer">Bank Transfer (Direct Deposit)</option>
              <option value="Cheque">Bank Cheque</option>
              <option value="Cash">Cash Settlement</option>
            </select>
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Transaction Reference / Slip #:
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#16a34a' }}>
              <CheckCircle size={15} /> Record Supplier Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierPaymentModal;
