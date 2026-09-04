import React, { useState } from 'react';
import { X, Building, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NewClientOnboardModal = ({ isOpen, onClose }) => {
  const { onboardNewTenant } = useAuth();

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [form20, setForm20] = useState('');
  const [form21, setForm21] = useState('');
  const [gstin, setGstin] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [subscribedSystemScope, setSubscribedSystemScope] = useState('HYBRID_BOTH'); // 'RETAIL_ONLY' | 'WHOLESALE_ONLY' | 'HYBRID_BOTH'
  const [setupFeePaid, setSetupFeePaid] = useState('50000');
  const [monthlyFee, setMonthlyFee] = useState('5000');
  const [firstDueDate, setFirstDueDate] = useState('2026-09-28');
  const [adminUsername, setAdminUsername] = useState('');

  const [createdResult, setCreatedResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim() || !phone.trim()) {
      alert('Please fill out all required client details.');
      return;
    }

    const res = onboardNewTenant({
      shopName,
      ownerName,
      phone,
      form20,
      form21,
      gstin,
      city,
      subscribedSystemScope,
      setupFeePaid,
      monthlyFee,
      firstDueDate,
      adminUsername,
    });

    setCreatedResult(res);
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `MediStore Pro Client Credentials:\nShop: ${createdResult.tenant.shopName} (#${createdResult.tenant.tenantId})\nSystem Scope: ${createdResult.tenant.subscribedSystemScope}\nUsername: ${createdResult.tenant.adminUsername}\nTemp Password: ${createdResult.tempPassword}`;
    navigator.clipboard.writeText(text);
    alert('Credentials copied to clipboard!');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      {/* LARGE WIDTH & COMPACT HEIGHT CONTAINER (maxWidth: 960px, maxHeight: 82vh) */}
      <div className="card" style={{ width: '100%', maxWidth: '960px', padding: '1.5rem 1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        {!createdResult ? (
          <>
            <div style={{ marginBottom: '1.15rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
              <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} color="#111827" /> Onboard New Pharmacy Client Shop
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Configure tenant profile, SaaS system scope entitlement & subscription billing financials
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* SECTION 1: SHOP & OWNER PROFILE (4 Columns Grid Layout for Compact Height) */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                  1. Shop Profile & Contact Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', gap: '0.75rem' }}>
                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Shop Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Shifa Meds Flagship"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Owner Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Salman Khan"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Mobile # *</label>
                    <input
                      type="text"
                      placeholder="e.g. 0300-1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>City</label>
                    <input
                      type="text"
                      placeholder="e.g. Islamabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SYSTEM SCOPE ENTITLEMENT */}
              <div style={{ backgroundColor: '#f1f5f9', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label className="subtext" style={{ fontWeight: 700, color: '#111827', display: 'block', marginBottom: '0.4rem' }}>
                  2. Subscribed System Scope Entitlement *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSubscribedSystemScope('RETAIL_ONLY')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '10px',
                      border: subscribedSystemScope === 'RETAIL_ONLY' ? '2px solid #111827' : '1px solid #cbd5e1',
                      backgroundColor: subscribedSystemScope === 'RETAIL_ONLY' ? '#111827' : '#ffffff',
                      color: subscribedSystemScope === 'RETAIL_ONLY' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🛒 Retail Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubscribedSystemScope('WHOLESALE_ONLY')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '10px',
                      border: subscribedSystemScope === 'WHOLESALE_ONLY' ? '2px solid #111827' : '1px solid #cbd5e1',
                      backgroundColor: subscribedSystemScope === 'WHOLESALE_ONLY' ? '#111827' : '#ffffff',
                      color: subscribedSystemScope === 'WHOLESALE_ONLY' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    📦 Wholesale Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubscribedSystemScope('HYBRID_BOTH')}
                    style={{
                      padding: '0.55rem',
                      borderRadius: '10px',
                      border: subscribedSystemScope === 'HYBRID_BOTH' ? '2px solid #111827' : '1px solid #cbd5e1',
                      backgroundColor: subscribedSystemScope === 'HYBRID_BOTH' ? '#111827' : '#ffffff',
                      color: subscribedSystemScope === 'HYBRID_BOTH' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🔄 Hybrid (Both Systems)
                  </button>
                </div>
              </div>

              {/* SECTION 3: LICENSING & SUBSCRIPTION FINANCIALS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                  3. Licensing & Financial Setup
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Form 20 License</label>
                    <input
                      type="text"
                      placeholder="PK-DL-20-45812"
                      value={form20}
                      onChange={(e) => setForm20(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Form 21 License</label>
                    <input
                      type="text"
                      placeholder="PK-DL-21-45813"
                      value={form21}
                      onChange={(e) => setForm21(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Setup Fee (Rs.) *</label>
                    <input
                      type="number"
                      value={setupFeePaid}
                      onChange={(e) => setSetupFeePaid(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Monthly Fee (Rs.) *</label>
                    <input
                      type="number"
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>First Subscription Due Date *</label>
                  <input
                    type="date"
                    value={firstDueDate}
                    onChange={(e) => setFirstDueDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Assigned Admin Username</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@shifameds.pk"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px', padding: '0.65rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', padding: '0.65rem', backgroundColor: '#111827' }}>
                  Confirm & Onboard Tenant
                </button>
              </div>
            </form>
          </>
        ) : (
          /* SUCCESS SCREEN WITH CREDENTIALS */
          <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
            <CheckCircle size={44} color="#047857" style={{ margin: '0 auto 0.5rem' }} />
            <h3 className="section-title" style={{ fontSize: '18px', color: '#047857' }}>Tenant Shop Successfully Onboarded!</h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Tenant ID <strong>#{createdResult.tenant.tenantId}</strong> created for <strong>{createdResult.tenant.shopName}</strong>.
            </p>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', margin: '1rem 0', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Generated Client Credentials
              </div>
              <div style={{ fontSize: '12px', margin: '0.25rem 0' }}><strong>System Scope:</strong> {createdResult.tenant.subscribedSystemScope}</div>
              <div style={{ fontSize: '12px', margin: '0.25rem 0' }}><strong>Username:</strong> {createdResult.tenant.adminUsername}</div>
              <div style={{ fontSize: '12px', margin: '0.25rem 0' }}>
                <strong>Temp Password:</strong> <code style={{ backgroundColor: '#fffbe0', padding: '0.15rem 0.4rem', borderRadius: '6px', border: '1px solid #fde68a', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#b45309' }}>{createdResult.tempPassword}</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleCopyCredentials} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px', padding: '0.6rem' }}>
                <Copy size={15} /> Copy Credentials
              </button>
              <button onClick={onClose} className="btn btn-primary" style={{ flex: 1, borderRadius: '10px', padding: '0.6rem', backgroundColor: '#111827' }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewClientOnboardModal;
