import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  RotateCcw, 
  DollarSign, 
  FileText, 
  Search, 
  Phone, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSupplier } from '../context/SupplierContext';
import { useAuth } from '../context/AuthContext';
import RTVModal from '../components/modals/RTVModal';
import NewPOModal from '../components/modals/NewPOModal';
import RetailNewPOModal from '../components/modals/RetailNewPOModal';
import SupplierPaymentModal from '../components/modals/SupplierPaymentModal';
import SupplierLedgerModal from '../components/modals/SupplierLedgerModal';

export const SuppliersPage = () => {
  const { suppliers = [], purchaseOrders = [] } = useSupplier();
  const { currentShop } = useAuth();
  const isRetail = currentShop?.mode === 'RETAIL';

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'DEBT_ONLY'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRTVOpen, setIsRTVOpen] = useState(false);
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isRetailPOOpen, setIsRetailPOOpen] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState(null);
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState(null);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const debt = Number(s.outstandingDebt || s.pendingBalance || 0);
      if (activeFilter === 'DEBT_ONLY' && debt <= 0) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.companyName && s.companyName.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.gstin && s.gstin.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [suppliers, activeFilter, searchQuery]);

  const debtOwingCount = suppliers.filter((s) => Number(s.outstandingDebt || s.pendingBalance || 0) > 0).length;
  const netPayableDebt = suppliers.reduce((sum, s) => sum + Number(s.outstandingDebt || s.pendingBalance || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* TOP HEADER & ACTION BUTTONS */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Truck size={22} color="#ffffff" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              {isRetail ? 'Retail Pharmacy Supplier Directory & Shelf Inward POs' : 'Pakistan Supplier Directory & Stock Inward Orders'}
            </h3>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.9 }}>
              {isRetail
                ? 'Manage pharmaceutical distributors, packaging conversion (Strips/Tabs), shelf stocking & inward invoices'
                : 'Distributor company directory, license verification, ledger statements & inward PO shipments'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isRetail && (
            <button
              onClick={() => setIsRTVOpen(true)}
              className="btn btn-outline"
              style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
            >
              <RotateCcw size={14} /> Return Stock (RTV Debit Note)
            </button>
          )}

          <button
            onClick={() => (isRetail ? setIsRetailPOOpen(true) : setIsNewPOOpen(true))}
            className="btn btn-outline"
            style={{ backgroundColor: '#ffffff', color: '#0284c7', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
          >
            <Plus size={14} /> {isRetail ? '+ Inward Shelf Stock (Retail PO)' : '+ New Purchase Order'}
          </button>
        </div>
      </div>

      {/* 3 KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>REGISTERED PHARMA DISTRIBUTORS</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
            {suppliers.length} Companies
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
          <div style={{ fontSize: '10px', color: '#be123c', fontWeight: 700 }}>DISTRIBUTORS WITH OUTSTANDING DEBT</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#be123c', marginTop: '0.2rem' }}>
            {debtOwingCount} Distributors Owing Debt
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700 }}>NET PAYABLE VENDOR BALANCE</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
            Rs. {netPayableDebt.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* SUPPLIER DIRECTORY TABLE */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
            Pharma Distributor Directory ({suppliers.length} Companies)
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search supplier, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.35rem 0.65rem 0.35rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
              />
            </div>

            <button
              onClick={() => setActiveFilter('ALL')}
              className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', padding: '0.35rem 0.65rem', borderRadius: '8px' }}
            >
              All Companies ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveFilter('DEBT_ONLY')}
              className={`btn ${activeFilter === 'DEBT_ONLY' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '11px', padding: '0.35rem 0.65rem', borderRadius: '8px', backgroundColor: activeFilter === 'DEBT_ONLY' ? '#dc2626' : 'transparent', color: activeFilter === 'DEBT_ONLY' ? '#ffffff' : '#dc2626', borderColor: '#fca5a5' }}
            >
              Debt Owing Only ({debtOwingCount})
            </button>
          </div>
        </div>

        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th>Distributor / Company Name</th>
                <th>Contact Phone</th>
                <th>GSTIN / License #</th>
                <th>City</th>
                <th style={{ textAlign: 'center' }}>Total Orders</th>
                <th style={{ textAlign: 'right' }}>Outstanding Debt</th>
                <th style={{ textAlign: 'center' }}>Company Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s, idx) => {
                const debt = Number(s.outstandingDebt || s.pendingBalance || 0);

                return (
                  <tr key={s.id || idx}>
                    <td style={{ fontWeight: 700 }}>{s.name || s.companyName}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{s.phone}</td>
                    <td>{s.gstin || s.licenseNo || 'PK-1234567-8'}</td>
                    <td>{s.city}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-otc">{s.totalOrders || 0} Orders</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: debt > 0 ? '#dc2626' : '#16a34a' }}>
                      Rs. {debt.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => setSelectedSupplierForLedger(s)}
                          className="btn btn-outline"
                          style={{ fontSize: '10px', padding: '0.2rem 0.5rem' }}
                        >
                          <FileText size={11} /> View Ledger
                        </button>
                        <button
                          onClick={() => (isRetail ? setIsRetailPOOpen(true) : setIsNewPOOpen(true))}
                          className="btn btn-outline"
                          style={{ fontSize: '10px', padding: '0.2rem 0.4rem', color: '#0284c7' }}
                        >
                          + Inward PO
                        </button>
                        <button
                          onClick={() => setSelectedSupplierForPay(s)}
                          className="btn btn-primary"
                          style={{ fontSize: '10px', padding: '0.2rem 0.45rem', backgroundColor: '#16a34a' }}
                        >
                          $ Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* INWARD STOCK PURCHASE ORDERS TABLE */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem' }}>
            Inward Stock Purchase Orders ({purchaseOrders.length})
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>PO Reference #</th>
                  <th>Distributor / Supplier</th>
                  <th>Date</th>
                  <th>Item Lines</th>
                  <th style={{ textAlign: 'right' }}>Total Cost</th>
                  <th style={{ textAlign: 'center' }}>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0284c7' }}>{po.poNumber || po.poReference}</td>
                    <td style={{ fontWeight: 600 }}>{po.distributor || po.supplierName}</td>
                    <td>{po.date}</td>
                    <td>{po.itemLines || `${po.itemName} (${po.boxesReceived} Boxes)`}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      Rs. {Number(po.totalAmount || 96000).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-success">{po.paymentStatus || 'PAID IN FULL'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-otc">{po.stockStatus || 'Stock Received'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isRTVOpen && (
        <RTVModal
          isOpen={isRTVOpen}
          onClose={() => setIsRTVOpen(false)}
        />
      )}

      {isNewPOOpen && (
        <NewPOModal
          isOpen={isNewPOOpen}
          onClose={() => setIsNewPOOpen(false)}
        />
      )}

      {isRetailPOOpen && (
        <RetailNewPOModal
          isOpen={isRetailPOOpen}
          onClose={() => setIsRetailPOOpen(false)}
        />
      )}

      {selectedSupplierForPay && (
        <SupplierPaymentModal
          isOpen={Boolean(selectedSupplierForPay)}
          supplier={selectedSupplierForPay}
          onClose={() => setSelectedSupplierForPay(null)}
        />
      )}

      {selectedSupplierForLedger && (
        <SupplierLedgerModal
          isOpen={Boolean(selectedSupplierForLedger)}
          supplier={selectedSupplierForLedger}
          onClose={() => setSelectedSupplierForLedger(null)}
        />
      )}
    </div>
  );
};

export default SuppliersPage;
