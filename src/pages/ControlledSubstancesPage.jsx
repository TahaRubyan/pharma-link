import React, { useState, useMemo } from 'react';
import { ShieldAlert, Printer, Search, Calendar, ChevronDown, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';
import PrintControlledRegisterModal from '../components/modals/PrintControlledRegisterModal';

const MOCK_CONTROLLED_REGISTER_ITEMS = [];

export const ControlledSubstancesPage = () => {
  const { invoices = [] } = useSales();
  const { currentShop } = useAuth();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [dateRangePreset, setDateRangePreset] = useState('TODAY'); // 'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM'

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Accordion state: set of expanded dates (Today expanded by default)
  const [expandedDates, setExpandedDates] = useState({ [todayStr]: true });

  const toggleDateAccordion = (dateKey) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // Compile all register rows from real sales invoices
  const allRegisterRows = useMemo(() => {
    const liveRows = [];
    invoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const type = item.controlledType || (item.requiresPrescription ? 'Narcotic' : 'OTC');
        liveRows.push({
          invoiceNo: inv.invoiceNo,
          date: inv.date,
          time: inv.time,
          cashierName: inv.cashierName || 'Dr. Idrees (Pharmacist)',
          customerName: inv.customerName || (inv.patient ? inv.patient.name : 'Walk-in Customer'),
          doctorName: inv.doctorName || (inv.patient ? inv.patient.prescribingDoctor : 'Dr. Aamir Khan (PMC-45812)'),
          brandName: item.brandName || item.name,
          batchNumber: item.batchNumber || item.batchNo || 'B-101',
          controlledType: type,
          quantity: item.quantity || item.qty || 1,
          unitSelection: item.unitSelection || 'Tablet',
          unitPrice: Number(item.unitPrice || item.rate || 0),
          total: Number(item.total || ((item.quantity || item.qty || 1) * (item.rate || 0))),
        });
      });
    });
    return liveRows;
  }, [invoices]);

  // Filter sales based on category, date preset, and search query
  const filteredSales = useMemo(() => {
    return allRegisterRows.filter((r) => {
      if (activeCategory !== 'ALL' && r.controlledType !== activeCategory) return false;

      if (dateRangePreset === 'TODAY') {
        if (r.date !== todayStr) return false;
      } else if (dateRangePreset === '7DAYS') {
        if (r.date < sevenDaysAgoStr) return false;
      } else if (dateRangePreset === '30DAYS') {
        if (r.date < thirtyDaysAgoStr) return false;
      } else if (dateRangePreset === 'CUSTOM') {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.brandName.toLowerCase().includes(q) ||
          r.doctorName.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.batchNumber.toLowerCase().includes(q) ||
          r.cashierName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allRegisterRows, activeCategory, dateRangePreset, startDate, endDate, searchQuery, todayStr]);

  // Group filtered sales by Date for Daily Accordion
  const dateGroupedSales = useMemo(() => {
    const groups = {};
    filteredSales.forEach((r) => {
      const d = r.date || todayStr;
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(r);
    });

    // Sort dates descending (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    return sortedKeys.map((dateKey) => ({
      date: dateKey,
      isToday: dateKey === todayStr || dateKey === new Date().toISOString().split('T')[0],
      items: groups[dateKey],
      totalItemsSold: groups[dateKey].reduce((sum, item) => sum + Number(item.quantity || 1), 0),
      totalValue: groups[dateKey].reduce((sum, item) => sum + Number(item.total || 0), 0),
    }));
  }, [filteredSales, todayStr]);

  const totalFilteredCount = filteredSales.length;
  const totalFilteredUnits = filteredSales.reduce((sum, r) => sum + Number(r.quantity || 1), 0);
  const totalFilteredAmount = filteredSales.reduce((sum, r) => sum + Number(r.total || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* Page Header */}
      <div className="flex-between">
        <div>
          <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Controlled Substances Daily PDF Register
          </h2>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Regulatory audit logbook for Narcotics, Steroids & OTC Sales (DRAP Form 6/7 Compliance with Daily Accordion)
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="btn btn-primary"
          style={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#0284c7', padding: '0.55rem 1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={15} /> Print / Export PDF Register
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`btn ${activeCategory === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', borderRadius: '9999px', padding: '0.35rem 0.75rem' }}
            >
              All Items ({allRegisterRows.length})
            </button>
            <button
              onClick={() => setActiveCategory('Narcotic')}
              className={`btn ${activeCategory === 'Narcotic' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', borderRadius: '9999px', padding: '0.35rem 0.75rem', backgroundColor: activeCategory === 'Narcotic' ? '#dc2626' : '#fef2f2', color: activeCategory === 'Narcotic' ? '#ffffff' : '#dc2626', borderColor: '#fca5a5' }}
            >
              💊 Narcotics Register
            </button>
            <button
              onClick={() => setActiveCategory('Steroid')}
              className={`btn ${activeCategory === 'Steroid' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', borderRadius: '9999px', padding: '0.35rem 0.75rem', backgroundColor: activeCategory === 'Steroid' ? '#b45309' : '#fffbe0', color: activeCategory === 'Steroid' ? '#ffffff' : '#b45309', borderColor: '#fde68a' }}
            >
              🧪 Steroids Register
            </button>
            <button
              onClick={() => setActiveCategory('OTC')}
              className={`btn ${activeCategory === 'OTC' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', borderRadius: '9999px', padding: '0.35rem 0.75rem', backgroundColor: activeCategory === 'OTC' ? '#047857' : '#ecfdf5', color: activeCategory === 'OTC' ? '#ffffff' : '#047857', borderColor: '#a7f3d0' }}
            >
              🩹 Counter / OTC Register
            </button>
          </div>

          {/* Time Range Presets */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <Calendar size={14} color="#0284c7" />
            {['TODAY', '7DAYS', '30DAYS', 'CUSTOM'].map((preset) => (
              <button
                key={preset}
                onClick={() => setDateRangePreset(preset)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: dateRangePreset === preset ? '#0284c7' : '#ffffff',
                  color: dateRangePreset === preset ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {preset === 'TODAY' ? 'Today (Open)' : preset === '7DAYS' ? '7 Days' : preset === '30DAYS' ? '30 Days' : 'Custom'}
              </button>
            ))}

            {dateRangePreset === 'CUSTOM' && (
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginLeft: '0.35rem' }}>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10.5px' }} />
                <span style={{ fontSize: '10px' }}>to</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '10.5px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
          <input
            type="text"
            placeholder="Search Medicine Name, Doctor Name, Patient Name, Batch #, or Dispensed Cashier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
        </div>
      </div>

      {/* KPI SUMMARY BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>LOGGED DISPENSING DATES</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>
            {dateGroupedSales.length} Day Shifts
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700 }}>TOTAL CONTROLLED UNITS DISPENSED</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626', marginTop: '0.15rem' }}>
            {totalFilteredUnits} Tablets / Units
          </div>
        </div>

        <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
          <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>TOTAL REGISTER AUDIT VALUE</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a', marginTop: '0.15rem' }}>
            Rs. {totalFilteredAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* DAILY ACCORDION REGISTER LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {dateGroupedSales.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', backgroundColor: '#ffffff', borderRadius: '14px' }}>
            No controlled substances sales recorded for this date selection.
          </div>
        ) : (
          dateGroupedSales.map((group) => {
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
                        <span>📅 Date: {group.date}</span>
                        {group.isToday && (
                          <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '9.5px', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
                            TODAY (ACTIVE)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.1rem' }}>
                        {group.items.length} Dispensing Records • {group.totalItemsSold} Tablets Dispensed
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Shift Total:</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a' }}>
                        Rs. {group.totalValue.toFixed(2)}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                      {isExpanded ? '▲ Collapse' : '▼ Click to Expand'}
                    </span>
                  </div>
                </div>

                {/* EXPANDABLE ITEM TABLE */}
                {isExpanded && (
                  <div style={{ padding: '0.75rem 1.25rem' }}>
                    <div className="table-container">
                      <table className="table" style={{ fontSize: '11px' }}>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Medicine Name</th>
                            <th>Category Tag</th>
                            <th>Batch #</th>
                            <th style={{ textAlign: 'center' }}>Qty Sold</th>
                            <th>Prescribing Doctor</th>
                            <th>Patient Name</th>
                            <th>Dispensed By</th>
                            <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((r, rIdx) => (
                            <tr key={rIdx}>
                              <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b' }}>{r.time}</td>
                              <td style={{ fontWeight: 700 }}>{r.brandName}</td>
                              <td>
                                <span className={`badge ${r.controlledType === 'Narcotic' ? 'badge-danger' : r.controlledType === 'Steroid' ? 'badge-warning' : 'badge-otc'}`}>
                                  {r.controlledType}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{r.batchNumber}</td>
                              <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.quantity} {r.unitSelection}s</td>
                              <td style={{ fontSize: '10.5px' }}>{r.doctorName}</td>
                              <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                              <td style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 600 }}>{r.cashierName}</td>
                              <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>Rs. {Number(r.total || 0).toFixed(2)}</td>
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

      {/* HIERARCHICAL PRINT REGISTER MODAL */}
      {isPrintModalOpen && (
        <PrintControlledRegisterModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          records={filteredSales}
          activeCategory={activeCategory}
        />
      )}
    </div>
  );
};

export default ControlledSubstancesPage;
