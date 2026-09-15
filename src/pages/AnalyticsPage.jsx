import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronRight,
  ClipboardList,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';
import AnalyticsReportModal from '../components/modals/AnalyticsReportModal';
import A4InvoicePrintModal from '../components/modals/A4InvoicePrintModal';
import TraceabilityLedgerPrintModal from '../components/modals/TraceabilityLedgerPrintModal';
import CatalogVelocityPrintModal from '../components/modals/CatalogVelocityPrintModal';

export const AnalyticsPage = () => {
  const { invoices = [] } = useSales();
  const { medicines = [] } = useInventory();
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

  // Movement & Traceability view modes
  const [activeTab, setActiveTab] = useState('SALES_LOGS'); // 'SALES_LOGS' | 'MEDICINE_MOVEMENT'
  const [movementViewMode, setMovementViewMode] = useState('TRACEABILITY'); // 'TRACEABILITY' | 'VELOCITY'
  const [selectedPeriod, setSelectedPeriod] = useState('30_DAYS'); // 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM'
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [movementSearch, setMovementSearch] = useState('');

  // Modals state
  const [isAnalyticsReportOpen, setIsAnalyticsReportOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [isTraceabilityPrintOpen, setIsTraceabilityPrintOpen] = useState(false);
  const [isVelocityPrintOpen, setIsVelocityPrintOpen] = useState(false);

  const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

  // 1. FILTERED SALES TRANSACTIONS
  const filteredInvoices = useMemo(() => {
    const q = searchLogQuery.toLowerCase().trim();
    return invoices.filter((inv) => {
      // If user is searching by invoice # or customer/shop query, search all historical invoices
      if (q.length > 0) {
        return (
          (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
          (inv.shopName && inv.shopName.toLowerCase().includes(q)) ||
          (inv.paymentMode && inv.paymentMode.toLowerCase().includes(q))
        );
      }

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

      return true;
    });
  }, [invoices, selectedPeriod, startDate, endDate, searchLogQuery, todayStr, sevenDaysAgoStr, thirtyDaysAgoStr]);

  // Turnover Metrics with strict 2-decimal precision
  const grossTurnover = round2(filteredInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || inv.grossTotal || inv.netTotal || 0), 0));
  const totalDiscounts = round2(filteredInvoices.reduce((sum, inv) => sum + Number(inv.discount || 0), 0));
  const netTurnover = round2(filteredInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0));
  const estProfit = round2(netTurnover * 0.22);

  // Accordion State for Daily Logs
  const [expandedDates, setExpandedDates] = useState({ [todayStr]: true });

  // Auto-expand all dates that contain search query matches
  useEffect(() => {
    if (searchLogQuery.trim().length > 0) {
      const q = searchLogQuery.toLowerCase().trim();
      const matchMap = {};
      invoices.forEach((inv) => {
        if (
          (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
          (inv.shopName && inv.shopName.toLowerCase().includes(q))
        ) {
          matchMap[inv.date || todayStr] = true;
        }
      });
      setExpandedDates((prev) => ({ ...prev, ...matchMap }));
    }
  }, [searchLogQuery, invoices, todayStr]);

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

  // 2. ITEMIZED MEDICINE MOVEMENT & TRACEABILITY LOGS
  const itemizedMovementLogs = useMemo(() => {
    const logs = [];
    invoices.forEach((inv) => {
      const invDate = inv.date || '';
      const customer = inv.shopName || inv.customerName || 'Walk-in Client';
      const paymentMode = inv.paymentMode || inv.paymentMethod || 'Cash';
      const invoiceNo = inv.invoiceNo;

      (inv.items || []).forEach((item, itemIdx) => {
        const tradeName = item.name || item.brandName || 'Medicine';
        const generic = item.formula || item.genericFormula || '-';
        const batchNo = item.batchNo || item.batchNumber || item.batch || 'B26-BATCH-01';
        const qty = Number(item.qty || item.quantity || 1);
        const unitPrice = Number(item.boxPrice || item.price || item.unitPrice || 0);
        const total = Number(item.total !== undefined ? item.total : (qty * unitPrice));

        logs.push({
          id: `${invoiceNo}-${itemIdx}`,
          invoiceNo,
          date: invDate,
          customer,
          paymentMode,
          tradeName,
          generic,
          batchNo,
          qty,
          unitPrice,
          total
        });
      });
    });

    if (movementSearch.trim()) {
      const q = movementSearch.toLowerCase().trim();
      return logs.filter(
        (log) =>
          log.tradeName.toLowerCase().includes(q) ||
          log.generic.toLowerCase().includes(q) ||
          log.batchNo.toLowerCase().includes(q) ||
          log.customer.toLowerCase().includes(q) ||
          log.invoiceNo.toLowerCase().includes(q)
      );
    }
    return logs;
  }, [invoices, movementSearch]);

  // 3. MEDICINE VELOCITY CALCULATIONS (Aggregated Catalog View)
  const medicineMovementData = useMemo(() => {
    const movementMap = new Map();

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

  // Movement KPI Totals
  const movementStats = useMemo(() => {
    const totalDispatched = itemizedMovementLogs.reduce((sum, l) => sum + l.qty, 0);
    const totalBilled = itemizedMovementLogs.reduce((sum, l) => sum + l.total, 0);
    const uniqueBuyers = new Set(itemizedMovementLogs.map(l => l.customer)).size;
    return { totalDispatched, totalBilled, uniqueBuyers };
  }, [itemizedMovementLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* 2 PRIMARY TOP TAB CONTROLS */}
      <div className="card" style={{ padding: '0.65rem 1rem', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            <Activity size={14} /> Medicine Movement & Traceability ({itemizedMovementLogs.length} Records)
          </button>
        </div>

        <button
          onClick={() => setIsAnalyticsReportOpen(true)}
          className="btn btn-primary"
          style={{ fontSize: '12px', borderRadius: '10px', backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
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
              <div style={{ fontSize: '10px', color: '#0284c7' }}>Gross margin on net billing</div>
            </div>

            <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Average Order Value</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                Rs. {filteredInvoices.length > 0 ? (netTurnover / filteredInvoices.length).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Per counter transaction</div>
            </div>
          </div>

          {/* DEDICATED PREVIOUS INVOICE SEARCH BAR */}
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Search size={16} color="#0284c7" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Search Previous Invoice by Invoice #:
                </span>
              </div>
              {searchLogQuery && (
                <button
                  onClick={() => setSearchLogQuery('')}
                  style={{ background: 'none', border: 'none', fontSize: '11px', color: '#ef4444', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  ✕ Clear Search
                </button>
              )}
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Type Invoice Number (e.g. INV-20260822-320791 or 320791) to locate previous invoices across all dates..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.4rem', borderRadius: '10px', border: searchLogQuery ? '2px solid #0284c7' : '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 600, outline: 'none', backgroundColor: searchLogQuery ? '#f0f9ff' : '#ffffff' }}
              />
            </div>

            {searchLogQuery && (
              <div style={{ fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e0f2fe', padding: '0.45rem 0.85rem', borderRadius: '8px', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ color: '#0369a1', fontWeight: 700 }}>
                  ✓ Found {filteredInvoices.length} matching invoice(s) • Date group(s) auto-expanded below
                </span>
                {filteredInvoices.length === 1 && (
                  <button
                    onClick={() => setViewInvoice(filteredInvoices[0])}
                    className="btn btn-primary"
                    style={{ fontSize: '11px', padding: '0.25rem 0.65rem', borderRadius: '6px', backgroundColor: '#0284c7' }}
                  >
                    <FileText size={13} /> View A4 Commercial Invoice
                  </button>
                )}
              </div>
            )}
          </div>

          {/* DATE RANGE FILTER CONTROLS */}
          <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Filter Period:</span>
              {[
                { id: 'TODAY', label: "Today's Sales" },
                { id: '7_DAYS', label: 'Past 7 Days' },
                { id: '30_DAYS', label: 'Past 30 Days' },
                { id: 'CUSTOM', label: 'Custom Date Range' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedPeriod(btn.id)}
                  className={`btn ${selectedPeriod === btn.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '11px', padding: '0.35rem 0.65rem', borderRadius: '6px' }}
                >
                  {btn.label}
                </button>
              ))}

              {selectedPeriod === 'CUSTOM' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }} />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>to</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }} />
                </div>
              )}
            </div>

            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Showing {filteredInvoices.length} transactions
            </span>
          </div>

          {/* DAILY COLLAPSIBLE SALES ACCORDIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dateGroupedInvoices.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <p className="subtext">No transactions found for the selected period.</p>
              </div>
            ) : (
              dateGroupedInvoices.map((group) => {
                const isOpen = !!expandedDates[group.date];
                return (
                  <div key={group.date} className="card" style={{ padding: '0', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleDateAccordion(group.date)}
                      style={{
                        padding: '0.85rem 1.25rem',
                        backgroundColor: group.isToday ? '#f0fdf4' : '#f8fafc',
                        borderBottom: isOpen ? '1px solid #e2e8f0' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isOpen ? <ChevronDown size={16} color="#0284c7" /> : <ChevronRight size={16} color="#64748b" />}
                        <Calendar size={15} color={group.isToday ? '#16a34a' : '#0284c7'} />
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                          {formatDateDDMMYYYY(group.date)} {group.isToday && '(Today)'}
                        </span>
                        <span className="badge badge-otc" style={{ fontSize: '10px' }}>
                          {group.invoices.length} Invoices
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Day Gross: </span>
                          <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>Rs. {group.dayGross.toFixed(2)}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: '#166534' }}>Net: </span>
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#16a34a' }}>Rs. {group.dayNet.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0.85rem 1.25rem' }}>
                        <div className="table-container">
                          <table className="table" style={{ fontSize: '11px' }}>
                            <thead>
                              <tr>
                                <th>Invoice #</th>
                                <th>Time</th>
                                <th>Customer / Shop</th>
                                <th>Payment Mode</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                                <th style={{ textAlign: 'right' }}>Discount</th>
                                <th style={{ textAlign: 'right' }}>Net Total</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.invoices.map((inv) => {
                                const isMatched = searchLogQuery.trim().length > 0 && inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(searchLogQuery.toLowerCase().trim());
                                return (
                                  <tr key={inv.invoiceNo} style={{ backgroundColor: isMatched ? '#eff6ff' : undefined }}>
                                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: isMatched ? '#0284c7' : 'inherit' }}>
                                      {inv.invoiceNo}
                                    </td>
                                    <td>{inv.time || '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{inv.shopName || inv.customerName || 'Walk-in'}</td>
                                    <td><span className="badge badge-success">{inv.paymentMode || 'Cash'}</span></td>
                                    <td style={{ textAlign: 'right' }}>Rs. {Number(inv.subtotal || inv.grossTotal || inv.netTotal || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', color: '#dc2626' }}>Rs. {Number(inv.discount || 0).toFixed(2)}</td>
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
                                        style={{ fontSize: '10px', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                        title="View Commercial A4 Tax Invoice (Form 2A)"
                                      >
                                        <FileText size={11} color="#0284c7" /> A4 Invoice
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
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
      {/* TAB 2: MEDICINE MOVEMENT & TRACEABILITY */}
      {/* ========================================================================= */}
      {activeTab === 'MEDICINE_MOVEMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* TRACEABILITY KPI METRICS */}
          <div className="grid-3" style={{ gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Traceable Dispatches</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0284c7', marginTop: '0.2rem' }}>
                {movementStats.totalDispatched.toLocaleString()} Units / Packs
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>Across {itemizedMovementLogs.length} Sale Item Lines</div>
            </div>

            <div className="card" style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Dispatched Product Volume</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a', marginTop: '0.2rem' }}>
                Rs. {movementStats.totalBilled.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10.5px', color: '#16a34a' }}>B2B & Counter Movement Revenue</div>
            </div>

            <div className="card" style={{ padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px' }}>
              <div style={{ fontSize: '10.5px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Verified Destination Buyers</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                {movementStats.uniqueBuyers} Distinct Pharmacies / Clients
              </div>
              <div style={{ fontSize: '10.5px', color: '#0284c7' }}>Complete DRAP-compliant batch custody</div>
            </div>
          </div>

          {/* VIEW SWITCHER & SEARCH CONTROLS */}
          <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setMovementViewMode('TRACEABILITY')}
                className={`btn ${movementViewMode === 'TRACEABILITY' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '11.5px', borderRadius: '8px' }}
              >
                <ClipboardList size={13} /> Itemized Sales Traceability Ledger (Audit Trail)
              </button>

              <button
                onClick={() => setMovementViewMode('VELOCITY')}
                className={`btn ${movementViewMode === 'VELOCITY' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '11.5px', borderRadius: '8px' }}
              >
                <BarChart3 size={13} /> Catalog Velocity & Stock Aggregates
              </button>
            </div>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
              <input
                type="text"
                placeholder="Search Medicine, Batch #, Buyer Shop, Invoice..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
              />
            </div>
          </div>

          {/* VIEW 1: ITEMIZED SALES TRACEABILITY LEDGER */}
          {movementViewMode === 'TRACEABILITY' && (
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Itemized Medicine Traceability Log (Sold To Destination Audit)
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    DRAP-compliant batch tracking: identifies exact shop/person, date, batch number, quantity, and unit price for every sold medicine
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="badge badge-success">{itemizedMovementLogs.length} Line Items Traced</span>
                  <button
                    type="button"
                    onClick={() => setIsTraceabilityPrintOpen(true)}
                    className="btn btn-primary"
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '11px',
                      padding: '0.35rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Export / Print itemized sales traceability ledger to A4 PDF"
                  >
                    <Printer size={13} /> Export Traceability PDF
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="table" style={{ fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Medicine Name & Formula</th>
                      <th>Batch Number</th>
                      <th>Sold To (Customer / Pharmacy)</th>
                      <th>Invoice #</th>
                      <th style={{ textAlign: 'center' }}>Quantity Sold</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                      <th style={{ textAlign: 'center' }}>Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemizedMovementLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          No medicine movements match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      itemizedMovementLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{formatDateDDMMYYYY(log.date)}</td>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.tradeName}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{log.generic}</div>
                          </td>
                          <td>
                            <span className="badge badge-otc" style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                              {log.batchNo}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#0284c7' }}>
                            {log.customer}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {log.invoiceNo}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>
                            {log.qty}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            Rs. {log.unitPrice.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                            Rs. {log.total.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-success">{log.paymentMode}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: CATALOG VELOCITY & STOCK AGGREGATES */}
          {movementViewMode === 'VELOCITY' && (
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Medicine Sales Velocity & Stock Consumption Register
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Aggregated consumption velocity, channel distribution (Counter vs Credit), and warehouse shelf location
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="badge badge-otc">{medicineMovementData.length} Catalog Items</span>
                  <button
                    type="button"
                    onClick={() => setIsVelocityPrintOpen(true)}
                    className="btn btn-primary"
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '11px',
                      padding: '0.35rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Export / Print catalog velocity & stock aggregates to A4 PDF"
                  >
                    <Printer size={13} /> Export Velocity PDF
                  </button>
                </div>
              </div>

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
          )}
        </div>
      )}

      {/* MODALS */}
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

      {/* TRACEABILITY LEDGER PRINT / PDF MODAL */}
      {isTraceabilityPrintOpen && (
        <TraceabilityLedgerPrintModal
          isOpen={isTraceabilityPrintOpen}
          onClose={() => setIsTraceabilityPrintOpen(false)}
          logs={itemizedMovementLogs}
        />
      )}

      {/* CATALOG VELOCITY PRINT / PDF MODAL */}
      {isVelocityPrintOpen && (
        <CatalogVelocityPrintModal
          isOpen={isVelocityPrintOpen}
          onClose={() => setIsVelocityPrintOpen(false)}
          items={medicineMovementData}
        />
      )}
    </div>
  );
};

export default AnalyticsPage;
