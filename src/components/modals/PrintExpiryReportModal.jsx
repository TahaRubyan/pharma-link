import React from 'react';
import { X, Printer, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const PrintExpiryReportModal = ({ isOpen, items = [], onClose }) => {
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
            <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}>
              <AlertTriangle size={18} color="#dc2626" /> Pakistan Pharmacy Expiry Radar & Loss Control Audit Report
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              {currentShop ? currentShop.shopName : 'IDREES PHARMA DISTRIBUTOR'} | Generated Date: {formatDateDDMMYYYY(new Date())}
            </p>
          </div>

          <button onClick={handlePrint} className="btn btn-primary" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#dc2626' }}>
            <Printer size={15} /> Print Expiry Report PDF
          </button>
        </div>

        {/* REPORT TABLE */}
        <div className="table-container" style={{ marginBottom: '1.25rem' }}>
          <table className="table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th>Sr.</th>
                <th>Medicine Trade Name</th>
                <th>Generic Formula</th>
                <th>Batch #</th>
                <th>Rack Location</th>
                <th>Expiry Date</th>
                <th>Status / Days Left</th>
                <th style={{ textAlign: 'center' }}>Box Stock</th>
                <th style={{ textAlign: 'right' }}>Box MRP (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{item.tradeName || item.name || item.brandName}</td>
                  <td style={{ color: '#475569' }}>{item.genericFormula || item.formula}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{item.batchNo || item.batchNumber}</td>
                  <td>{item.rackLocation || 'Rack B-03 / Shelf 1'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{item.expiryDate}</td>
                  <td>
                    <span className="badge badge-danger">
                      ⚠️ {item.daysLeft || '47 Days Left (<= 6 Months)'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.boxStock || 10} Boxes</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {Number(item.boxPrice || item.price || 350).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintExpiryReportModal;
