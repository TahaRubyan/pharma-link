import React, { useState, useMemo, useRef } from 'react';
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
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import EditPriceModal from '../components/modals/EditPriceModal';

export const InventoryPage = () => {
  const { medicines = [], batches = [], setMedicines, updateMedicineDetails, bulkImportMedicines } = useInventory();
  const { currentShop } = useAuth();
  const isRetail = currentShop?.mode === 'RETAIL';
  const csvFileRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals state
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isEditPriceOpen, setIsEditPriceOpen] = useState(false);

  const handleExportCSV = () => {
    if (medicines.length === 0) {
      alert('No medicines registered to export.');
      return;
    }
    const headers = ['Item Code', 'Medicine Name', 'Generic Formula', 'Category', 'Manufacturer', 'Physical Shelf', 'Box Stock', 'Purchase Cost (Box)', 'Retail MRP (Box)', 'Strips Per Box', 'Tablets Per Strip', 'Controlled Type', 'Requires Rx'];
    const rows = medicines.map((m) => [
      m.itemCode || '',
      `"${(m.name || m.brandName || '').replace(/"/g, '""')}"`,
      `"${(m.formula || m.genericFormula || '').replace(/"/g, '""')}"`,
      m.category || 'Tablets',
      `"${(m.manufacturer || '').replace(/"/g, '""')}"`,
      `"${(m.rackLocation || '').replace(/"/g, '""')}"`,
      m.boxStock || 0,
      m.purchaseCost || m.purchasePriceBox || 0,
      m.boxSellingPrice || m.boxPrice || 0,
      m.stripsPerBox || 10,
      m.tabletsPerStrip || 10,
      m.controlledType || 'None',
      m.requiresPrescription ? 'Yes' : 'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmalink_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const headers = ['Item Code', 'Medicine Name', 'Generic Formula', 'Category', 'Manufacturer', 'Physical Shelf', 'Box Stock', 'Purchase Cost (Box)', 'Retail MRP (Box)', 'Strips Per Box', 'Tablets Per Strip', 'Controlled Type', 'Requires Rx'];
    const sampleRows = [
      ['2001', 'Panadol Extra 500mg', 'Paracetamol + Caffeine', 'Tablets', 'GSK Pakistan', 'Shelf A-1', '20', '520', '650', '20', '10', 'None', 'No'],
      ['2002', 'Ciproxin 500mg', 'Ciprofloxacin 500mg', 'Tablets', 'Bayer Pakistan', 'Shelf B-2', '15', '410', '500', '1', '10', 'None', 'Yes'],
      ['2003', 'Lexotanil 3mg', 'Bromazepam 3mg', 'Tablets', 'Martin Dow', 'Safe Lock-R', '10', '260', '320', '3', '10', 'Narcotic', 'Yes']
    ];
    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmalink_inventory_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\\r?\\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSV file is empty or missing data rows.');
          return;
        }

        const newMeds = [];
        const newBatches = [];
        const nowTime = Date.now();

        for (let i = 1; i < lines.length; i++) {
          const row = [];
          let insideQuotes = false;
          let entry = '';
          for (let c of lines[i]) {
            if (c === '"') {
              insideQuotes = !insideQuotes;
            } else if (c === ',' && !insideQuotes) {
              row.push(entry.trim());
              entry = '';
            } else {
              entry += c;
            }
          }
          row.push(entry.trim());

          const name = row[1] ? row[1].replace(/^"|"$/g, '').trim() : '';
          if (!name) continue;

          const itemCode = row[0] && /^\\d{4}$/.test(row[0].trim()) ? row[0].trim() : (1001 + medicines.length + newMeds.length).toString();
          const formula = row[2] ? row[2].replace(/^"|"$/g, '').trim() : 'Standard Formula';
          const category = row[3] ? row[3].replace(/^"|"$/g, '').trim() : 'Tablets';
          const manufacturer = row[4] ? row[4].replace(/^"|"$/g, '').trim() : 'Pharma Distributor';
          const rackLocation = row[5] ? row[5].replace(/^"|"$/g, '').trim() : '';
          const boxStock = Number(row[6]) || 1;
          const purchaseCost = Number(row[7]) || 400;
          const boxMrp = Number(row[8]) || 500;
          const stripsPerBox = Number(row[9]) || 10;
          const tabletsPerStrip = Number(row[10]) || 10;
          const tabletsPerBox = stripsPerBox * tabletsPerStrip;
          const pricePerTablet = Number((boxMrp / tabletsPerBox).toFixed(2));
          const stripPrice = Number((boxMrp / stripsPerBox).toFixed(2));
          const controlledType = row[11] ? row[11].replace(/^"|"$/g, '').trim() : 'None';
          const requiresPrescription = (row[12] || '').toLowerCase().includes('y') || controlledType === 'Narcotic';

          const medId = `MED-${nowTime.toString().slice(-4)}-${i}`;
          const newMed = {
            id: medId,
            itemCode,
            name,
            brandName: name,
            formula,
            genericFormula: formula,
            category,
            manufacturer,
            rackLocation,
            boxStock,
            purchaseCost,
            purchasePriceBox: purchaseCost,
            boxSellingPrice: boxMrp,
            boxPrice: boxMrp,
            stripsPerBox,
            tabletsPerStrip,
            tabletsPerBox,
            pricePerTablet,
            stripPrice,
            controlledType,
            requiresPrescription,
            expiryDate: '2028-12-31'
          };

          const newBatch = {
            id: `BATCH-${nowTime.toString().slice(-4)}-${i}`,
            medicineId: medId,
            medicineName: name,
            batchNo: `B26-${Math.floor(100 + Math.random() * 900)}`,
            batchNumber: `B26-${Math.floor(100 + Math.random() * 900)}`,
            distributorName: manufacturer,
            expiryDate: '2028-12-31',
            boxStock,
            totalTabletsAvailable: boxStock * tabletsPerBox,
            boxPrice: boxMrp,
            purchasePriceBox: purchaseCost,
            pricePerTablet,
            status: 'Active Stock',
            rackLocation,
          };

          newMeds.push(newMed);
          newBatches.push(newBatch);
        }

        if (newMeds.length > 0) {
          if (typeof bulkImportMedicines === 'function') {
            bulkImportMedicines(newMeds, newBatches);
          } else {
            setMedicines((prev) => [...newMeds, ...prev]);
          }
          alert(`Successfully imported ${newMeds.length} medicines into the catalog!`);
        } else {
          alert('No valid medicine rows found in file.');
        }
      } catch (err) {
        alert('Failed to parse CSV file: ' + err.message);
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

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
    if (typeof updateMedicineDetails === 'function') {
      updateMedicineDetails(id, updatedData);
    } else {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m))
      );
    }
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#ffffff', color: '#0284c7', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
            {medicines.length} Products Registered
          </span>

          <button
            onClick={handleExportCSV}
            className="btn btn-outline"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', fontSize: '11px', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            title="Export catalog to Excel CSV"
          >
            <Download size={13} /> Export CSV
          </button>

          <button
            onClick={() => csvFileRef.current?.click()}
            className="btn btn-outline"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', fontSize: '11px', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            title="Bulk import medicines from Excel CSV"
          >
            <Upload size={13} /> Import CSV
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="btn btn-outline"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', fontSize: '11px', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            title="Download CSV sample template for Excel"
          >
            <FileSpreadsheet size={13} /> Template
          </button>

          <input
            type="file"
            ref={csvFileRef}
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImportCSV}
          />
        </div>
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
                        {med.rackLocation ? (
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>📍 {med.rackLocation}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>Unassigned</span>
                        )}
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
