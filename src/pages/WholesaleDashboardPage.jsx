import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Truck, 
  DollarSign, 
  Users, 
  FileText, 
  ArrowUpRight, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Receipt,
  Building2,
  PieChart
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import { useSupplier } from '../context/SupplierContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';

export const WholesaleDashboardPage = ({ onNavigate }) => {
  const { invoices = [] } = useSales();
  const { medicines = [], batches = [] } = useInventory();
  const { suppliers = [], purchaseOrders = [] } = useSupplier();
  const { currentShop, user } = useAuth();

  const [activeKpiTab, setActiveKpiTab] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Timeframe filter logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredInvoices = useMemo(() => {
    if (activeKpiTab === 'TODAY') {
      return invoices.filter(inv => inv.date === todayStr);
    }
    if (activeKpiTab === 'WEEK') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return invoices.filter(inv => new Date(inv.date || todayStr) >= sevenDaysAgo);
    }
    if (activeKpiTab === 'MONTH') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return invoices.filter(inv => new Date(inv.date || todayStr) >= thirtyDaysAgo);
    }
    return invoices;
  }, [invoices, activeKpiTab, todayStr]);

  // Executive KPI Calculations
  const metrics = useMemo(() => {
    let totalBilledGross = 0;
    let totalNetInvoiced = 0;
    let actualCollected = 0;
    let totalSalesTax = 0;
    let totalAdvTax = 0;

    filteredInvoices.forEach((inv) => {
      const net = Number(inv.netTotal || inv.grandTotal || inv.subtotal || 0);
      const gross = Number(inv.grossTotal || inv.subtotal || net);
      const st = Number(inv.salesTax18 || 0);
      const adv = Number(inv.advTax05 || 0);

      totalBilledGross += gross;
      totalNetInvoiced += net;
      totalSalesTax += st;
      totalAdvTax += adv;

      // Actual cash/bank received
      if (inv.paymentStatus === 'PAID' || inv.isPaid) {
        actualCollected += net;
      } else {
        const tendered = Number(inv.cashTendered || inv.tendered || 0);
        const settledAmount = Number(inv.settledAmount || 0);
        actualCollected += Math.min(net, Math.max(tendered, settledAmount));
      }
    });

    const outstandingReceivables = Math.max(0, totalNetInvoiced - actualCollected);
    const orderCount = filteredInvoices.length;

    return {
      totalBilledGross,
      totalNetInvoiced,
      actualCollected,
      outstandingReceivables,
      orderCount,
      totalSalesTax,
      totalAdvTax
    };
  }, [filteredInvoices]);

  // 7-Day Trend Data
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayInvoices = invoices.filter(inv => inv.date === dateStr);
      const billed = dayInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0);
      const collected = dayInvoices.reduce((sum, inv) => {
        if (inv.paymentStatus === 'PAID' || inv.isPaid) return sum + Number(inv.netTotal || 0);
        const tendered = Number(inv.cashTendered || inv.tendered || 0);
        return sum + Math.min(Number(inv.netTotal || 0), tendered);
      }, 0);

      days.push({
        dayName,
        dateStr,
        billed,
        collected
      });
    }
    return days;
  }, [invoices]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...last7DaysData.map(d => Math.max(d.billed, d.collected)), 1000);
    return max * 1.15; // 15% headroom
  }, [last7DaysData]);

  // Territory / Region Volume Breakdown
  const territoryBreakdown = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      const reg = (inv.region || 'Gujrat').trim();
      if (!map[reg]) {
        map[reg] = { region: reg, count: 0, total: 0 };
      }
      map[reg].count += 1;
      map[reg].total += Number(inv.netTotal || inv.subtotal || 0);
    });

    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [invoices]);

  // Top Fast Moving Wholesale Items
  const topMovingMedicines = useMemo(() => {
    const itemMap = {};
    invoices.forEach((inv) => {
      const items = inv.items || [];
      items.forEach((it) => {
        const key = (it.name || it.brandName || it.itemCode || 'Unknown').trim();
        if (!itemMap[key]) {
          itemMap[key] = {
            name: key,
            generic: it.formula || it.genericFormula || 'Formula USP',
            totalBoxes: 0,
            totalSales: 0,
            totalTax: 0,
            taxRate: it.saleTaxPercent !== undefined ? it.saleTaxPercent : 18
          };
        }
        const qty = Number(it.qty || it.quantity || 1);
        const rate = Number(it.boxPrice || it.price || 0);
        const gross = qty * rate;
        const st = Number(it.salesTax18 || (gross * ((itemMap[key].taxRate) / 100)));

        itemMap[key].totalBoxes += qty;
        itemMap[key].totalSales += gross;
        itemMap[key].totalTax += st;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.totalBoxes - a.totalBoxes)
      .slice(0, 6);
  }, [invoices]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* HEADER BAR & TIMEFRAME TOGGLE */}
      <div className="card" style={{ padding: '1rem 1.5rem', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 size={24} color="#ffffff" />
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Wholesale Command Center
            </h2>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
              B2B Distribution
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '12px', opacity: 0.9 }}>
            Live distributor revenue, realized liquidity, customer receivables & order movements for {currentShop?.shopName || 'Testing Shop'}
          </p>
        </div>

        {/* Timeframe Pill Selector */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(15, 23, 42, 0.25)', padding: '0.25rem', borderRadius: '10px', gap: '0.25rem' }}>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'Last 7 Days' },
            { id: 'MONTH', label: 'Last 30 Days' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveKpiTab(tab.id)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: activeKpiTab === tab.id ? 800 : 500,
                backgroundColor: activeKpiTab === tab.id ? '#ffffff' : 'transparent',
                color: activeKpiTab === tab.id ? '#0284c7' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 CORE EXECUTIVE KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Total Billed Gross */}
        <div 
          className="card ksi-card kpi-card"
          style={{ 
            padding: '1.25rem', 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Billed Volume
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                PKR {metrics.totalNetInvoiced.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} color="#0284c7" />
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>Gross Value:</span>
            <strong style={{ color: '#334155' }}>PKR {metrics.totalBilledGross.toLocaleString('en-PK')}</strong>
          </div>
        </div>

        {/* KPI 2: Actual Amount Collected */}
        <div 
          className="card ksi-card kpi-card"
          style={{ 
            padding: '1.25rem', 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Actual Cash & Bank Received
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                PKR {metrics.actualCollected.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>Realized Liquidity Rate:</span>
            <strong style={{ color: '#16a34a' }}>
              {metrics.totalNetInvoiced > 0 ? Math.round((metrics.actualCollected / metrics.totalNetInvoiced) * 100) : 100}%
            </strong>
          </div>
        </div>

        {/* KPI 3: Customer Receivables (Credit) */}
        <div 
          className="card ksi-card kpi-card"
          style={{ 
            padding: '1.25rem', 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending Receivables
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: metrics.outstandingReceivables > 0 ? '#d97706' : '#16a34a', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                PKR {metrics.outstandingReceivables.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#d97706" />
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>Owed by Pharmacies:</span>
            <button 
              onClick={() => onNavigate && onNavigate('region-ledger')} 
              style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              View Territory Ledger →
            </button>
          </div>
        </div>

        {/* KPI 4: Total Orders Count */}
        <div 
          className="card ksi-card kpi-card"
          style={{ 
            padding: '1.25rem', 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                B2B Orders Processed
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                {metrics.orderCount} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Invoices</span>
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={20} color="#475569" />
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>FBR Sales Tax Collected:</span>
            <strong style={{ color: '#0284c7' }}>PKR {metrics.totalSalesTax.toLocaleString('en-PK')}</strong>
          </div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: 7-DAY TREND GRAPH & TERRITORY DISTRIBUTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '1.25rem' }}>
        {/* 7-DAY BILLED VS COLLECTED GRAPH */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '15px', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={18} color="#0284c7" /> 7-Day Wholesale Revenue & Realized Collections
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Daily B2B shipment value compared against actual liquid cash/bank payments received
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', fontWeight: 700 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#0284c7' }}></span>
                Billed (PKR)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', fontWeight: 700 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#16a34a' }}></span>
                Collected (PKR)
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '0.85rem', padding: '0 0.5rem 0.5rem', borderBottom: '1px solid #e2e8f0' }}>
            {last7DaysData.map((d, idx) => {
              const billedHeight = Math.max(8, Math.round((d.billed / maxChartValue) * 190));
              const collectedHeight = Math.max(8, Math.round((d.collected / maxChartValue) * 190));
              const isHovered = hoveredBarIndex === idx;

              return (
                <div 
                  key={d.dateStr} 
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      bottom: `${Math.max(billedHeight, collectedHeight) + 12}px`,
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '10.5px',
                      whiteSpace: 'nowrap',
                      zIndex: 30,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      pointerEvents: 'none'
                    }}>
                      <div style={{ fontWeight: 700 }}>{d.dateStr}</div>
                      <div>Billed: PKR {d.billed.toLocaleString()}</div>
                      <div>Collected: PKR {d.collected.toLocaleString()}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    {/* Billed Bar */}
                    <div 
                      style={{ 
                        width: '14px', 
                        height: `${billedHeight}px`, 
                        backgroundColor: '#0284c7', 
                        borderRadius: '4px 4px 0 0',
                        opacity: isHovered ? 1 : 0.85,
                        transition: 'height 0.25s ease, opacity 0.15s ease'
                      }} 
                    />
                    {/* Collected Bar */}
                    <div 
                      style={{ 
                        width: '14px', 
                        height: `${collectedHeight}px`, 
                        backgroundColor: '#16a34a', 
                        borderRadius: '4px 4px 0 0',
                        opacity: isHovered ? 1 : 0.85,
                        transition: 'height 0.25s ease, opacity 0.15s ease'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '0.45rem', fontWeight: 600 }}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TERRITORY DISTRIBUTION */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ fontSize: '15px', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={18} color="#0284c7" /> Territory Demand
            </h3>
            <button
              onClick={() => onNavigate && onNavigate('region-ledger')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              All Regions →
            </button>
          </div>
          <p className="subtext" style={{ marginBottom: '1rem' }}>
            Top pharmaceutical delivery routes by billed sales value
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {territoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '12px' }}>
                No regional invoices recorded yet.
              </div>
            ) : (
              territoryBreakdown.map((t, idx) => {
                const totalRev = metrics.totalNetInvoiced || 1;
                const pct = Math.min(100, Math.round((t.total / totalRev) * 100));

                return (
                  <div key={t.region} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>
                        {idx + 1}. {t.region}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0284c7' }}>
                        PKR {t.total.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '7px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: idx === 0 ? '#0284c7' : '#38bdf8', borderRadius: '4px' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {t.count} orders dispatched
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FAST-MOVING BULK MEDICINES TABLE & QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* FAST-MOVING BULK MEDICINES TABLE */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '15px', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={18} color="#0284c7" /> Fast-Moving Wholesale Medicines
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Ranked by bulk box velocity, revenue volume and tax contributions
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('inventory')}
              style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              View Inventory →
            </button>
          </div>

          <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Medicine Name & Generic</th>
                  <th style={{ textAlign: 'center' }}>Tax %</th>
                  <th style={{ textAlign: 'right' }}>Boxes Sold</th>
                  <th style={{ textAlign: 'right' }}>Total Sales (PKR)</th>
                  <th style={{ textAlign: 'right' }}>Tax (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {topMovingMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No sales recorded yet. Process invoices via Wholesale POS.
                    </td>
                  </tr>
                ) : (
                  topMovingMedicines.map((item, idx) => (
                    <tr 
                      key={item.name}
                      style={{ 
                        transition: 'background-color 0.15s ease',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ fontWeight: 800, color: idx < 3 ? '#0284c7' : '#64748b' }}>
                        #{idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{item.generic}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ 
                          backgroundColor: item.taxRate === 19 ? '#fef3c7' : '#e0f2fe',
                          color: item.taxRate === 19 ? '#b45309' : '#0284c7',
                          fontWeight: 700,
                          fontSize: '10px'
                        }}>
                          {item.taxRate}% ST
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        {item.totalBoxes} bxs
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>
                        PKR {item.totalSales.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                        PKR {item.totalTax.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK SHORTCUTS & OPERATIONS */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '15px', color: '#0f172a', margin: 0 }}>
              ⚡ Operational Shortcuts
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              One-click access to core wholesale distribution modules
            </p>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('pos')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={16} /> New Wholesale Sale (POS)
            </span>
            <ArrowUpRight size={15} />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('suppliers')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={16} color="#0284c7" /> Inward Stock PO Builder
            </span>
            <ArrowUpRight size={15} color="#64748b" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('customer-ledger')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="#0284c7" /> Customer Receivables & Ledger
            </span>
            <ArrowUpRight size={15} color="#64748b" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('fbr')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="#0284c7" /> FBR Tax Audit & Annex-C
            </span>
            <ArrowUpRight size={15} color="#64748b" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WholesaleDashboardPage;
