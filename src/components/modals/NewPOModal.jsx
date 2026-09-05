import React, { useState } from 'react';
import { X, Package, Plus, Trash2, CheckCircle, Truck, FileText } from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useInventory } from '../../context/InventoryContext';

export const NewPOModal = ({ isOpen, onClose }) => {
  const { suppliers = [], createPurchaseOrder } = useSupplier();
  const { medicines = [], inwardPOStock } = useInventory();

  const [selectedDistributor, setSelectedDistributor] = useState(suppliers[0]?.name || '');
  const [poCode, setPoCode] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierLicense, setSupplierLicense] = useState('');
  const [supplierNtn, setSupplierNtn] = useState('');
  const [supplierGst, setSupplierGst] = useState('');
  const [fbrStatus, setFbrStatus] = useState('FILER');
  const [contactPhone, setContactPhone] = useState('');
  const [saveProfile, setSaveProfile] = useState(false);

  // PO Items state (Clean Slate)
  const [items, setItems] = useState([
    {
      itemCode: '',
      tradeName: '',
      genericFormula: '',
      batchNo: '',
      expiryDate: '',
      inwardBoxes: '',
      purchaseCost: '',
      sellingMrp: '',
      shelfLocation: '',
    },
  ]);

  // Payment Settlement Tag
  const [paymentStatus, setPaymentStatus] = useState('Paid in Full (Zero Debt)');
  const [amountPaid, setAmountPaid] = useState('0');

  if (!isOpen) return null;

  const handleSupplierChange = (e) => {
    const name = e.target.value;
    setSelectedDistributor(name);
    const sup = suppliers.find((s) => (s.name || s.companyName) === name);
    if (sup) {
      setSupplierLicense(sup.licenseNo || '');
      setContactPhone(sup.phone || '');
      setSupplierGst(sup.gstin || '');
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemCode: '',
        tradeName: '',
        genericFormula: '',
        batchNo: '',
        expiryDate: '',
        inwardBoxes: '',
        purchaseCost: '',
        sellingMrp: '',
        shelfLocation: '',
      },
    ]);
  };

  const handleItemChange = (idx, field, val) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalPoCost = items.reduce((sum, item) => sum + (Number(item.inwardBoxes) || 0) * (Number(item.purchaseCost) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const poRecord = {
      poNumber: poCode,
      poReference: poCode,
      supplierName: selectedDistributor,
      distributor: selectedDistributor,
      date: inwardDate,
      itemLines: items.map((i) => `${i.tradeName} (${i.inwardBoxes} Boxes)`).join(', '),
      items: items.map((it) => ({
        ...it,
        itemCode: it.itemCode?.trim() || '',
        boxCost: it.purchaseCost,
        boxMrp: it.sellingMrp,
        shelfLocation: it.shelfLocation?.trim() || '',
      })),
      totalAmount: totalPoCost,
      grossCost: totalPoCost,
      paymentStatus,
      amountPaid: paymentStatus.includes('Paid in Full') ? totalPoCost : Number(amountPaid) || 0,
      stockStatus: 'Stock Received',
    };

    createPurchaseOrder(poRecord);
    if (typeof inwardPOStock === 'function') {
      inwardPOStock(poRecord);
    }
    alert(`Purchase Order ${poCode} logged! Inward inventory batches received and prices synchronized.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '95vw', maxWidth: '1240px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '92vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
            <FileText size={20} color="#0284c7" /> Wholesale Purchase Order & Depot Inward
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Create wholesale supplier PO, record commercial batch lots, client item codes, and restock inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
              Select Registered Distributor / Manufacturer Profile:
            </label>
            <select
              value={selectedDistributor}
              onChange={handleSupplierChange}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, outline: 'none', backgroundColor: '#f8fafc' }}
            >
              {suppliers.map((s, idx) => (
                <option key={idx} value={s.name || s.companyName}>
                  {s.name || s.companyName} (License #: {s.licenseNo || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* DISTRIBUTOR METADATA GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>PO Reference Code:</label>
              <input type="text" value={poCode} onChange={(e) => setPoCode(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none', fontWeight: 700 }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Distributor / Supplier Name *:</label>
              <input type="text" placeholder="e.g. Muller & Phipps Pakistan" value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Inward Date:</label>
              <input type="date" value={inwardDate} onChange={(e) => setInwardDate(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Contact Phone:</label>
              <input type="text" placeholder="e.g. +92 300 8451122" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Supplier License #:</label>
              <input type="text" placeholder="e.g. PK-DL-20-45812" value={supplierLicense} onChange={(e) => setSupplierLicense(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Supplier NTN #:</label>
              <input type="text" placeholder="e.g. 0792320-1" value={supplierNtn} onChange={(e) => setSupplierNtn(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>FBR Status:</label>
              <select value={fbrStatus} onChange={(e) => setFbrStatus(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}>
                <option value="FILER">FILER</option>
                <option value="NON-FILER">NON-FILER</option>
              </select>
            </div>
          </div>

          {/* SHIPMENT INWARD ITEMS TABLE (EXPANDED BOXES) */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex-between" style={{ backgroundColor: '#f1f5f9', padding: '0.65rem 1rem', borderBottom: '1px solid #cbd5e1' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                📦 Shipment Inward Items ({items.length} Products)
              </span>
              <button type="button" onClick={handleAddItem} className="btn btn-outline" style={{ fontSize: '11.5px', padding: '0.35rem 0.75rem', borderRadius: '8px', backgroundColor: '#ffffff', fontWeight: 700 }}>
                <Plus size={13} /> Add Another Item to PO
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '12px', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ width: '28px' }}>#</th>
                    <th style={{ minWidth: '95px' }}>Item Code (Opt)</th>
                    <th style={{ minWidth: '170px' }}>Medicine Trade Name *</th>
                    <th style={{ minWidth: '135px' }}>Generic Formula</th>
                    <th style={{ minWidth: '105px' }}>Batch #</th>
                    <th style={{ minWidth: '110px' }}>Expiry Date</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Inward Boxes</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>Cost/Box</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>Selling MRP</th>
                    <th style={{ width: '95px', textAlign: 'right' }}>Line Total</th>
                    <th style={{ minWidth: '100px' }}>Shelf (Opt)</th>
                    <th style={{ width: '35px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal = (Number(it.inwardBoxes) || 0) * (Number(it.purchaseCost) || 0);

                    return (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                        <td>
                          <input type="text" placeholder="e.g. 1001" value={it.itemCode || ''} onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }} />
                        </td>
                        <td>
                          <input type="text" placeholder="Trade Name e.g. Panadol" value={it.tradeName} onChange={(e) => handleItemChange(idx, 'tradeName', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700 }} required />
                        </td>
                        <td>
                          <input type="text" placeholder="Formula e.g. Paracetamol" value={it.genericFormula} onChange={(e) => handleItemChange(idx, 'genericFormula', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
                        </td>
                        <td>
                          <input type="text" placeholder="Batch #" value={it.batchNo} onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)' }} required />
                        </td>
                        <td>
                          <input type="date" value={it.expiryDate} onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }} required />
                        </td>
                        <td>
                          <input type="number" min="1" placeholder="Qty" value={it.inwardBoxes} onChange={(e) => handleItemChange(idx, 'inwardBoxes', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, textAlign: 'center' }} required />
                        </td>
                        <td>
                          <input type="number" step="any" placeholder="Cost" value={it.purchaseCost} onChange={(e) => handleItemChange(idx, 'purchaseCost', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'right', fontWeight: 700 }} required />
                        </td>
                        <td>
                          <input type="number" step="any" placeholder="MRP" value={it.sellingMrp} onChange={(e) => handleItemChange(idx, 'sellingMrp', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'right', fontWeight: 800, color: '#0284c7' }} required />
                        </td>
                        <td style={{ fontWeight: 800, color: '#0f172a', textAlign: 'right', fontSize: '12.5px' }}>
                          Rs. {lineTotal.toFixed(2)}
                        </td>
                        <td>
                          <input type="text" placeholder="Optional" value={it.shelfLocation || ''} onChange={(e) => handleItemChange(idx, 'shelfLocation', e.target.value)} style={{ width: '100%', padding: '0.45rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px' }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENT SETTLEMENT & DEBT TAGGING */}
          <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.2rem', color: '#0f172a' }}>PO Payment Settlement & Supplier Debt Tagging:</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}>
                <option value="Paid in Full (Zero Debt)">Paid in Full (Zero Debt)</option>
                <option value="Partial Paid (Record Due)">Partial Paid (Record Due)</option>
                <option value="Unpaid Debt (Full Credit)">Unpaid Debt (Full Credit)</option>
              </select>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL PURCHASE ORDER COST:</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0284c7' }}>Rs. {totalPoCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px', padding: '0.6rem', fontSize: '12.5px', fontWeight: 700 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#0284c7', padding: '0.6rem', fontSize: '13px', fontWeight: 800 }}>
              <CheckCircle size={16} /> Log Inward PO & Restock Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPOModal;
