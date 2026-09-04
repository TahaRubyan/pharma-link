import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileText, 
  Printer, 
  ShieldCheck, 
  Search, 
  CheckCircle,
  Eye,
  Activity,
  Package,
  Layers,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';
import FBRLawyerReportModal from '../components/modals/FBRLawyerReportModal';
import AnalyticsReportModal from '../components/modals/AnalyticsReportModal';
import A4InvoicePrintModal from '../components/modals/A4InvoicePrintModal';

export const AnalyticsPage = () => {
  const { invoices = [] } = useSales();
  const { medicines = [], poTaxLogs = [] } = useInventory();
  const { currentShop } = useAuth();
  const isRetail = currentShop?.mode === 'RETAIL';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('SALES_LOGS'); // 'SALES_LOGS' | 'MEDICINE_MOVEMENT' | 'TAX_RECONCILIATION'
  const [selectedPeriod, setSelectedPeriod] = useState('30_DAYS'); // 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM'
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [movementSearch, setMovementSearch] = useState('');

  // Modals state
  const [isFBRLawyerModalOpen, setIsFBRLawyerModalOpen] = useState(false);
  const [isAnalyticsReportOpen, setIsAnalyticsReportOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);

  // 1. FILTERED SALES TRANSACTIONS
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedPeriod === 'TODAY') {
        if (inv.date !== todayStr) return false;
      } else if (selectedPeriod === '7_DAYS') {
        if (inv.date < sevenDaysAgoStr) return false;
      } else if (selectedPeriod === '30_DAYS') {
        if (inv.date < thirtyDaysAgoStr) return false;
      } else if (selectedPeriod === 'CUSTOM') {
        if (startDate && inv.date < startDate) return false;
        if (endDate && inv.date > endDate) return false;
      }

      if (searchLogQuery.trim().length > 0) {
        const q = searchLogQuery.toLowerCase().trim();
        return (
          (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
          (inv.shopName && inv.shopName.toLowerCase().includes(q)) ||
          (inv.paymentMode && inv.paymentMode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [invoices, selectedPeriod, startDate, endDate, searchLogQuery, todayStr]);

  // Turnover Metrics
  const grossTurnover = filteredInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || inv.grossTotal || inv.netTotal || 0), 0);
  const totalDiscounts = filteredInvoices.reduce((sum, inv) => sum + Number(inv.discount || 0), 0);
  const netTurnover = filteredInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0);
  const estProfit = netTurnover * 0.22;

  // Accordion State for Daily Logs
  const [expandedDates, setExpandedDates] = useState({ [todayStr]: true });

  const toggleDateAccordion = (dateKey) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // Group Invoices by Date for Daily Collapsible Cards
  const dateGroupedInvoices = useMemo(() => {
    const groups = {};
    filteredInvoices.forEach((inv) => {
      const d = inv.date || todayStr;
      if (!groups[d]) groups[d] = [];
      groups[d].push(inv);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    return sortedKeys.map((dateKey) => ({
      date: dateKey,
      isToday: dateKey === todayStr,
      invoices: groups[dateKey],
      dayGross: groups[dateKey].reduce((sum, i) => sum + Number(i.subtotal || i.grossTotal || i.netTotal || 0), 0),
      dayNet: groups[dateKey].reduce((sum, i) => sum + Number(i.netTotal || 0), 0),
    }));
  }, [filteredInvoices, todayStr]);

  // 2. MEDICINE MOVEMENT CALCULATIONS
  const medicineMovementData = useMemo(() => {
    const movementMap = new Map();

    // Seed master catalog
    medicines.forEach((med) => {
      const key = (med.name || med.brandName).toLowerCase().trim();
      movementMap.set(key, {
        medicineId: med.id,
        tradeName: med.name || med.brandName,
        genericFormula: med.formula || med.genericFormula,
        category: med.category || 'Tablets',
        rackLocation: med.rackLocation || 'Rack A-01',
        boxStock: med.boxStock !== undefined ? med.boxStock : 10,
        totalTabsSold: 0,
        totalRevenue: 0,
        retailWalkinCount: 0,
        creditDebtCount: 0,
      });
    });

    // Populate from sales invoices
    invoices.forEach((inv) => {
      const isCredit = inv.saleType?.includes('Credit') || inv.paymentMode === 'CREDIT';
      (inv.items || []).forEach((item) => {
        const key = (item.name || item.brandName || '').toLowerCase().trim();
        const existing = movementMap.get(key) || {
          medicineId: item.medicineId || 'MED-GEN',
          tradeName: item.name || item.brandName,
          genericFormula: item.formula || item.genericFormula || 'Formula',
          category: 'Tablets',
          rackLocation: 'Rack A-01',
          boxStock: 10,
          totalTabsSold: 0,
          totalRevenue: 0,
          retailWalkinCount: 0,
          creditDebtCount: 0,
        };

        const qty = Number(item.qty || item.quantity || 1);
        const lineTot = Number(item.total || (qty * (item.price || item.boxPrice || 10)));
        existing.totalTabsSold += qty;
        existing.totalRevenue += lineTot;
        if (isCredit) {
          existing.creditDebtCount += qty;
        } else {
          existing.retailWalkinCount += qty;
        }
        movementMap.set(key, existing);
      });
    });

    let list = Array.from(movementMap.values());
    if (movementSearch.trim()) {
      const q = movementSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.tradeName.toLowerCase().includes(q) ||
          m.genericFormula.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.rackLocation.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.totalTabsSold - a.totalTabsSold);
  }, [medicines, invoices, movementSearch]);

  // 3. TAX RECONCILIATION CALCULATIONS (Input PO Tax vs Output Sales Tax)
  const totalInputTaxPaid = poTaxLogs.reduce((sum, log) => sum + (Number(log.totalInputTaxPaid) || 0), 0);
  const totalPOPurchases = poTaxLogs.reduce((sum, log) => sum + (Number(log.totalPurchaseCost) || 0), 0);

  const totalOutputSalesTax = invoices.reduce((sum, inv) => {
    return sum + Number(inv.totalTax || inv.totalSalesTax18 || (Number(inv.netTotal || 0) * 0.05));
  }, 0);

  const netTaxBalance = totalOutputSalesTax - totalInputTaxPaid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* 3 TOP TAB CONTROLS */}
      <div className="card" style={{ padding: '0.65rem 1rem', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('SALES_LOGS')}
            className={`btn ${activeTab === 'SALES_LOGS' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', borderRadius: '10px' }}
          >
            <TrendingUp size={14} /> Daily & Detailed Sales Logs ({filteredInvoices.length})
          </button>

          <button
            onClick={() => setActiveTab('MEDICINE_MOVEMENT')}
            className={`btn ${activeTab === 'MEDICINE_MOVEMENT' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', borderRadius: '10px' }}
          >
            <Activity size={14} /> Medicine Movement & Velocity ({medicineMovementData.length})
          </button>

          <button
            onClick={() => setActiveTab('TAX_RECONCILIATION')}
            className={`btn ${activeTab === 'TAX_RECONCILIATION' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', borderRadius: '10px' }}
          >
            <ShieldCheck size={14} /> FBR Tax Reconciliation (PO Tax vs Sales Tax)
          </button>
        </div>

        <button
          onClick={() => setIsAnalyticsReportOpen(true)}
          className="btn btn-primary"
          style={{ fontSize: '12px', borderRadius: '10px', backgroundColor: '#0284c7' }}
        >
          <Printer size={14} /> Export Analytics PDF
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY & DETAILED SALES LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'SALES_LOGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 4 SUMMARY KPI CARDS */}
          <div className="grid-4" style={{ gap: '0.75rem' }}>
            <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gross Sales Turnover</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                Rs. {grossTurnover.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>From {filteredInvoices.length} Orders</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Net Collected Revenue</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a', marginTop: '0.2rem' }}>
                Rs. {netTurnover.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#16a34a' }}>After Rs. {totalDiscounts.toFixed(2)} discounts</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Profit (22%)</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0284c7', marginTop: '0.2rem' }}>
                Rs. {estProfit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#0284c7' }}>Retail Dispensary Margin</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Average Bill Size</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                Rs. {filteredInvoices.length > 0 ? (netTurnover / filteredInvoices.length).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Per Patient Transaction</div>
            </div>
          </div>

          {/* CALENDAR FILTER TOOLBAR */}
          <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Calendar size={15} color="#0284c7" />
              {['TODAY', '7_DAYS', '30_DAYS', 'CUSTOM'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: selectedPeriod === period ? '#0284c7' : '#ffffff',
                    color: selectedPeriod === period ? '#ffffff' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {period === 'TODAY' ? 'Today' : period === '7_DAYS' ? 'Last 7 Days' : period === '30_DAYS' ? 'Last 30 Days' : 'Custom Calendar'}
                </button>
              ))}

              {selectedPeriod === 'CUSTOM' && (
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }} />
                  <span style={{ fontSize: '11px' }}>to</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }} />
                </div>
              )}
            </div>

            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
              <input
                type="text"
                placeholder="Search Invoice #, Customer, Payment..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.65rem 0.4rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
              />
            </div>
          </div>

          {/* DAILY COLLAPSIBLE SALES LOG ACCORDIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {dateGroupedInvoices.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#ffffff', borderRadius: '14px' }}>
                No sales transactions recorded for this selected time period.
              </div>
            ) : (
              dateGroupedInvoices.map((group) => {
                const isExpanded = Boolean(expandedDates[group.date]);

                return (
                  <div
                    key={group.date}
                    className="card"
                    style={{
                      backgroundColor: '#ffffff',
                      border: group.isToday ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      padding: 0
                    }}
                  >
                    {/* ACCORDION HEADER CARD */}
                    <div
                      onClick={() => toggleDateAccordion(group.date)}
                      style={{
                        padding: '0.85rem 1.25rem',
                        backgroundColor: group.isToday ? '#f0f9ff' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {isExpanded ? <ChevronDown size={18} color="#0284c7" /> : <ChevronRight size={18} color="#64748b" />}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span>📅 Sales Date: {group.date}</span>
                            {group.isToday && (
                              <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '9.5px', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
                                TODAY (ACTIVE SHIFT)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.1rem' }}>
                            {group.invoices.length} Sales Invoices Completed
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Shift Net Sales:</div>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a' }}>
                            Rs. {group.dayNet.toFixed(2)}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                          {isExpanded ? '▲ Collapse' : '▼ Click to Expand'}
                        </span>
                      </div>
                    </div>

                    {/* EXPANDABLE BILLS TABLE */}
                    {isExpanded && (
                      <div style={{ padding: '0.75rem 1.25rem' }}>
                        <div className="table-container" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                          <table className="table" style={{ fontSize: '11px' }}>
                            <thead>
                              <tr>
                                <th>Inv #</th>
                                <th>Time</th>
                                <th>Customer Name</th>
                                <th>Channel</th>
                                <th style={{ textAlign: 'center' }}>Items</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                                <th style={{ textAlign: 'right' }}>Disc</th>
                                <th style={{ textAlign: 'right' }}>Net Total</th>
                                <th style={{ textAlign: 'center' }}>Payment</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.invoices.map((inv, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNo}</td>
                                  <td style={{ color: '#475569' }}>{inv.time}</td>
                                  <td style={{ fontWeight: 700 }}>{inv.customerName || inv.shopName || 'Walk-in'}</td>
                                  <td>
                                    <span className={`badge ${inv.saleType?.includes('Credit') ? 'badge-warning' : 'badge-otc'}`}>
                                      {inv.saleType || 'Retail'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{(inv.items || []).length} items</td>
                                  <td style={{ textAlign: 'right' }}>Rs. {Number(inv.subtotal || inv.grossTotal || 0).toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', color: '#dc2626' }}>{Number(inv.discount || 0) > 0 ? `-Rs. ${Number(inv.discount).toFixed(2)}` : '-'}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>Rs. {Number(inv.netTotal || 0).toFixed(2)}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                                      {inv.paymentStatus || 'PAID'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      onClick={() => setViewInvoice(inv)}
                                      className="btn btn-outline"
                                      style={{ fontSize: '10px', padding: '0.2rem 0.45rem', borderRadius: '6px' }}
                                    >
                                      <Eye size={11} /> View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEDICINE MOVEMENT & SALES VELOCITY */}
      {/* ========================================================================= */}
      {activeTab === 'MEDICINE_MOVEMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* SEARCH & FILTERS */}
          <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Medicine Sales Velocity & Movement Register
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Track total units sold, channel distribution (Walk-in vs Credit), and stock consumption
              </div>
            </div>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
              <input
                type="text"
                placeholder="Search by Trade Name, Formula, Category, Rack..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
              />
            </div>
          </div>

          {/* MOVEMENT TABLE */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="table-container">
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Medicine Trade Name</th>
                    <th>Generic Formula</th>
                    <th>Category</th>
                    <th>Shelf Location</th>
                    <th style={{ textAlign: 'center' }}>Total Units Sold</th>
                    <th style={{ textAlign: 'center' }}>Counter vs Debt</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                    <th style={{ textAlign: 'center' }}>Remaining Stock</th>
                    <th style={{ textAlign: 'center' }}>Movement Velocity</th>
                  </tr>
                </thead>
                <tbody>
                  {medicineMovementData.map((item, idx) => {
                    const isFast = item.totalTabsSold >= 30;
                    const isModerate = item.totalTabsSold > 0 && item.totalTabsSold < 30;

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{item.tradeName}</td>
                        <td style={{ color: '#475569' }}>{item.genericFormula}</td>
                        <td><span className="badge badge-otc">{item.category}</span></td>
                        <td><strong>📍 {item.rackLocation}</strong></td>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '12px', color: '#0284c7' }}>
                          {item.totalTabsSold} Units
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '10.5px' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>{item.retailWalkinCount} Cash</span> / <span style={{ color: '#dc2626', fontWeight: 700 }}>{item.creditDebtCount} Debt</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                          Rs. {item.totalRevenue.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {item.boxStock} Boxes
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${isFast ? 'badge-success' : isModerate ? 'badge-warning' : 'badge-danger'}`}>
                            {isFast ? '⚡ Fast Moving' : isModerate ? '⏳ Moderate' : '🛑 Slow / Dead'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FBR & DRAP TAX RECONCILIATION (PO INWARD vs SALES OUTWARD) */}
      {/* ========================================================================= */}
      {activeTab === 'TAX_RECONCILIATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* TAX RECONCILIATION KPI SUMMARY */}
          <div className="grid-3" style={{ gap: '0.85rem' }}>
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px' }}>
              <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>
                1. Input Tax Paid on POs (Distributor Purchases)
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginTop: '0.35rem' }}>
                Rs. {totalInputTaxPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '0.2rem' }}>
                Paid on Rs. {totalPOPurchases.toLocaleString('en-PK')} PO Inward Invoices
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px' }}>
              <div style={{ fontSize: '10.5px', color: '#1e40af', fontWeight: 800, textTransform: 'uppercase' }}>
                2. Output Tax Collected on Sales (Customer Bills)
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284c7', marginTop: '0.35rem' }}>
                Rs. {totalOutputSalesTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '0.2rem' }}>
                Collected across {invoices.length} Sales Transactions
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '2px solid #0284c7', borderRadius: '14px' }}>
              <div style={{ fontSize: '10.5px', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase' }}>
                3. Net Tax Adjustment / Liability Balance
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: netTaxBalance >= 0 ? '#16a34a' : '#0284c7', marginTop: '0.35rem' }}>
                Rs. {Math.abs(netTaxBalance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
                {netTaxBalance >= 0 ? 'Net Payable to FBR' : 'Input Tax Credit Carried Forward'}
              </div>
            </div>
          </div>

          {/* PO INPUT TAX AUDIT TABLE */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck size={16} color="#0284c7" /> Distributor Purchase Invoices & Input Taxes Paid (FBR Form)
              </div>
              <button
                onClick={() => setIsFBRLawyerModalOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '11.5px', backgroundColor: '#0284c7', borderRadius: '8px' }}
              >
                <Printer size={13} /> Print FBR Tax Statement
              </button>
            </div>

            <div className="table-container">
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>PO Ref #</th>
                    <th>Date</th>
                    <th>Distributor / Supplier</th>
                    <th style={{ textAlign: 'right' }}>Total Purchase Cost</th>
                    <th style={{ textAlign: 'right' }}>Sales Tax 18%</th>
                    <th style={{ textAlign: 'right' }}>Adv Tax 0.5%</th>
                    <th style={{ textAlign: 'right' }}>FBR Tax 1%</th>
                    <th style={{ textAlign: 'right' }}>Total Tax Paid</th>
                    <th style={{ textAlign: 'center' }}>FBR Status</th>
                  </tr>
                </thead>
                <tbody>
                  {poTaxLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{log.poNumber}</td>
                      <td>{log.date}</td>
                      <td style={{ fontWeight: 700 }}>{log.supplierName}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(log.totalPurchaseCost).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: '#0284c7' }}>Rs. {Number(log.salesTax18).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>Rs. {Number(log.advTax05).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>Rs. {Number(log.fbrTax01).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>Rs. {Number(log.totalInputTaxPaid).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-success">Paid ✓</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isFBRLawyerModalOpen && (
        <FBRLawyerReportModal
          isOpen={isFBRLawyerModalOpen}
          invoices={filteredInvoices}
          onClose={() => setIsFBRLawyerModalOpen(false)}
        />
      )}

      {isAnalyticsReportOpen && (
        <AnalyticsReportModal
          isOpen={isAnalyticsReportOpen}
          invoices={filteredInvoices}
          onClose={() => setIsAnalyticsReportOpen(false)}
        />
      )}

      {viewInvoice && (
        <A4InvoicePrintModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
        />
      )}
    </div>
  );
};

export default AnalyticsPage;
