import React from 'react';
import { X, Printer, Package, Truck, CheckCircle } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const StockMovementAuditModal = ({ isOpen, medicine, onClose }) => {
  const { currentShop } = useAuth();
  if (!isOpen || !medicine) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
              <Package size={18} color="#0284c7" /> Stock Movement & Regional Distribution Audit
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Target Medicine: <strong>{medicine.name || medicine.brandName}</strong> ({medicine.formula || medicine.genericFormula}) — [Code: {medicine.itemCode || medicine.id}]
            </p>
          </div>

          <button onClick={handlePrint} className="btn btn-primary" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#0284c7' }}>
            <Printer size={15} /> Print Stock Audit PDF
          </button>
        </div>

        {/* 4 KPI BOXES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>INITIAL INWARD STOCK</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>10 Boxes</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total inward batch inflow</div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700 }}>TOTAL QUANTITY SOLD</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>10 Boxes</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Sum of sold invoices</div>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>REMAINING IN STOCK</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>0 Boxes</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Current available balance</div>
          </div>

          <div style={{ backgroundColor: '#fff7ed', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fed7aa', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: 700 }}>STOCK TURNOVER RATE</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>100.0%</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Depletion velocity %</div>
          </div>
        </div>

        {/* REGIONAL SALES BREAKDOWN TABLE */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
            📍 Regional & Shop-Wise Sales Distribution Breakdown
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Shop / Customer Name</th>
                  <th style={{ textAlign: 'center' }}>Purchased Boxes Qty</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue (Rs.)</th>
                  <th style={{ textAlign: 'center' }}>Invoices</th>
                  <th>Last Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge badge-otc">Gujrat</span></td>
                  <td style={{ fontWeight: 700 }}>Muhammad Ali</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>10 Boxes</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. 30.00</td>
                  <td style={{ textAlign: 'center' }}>1 Orders</td>
                  <td>2026-08-27</td>
                </tr>
                <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>
                  <td colSpan="2">DISTRIBUTION TOTALS:</td>
                  <td style={{ textAlign: 'center', color: '#0284c7' }}>10 Boxes</td>
                  <td style={{ textAlign: 'right' }}>Rs. 30.00</td>
                  <td style={{ textAlign: 'center' }}>1 Orders</td>
                  <td>✔ Verified Ledger</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* DRIVER AUDIT LOG TABLE */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
            🚚 Item Sales Transaction & Delivery Driver Audit Log
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Date / Time</th>
                  <th>Invoice #</th>
                  <th>Customer / Shop Name</th>
                  <th>Region</th>
                  <th style={{ textAlign: 'center' }}>Boxes Sold</th>
                  <th style={{ textAlign: 'right' }}>Total Value (Rs.)</th>
                  <th>Sold By (Cashier)</th>
                  <th>Delivery Driver Name</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2026-08-27</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>INV-20260801-001</td>
                  <td style={{ fontWeight: 600 }}>Muhammad Ali</td>
                  <td>Gujrat</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>10 Boxes</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. 30.00</td>
                  <td>👤 Dr. Idrees</td>
                  <td><span className="badge badge-warning">Ayan (Driver)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockMovementAuditModal;
