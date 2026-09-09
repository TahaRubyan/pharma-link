import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, FileText, CreditCard, History, Printer, Building, MapPin } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';
import CustomerLedgerStatementModal from '../components/modals/CustomerLedgerStatementModal';
import PaymentHistoryModal from '../components/region/PaymentHistoryModal';

export const CustomerLedgerPage = () => {
  const { invoices = [], recordDebtPayment } = useSales();
  const { currentShop } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedInvoiceForLogs, setSelectedInvoiceForLogs] = useState(null);

  // Per-invoice settlement input map
  const [settlementInputs, setSettlementInputs] = useState({});

  // Group invoices into distinct customer accounts
  const customerList = useMemo(() => {
    const map = new Map();

    invoices.forEach((inv) => {
      const name = (inv.customerShopName || inv.customerName || inv.shopName || 'Walk-in Customer').trim();
      const key = name.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          shopName: name,
          phone: inv.customerPhone || 'N/A',
          region: inv.region || currentShop?.city || 'Lahore',
          ntn: inv.customerNtn || '-',
          strn: inv.customerStrn || '-',
          creditLimit: 500000,
          invoices: []
        });
      }

      map.get(key).invoices.push(inv);
    });

    return Array.from(map.values());
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customerList;
    const q = searchQuery.toLowerCase().trim();
    return customerList.filter((c) => c.shopName.toLowerCase().includes(q) || c.region.toLowerCase().includes(q));
  }, [customerList, searchQuery]);

  const handleSettleDebt = (invoiceNo) => {
    const val = settlementInputs[invoiceNo];
    if (!val || isNaN(val) || Number(val) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    recordDebtPayment(invoiceNo, Number(val));
    setSettlementInputs((prev) => ({ ...prev, [invoiceNo]: '' }));
    alert(`Payment of Rs. ${Number(val).toLocaleString('en-PK')} recorded successfully!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="page-title" style={{ fontSize: '20px' }}>Wholesale Customer Directory & Credit Ledgers</h2>
            <span className="badge badge-success">Receivables Control</span>
          </div>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Manage customer credit limits, outstanding balances, partial cash settlements & printable A4 statements
          </p>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search Customer Pharmacy Name or Region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
        </div>
      </div>

      {/* CUSTOMER DIRECTORY CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filteredCustomers.map((cust, idx) => {
          const totalInvoiced = cust.invoices.reduce((sum, i) => sum + Number(i.netTotal || i.subtotal || 0), 0);
          const totalDebt = cust.invoices.reduce((sum, i) => sum + (i.remainingDebt !== undefined ? Number(i.remainingDebt) : Number(i.netTotal || 0)), 0);

          return (
            <div key={idx} className="card card-hover" style={{ padding: '1.15rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                  <span className="badge badge-otc" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                    <MapPin size={10} style={{ marginRight: '0.2rem' }} /> {cust.region}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {cust.invoices.length} Orders
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                  {cust.shopName}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.75rem' }}>
                  Ph: {cust.phone} • NTN: {cust.ntn}
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Total Billed</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Rs. {totalInvoiced.toLocaleString('en-PK')}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Outstanding Debt</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: totalDebt > 0 ? '#b45309' : '#047857' }}>Rs. {totalDebt.toLocaleString('en-PK')}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer({ shopName: cust.shopName, regionName: cust.region });
                  setIsStatementModalOpen(true);
                }}
                className="btn btn-outline"
                style={{ width: '100%', borderRadius: '10px', fontSize: '11px', padding: '0.45rem' }}
              >
                <FileText size={13} /> View A4 Credit Statement
              </button>
            </div>
          );
        })}
      </div>

      {/* STATEMENT MODAL */}
      {isStatementModalOpen && selectedCustomer && (
        <CustomerLedgerStatementModal
          customer={selectedCustomer}
          onClose={() => {
            setIsStatementModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerLedgerPage;
