import React from 'react';
import { X, Building, Calendar, DollarSign, ShieldCheck, CreditCard, User, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ShopDetailsModal = ({ tenant, onClose }) => {
  const { clientPaymentLogs } = useAuth();

  if (!tenant) return null;

  // Filter payments specific to this tenant
  const tenantPaymentHistory = clientPaymentLogs.filter((log) => log.tenantId === tenant.tenantId);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      {/* LARGE WIDTH & COMPACT HEIGHT CONTAINER (maxWidth: 920px, maxHeight: 82vh) */}
      <div className="card" style={{ width: '100%', maxWidth: '920px', padding: '1.5rem 1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.15rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#111827', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={22} />
          </div>
          <div>
            <h3 className="section-title" style={{ fontSize: '18px', margin: 0 }}>
              {tenant.shopName} <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>(#{tenant.tenantId})</span>
            </h3>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '0.15rem' }}>
              Owner: <strong>{tenant.ownerName}</strong> • {tenant.city || 'Islamabad'}, Pakistan
            </div>
          </div>
        </div>

        {/* SECTION 1: OVERALL SHOP PROFILE & LICENSING (2 Columns Grid Layout) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.15rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Legal Licensing & Contact Profile
            </div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0' }}><strong>Mobile Contact:</strong> {tenant.phone}</div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0' }}><strong>Drug License (Form 20):</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{tenant.form20}</span></div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0' }}><strong>Drug License (Form 21):</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{tenant.form21}</span></div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0' }}><strong>STRN Tax #:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{tenant.gstin}</span></div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Subscribed System Scope & Access
            </div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <strong>System Scope:</strong>
              <span className={`badge ${tenant.subscribedSystemScope === 'RETAIL_ONLY' ? 'badge-otc' : tenant.subscribedSystemScope === 'WHOLESALE_ONLY' ? 'badge-narcotic' : 'badge-success'}`}>
                {tenant.subscribedSystemScope === 'RETAIL_ONLY' ? '🛒 Retail Only' : tenant.subscribedSystemScope === 'WHOLESALE_ONLY' ? '📦 Wholesale Only' : '🔄 Hybrid (Both)'}
              </span>
            </div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0' }}><strong>Admin Username:</strong> {tenant.adminUsername}</div>
            <div style={{ fontSize: '12px', margin: '0.3rem 0' }}><strong>Onboarded Date:</strong> {tenant.createdDate || '2026-08-01'}</div>
          </div>
        </div>

        {/* SECTION 2: SUBSCRIPTION FINANCIALS */}
        <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '0.85rem 1rem', marginBottom: '1.15rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>One-Time Setup Fee</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginTop: '0.15rem' }}>Rs. {Number(tenant.setupFeePaid).toLocaleString('en-PK')}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Monthly Subscription</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginTop: '0.15rem' }}>Rs. {Number(tenant.monthlyFee).toLocaleString('en-PK')} / mo</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Subscription Status</div>
            <div style={{ marginTop: '0.15rem' }}>
              <span className={`badge ${tenant.subscriptionStatus === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                {tenant.subscriptionStatus}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Next Due Date</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginTop: '0.15rem' }}>{tenant.nextDueDate}</div>
          </div>
        </div>

        {/* SECTION 3: TENANT PAYMENT HISTORY LEDGER */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CreditCard size={15} color="#047857" /> Payment History Ledger ({tenantPaymentHistory.length} Logs)
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment Ref #</th>
                  <th>Amount Paid</th>
                  <th>Payment Method</th>
                  <th>Logged Date & Time</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {tenantPaymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1.25rem', color: '#9ca3af' }}>
                      No payment history logged yet for this client.
                    </td>
                  </tr>
                ) : (
                  tenantPaymentHistory.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{log.id}</td>
                      <td style={{ fontWeight: 700, color: '#047857' }}>Rs. {Number(log.amount).toLocaleString('en-PK')}</td>
                      <td style={{ fontSize: '12px' }}>{log.paymentMethod}</td>
                      <td style={{ fontSize: '11px', color: '#64748B' }}>{log.loggedDate}</td>
                      <td style={{ fontSize: '11px' }}>{log.loggedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailsModal;
