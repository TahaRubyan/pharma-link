import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Search,
  Filter,
  DollarSign,
  Store,
  Truck,
  CheckCircle,
  History,
  Printer,
  Calendar,
  AlertCircle,
  FileText,
  TrendingUp,
  RotateCcw,
  X,
  Layers,
  Plus,
  CreditCard
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';
import RegionalDeliveryManifestModal from '../components/region/RegionalDeliveryManifestModal';
import AddRegionModal from '../components/modals/AddRegionModal';
import CustomerLedgerStatementModal from '../components/modals/CustomerLedgerStatementModal';

export const RegionLedgerPage = () => {
  const { invoices = [], recordDebtPayment } = useSales();
  const { currentShop } = useAuth();

  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [customRegions, setCustomRegions] = useState(() => {
    const saved = localStorage.getItem('pharmalink_regions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ['Islamabad', 'Lahore', 'Gujrat', 'Peshawar', 'Karianwala', 'Tanda'];
  });

  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);

  // Customer Ledger Statement Modal State
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState(null);

  // Inline cash settlement input map: invoiceNo -> cash string
  const [cashInputs, setCashInputs] = useState({});

  useEffect(() => {
    localStorage.setItem('pharmalink_regions', JSON.stringify(customRegions));
  }, [customRegions]);

  const handleAddRegion = (newRegionName) => {
    if (!newRegionName) return;
    const exists = customRegions.some((r) => r.toLowerCase() === newRegionName.toLowerCase());
    if (!exists) {
      setCustomRegions((prev) => [...prev, newRegionName]);
      setSelectedRegion(newRegionName);
    } else {
      setSelectedRegion(newRegionName);
    }
  };

  const handleOpenStatement = (shopName, regionName) => {
    setSelectedCustomerForStatement({ shopName, regionName });
    setIsStatementModalOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedRegion !== 'All Regions') {
        const invRegion = (inv.region || 'Gujrat').trim().toLowerCase();
        if (invRegion !== selectedRegion.trim().toLowerCase()) return false;
      }

      if (selectedStatus !== 'ALL') {
        const originalNet = Number(inv.netTotal || inv.subtotal || 0);
        const currentDebt = inv.remainingDebt !== undefined ? Number(inv.remainingDebt) : originalNet;
        const isPaid = currentDebt === 0;

        if (selectedStatus === 'PAID' && !isPaid) return false;
        if (selectedStatus === 'NOT_PAID' && isPaid) return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        const shop = (inv.shopName || inv.customerName || '').toLowerCase();
        const invNo = (inv.invoiceNo || '').toLowerCase();
        const reg = (inv.region || '').toLowerCase();
        const driver = (inv.deliveryMan || '').toLowerCase();

        return shop.includes(q) || invNo.includes(q) || reg.includes(q) || driver.includes(q);
      }

      return true;
    });
  }, [invoices, selectedRegion, selectedStatus, searchQuery]);

  const regionKPIs = useMemo(() => {
    const uniqueShops = new Set(filteredInvoices.map((inv) => (inv.customerShopName || inv.customerName || inv.shopName || '').trim().toLowerCase()));
    let totalShops = uniqueShops.size;
    let totalSalesNet = 0;
    let totalOutstandingDebt = 0;
    let totalCashSettledToday = 0;
    let activeDueShops = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    filteredInvoices.forEach((inv) => {
      const net = Number(inv.netTotal || inv.subtotal || 0);
      const remaining = inv.remainingDebt !== undefined 
        ? Number(inv.remainingDebt) 
        : (inv.paymentStatus === 'PAID' ? 0 : net);

      totalSalesNet += net;
      totalOutstandingDebt += remaining;
      if (remaining > 0) activeDueShops++;

      const logs = inv.paymentLogs || [];
      logs.forEach((log) => {
        if (log.date === todayStr) {
          totalCashSettledToday += Number(log.amountPaid || 0);
        }
      });
    });

    return {
      totalShops,
      activeDueShops,
      totalSalesNet,
      totalOutstandingDebt,
      totalCashSettledToday,
    };
  }, [filteredInvoices]);

  const handleSettleCash = (invoice) => {
    const remaining = invoice.remainingDebt !== undefined 
      ? Number(invoice.remainingDebt) 
      : (invoice.paymentStatus === 'PAID' ? 0 : Number(invoice.netTotal || invoice.subtotal || 0));

    const val = cashInputs[invoice.invoiceNo];
    if (!val || isNaN(val) || Number(val) <= 0) {
      alert('Please enter a valid cash amount to settle.');
      return;
    }

    const amountPaid = Math.min(Number(val), remaining);
    if (typeof recordDebtPayment === 'function') {
      recordDebtPayment(invoice.invoiceNo, amountPaid);
    }
    setCashInputs((prev) => ({ ...prev, [invoice.invoiceNo]: '' }));
    alert(`✅ Cash payment of Rs. ${amountPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })} successfully settled and added to system liquidity for ${invoice.customerShopName || invoice.customerName || invoice.shopName}!`);
  };

  const handleClearFullAmount = (invoice) => {
    const remaining = invoice.remainingDebt !== undefined 
      ? Number(invoice.remainingDebt) 
      : (invoice.paymentStatus === 'PAID' ? 0 : Number(invoice.netTotal || invoice.subtotal || 0));

    if (remaining <= 0) {
      alert('This invoice is already fully cleared!');
      return;
    }

    if (typeof recordDebtPayment === 'function') {
      recordDebtPayment(invoice.invoiceNo, remaining);
    }
    setCashInputs((prev) => ({ ...prev, [invoice.invoiceNo]: '' }));
    alert(`✅ Full balance of Rs. ${remaining.toLocaleString('en-PK', { minimumFractionDigits: 2 })} successfully cleared and added to system cash for ${invoice.customerShopName || invoice.customerName || invoice.shopName}!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* TOP HEADER (PDF PAGE 5 MATCH) */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <MapPin size={22} color="#ffffff" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              Region-Based Delivery & Settlement Ledger
            </h3>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.9 }}>
              Regional Shop Deliveries, Debt Ledger & Daily Cash Settlement Tracker
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsManifestModalOpen(true)}
          className="btn btn-outline"
          style={{ backgroundColor: '#ffffff', color: '#0284c7', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
        >
          <Printer size={14} /> A4 Regional Manifest PDF
        </button>
      </div>

      {/* 4 KPI CARDS (PDF PAGE 5 MATCH) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>TOTAL REGIONAL SALES (NET)</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
            Rs. {regionKPIs.totalSalesNet.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total gross invoice balance for active selection</div>
        </div>

        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#be123c', fontWeight: 700 }}>TOTAL OUTSTANDING DEBT</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#be123c', marginTop: '0.2rem' }}>
            Rs. {regionKPIs.totalOutstandingDebt.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unpaid customer credit remaining</div>
        </div>

        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>TOTAL CASH SETTLED TODAY</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
            Rs. {regionKPIs.totalCashSettledToday.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cash received today by delivery drivers</div>
        </div>

        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700 }}>ACTIVE REGIONS & DESTINATIONS</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
            {regionKPIs.totalShops} Destinations ({regionKPIs.activeDueShops} Due)
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Delivery destinations with pending recovery</div>
        </div>
      </div>

      {/* FILTER BAR (PDF PAGE 5 MATCH) */}
      <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search shop name, region, invoice #, or delivery man..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.65rem 0.4rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={13} color="#0284c7" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
            >
              <option value="All Regions">All Regions</option>
              {customRegions.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddRegionOpen(true)}
            className="btn btn-outline"
            style={{ fontSize: '11px', padding: '0.3rem 0.6rem', borderRadius: '8px' }}
          >
            <Plus size={12} /> Region
          </button>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Fully Paid</option>
            <option value="NOT_PAID">Not Paid / Due</option>
          </select>
        </div>
      </div>

      {/* REGIONAL SHOP DELIVERIES & INLINE CASH SETTLEMENT TABLE (PDF PAGE 5 MATCH) */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
            Regional Shop Deliveries & Inline Cash Settlement Table
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Showing {filteredInvoices.length} Orders & Deliveries
          </span>
        </div>

        <div className="table-container">
          <table className="table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th>Shop Name / Customer</th>
                <th>Region</th>
                <th>Delivery Man</th>
                <th style={{ textAlign: 'center' }}>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Net Total (Rs.)</th>
                <th style={{ textAlign: 'right' }}>Current Due (Rs.)</th>
                <th>Cash Received Today (Rs.)</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    <Truck size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 700 }}>No deliveries found for the selected filter</div>
                    <div style={{ fontSize: '11px' }}>When you complete a wholesale sale or dispatch, the customer details and due balance will appear here.</div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const net = Number(inv.netTotal || inv.subtotal || 0);
                  const remaining = inv.remainingDebt !== undefined 
                    ? Number(inv.remainingDebt) 
                    : (inv.paymentStatus === 'PAID' ? 0 : net);
                  const isPaid = remaining === 0;

                  return (
                    <tr key={inv.invoiceNo || idx}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{inv.customerShopName || inv.customerName || inv.shopName || 'Walk-in Customer'}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          Inv #{inv.invoiceNo} • {inv.date} {inv.customerPhone ? `• Ph: ${inv.customerPhone}` : ''}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-otc">
                          📍 {inv.region || currentShop?.city || 'Lahore'}
                        </span>
                      </td>
                      <td style={{ color: '#475569' }}>{inv.deliveryMan || 'Express Delivery / Rider'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isPaid ? 'badge-success' : remaining < net ? 'badge-warning' : 'badge-danger'}`}
                          style={remaining > 0 && remaining < net ? { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' } : {}}
                        >
                          {isPaid ? 'FULLY PAID' : remaining < net ? 'PARTIALLY PAID' : 'DUE / NOT PAID'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {net.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                        Rs. {remaining.toFixed(2)}
                      </td>
                      <td>
                        {!isPaid ? (
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={cashInputs[inv.invoiceNo] !== undefined ? cashInputs[inv.invoiceNo] : remaining}
                              onChange={(e) => setCashInputs({ ...cashInputs, [inv.invoiceNo]: e.target.value })}
                              style={{ width: '75px', padding: '0.25rem 0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700 }}
                            />
                            <button
                              onClick={() => handleSettleCash(inv)}
                              className="btn btn-primary"
                              style={{ fontSize: '10px', padding: '0.25rem 0.5rem', backgroundColor: '#16a34a', whiteSpace: 'nowrap' }}
                              title="Settle specified cash amount"
                            >
                              Settle Cash
                            </button>
                            <button
                              onClick={() => handleClearFullAmount(inv)}
                              className="btn btn-outline"
                              style={{ fontSize: '10px', padding: '0.25rem 0.4rem', borderColor: '#16a34a', color: '#16a34a', whiteSpace: 'nowrap' }}
                              title="Clear full remaining due balance in 1 click"
                            >
                              Clear All
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={13} color="#16a34a" /> Settled / Added
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          {isPaid ? (
                            <span className="badge badge-success">✔ Settled</span>
                          ) : null}
                          <button
                            onClick={() => handleOpenStatement(inv.customerShopName || inv.customerName || inv.shopName, inv.region || currentShop?.city || 'Lahore')}
                            className="btn btn-outline"
                            style={{ fontSize: '10px', padding: '0.2rem 0.5rem' }}
                          >
                            Statement
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {isAddRegionOpen && (
        <AddRegionModal
          isOpen={isAddRegionOpen}
          onClose={() => setIsAddRegionOpen(false)}
          onAddRegion={handleAddRegion}
        />
      )}

      {isManifestModalOpen && (
        <RegionalDeliveryManifestModal
          invoices={filteredInvoices}
          selectedRegion={selectedRegion}
          onClose={() => setIsManifestModalOpen(false)}
        />
      )}

      {isStatementModalOpen && selectedCustomerForStatement && (
        <CustomerLedgerStatementModal
          customer={selectedCustomerForStatement}
          onClose={() => {
            setIsStatementModalOpen(false);
            setSelectedCustomerForStatement(null);
          }}
        />
      )}
    </div>
  );
};

export default RegionLedgerPage;
