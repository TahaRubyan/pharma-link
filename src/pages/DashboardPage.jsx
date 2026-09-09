import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  Truck, 
  DollarSign, 
  ShieldAlert, 
  ArrowUpRight, 
  Activity
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = ({ onNavigate }) => {
  const { invoices = [] } = useSales();
  const { medicines = [], batches = [], vendorReturns = [] } = useInventory();
  const { currentShop } = useAuth();
  const isRetail = currentShop?.mode === 'RETAIL';

  const [activeMetric, setActiveMetric] = useState('REVENUE'); // 'REVENUE' | 'TRANSACTIONS' | 'RX'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Calculations from live state
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(inv => inv.date === todayStr);
  const todayTurnover = todayInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0);
  const todayProfit = todayTurnover * 0.22;

  const lowStockCount = medicines.filter(m => (m.boxStock !== undefined ? m.boxStock : 0) <= 5).length;

  const nearExpiryCount = useMemo(() => {
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    return batches.filter((b) => {
      if (!b.expiryDate) return false;
      let expDate;
      if (b.expiryDate.includes('-')) {
        const parts = b.expiryDate.split('-');
        if (parts[0].length === 2 && parts[1].length === 4) {
          expDate = new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        } else if (parts[0].length === 4) {
          expDate = new Date(b.expiryDate);
        }
      } else if (b.expiryDate.includes('/')) {
        const parts = b.expiryDate.split('/');
        if (parts[0].length === 2 && parts[1].length === 4) {
          expDate = new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        }
      }
      return expDate && expDate <= sixMonthsFromNow;
    }).length;
  }, [batches]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      const isToday = i === 0;

      const dayInvoices = invoices.filter(inv => inv.date === isoDate);
      const amount = dayInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0);
      const txCount = dayInvoices.length;
      const rxCount = dayInvoices.filter(inv => Boolean(inv.patient || inv.rxPatient)).length;

      result.push({
        day: isToday ? `${dayName} (Today)` : dayName,
        date: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        amount,
        txCount,
        rxCount,
      });
    }
    return result;
  }, [invoices]);

  const maxVal = Math.max(...chartData.map(d => activeMetric === 'REVENUE' ? d.amount : activeMetric === 'TRANSACTIONS' ? d.txCount : d.rxCount)) * 1.15 || 100;
  const totalWeekRevenue = chartData.reduce((sum, d) => sum + d.amount, 0);
  const peakDay = [...chartData].sort((a, b) => b.amount - a.amount)[0];

  // Compact SVG dimensions so no scroll is needed
  const svgWidth = 600;
  const svgHeight = 120;
  const paddingX = 35;
  const paddingY = 18;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const getPoints = () => {
    return chartData.map((d, i) => {
      const x = paddingX + (i / (chartData.length - 1)) * chartW;
      const val = activeMetric === 'REVENUE' ? d.amount : activeMetric === 'TRANSACTIONS' ? d.txCount : d.rxCount;
      const y = svgHeight - paddingY - (val / maxVal) * chartH;
      return { x, y, ...d, val };
    });
  };

  const points = getPoints();
  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontFamily: 'var(--font-sans)', maxHeight: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      {/* Page Header (Compact) */}
      <div className="flex-between">
        <div>
          <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {isRetail ? 'Pharmacy Executive Dashboard' : 'Wholesale Command Dashboard'}
          </h2>
          <p className="subtext" style={{ marginTop: '0.1rem', fontSize: '11px' }}>
            Live sales turnover, prescription audit metrics, and stock health monitor
          </p>
        </div>

        <button
          onClick={() => onNavigate('pos')}
          className="btn btn-primary"
          style={{ borderRadius: '10px', fontSize: '11px', backgroundColor: '#0284c7', padding: '0.4rem 0.85rem', fontWeight: 700 }}
        >
          <ShoppingCart size={13} /> Open POS Counter
        </button>
      </div>

      {/* 4 KPI METRIC CARDS (Compact) */}
      <div className="grid-4" style={{ gap: '0.65rem' }}>
        {/* Today Turnover */}
        <div className="card ksi-card kpi-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '12px' }}>
          <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9.5px', color: '#64748b' }}>Today's Turnover</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={14} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
            Rs. {todayTurnover.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <ArrowUpRight size={11} /> {todayInvoices.length} Bills Completed
          </div>
        </div>

        {/* Est Net Margin */}
        <div className="card ksi-card kpi-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '12px' }}>
          <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9.5px', color: '#64748b' }}>Est. Net Profit</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={14} color="#047857" />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#047857' }}>
            Rs. {todayProfit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '0.15rem' }}>
            22% Average Retail Margin
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className="card ksi-card kpi-card" style={{ backgroundColor: lowStockCount > 0 ? '#fffbe0' : '#ffffff', borderColor: lowStockCount > 0 ? '#fde68a' : '#e2e8f0', padding: '0.75rem', borderRadius: '12px' }}>
          <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
            <span className="subtext" style={{ fontWeight: 700, color: lowStockCount > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', fontSize: '9.5px' }}>Low Stock Items</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: lowStockCount > 0 ? '#fde68a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={14} color={lowStockCount > 0 ? '#b45309' : '#64748b'} />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: lowStockCount > 0 ? '#b45309' : '#0f172a' }}>
            {lowStockCount} Medicines
          </div>
          <div style={{ fontSize: '10px', color: lowStockCount > 0 ? '#b45309' : '#64748b', marginTop: '0.15rem' }}>
            Stock count &le; 5 boxes
          </div>
        </div>

        {/* Near-Expiry Radar */}
        <div className="card ksi-card kpi-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '12px' }}>
          <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9.5px', color: '#64748b' }}>Near-Expiry Radar</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={14} color="#ef4444" />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>
            {nearExpiryCount} Batches
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '0.15rem' }}>
            Expiring in &le; 6 months
          </div>
        </div>
      </div>

      {/* COMPACT 7-DAY SALES TREND VISUALIZATION */}
      <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
        <div className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
              <Activity size={15} color="#0284c7" /> 7-Day Performance Graph Visualizer
            </h3>
          </div>

          {/* Metric Toggle Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveMetric('REVENUE')}
              style={{
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeMetric === 'REVENUE' ? '#ffffff' : 'transparent',
                color: activeMetric === 'REVENUE' ? '#0284c7' : '#64748b',
                fontWeight: 700,
                fontSize: '10.5px',
                cursor: 'pointer',
                boxShadow: activeMetric === 'REVENUE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              💰 Revenue (PKR)
            </button>
            <button
              onClick={() => setActiveMetric('TRANSACTIONS')}
              style={{
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeMetric === 'TRANSACTIONS' ? '#ffffff' : 'transparent',
                color: activeMetric === 'TRANSACTIONS' ? '#0284c7' : '#64748b',
                fontWeight: 700,
                fontSize: '10.5px',
                cursor: 'pointer',
                boxShadow: activeMetric === 'TRANSACTIONS' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              🧾 Total Bills
            </button>
            <button
              onClick={() => setActiveMetric('RX')}
              style={{
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeMetric === 'RX' ? '#ffffff' : 'transparent',
                color: activeMetric === 'RX' ? '#0284c7' : '#64748b',
                fontWeight: 700,
                fontSize: '10.5px',
                cursor: 'pointer',
                boxShadow: activeMetric === 'RX' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              💊 Rx Prescriptions
            </button>
          </div>
        </div>

        {/* Compact SVG Graph */}
        <div style={{ position: 'relative', width: '100%' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '115px' }}>
            <defs>
              <linearGradient id="chartGradientCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.33, 0.66, 1].map((ratio, idx) => {
              const y = paddingY + ratio * chartH;
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Area Gradient */}
            <path d={areaD} fill="url(#chartGradientCompact)" />

            {/* Trend Line */}
            <path d={pathD} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Points */}
            {points.map((p, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? '#0284c7' : '#ffffff'}
                    stroke="#0284c7"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />

                  {/* Value Tag on Top */}
                  <text
                    x={p.x}
                    y={p.y - 7}
                    textAnchor="middle"
                    fill={isHovered ? '#0f172a' : '#64748b'}
                    fontSize={isHovered ? '9.5' : '8.5'}
                    fontWeight={isHovered ? '800' : '600'}
                  >
                    {activeMetric === 'REVENUE' ? `${(p.amount / 1000).toFixed(1)}k` : p.val}
                  </text>

                  {/* Day Label on X-axis */}
                  <text
                    x={p.x}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    fill={idx === points.length - 1 ? '#0284c7' : '#94a3b8'}
                    fontSize="9.5"
                    fontWeight={idx === points.length - 1 ? '800' : '600'}
                  >
                    {p.day.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer Mini Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', textAlign: 'center', fontSize: '11px' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '10px' }}>7-Day Total: </span>
            <strong style={{ color: '#0f172a' }}>Rs. {totalWeekRevenue.toLocaleString('en-PK')}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '10px' }}>Peak Sales: </span>
            <strong style={{ color: '#16a34a' }}>
              {peakDay && peakDay.amount > 0 ? `${peakDay.day.split(' ')[0]} (${(peakDay.amount / 1000).toFixed(1)}k)` : 'None yet (0k)'}
            </strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '10px' }}>Daily Avg: </span>
            <strong style={{ color: '#0284c7' }}>Rs. {Math.round(totalWeekRevenue / 7).toLocaleString('en-PK')}/day</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
