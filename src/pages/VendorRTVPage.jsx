import React, { useState } from 'react';
import { RotateCcw, CreditCard, CheckCircle, ShieldAlert, X, DollarSign } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useSupplier } from '../context/SupplierContext';
import { useAuth } from '../context/AuthContext';

export const VendorRTVPage = () => {
  const { user } = useAuth();
  const { vendorReturns, batches, medicines, markItemAsRTV, recordVendorReimbursement } = useInventory();
  const { suppliers } = useSupplier();

  const [activeTab, setActiveTab] = useState('RTV_QUEUE'); // 'RTV_QUEUE' | 'SUPPLIER_DEBT'
  const [selectedRtvForPayment, setSelectedRtvForPayment] = useState(null);
  const [reimbursementAmount, setReimbursementAmount] = useState('');

  // Form state for creating manual RTV return
  const [isManualRtvOpen, setIsManualRtvOpen] = useState(false);
  const [rtvBatchId, setRtvBatchId] = useState('');
  const [rtvTabletsCount, setRtvTabletsCount] = useState('');
  const [rtvReason, setRtvReason] = useState('Expiry <= 6 Months');

  const handleOpenReimbursement = (rtv) => {
    setSelectedRtvForPayment(rtv);
    setReimbursementAmount(rtv.claimAmount);
  };

  const handleSaveReimbursement = (e) => {
    e.preventDefault();
    if (!selectedRtvForPayment || !reimbursementAmount) return;

    recordVendorReimbursement(selectedRtvForPayment.id, reimbursementAmount, user.name || 'Testing Shop Admin');
    alert(`Reimbursement payment of Rs. ${reimbursementAmount} recorded successfully by ${user.name}!`);
    setSelectedRtvForPayment(null);
    setReimbursementAmount('');
  };

  const handleConfirmManualRtv = (e) => {
    e.preventDefault();
    if (!rtvBatchId || !rtvTabletsCount) return;

    markItemAsRTV(rtvBatchId, rtvTabletsCount, rtvReason, user.name || 'Testing Shop Admin');
    alert(`Item returned to vendor successfully! Stock deducted and posted to RTV Receivable log.`);
    setIsManualRtvOpen(false);
    setRtvBatchId('');
    setRtvTabletsCount('');
  };

  const totalRtvClaimAmount = vendorReturns.reduce((sum, r) => sum + r.claimAmount, 0);
  const totalSettledAmount = vendorReturns
    .filter((r) => r.status === 'Reimbursed & Settled')
    .reduce((sum, r) => sum + r.claimAmount, 0);
  const totalPendingRtvAmount = totalRtvClaimAmount - totalSettledAmount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <RotateCcw size={28} color="#FFFFFF" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Vendor Return (RTV) & Supplier Debt Accounting Ledger</h2>
              <p style={{ fontSize: '0.8rem', color: '#E0F2FE', marginTop: '0.15rem' }}>
                Quarantined Stock Returns (&le; 6 Months Expiry), Vendor Claims, Logged Payments & Supplier Credit Liabilities.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('RTV_QUEUE')}
              className={`btn ${activeTab === 'RTV_QUEUE' ? 'btn-primary' : 'btn-outline'}`}
              style={{ backgroundColor: activeTab === 'RTV_QUEUE' ? '#0369A1' : 'rgba(255,255,255,0.2)', color: '#FFF', border: 'none', fontSize: '0.85rem' }}
            >
              <RotateCcw size={16} /> Vendor Return (RTV) Ledger
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIER_DEBT')}
              className={`btn ${activeTab === 'SUPPLIER_DEBT' ? 'btn-primary' : 'btn-outline'}`}
              style={{ backgroundColor: activeTab === 'SUPPLIER_DEBT' ? '#0369A1' : 'rgba(255,255,255,0.2)', color: '#FFF', border: 'none', fontSize: '0.85rem' }}
            >
              <DollarSign size={16} /> Supplier Debt & Liabilities
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-3">
        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>TOTAL RTV RECEIVABLE CLAIMS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284C7', marginTop: '0.2rem' }}>
            Rs. {totalRtvClaimAmount.toLocaleString('en-PK')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
            {vendorReturns.length} Return Entries Logged
          </div>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>PENDING VENDOR REIMBURSEMENTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', marginTop: '0.2rem' }}>
            Rs. {totalPendingRtvAmount.toLocaleString('en-PK')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.2rem' }}>
            Awaiting vendor payout or credit note
          </div>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>SETTLED & REIMBURSED PAYOUTS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
            Rs. {totalSettledAmount.toLocaleString('en-PK')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
            Fully claimed & logged into financial ledger
          </div>
        </div>
      </div>

      {/* TAB 1: VENDOR RETURN (RTV) QUEUE & LOGS */}
      {activeTab === 'RTV_QUEUE' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Vendor Return (RTV) Logbook</h3>
              <p style={{ fontSize: '0.775rem', color: '#64748B' }}>
                Stock deducted from active inventory due to &le; 6 months expiry rule or vendor return claims.
              </p>
            </div>

            <button
              onClick={() => setIsManualRtvOpen(true)}
              className="btn btn-primary"
              style={{ backgroundColor: '#DC2626', color: '#FFF', fontWeight: 800, fontSize: '0.85rem' }}
            >
              + Return Item to Vendor (RTV)
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>RTV Log Reference #</th>
                  <th>Medicine Brand & Batch</th>
                  <th>Supplier / Vendor</th>
                  <th>Expiry Date</th>
                  <th>Tablets Returned</th>
                  <th>Claim Value (Rs.)</th>
                  <th>Return Date & Logged By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vendorReturns.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                      No vendor returns recorded yet.
                    </td>
                  </tr>
                ) : (
                  vendorReturns.map((rtv) => (
                    <tr key={rtv.id}>
                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0284C7' }}>{rtv.id}</td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{rtv.brandName}</div>
                        <div style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>Batch: {rtv.batchNumber}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{rtv.supplierName}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '4px', fontWeight: 700 }}>
                          Exp: {rtv.expiryDate}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800 }}>{rtv.tabletsReturned} Tabs</td>
                      <td style={{ fontWeight: 800, color: '#0284C7' }}>Rs. {Number(rtv.claimAmount).toLocaleString('en-PK')}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>{rtv.returnDate}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>By: {rtv.loggedBy || 'Testing Shop Admin'}</div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: rtv.status === 'Reimbursed & Settled' ? '#D1FAE5' : '#FEF3C7',
                            color: rtv.status === 'Reimbursed & Settled' ? '#065F46' : '#92400E',
                            fontWeight: 800,
                          }}
                        >
                          {rtv.status}
                        </span>
                      </td>
                      <td>
                        {rtv.status !== 'Reimbursed & Settled' ? (
                          <button
                            onClick={() => handleOpenReimbursement(rtv)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.725rem', padding: '0.25rem 0.5rem', backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#10B981', fontWeight: 800 }}
                          >
                            <CreditCard size={12} /> Log Vendor Payment
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle size={14} /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER DEBT & CREDIT LIABILITIES ACCOUNTING */}
      {activeTab === 'SUPPLIER_DEBT' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Supplier Credit & Debt Accounting Ledger</h3>
          <p style={{ fontSize: '0.775rem', color: '#64748B', marginBottom: '1rem' }}>
            Tracks original debt when stock arrived, inward payments made, current remaining debt, and future upcoming stock liabilities.
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Distributor Name & ID</th>
                  <th>Contact Person & Phone</th>
                  <th>Total Inward Stock Paid to Date</th>
                  <th>Current Outstanding Debt</th>
                  <th>Upcoming Stock Liabilities</th>
                  <th>Total Payable Balance</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => {
                  const currentDebt = sup.pendingBalance !== undefined ? sup.pendingBalance : (sup.outstandingBalance || 0);
                  const upcomingLiabilities = sup.upcomingInvoicesTotal || 0;
                  const totalPayable = currentDebt + upcomingLiabilities;

                  return (
                    <tr key={sup.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{sup.companyName || sup.name}</div>
                        <div style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>{sup.id}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sup.contactPerson}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{sup.phone}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#059669' }}>
                        Rs. {Number(sup.totalPaidToDate || 150000).toLocaleString('en-PK')}
                      </td>
                      <td style={{ fontWeight: 800, color: currentDebt > 0 ? '#DC2626' : '#059669' }}>
                        Rs. {Number(currentDebt).toLocaleString('en-PK')}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0369A1' }}>
                        Rs. {Number(upcomingLiabilities).toLocaleString('en-PK')}
                      </td>
                      <td style={{ fontWeight: 900, color: '#1F2937' }}>
                        Rs. {Number(totalPayable).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD VENDOR REIMBURSEMENT PAYMENT MODAL */}
      {selectedRtvForPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '450px', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => setSelectedRtvForPayment(null)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0284C7' }}>
              Log Vendor Reimbursement Payment
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
              Record payment claimed from vendor <strong>{selectedRtvForPayment.supplierName}</strong> for Batch <strong>{selectedRtvForPayment.batchNumber}</strong>.
            </p>

            <form onSubmit={handleSaveReimbursement} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Claim Value Amount: <strong>Rs. {selectedRtvForPayment.claimAmount}</strong></label>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Reimbursement Amount Paid (Rs.):</label>
                <input
                  type="number"
                  value={reimbursementAmount}
                  onChange={(e) => setReimbursementAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', fontWeight: 800, borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Logged By (Staff Name):</label>
                <input
                  type="text"
                  value={user.name || 'Testing Shop Admin'}
                  readOnly
                  style={{ width: '100%', padding: '0.5rem', fontWeight: 700, backgroundColor: '#F1F5F9', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedRtvForPayment(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#0284C7', color: '#FFF', fontWeight: 800 }}>
                  [Confirm & Record Payment Log]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL RETURN TO VENDOR (RTV) MODAL */}
      {isManualRtvOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => setIsManualRtvOpen(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#DC2626' }}>
              Mark Item as Return to Vendor (RTV)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
              Item stock will be deducted from active inventory and posted to Vendor Claim Receivable ledger.
            </p>

            <form onSubmit={handleConfirmManualRtv} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Select Medicine Batch:</label>
                <select
                  value={rtvBatchId}
                  onChange={(e) => setRtvBatchId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  required
                >
                  <option value="">-- Choose Batch to Return --</option>
                  {batches.map((b) => {
                    const med = medicines.find((m) => m.id === b.medicineId);
                    return (
                      <option key={b.id} value={b.id}>
                        {med ? med.brandName : 'Med'} — Batch {b.batchNumber} (Exp: {b.expiryDate} | Stock: {b.totalTabletsAvailable} Tabs)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Tablets Count to Return:</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={rtvTabletsCount}
                  onChange={(e) => setRtvTabletsCount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Reason for Return:</label>
                <select
                  value={rtvReason}
                  onChange={(e) => setRtvReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                >
                  <option value="Expiry <= 6 Months">Expiry &le; 6 Months (Regulatory Rule)</option>
                  <option value="Damaged / Leaking Shipment">Damaged / Leaking Shipment</option>
                  <option value="Supplier Recall">Supplier / Manufacturer Recall</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsManualRtvOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: '#DC2626', color: '#FFF', fontWeight: 800 }}>
                  [Confirm Vendor Return]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRTVPage;
