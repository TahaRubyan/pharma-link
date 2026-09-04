import React from 'react';
import { X, Printer, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const AnalyticsReportModal = ({ isOpen, onClose, analyticsData }) => {
  const { currentShop } = useAuth();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

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
              {currentShop ? currentShop.shopName : 'IDREES PHARMA DISTRIBUTOR'} | Generated: {formatDateDDMMYYYY(new Date())}
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
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>Rs. 1,006.15</div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>ESTIMATED NET PROFIT (25%)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>Rs. 251.538</div>
          </div>

          <div style={{ backgroundColor: '#fff7ed', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: 700 }}>OUTSTANDING CUSTOMER DEBT</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>Rs. 0.00</div>
          </div>
        </div>

        {/* TOP 5 RANKED MEDICINES */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
            🏆 Top 5 Fast-Moving Medicines:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>Rank #1</div>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '0.15rem' }}>Panadol 500mg</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>10 Boxes | Rs. 30.00</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>Rank #2</div>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '0.15rem' }}>Arinac Forte</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>10 Boxes | Rs. 85.00</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>Rank #3</div>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '0.15rem' }}>Risek 20mg</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>1 Boxes | Rs. 150.00</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>Rank #4</div>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '0.15rem' }}>Augmentin 625mg</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>1 Boxes | Rs. 420.00</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>Rank #5</div>
              <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '0.15rem' }}>Deltacortril 5mg</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>1 Boxes | Rs. 320.00</div>
            </div>
          </div>
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
                <tr>
                  <td>29-08-2026</td>
                  <td>1 Orders</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. 890.00</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>Rs. 222.50</td>
                  <td style={{ textAlign: 'right' }}>Rs. 0.00</td>
                  <td style={{ textAlign: 'center' }}><span className="badge badge-success">RECONCILED</span></td>
                </tr>
                <tr>
                  <td>27-08-2026</td>
                  <td>1 Orders</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. 116.15</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>Rs. 29.038</td>
                  <td style={{ textAlign: 'right' }}>Rs. 0.00</td>
                  <td style={{ textAlign: 'center' }}><span className="badge badge-success">RECONCILED</span></td>
                </tr>
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
