import React from 'react';
import { X, Printer, Truck, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const RegionalDeliveryManifestModal = ({ invoices = [], selectedRegion, onClose }) => {
  const { currentShop } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  const totalManifestNet = invoices.reduce((sum, inv) => sum + Number(inv.netTotal || inv.subtotal || 0), 0);
  const totalManifestDebt = invoices.reduce((sum, inv) => sum + (inv.remainingDebt !== undefined ? Number(inv.remainingDebt) : Number(inv.netTotal || 0)), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        {/* Action Header */}
        <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} color="#0284C7" /> Regional Delivery Route Manifest Report
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Territory Zone: <strong>{selectedRegion}</strong> • {invoices.length} Outgoing Invoices
            </p>
          </div>

          <button onClick={handlePrint} className="btn btn-outline" style={{ borderRadius: '10px', fontSize: '12px' }}>
            <Printer size={15} /> Print Delivery Manifest
          </button>
        </div>

        {/* MANIFEST REPORT CONTAINER */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{currentShop ? currentShop.shopName : 'PharmaLink Wholesale Store'}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Delivery Territory: <strong>{selectedRegion}</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>MANIFEST DATE</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatDateDDMMYYYY(new Date())}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Deliveries</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{invoices.length} Shops</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Manifest Value</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginTop: '0.15rem' }}>Rs. {totalManifestNet.toLocaleString('en-PK')}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Pending Recovery</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#b45309', marginTop: '0.15rem' }}>Rs. {totalManifestDebt.toLocaleString('en-PK')}</div>
            </div>
          </div>
        </div>

        {/* MANIFEST INVOICES TABLE */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Pharmacy Shop Name</th>
                <th>Delivery Person</th>
                <th>Total Value</th>
                <th>Pending Debt</th>
                <th>Driver Collection Signature</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const net = Number(inv.netTotal || inv.subtotal || 0);
                const rem = inv.remainingDebt !== undefined ? Number(inv.remainingDebt) : net;

                return (
                  <tr key={inv.invoiceNo}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNo}</td>
                    <td style={{ fontWeight: 700 }}>{inv.shopName || inv.customerName}</td>
                    <td style={{ fontSize: '12px' }}>{inv.deliveryMan || 'Driver'}</td>
                    <td style={{ fontWeight: 700 }}>Rs. {net.toLocaleString('en-PK')}</td>
                    <td style={{ fontWeight: 700, color: '#b45309' }}>Rs. {rem.toLocaleString('en-PK')}</td>
                    <td style={{ borderBottom: '1px dashed #cbd5e1', width: '180px' }}></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close Manifest
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegionalDeliveryManifestModal;
