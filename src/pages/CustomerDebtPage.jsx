import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  FileText, 
  Printer, 
  CheckCircle, 
  DollarSign, 
  Phone, 
  MapPin, 
  CreditCard, 
  History, 
  ShieldAlert, 
  ArrowUpRight, 
  X, 
  Send,
  Trash2
} from 'lucide-react';
import { useCustomerDebt } from '../context/CustomerDebtContext';
import { useAuth } from '../context/AuthContext';
import CustomerDebtStatementModal from '../components/modals/CustomerDebtStatementModal';

export const CustomerDebtPage = () => {
  const { debtCustomers = [], addDebtCustomer, settleCustomerDebt, generateWhatsAppCreditSlip, deleteDebtCustomer } = useCustomerDebt();
  const { currentShop } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE_DEBT'); // 'ACTIVE_DEBT' | 'SETTLED_CYCLES'
  
  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedCycleForView, setSelectedCycleForView] = useState(null);

  // Settlement Form State
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementMode, setSettlementMode] = useState('Cash');
  const [settlementNotes, setSettlementNotes] = useState('');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCnic, setNewCustCnic] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('');

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return debtCustomers;
    const q = searchQuery.toLowerCase().trim();
    return debtCustomers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.cnic && c.cnic.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [debtCustomers, searchQuery]);

  // Total Metrics
  const totalOutstanding = debtCustomers.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
  const activeDebtorsCount = debtCustomers.filter((c) => c.currentBalance > 0).length;
  const totalSettledHistory = debtCustomers.reduce(
    (sum, c) => sum + (c.settledCyclesHistory || []).reduce((cSum, cy) => cSum + Number(cy.settledAmount || 0), 0),
    0
  );

  // Handle Select Customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSettlementAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
    setActiveTab('ACTIVE_DEBT');
  };

  // Handle Submit Settlement ("amount get in hand")
  const handleProcessSettlement = (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amt = Number(settlementAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid received payment amount.');
      return;
    }
    if (amt > selectedCustomer.currentBalance) {
      if (!window.confirm(`Received amount (Rs. ${amt}) is higher than outstanding debt (Rs. ${selectedCustomer.currentBalance}). Proceed with advance credit?`)) {
        return;
      }
    }

    const res = settleCustomerDebt(selectedCustomer.id, amt, settlementMode, settlementNotes);
    if (res) {
      alert(`Payment of Rs. ${amt.toFixed(2)} received successfully from ${selectedCustomer.name}! Debt cycle #${res.cycleId} has been archived.`);
      // Update local selection
      const updated = debtCustomers.find((c) => c.id === selectedCustomer.id);
      setSelectedCustomer(updated || null);
      setSettlementAmount('');
      setSettlementNotes('');
    }
  };

  // Handle Add New Customer
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Customer Name and Phone Number are required.');
      return;
    }
    const created = addDebtCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress,
      cnic: newCustCnic,
      creditLimit: newCustLimit,
    });
    alert(`Customer ${created.name} registered for Khata / Credit!`);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustCnic('');
    setIsAddCustomerOpen(false);
    setSelectedCustomer(created);
  };

  // Handle Delete Customer Debt (Enforce settlement rule)
  const handleDeleteCustomer = (cust) => {
    if (!cust) return;
    if (cust.currentBalance > 0) {
      alert(`⚠️ Cannot Delete Khata Account!\n\nCustomer "${cust.name}" has an active outstanding debt balance of Rs. ${cust.currentBalance.toFixed(2)}.\n\nThe customer debt account can only be deleted once cash is fully settled.`);
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete settled khata account for "${cust.name}"? All past invoices and settled cycles for this customer will be removed.`)) {
      const res = deleteDebtCustomer(cust.id);
      if (res.success) {
        alert(res.message);
        if (selectedCustomer?.id === cust.id) {
          setSelectedCustomer(null);
        }
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* HEADER BANNER */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CreditCard size={22} color="#ffffff" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              Customer Debt & Udhar (Khata Ledger) Management
            </h3>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.9 }}>
              Track customer credit purchases, dispatch WhatsApp receipts, settle monthly balances & archive past debt cycles
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="btn btn-outline"
          style={{ backgroundColor: '#ffffff', color: '#0284c7', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Plus size={14} /> + Register New Debt Customer
        </button>
      </div>

      {/* 3 KPI SUMMARY CARDS */}
      <div className="grid-3" style={{ gap: '0.85rem' }}>
        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div className="flex-between">
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Total Outstanding Debt</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', marginTop: '0.35rem' }}>
            Rs. {totalOutstanding.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
            Across {activeDebtorsCount} Active Credit Accounts
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div className="flex-between">
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Total Debt Recovered</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginTop: '0.35rem' }}>
            Rs. {totalSettledHistory.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
            Archived in Settled Cycles History
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div className="flex-between">
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Registered Customers</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: '0.35rem' }}>
            {debtCustomers.length} Customers
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
            Store: {currentShop?.shopName || 'Idrees Medical Store'}
          </div>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: CUSTOMER LIST (LEFT) & DETAIL LEDGER DRAWER (RIGHT) */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 1.25fr' : '1fr', gap: '1.25rem' }}>
        {/* LEFT COLUMN: CUSTOMERS TABLE */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              Customer Khata Directory ({filteredCustomers.length})
            </div>
            <span style={{ fontSize: '11px', color: '#0284c7', fontStyle: 'italic' }}>
              Click any customer row to view details, settle debt, or print statement
            </span>
          </div>

          <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
            <input
              type="text"
              placeholder="Search Customer Name, Phone, CNIC, or Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '11.5px' }}>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone / Contact</th>
                  <th>Khata Activity</th>
                  <th style={{ textAlign: 'right' }}>Khata Balance</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ width: '35px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      No customers match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    const hasDebt = cust.currentBalance > 0;
                    const totalTxs = (cust.activeTransactions || []).length + (cust.settledCyclesHistory || []).length;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        style={{
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 400,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{cust.name}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{cust.address || 'Local'}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{cust.phone}</td>
                        <td style={{ color: '#0284c7', fontWeight: 600 }}>{totalTxs} Purchases</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: hasDebt ? '#dc2626' : '#16a34a' }}>
                          Rs. {cust.currentBalance.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${hasDebt ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                            {hasDebt ? 'Due Debt' : 'Clear ✓'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust)}
                            title={hasDebt ? "Debt Unsettled (Settle cash to delete)" : "Delete Settled Khata Account"}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: hasDebt ? '#cbd5e1' : '#ef4444',
                              padding: '0.25rem',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CUSTOMER LEDGER & SETTLEMENT BOX */}
        {selectedCustomer && (
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '2px solid #0284c7', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Customer Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>Selected Khata Account</div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0.15rem 0 0' }}>
                  {selectedCustomer.name}
                </h3>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.15rem' }}>
                  Phone: <strong>{selectedCustomer.phone}</strong> • Address: {selectedCustomer.address}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>CURRENT OUTSTANDING:</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: selectedCustomer.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                  Rs. {selectedCustomer.currentBalance.toFixed(2)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(selectedCustomer)}
                    style={{
                      border: '1px solid',
                      borderColor: selectedCustomer.currentBalance > 0 ? '#e2e8f0' : '#fecaca',
                      backgroundColor: selectedCustomer.currentBalance > 0 ? '#f8fafc' : '#fef2f2',
                      color: selectedCustomer.currentBalance > 0 ? '#94a3b8' : '#ef4444',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                    title={selectedCustomer.currentBalance > 0 ? "Debt must be fully settled before deletion" : "Delete settled khata account"}
                  >
                    <Trash2 size={12} /> {selectedCustomer.currentBalance > 0 ? 'Debt Unsettled' : 'Delete Khata'}
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '11px' }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR: ACTIVE UNPAID BILLS vs SETTLED CYCLES HISTORY */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>
              <button
                onClick={() => setActiveTab('ACTIVE_DEBT')}
                className={`btn ${activeTab === 'ACTIVE_DEBT' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '11px', padding: '0.35rem 0.75rem', borderRadius: '8px' }}
              >
                <FileText size={13} /> Active Purchases List ({(selectedCustomer.activeTransactions || []).length})
              </button>

              <button
                onClick={() => setActiveTab('SETTLED_CYCLES')}
                className={`btn ${activeTab === 'SETTLED_CYCLES' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '11px', padding: '0.35rem 0.75rem', borderRadius: '8px' }}
              >
                <History size={13} /> Past Settled Cycles ({(selectedCustomer.settledCyclesHistory || []).length})
              </button>

              <button
                onClick={() => { setSelectedCycleForView(null); setIsStatementModalOpen(true); }}
                className="btn btn-outline"
                style={{ fontSize: '11px', padding: '0.35rem 0.75rem', borderRadius: '8px', marginLeft: 'auto', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 700 }}
              >
                <Printer size={13} /> Print Statement PDF
              </button>
            </div>

            {/* TAB 1: ACTIVE UNPAID PURCHASES & SETTLEMENT FORM */}
            {activeTab === 'ACTIVE_DEBT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Active Transactions List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '0.5rem' }}>
                  {(selectedCustomer.activeTransactions || []).length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>
                      🎉 Khata is completely clear! No unpaid purchases.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {selectedCustomer.activeTransactions.map((tx, idx) => (
                        <div key={idx} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                          <div className="flex-between" style={{ marginBottom: '0.35rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '11.5px', color: '#0f172a' }}>
                              Bill #{tx.invoiceNo} • {tx.date} {tx.time}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '12px', color: '#0284c7' }}>
                              Rs. {Number(tx.netTotal).toFixed(2)}
                            </span>
                          </div>

                          <div style={{ fontSize: '10.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {(tx.items || []).map((i, iIdx) => (
                              <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>• {i.name || i.brandName} ({i.qty} {i.unitSelection || 'Tab'})</span>
                                <span>Rs. {Number(i.total || (i.qty * 10)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SETTLEMENT ACTION FORM ("Amount get in hand") */}
                {selectedCustomer.currentBalance > 0 && (
                  <form onSubmit={handleProcessSettlement} style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#065f46', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle size={16} color="#047857" /> Settle Customer Debt (Cash in Hand Settlement)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                      <div>
                        <label className="subtext" style={{ fontSize: '10.5px', fontWeight: 700, color: '#065f46', display: 'block', marginBottom: '0.15rem' }}>
                          Payment Amount Received (Rs.) *:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 5000"
                          value={settlementAmount}
                          onChange={(e) => setSettlementAmount(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '13px', fontWeight: 800, outline: 'none' }}
                          required
                        />
                      </div>

                      <div>
                        <label className="subtext" style={{ fontSize: '10.5px', fontWeight: 700, color: '#065f46', display: 'block', marginBottom: '0.15rem' }}>
                          Payment Mode:
                        </label>
                        <select
                          value={settlementMode}
                          onChange={(e) => setSettlementMode(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '12px', outline: 'none' }}
                        >
                          <option value="Cash">Cash in Hand</option>
                          <option value="Bank Transfer">Bank Transfer / Raast</option>
                          <option value="JazzCash">JazzCash / EasyPaisa</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.65rem' }}>
                      <input
                        type="text"
                        placeholder="Settlement notes (e.g. Monthly July clearance / partial token)..."
                        value={settlementNotes}
                        onChange={(e) => setSettlementNotes(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '11px', outline: 'none' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', backgroundColor: '#059669', borderRadius: '10px', fontSize: '12px', fontWeight: 800, padding: '0.6rem' }}
                    >
                      <CheckCircle size={15} /> Confirm Payment & Clear Debt Cycle
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: PAST SETTLED CYCLES ARCHIVE */}
            {activeTab === 'SETTLED_CYCLES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {(selectedCustomer.settledCyclesHistory || []).length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    No past settled cycles recorded for this customer yet.
                  </div>
                ) : (
                  selectedCustomer.settledCyclesHistory.map((cycle, idx) => (
                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '12px', color: '#0f172a' }}>
                          Cycle #{cycle.cycleId} • Date: {cycle.settledDate}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.15rem' }}>
                          Settled via {cycle.paymentMode} • {cycle.invoicesCount} Invoices Cleared
                        </div>
                        {cycle.notes && <div style={{ fontSize: '10.5px', color: '#059669', fontStyle: 'italic', marginTop: '0.1rem' }}>"{cycle.notes}"</div>}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a' }}>
                          Rs. {Number(cycle.settledAmount).toFixed(2)}
                        </div>
                        <button
                          onClick={() => { setSelectedCycleForView(cycle); setIsStatementModalOpen(true); }}
                          className="btn btn-outline"
                          style={{ fontSize: '10px', padding: '0.2rem 0.45rem', borderRadius: '6px', marginTop: '0.25rem' }}
                        >
                          <Printer size={11} /> View / Print PDF
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW CUSTOMER MODAL */}
      {isAddCustomerOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '16px', position: 'relative' }}>
            <button onClick={() => setIsAddCustomerOpen(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} color="#64748b" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users size={20} color="#0284c7" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Register New Debt (Khata) Customer</h3>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Customer Full Name *:</label>
                <input type="text" placeholder="e.g. Chaudhry Tariq Mahmood" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Phone / WhatsApp *:</label>
                  <input type="text" placeholder="e.g. 0300-1234567" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} required />
                </div>
                <div>
                  <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>CNIC (Optional):</label>
                  <input type="text" placeholder="e.g. 37405-1234567-1" value={newCustCnic} onChange={(e) => setNewCustCnic(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                </div>
              </div>

              <div>
                <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Address / Location:</label>
                <input type="text" placeholder="e.g. House 14, Street 2, F-7/2, Islamabad" value={newCustAddress} onChange={(e) => setNewCustAddress(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0284c7', borderRadius: '10px', fontSize: '12px', fontWeight: 800, padding: '0.65rem', marginTop: '0.5rem' }}>
                <CheckCircle size={15} /> Save & Register Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* A4 CUSTOMER DEBT STATEMENT PRINT MODAL */}
      {isStatementModalOpen && selectedCustomer && (
        <CustomerDebtStatementModal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          customer={selectedCustomer}
          activeCycle={selectedCycleForView}
        />
      )}
    </div>
  );
};

export default CustomerDebtPage;
