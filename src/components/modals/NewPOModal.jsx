import React, { useState } from 'react';
import { X, Package, Plus, Trash2, CheckCircle, Truck, FileText } from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useInventory } from '../../context/InventoryContext';

export const NewPOModal = ({ isOpen, onClose }) => {
  const { suppliers = [], createPurchaseOrder } = useSupplier();
  const { medicines = [] } = useInventory();

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
      tradeName: '',
      genericFormula: '',
      batchNo: '',
      expiryDate: '',
      inwardBoxes: '',
      purchaseCost: '',
      sellingMrp: '',
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
        tradeName: '',
        genericFormula: '',
        batchNo: '',
        expiryDate: '',
        inwardBoxes: '',
        purchaseCost: '',
        sellingMrp: '',
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
      items,
      totalAmount: totalPoCost,
      paymentStatus,
      amountPaid: paymentStatus.includes('Paid in Full') ? totalPoCost : Number(amountPaid) || 0,
      stockStatus: 'Stock Received',
    };

    createPurchaseOrder(poRecord);
    alert(`Purchase Order ${poCode} logged! Inward inventory batches received.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '840px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.15rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
            <Package size={18} color="#0284c7" /> New Distributor Purchase Order (PO) & Inward Shipment
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Inward multiple wholesale medicine items with company supplier license, NTN, GST & FBR status records
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* DISTRIBUTOR PRE-FILL */}
          <div style={{ backgroundColor: '#f0f9ff', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1' }}>
              ⭐ Select Trusted Distributor:
            </span>
            <select
              value={selectedDistributor}
              onChange={handleSupplierChange}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #7dd3fc', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer', backgroundColor: '#ffffff' }}
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
              <input type="text" value={poCode} onChange={(e) => setPoCode(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none', fontWeight: 700 }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Distributor / Supplier Name *:</label>
              <input type="text" placeholder="e.g. Muller & Phipps Pakistan" value={selectedDistributor} onChange={(e) => setSelectedDistributor(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Inward Date:</label>
              <input type="date" value={inwardDate} onChange={(e) => setInwardDate(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Contact Phone:</label>
              <input type="text" placeholder="e.g. +92 300 8451122" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Supplier License #:</label>
              <input type="text" placeholder="e.g. PK-DL-20-45812" value={supplierLicense} onChange={(e) => setSupplierLicense(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Supplier NTN #:</label>
              <input type="text" placeholder="e.g. 0792320-1" value={supplierNtn} onChange={(e) => setSupplierNtn(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>FBR Status:</label>
              <select value={fbrStatus} onChange={(e) => setFbrStatus(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}>
                <option value="FILER">FILER</option>
                <option value="NON-FILER">NON-FILER</option>
              </select>
            </div>
          </div>

          {/* SHIPMENT INWARD ITEMS TABLE */}
          <div>
            <div className="flex-between" style={{ marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                📦 Shipment Inward Items ({items.length} Products)
              </span>
              <button type="button" onClick={handleAddItem} className="btn btn-outline" style={{ fontSize: '11px', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                <Plus size={12} /> Add Another Item to PO
              </button>
            </div>

            <div className="table-container">
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine Trade Name</th>
                    <th>Generic Formula</th>
                    <th>Batch #</th>
                    <th>Expiry Date</th>
                    <th style={{ width: '70px' }}>Inward Boxes</th>
                    <th style={{ width: '80px' }}>Purchase Cost Box</th>
                    <th style={{ width: '80px' }}>Selling Box MRP</th>
                    <th>Line Total Cost</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal = (Number(it.inwardBoxes) || 0) * (Number(it.purchaseCost) || 0);

                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <input type="text" placeholder="Trade Name e.g. Panadol" value={it.tradeName} onChange={(e) => handleItemChange(idx, 'tradeName', e.target.value)} style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 600 }} required />
                        </td>
                        <td>
                          <input type="text" placeholder="Formula e.g. Paracetamol" value={it.genericFormula} onChange={(e) => handleItemChange(idx, 'genericFormula', e.target.value)} style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }} />
                        </td>
                        <td>
                          <input type="text" placeholder="Batch #" value={it.batchNo} onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)} style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'var(--font-mono)' }} required />
                        </td>
                        <td>
                          <input type="date" value={it.expiryDate} onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)} style={{ width: '110px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }} required />
                        </td>
                        <td>
                          <input type="number" min="1" placeholder="Qty" value={it.inwardBoxes} onChange={(e) => handleItemChange(idx, 'inwardBoxes', e.target.value)} style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700 }} required />
                        </td>
                        <td>
                          <input type="number" step="any" placeholder="Cost" value={it.purchaseCost} onChange={(e) => handleItemChange(idx, 'purchaseCost', e.target.value)} style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }} required />
                        </td>
                        <td>
                          <input type="number" step="any" placeholder="MRP" value={it.sellingMrp} onChange={(e) => handleItemChange(idx, 'sellingMrp', e.target.value)} style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }} required />
                        </td>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>
                          Rs. {lineTotal.toFixed(2)}
                        </td>
                        <td>
                          {items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                              <Trash2 size={13} />
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
          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>PO Payment Settlement & Supplier Debt Tagging:</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, outline: 'none' }}>
                <option value="Paid in Full (Zero Debt)">Paid in Full (Zero Debt)</option>
                <option value="Partial Paid (Record Due)">Partial Paid (Record Due)</option>
                <option value="Unpaid Debt (Full Credit)">Unpaid Debt (Full Credit)</option>
              </select>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL PURCHASE ORDER COST:</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>Rs. {totalPoCost.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#0284c7' }}>
              <CheckCircle size={15} /> Log Inward PO & Restock Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPOModal;
