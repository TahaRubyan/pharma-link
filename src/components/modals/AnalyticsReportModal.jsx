import React from 'react';
import { X, Printer, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const AnalyticsReportModal = ({ isOpen, onClose, analyticsData, invoices: propInvoices }) => {
  const { currentShop } = useAuth();
  if (!isOpen) return null;

  const invoices = propInvoices || analyticsData?.invoices || [];

  const handlePrint = () => {
    window.print();
  };

  // Dynamic calculations
  const grossTurnover = invoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.grossTotal || 0), 0);
  const estProfit = invoices.reduce((sum, inv) => sum + (Number(inv.netTotal || inv.grossTotal || 0) * 0.25), 0);
  const outstandingDebt = invoices.reduce((sum, inv) => sum + Number(inv.remainingDebt || 0), 0);

  // Top 5 fast moving medicines
  const medicineMap = {};
  invoices.forEach((inv) => {
    (inv.items || []).forEach((item) => {
      const name = item.name || item.brandName || 'Item';
      const qty = Number(item.qty || item.quantity || 1);
      const total = Number(item.total || (qty * (item.price || item.unitPrice || 0)));
      if (!medicineMap[name]) {
        medicineMap[name] = { name, qty: 0, total: 0 };
      }
      medicineMap[name].qty += qty;
      medicineMap[name].total += total;
    });
  });

  const topMedicines = Object.values(medicineMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Group by date for Daily Summary & Reconciliation
  const dailyMap = {};
  invoices.forEach((inv) => {
    const date = inv.date || 'Unknown';
    if (!dailyMap[date]) {
      dailyMap[date] = { date, count: 0, turnover: 0, profit: 0, debt: 0 };
    }
    const net = Number(inv.netTotal || inv.grossTotal || 0);
    dailyMap[date].count += 1;
    dailyMap[date].turnover += net;
    dailyMap[date].profit += net * 0.25;
    dailyMap[date].debt += Number(inv.remainingDebt || 0);
  });

  const dailySummaries = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '840px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
              <TrendingUp size={18} color="#0284c7" /> Official Commercial Sales & Profit Analytics Report
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              {currentShop ? currentShop.shopName : 'Testing Shop'} | Generated: {formatDateDDMMYYYY(new Date())}
            </p>
          </div>

          <button onClick={handlePrint} className="btn btn-primary" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#0284c7' }}>
            <Printer size={15} /> Print Analytics PDF
          </button>
        </div>

        {/* 3 KPI BOXES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>GROSS WHOLESALE TURNOVER</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              Rs. {grossTurnover.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>ESTIMATED NET PROFIT (25%)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
              Rs. {estProfit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ backgroundColor: '#fff7ed', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: 700 }}>OUTSTANDING CUSTOMER DEBT</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>
              Rs. {outstandingDebt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* TOP 5 RANKED MEDICINES */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
            🏆 Top Fast-Moving Medicines:
          </div>

          {topMedicines.length === 0 ? (
            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              No medicine sales recorded for this period.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(topMedicines.length, 5)}, 1fr)`, gap: '0.5rem', textAlign: 'center' }}>
              {topMedicines.map((med, idx) => (
                <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>Rank #{idx + 1}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{med.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{med.qty} Units | Rs. {med.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DAILY RECONCILIATION TABLE */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
            📅 Daily Sales Summary & Reconciliation:
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Wholesale Orders</th>
                  <th style={{ textAlign: 'right' }}>Daily Gross Turnover</th>
                  <th style={{ textAlign: 'right' }}>Est. Daily Profit (25%)</th>
                  <th style={{ textAlign: 'right' }}>Outstanding Credit Debt</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748b' }}>
                      No sales records found for this period.
                    </td>
                  </tr>
                ) : (
                  dailySummaries.map((day, idx) => (
                    <tr key={idx}>
                      <td>{day.date}</td>
                      <td>{day.count} Orders</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {day.turnover.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>Rs. {day.profit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: day.debt > 0 ? '#ea580c' : '#64748b' }}>Rs. {day.debt.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${day.debt === 0 ? 'badge-success' : 'badge-warning'}`}>
                          {day.debt === 0 ? 'RECONCILED' : 'OUTSTANDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportModal;
