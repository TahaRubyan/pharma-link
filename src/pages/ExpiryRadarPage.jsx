import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Printer, 
  RotateCcw, 
  Search, 
  Calendar, 
  Package,
  ShieldAlert
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import PrintExpiryReportModal from '../components/modals/PrintExpiryReportModal';

export const ExpiryRadarPage = () => {
  const { batches = [], medicines = [] } = useInventory();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'NEAR' | 'EXPIRED'
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const atRiskItems = useMemo(() => {
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    const items = [];
    batches.forEach((b) => {
      if (!b.expiryDate) return;
      let expDate;
      if (b.expiryDate.includes('-')) {
        const parts = b.expiryDate.split('-');
        if (parts[0].length === 2 && parts[1].length === 4) {
          // MM-YYYY
          expDate = new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        } else if (parts[0].length === 4) {
          // YYYY-MM
          expDate = new Date(b.expiryDate);
        }
      } else if (b.expiryDate.includes('/')) {
        const parts = b.expiryDate.split('/');
        if (parts[0].length === 2 && parts[1].length === 4) {
          // MM/YYYY
          expDate = new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        }
      }

      if (!expDate) return;

      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isExpired = diffDays <= 0;

      if (expDate <= sixMonthsFromNow) {
        const med = medicines.find((m) => m.id === b.medicineId);
        items.push({
          id: b.id || b.batchNumber,
          tradeName: med?.name || med?.brandName || b.medicineName || 'Medicine',
          genericFormula: med?.genericName || med?.genericFormula || '',
          batchNo: b.batchNumber || b.batchNo || 'LOT-01',
          rackLocation: med?.rackLocation || b.shelfLocation || 'Main Storage',
          expiryDate: b.expiryDate,
          daysLeft: isExpired ? `Expired ${Math.abs(diffDays)} Days Ago` : `${diffDays} Days Left (<= 6 Months)`,
          boxStock: b.boxStock || b.quantity || 0,
          boxPrice: b.boxPrice || b.boxMrp || b.mrp || 0,
          isExpired,
        });
      }
    });

    return items;
  }, [batches, medicines]);

  const nearCount = useMemo(() => atRiskItems.filter(i => !i.isExpired).length, [atRiskItems]);
  const expiredCount = useMemo(() => atRiskItems.filter(i => i.isExpired).length, [atRiskItems]);

  const displayedItems = useMemo(() => {
    let items = atRiskItems;
    if (filterTab === 'NEAR') items = items.filter((i) => !i.isExpired);
    if (filterTab === 'EXPIRED') items = items.filter((i) => i.isExpired);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.tradeName.toLowerCase().includes(q) ||
          i.genericFormula.toLowerCase().includes(q) ||
          i.batchNo.toLowerCase().includes(q) ||
          i.rackLocation.toLowerCase().includes(q)
      );
    }
    return items;
  }, [atRiskItems, filterTab, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* TOP BANNER */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <ShieldAlert size={22} color="#ffffff" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              Pharmacy Expiry Radar & Loss Control Center
            </h3>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.9 }}>
              Track near-expiry batches (≤ 6 months), quarantine expired stock & generate audit reports
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="btn btn-outline"
            style={{ backgroundColor: '#ffffff', color: '#0284c7', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
          >
            <Printer size={14} /> Print Expiry Report PDF
          </button>
          <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
            {atRiskItems.length} At-Risk Batches
          </span>
        </div>
      </div>

      {/* 3 FILTER TABS + SEARCH BAR */}
      <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`btn ${filterTab === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '11px', borderRadius: '8px', padding: '0.35rem 0.75rem' }}
          >
            All At-Risk Items ({atRiskItems.length})
          </button>
          <button
            onClick={() => setFilterTab('NEAR')}
            className={`btn ${filterTab === 'NEAR' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '11px', borderRadius: '8px', padding: '0.35rem 0.75rem' }}
          >
            Expiring in ≤ 6 Months ({nearCount})
          </button>
          <button
            onClick={() => setFilterTab('EXPIRED')}
            className={`btn ${filterTab === 'EXPIRED' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '11px', borderRadius: '8px', padding: '0.35rem 0.75rem', backgroundColor: filterTab === 'EXPIRED' ? '#dc2626' : 'transparent', color: filterTab === 'EXPIRED' ? '#ffffff' : '#dc2626', borderColor: '#fca5a5' }}
          >
            Already Expired ({expiredCount})
          </button>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
          <input
            type="text"
            placeholder="Search Medicine, Formula, Batch, Rack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.65rem 0.4rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626' }}>
            - Medicines Expiry & Audit Schedule (≤ 6 Months & Expired)
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            CRITICAL EXPIRY LIST
          </span>
        </div>

        <div className="table-container">
          <table className="table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>Sr.</th>
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
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No matching items found.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 700 }}>{item.tradeName}</td>
                    <td style={{ color: '#475569' }}>{item.genericFormula}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.batchNo}</td>
                    <td>📍 {item.rackLocation}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.expiryDate}</td>
                    <td>
                      <span className={`badge ${item.isExpired ? 'badge-danger' : 'badge-warning'}`}>
                        ⚠️ {item.daysLeft}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.boxStock} Boxes</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>Rs. {item.boxPrice.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT EXPORT MODAL */}
      {isPrintModalOpen && (
        <PrintExpiryReportModal
          isOpen={isPrintModalOpen}
          items={displayedItems}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ExpiryRadarPage;
