import React from 'react';
import { X, Printer, CheckCircle, FileText, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CustomerDebtStatementModal = ({ isOpen, onClose, customer, activeCycle = null }) => {
  const { currentShop } = useAuth();
  if (!isOpen || !customer) return null;

  const handlePrint = () => {
    window.print();
  };

  const shopName = currentShop?.shopName || 'Idrees Medical Store';
  const shopAddress = currentShop?.address || 'F-7 Markaz, Islamabad, Pakistan';
  const shopPhone = currentShop?.phone || '051-2345678';
  const shopDL = currentShop?.dlNumber || 'PK-DL-20-45812 & Form 21';
  const shopNTN = currentShop?.ntn || '0792320-1';

  // If viewing a settled historical cycle, render cycle items; otherwise render active unpaid transactions
  const isHistoricalCycle = Boolean(activeCycle);
  const transactions = isHistoricalCycle ? [] : (customer.activeTransactions || []);
  const cycleItems = isHistoricalCycle ? (activeCycle.settledItems || []) : [];

  const totalAmount = isHistoricalCycle
    ? Number(activeCycle.settledAmount || 0)
    : customer.currentBalance;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '92vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="#0284c7" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {isHistoricalCycle ? `Settled Debt Archive Statement (#${activeCycle.cycleId})` : `Active Customer Debt Statement (Khata Statement)`}
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Itemized breakdown of all medicine purchases on credit
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ backgroundColor: '#0284c7', fontSize: '12px', padding: '0.45rem 0.85rem', fontWeight: 700, borderRadius: '8px' }}>
              <Printer size={14} /> Print A4 Statement
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem', borderRadius: '50%', backgroundColor: '#f1f5f9' }}>
              <X size={18} color="#64748b" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div id="printable-customer-statement" style={{ backgroundColor: '#ffffff', color: '#000000', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #000000', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#0f172a' }}>
                {shopName}
              </div>
              <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                {shopAddress} | Phone: {shopPhone}
              </div>
              <div style={{ fontSize: '11px', color: '#334155', fontWeight: 700 }}>
                Drug License: {shopDL} | NTN: {shopNTN}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#0284c7' }}>
                CUSTOMER KHATA & DEBT LEDGER
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                Statement Date: {new Date().toLocaleDateString('en-GB')}
              </div>
              {isHistoricalCycle && (
                <div style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800, marginTop: '0.2rem', display: 'inline-block' }}>
                  PAID & SETTLED ✓
                </div>
              )}
            </div>
          </div>

          {/* Customer Info Card */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', fontSize: '11.5px' }}>
            <div>
              <div style={{ color: '#64748b', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>Customer Profile:</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>{customer.name}</div>
              <div>Phone: <strong>{customer.phone}</strong></div>
              <div>Address: {customer.address || 'Local Area'}</div>
              <div>CNIC: {customer.cnic || '-'}</div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ color: '#64748b', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
                {isHistoricalCycle ? 'Settled Payment Total:' : 'Current Outstanding Balance:'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: isHistoricalCycle ? '#16a34a' : '#dc2626', marginTop: '0.2rem' }}>
                Rs. {totalAmount.toFixed(2)}
              </div>
              {!isHistoricalCycle && (
                <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 600 }}>
                  Khata Status: Active Unpaid Purchases
                </div>
              )}
            </div>
          </div>

          {/* ITEM TRANSACTIONS TABLE */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
              Itemized Medicines & Purchases Breakdown
            </div>

            {!isHistoricalCycle ? (
              // Active Unpaid Transactions
              transactions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  No unpaid credit purchases. Khata balance is currently clear (Rs. 0.00).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {transactions.map((tx, tIdx) => (
                    <div key={tIdx} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: '#f1f5f9', padding: '0.45rem 0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, borderBottom: '1px solid #cbd5e1' }}>
                        <span>Bill #{tx.invoiceNo} • Date: {tx.date} {tx.time}</span>
                        <span>Bill Amount: <strong style={{ color: '#0284c7' }}>Rs. {Number(tx.netTotal).toFixed(2)}</strong></span>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                            <th style={{ padding: '0.4rem 0.6rem', width: '35px' }}>#</th>
                            <th style={{ padding: '0.4rem 0.6rem' }}>Medicine Name</th>
                            <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Unit Rate</th>
                            <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Total (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tx.items || []).map((item, iIdx) => {
                            const q = Number(item.qty || item.quantity || 1);
                            const price = Number(item.unitPrice || item.price || item.boxPrice || 10);
                            const lineTot = Number(item.total || (q * price));
                            return (
                              <tr key={iIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.4rem 0.6rem', color: '#64748b' }}>{iIdx + 1}</td>
                                <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700 }}>{item.name || item.brandName}</td>
                                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', fontWeight: 600 }}>{q} {item.unitSelection || 'Units'}</td>
                                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Rs. {price.toFixed(2)}</td>
                                <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>Rs. {lineTot.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Historical Settled Cycle Items Table
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                    <th style={{ padding: '0.45rem', width: '35px' }}>#</th>
                    <th style={{ padding: '0.45rem' }}>Medicine / Item Name</th>
                    <th style={{ padding: '0.45rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.45rem', textAlign: 'right' }}>Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleItems.map((item, iIdx) => (
                    <tr key={iIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.45rem', color: '#64748b' }}>{iIdx + 1}</td>
                      <td style={{ padding: '0.45rem', fontWeight: 700 }}>{item.name || item.brandName}</td>
                      <td style={{ padding: '0.45rem', textAlign: 'center' }}>{item.qty || 1} {item.unitSelection || 'Units'}</td>
                      <td style={{ padding: '0.45rem', textAlign: 'right', fontWeight: 700 }}>Rs. {Number(item.total || (item.qty * 10)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* TOTAL SUMMARY & SIGNATURE BLOCK */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed #cbd5e1', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ borderBottom: '1px solid #000', width: '180px', marginBottom: '0.25rem' }}></div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155' }}>Customer Signature / Verification</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>NET OUTSTANDING TOTAL:</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: isHistoricalCycle ? '#16a34a' : '#0284c7' }}>
                Rs. {totalAmount.toFixed(2)}
              </div>
              <div style={{ borderBottom: '1px solid #000', width: '180px', marginTop: '1.25rem', marginBottom: '0.25rem', marginLeft: 'auto' }}></div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155' }}>Authorized Medical Store Signature & Seal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDebtStatementModal;
