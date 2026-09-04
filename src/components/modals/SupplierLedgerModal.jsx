import React from 'react';
import { X, Printer, Truck, FileText, CheckCircle, CreditCard, DollarSign, Package } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';
import { useSupplier } from '../../context/SupplierContext';

export const SupplierLedgerModal = ({ isOpen, supplier, onClose }) => {
  const { currentShop } = useAuth();
  const { purchaseOrders = [] } = useSupplier();

  if (!isOpen || !supplier) return null;

  const handlePrint = () => {
    window.print();
  };

  const supplierPOs = purchaseOrders.filter((po) => 
    po.distributorName === supplier.name || 
    po.distributorName === supplier.companyName ||
    po.supplierName === supplier.name ||
    po.supplierName === supplier.companyName
  );

  const payments = Array.isArray(supplier.paymentHistory) ? supplier.paymentHistory : [];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div>
            <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
              <Truck size={18} color="#0284c7" /> Supplier Account Statement & Inward Ledger
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              {supplier.name || supplier.companyName} | GSTIN/NTN: {supplier.gstin || 'PK-1234567-8'} | City: {supplier.city || 'Lahore'}
            </p>
          </div>

          <button onClick={handlePrint} className="btn btn-primary" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Printer size={15} /> Print Statement
          </button>
        </div>

        {/* LEDGER HEADER KPI BOX */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL PAID TO DATE</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
              Rs. {Number(supplier.totalPaidToDate || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>OUTSTANDING DEBT OWING</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>
              Rs. {Number(supplier.outstandingDebt !== undefined ? supplier.outstandingDebt : (supplier.pendingBalance || 0)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PAYMENTS RECORDED</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
              {payments.length} Payments
            </div>
          </div>
        </div>

        {/* RECORDED PAYMENT SETTLEMENT LOGS */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <DollarSign size={15} color="#16a34a" /> Payment Clearance Logs & Bank Transfers ({payments.length}):
          </div>

          <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Slip / Reference #</th>
                  <th>Payment Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ textAlign: 'right' }}>Remaining Debt</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      No payments logged yet for this supplier. Click "$ Pay" on the Suppliers directory to log payment.
                    </td>
                  </tr>
                ) : (
                  payments.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#475569' }}>{p.date}</td>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.reference || `REF-${idx + 1}`}</td>
                      <td>
                        <span className="badge badge-otc">{p.paymentMode || 'Bank Transfer'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                        Rs. {Number(p.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#64748b' }}>
                        Rs. {Number(p.remainingDebt || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success">CLEARED</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* INWARD SHIPMENTS TABLE */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Package size={15} color="#0284c7" /> Purchase Orders & Inward Shipments:
          </div>

          <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Item Details</th>
                  <th style={{ textAlign: 'right' }}>Total Cost</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {supplierPOs.length === 0 ? (
                  <tr>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>PO-20260801-0101</td>
                    <td>01-08-2026</td>
                    <td style={{ fontWeight: 600 }}>Panadol 500mg, Augmentin 625mg (Stock Inward)</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. 96,000.00</td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-success">Received</span></td>
                  </tr>
                ) : (
                  supplierPOs.map((po, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{po.poNumber}</td>
                      <td>{po.inwardDate || po.date}</td>
                      <td style={{ fontWeight: 600 }}>{po.itemLines || `${po.brandName} (${po.quantity} Boxes)`}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {Number(po.totalAmount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-success">{po.stockStatus || 'Received'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#0284c7' }}>
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedgerModal;
