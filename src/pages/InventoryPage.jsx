import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Printer, 
  Plus, 
  CheckCircle,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import EditPriceModal from '../components/modals/EditPriceModal';

export const InventoryPage = () => {
  const { medicines = [], batches = [], setMedicines } = useInventory();
  const { currentShop } = useAuth();
  const isRetail = currentShop?.mode === 'RETAIL';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals state
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isEditPriceOpen, setIsEditPriceOpen] = useState(false);

  // Filtered Catalog Items
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.brandName && m.brandName.toLowerCase().includes(q)) ||
          (m.formula && m.formula.toLowerCase().includes(q)) ||
          (m.genericFormula && m.genericFormula.toLowerCase().includes(q)) ||
          (m.itemCode && m.itemCode.toString().toLowerCase().includes(q)) ||
          (m.rackLocation && m.rackLocation.toLowerCase().includes(q)) ||
          (m.manufacturer && m.manufacturer.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [medicines, selectedCategory, searchQuery]);

  const handleSavePrice = (id, updatedData) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m))
    );
  };

  const handleDeleteMedicine = (id) => {
    if (window.confirm('Are you sure you want to delete this medicine from the catalog?')) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* HEADER BANNER */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Package size={22} color="#ffffff" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
              {isRetail ? 'Retail Pharmacy Medicine Inventory' : 'Wholesale Medicine Stock Catalog'}
            </h3>
            <p style={{ fontSize: '11px', margin: 0, opacity: 0.9 }}>
              {isRetail
                ? 'Master medicine catalog with physical shelf locations, loose tablet counts & retail MRP'
                : 'Master wholesale medicine directory with batch FEFO stock & box pricing'}
            </p>
          </div>
        </div>

        <span style={{ backgroundColor: '#ffffff', color: '#0284c7', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
          {medicines.length} Products Registered
        </span>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
          <input
            type="text"
            placeholder={isRetail ? "Search by Brand Name, Formula, Shelf (Rack A-01)..." : "Search by Item Code, Trade Name, Formula, Batch..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px' }}>
            <span className="subtext" style={{ fontWeight: 600 }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="ALL">ALL Categories</option>
              <option value="Tablets">Tablets</option>
              <option value="Capsules">Capsules</option>
              <option value="Effervescent">Effervescent</option>
              <option value="Soluble Tablets">Soluble Tablets</option>
            </select>
          </div>

          <span className="badge badge-otc" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>
            Showing {filteredMedicines.length} Medicines
          </span>
        </div>
      </div>

      {/* CATALOG TABLE */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="table-container">
          <table className="table" style={{ fontSize: '11px' }}>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Medicine Trade Name</th>
                <th>Generic Formula</th>
                {isRetail && <th>Drug Type</th>}
                <th>Category</th>
                <th>Physical Shelf Location</th>
                <th style={{ textAlign: 'center' }}>Box Stock</th>
                {isRetail && <th style={{ textAlign: 'center' }}>Loose Pool</th>}
                <th style={{ textAlign: 'right' }}>Cost Price</th>
                <th style={{ textAlign: 'right' }}>{isRetail ? 'Retail MRP' : 'Selling Box Price'}</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={isRetail ? 11 : 9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No medicines match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med, idx) => {
                  const price = Number(med.boxSellingPrice || med.boxPrice || med.price || 600);
                  const tabPrice = Number(med.pricePerTablet || (price / (med.tabletsPerBox || 200)) || 3.0);
                  const isNarcotic = med.controlledType === 'Narcotic';

                  return (
                    <tr key={med.id || idx}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{med.itemCode || med.id}</td>
                      <td style={{ fontWeight: 700 }}>
                        {med.name || med.brandName}
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 400 }}>{med.manufacturer}</div>
                      </td>
                      <td style={{ color: '#475569' }}>{med.formula || med.genericFormula}</td>

                      {isRetail && (
                        <td>
                          <span className={`badge ${isNarcotic ? 'badge-danger' : med.requiresPrescription ? 'badge-warning' : 'badge-otc'}`}>
                            {isNarcotic ? 'Narcotic' : med.requiresPrescription ? 'Schedule H Rx' : 'OTC'}
                          </span>
                        </td>
                      )}

                      <td><span className="badge badge-otc">{med.category || 'Tablets'}</span></td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>📍 {med.rackLocation || 'Rack A-01 / Shelf 2'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${med.boxStock > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {med.boxStock !== undefined ? med.boxStock : 10} Boxes
                        </span>
                      </td>

                      {isRetail && (
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                          {((med.boxStock !== undefined ? med.boxStock : 10) * (med.tabletsPerBox || 200))} Tabs
                        </td>
                      )}

                      <td style={{ textAlign: 'right' }}>Rs. {Number(med.purchaseCost || med.purchasePriceBox || 480).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {isRetail ? `Rs. ${tabPrice.toFixed(2)}/tab` : `Rs. ${price.toFixed(2)}`}
                        {isRetail && <div style={{ fontSize: '9px', color: '#64748b' }}>Rs. {price.toFixed(2)}/box</div>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => { setEditingMedicine(med); setIsEditPriceOpen(true); }}
                            className="btn btn-outline"
                            style={{ fontSize: '11px', padding: '0.2rem 0.5rem' }}
                          >
                            <Edit size={11} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(med.id)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isEditPriceOpen && editingMedicine && (
        <EditPriceModal
          isOpen={isEditPriceOpen}
          medicine={editingMedicine}
          onClose={() => { setIsEditPriceOpen(false); setEditingMedicine(null); }}
          onSave={handleSavePrice}
        />
      )}
    </div>
  );
};

export default InventoryPage;
