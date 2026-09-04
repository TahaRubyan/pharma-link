import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LogClientPaymentModal = ({ tenant, onClose }) => {
  const { logClientPayment } = useAuth();
  const [amount, setAmount] = useState(tenant ? tenant.monthlyFee : '5000');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (HBL)');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!tenant) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;

    logClientPayment(tenant.tenantId, amount, paymentMethod);
    alert(`Payment of Rs. ${amount} logged for ${tenant.shopName}! Subscription active for next 30 days.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      {/* LARGE WIDTH & COMPACT HEIGHT POPUP CONTAINER (maxWidth: 880px, maxHeight: 80vh) */}
      <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '1.5rem 1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '18px', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="#047857" /> Log Monthly Subscription Payment
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Record monthly SaaS payment transaction & extend subscription due date by 30 days
          </p>
        </div>

        {/* TENANT SUMMARY CARD (4 Columns Grid for Horizontal Span) */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '1.15rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', gap: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Client Shop & Tenant ID:</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{tenant.shopName} (#{tenant.tenantId})</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Owner Contact:</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{tenant.ownerName} ({tenant.phone})</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Current Next Due Date:</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} /> {tenant.nextDueDate}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Subscription Status:</div>
            <span className={`badge ${tenant.subscriptionStatus === 'Active' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '0.2rem' }}>
              {tenant.subscriptionStatus}
            </span>
          </div>
        </div>

        {/* PAYMENT LOG FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '0.85rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Payment Amount (Rs.) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              >
                <option value="Bank Transfer (HBL)">Bank Transfer (HBL)</option>
                <option value="Bank Transfer (Meezan)">Bank Transfer (Meezan)</option>
                <option value="EasyPaisa Business">EasyPaisa Business</option>
                <option value="JazzCash Business">JazzCash Business</option>
                <option value="Cash Payment">Cash Payment</option>
              </select>
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Payment Reference / Notes</label>
              <input
                type="text"
                placeholder="e.g. Transaction Ref # 9481029148"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px', padding: '0.65rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', padding: '0.65rem', backgroundColor: '#047857' }}>
              Confirm Payment & Extend 30 Days
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogClientPaymentModal;
