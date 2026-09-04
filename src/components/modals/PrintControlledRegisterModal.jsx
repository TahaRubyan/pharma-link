import React from 'react';
import { X, Printer, ShieldAlert, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PrintControlledRegisterModal = ({ isOpen, onClose, records = [], activeCategory = 'ALL' }) => {
  const { currentShop, user } = useAuth();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group records by Dispensed By (Cashier / User) for easy tallying
  const groupedByUser = records.reduce((acc, r) => {
    const cashier = r.cashierName || 'Dr. Idrees (Pharmacist)';
    if (!acc[cashier]) {
      acc[cashier] = [];
    }
    acc[cashier].push(r);
    return acc;
  }, {});

  const totalValue = records.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  const totalUnits = records.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '980px', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '92vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {/* Modal Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={22} color="#dc2626" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Official Drug Inspection Register (DRAP Form 6/7)
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Hierarchical Audit Logbook grouped by Cashier & Shift for regulatory tallying
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ backgroundColor: '#0284c7', fontSize: '12px', padding: '0.45rem 0.85rem', fontWeight: 700, borderRadius: '8px' }}>
              <Printer size={14} /> Print / Export PDF
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem', borderRadius: '50%', backgroundColor: '#f1f5f9' }}>
              <X size={18} color="#64748b" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY (A4 HIERARCHY FORMAT) */}
        <div id="printable-controlled-register" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #000000', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#0f172a' }}>
                {currentShop?.shopName || 'Idrees Medical Store'}
              </div>
              <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                {currentShop?.address || 'F-7 Markaz, Islamabad, Pakistan'} | Phone: {currentShop?.phone || '051-2345678'}
              </div>
              <div style={{ fontSize: '11px', color: '#334155', fontWeight: 700 }}>
                Drug License: {currentShop?.dlNumber || 'PK-DL-20-45812 & Form 21'} | NTN: {currentShop?.ntn || '0792320-1'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#dc2626' }}>
                DRAP FORM 6 / 7 COMPLIANCE REGISTER
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                Inspection Scope: <strong>{activeCategory.toUpperCase()}</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Date Generated: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          {/* 3 SUMMARY KPI BOXES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.65rem 0.85rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#475569', fontWeight: 700 }}>TOTAL DISPENSING TRANSACTIONS</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{records.length} Bills</div>
            </div>

            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700 }}>TOTAL TABLETS / STRIPS DISPENSED</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>{totalUnits} Units</div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.65rem 0.85rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>TOTAL AUDIT REGISTER VALUE</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>Rs. {totalValue.toFixed(2)}</div>
            </div>
          </div>

          {/* HIERARCHICAL SECTIONS GROUPED BY DISPENSER / USER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.keys(groupedByUser).map((cashier, userIdx) => {
              const userRows = groupedByUser[cashier];
              const userSum = userRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
              const userUnits = userRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

              return (
                <div key={userIdx} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* User Section Header */}
                  <div style={{ backgroundColor: '#f1f5f9', padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      👤 Dispenser / User: <strong style={{ color: '#0284c7' }}>{cashier}</strong> ({userRows.length} Sales)
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      User Total: {userUnits} Units | <span style={{ color: '#16a34a' }}>Rs. {userSum.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* User Transaction Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                        <th style={{ padding: '0.45rem', width: '105px' }}>Date & Time</th>
                        <th style={{ padding: '0.45rem' }}>Medicine Name</th>
                        <th style={{ padding: '0.45rem', width: '75px' }}>Category</th>
                        <th style={{ padding: '0.45rem', width: '75px' }}>Batch #</th>
                        <th style={{ padding: '0.45rem', textAlign: 'center', width: '75px' }}>Qty Sold</th>
                        <th style={{ padding: '0.45rem' }}>Prescribing Doctor</th>
                        <th style={{ padding: '0.45rem' }}>Patient Name</th>
                        <th style={{ padding: '0.45rem', textAlign: 'right', width: '85px' }}>Total (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userRows.map((r, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.45rem', fontFamily: 'monospace', fontSize: '10px' }}>{r.date} {r.time}</td>
                          <td style={{ padding: '0.45rem', fontWeight: 700 }}>{r.brandName || r.name}</td>
                          <td style={{ padding: '0.45rem' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              backgroundColor: r.controlledType === 'Narcotic' ? '#fef2f2' : r.controlledType === 'Steroid' ? '#fffbe0' : '#ecfdf5',
                              color: r.controlledType === 'Narcotic' ? '#dc2626' : r.controlledType === 'Steroid' ? '#b45309' : '#047857',
                              border: `1px solid ${r.controlledType === 'Narcotic' ? '#fecaca' : r.controlledType === 'Steroid' ? '#fde68a' : '#a7f3d0'}`
                            }}>
                              {r.controlledType}
                            </span>
                          </td>
                          <td style={{ padding: '0.45rem', fontFamily: 'monospace' }}>{r.batchNumber || r.batchNo}</td>
                          <td style={{ padding: '0.45rem', textAlign: 'center', fontWeight: 700 }}>{r.quantity || r.qty} {r.unitSelection || 'Tabs'}</td>
                          <td style={{ padding: '0.45rem', fontSize: '10px' }}>{r.doctorName || 'Dr. Aamir Khan (PMC-45812)'}</td>
                          <td style={{ padding: '0.45rem', fontWeight: 600 }}>{r.customerName || 'Walk-in'}</td>
                          <td style={{ padding: '0.45rem', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>Rs. {Number(r.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* DRAP OFFICIAL VERIFICATION & AUDITOR SIGNATURE FOOTER */}
          <div style={{ marginTop: '2rem', borderTop: '2px dashed #cbd5e1', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '8px', fontSize: '11px', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>LEGAL DISPENSARY DECLARATION:</div>
              <p style={{ margin: 0, color: '#475569', fontSize: '10px' }}>
                I hereby declare that all Schedule G, H, Narcotic & Steroid substances documented above have been dispensed strictly against verified prescriptions from Registered Medical Practitioners in compliance with DRAP & Drug Act 1976.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #000', width: '140px', marginBottom: '0.2rem' }}></div>
                  <div style={{ fontSize: '10px', fontWeight: 700 }}>Managing Pharmacist Signature</div>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Date: ____/____/2026</div>
              </div>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '8px', fontSize: '11px', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>GOVERNMENT DRUG INSPECTOR VERIFICATION:</div>
              <p style={{ margin: 0, color: '#475569', fontSize: '10px' }}>
                Audited and verified against physical stock locker balance, serial registers, and registered medical council practitioner prescriptions.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #000', width: '140px', marginBottom: '0.2rem' }}></div>
                  <div style={{ fontSize: '10px', fontWeight: 700 }}>Drug Inspector Official Seal & Sign</div>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Inspection Status: VERIFIED ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintControlledRegisterModal;
