import React, { useState, useEffect } from 'react';
import { X, Layers, Calendar, DollarSign, Package, MapPin, CheckCircle } from 'lucide-react';

export const EditBatchModal = ({ isOpen, medicine, batch, onClose, onSave }) => {
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [boxStock, setBoxStock] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [boxPrice, setBoxPrice] = useState('');
  const [rackLocation, setRackLocation] = useState('');

  useEffect(() => {
    if (medicine || batch) {
      const b = batch || {};
      const currentBatchNo = b.batchNo || b.batchNumber || medicine?.batchNo || medicine?.batchNumber || '';
      const currentExpiry = b.expiryDate || medicine?.expiryDate || '12-2028';
      const currentStock = b.boxStock !== undefined ? b.boxStock : (medicine?.boxStock !== undefined ? medicine.boxStock : 10);
      const currentCost = b.purchaseCost !== undefined ? b.purchaseCost : (b.purchasePriceBox !== undefined ? b.purchasePriceBox : (medicine?.purchaseCost !== undefined ? medicine.purchaseCost : (medicine?.boxCost || 0)));
      const currentPrice = b.boxPrice !== undefined ? b.boxPrice : (b.boxSellingPrice !== undefined ? b.boxSellingPrice : (medicine?.boxSellingPrice !== undefined ? medicine.boxSellingPrice : (medicine?.boxPrice || currentCost)));
      const currentRack = b.rackLocation || medicine?.rackLocation || '';

      setBatchNo(currentBatchNo);
      setExpiryDate(currentExpiry);
      setBoxStock(String(currentStock));
      setPurchaseCost(String(currentCost));
      setBoxPrice(String(currentPrice));
      setRackLocation(currentRack);
    }
  }, [medicine, batch, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batchNo.trim()) {
      alert('Batch Number is compulsory. Please enter a valid batch lot number.');
      return;
    }

    if (typeof onSave === 'function') {
      onSave(batch?.id || medicine?.id, {
        batchId: batch?.id,
        medicineId: medicine?.id,
        batchNo: batchNo.trim(),
        batchNumber: batchNo.trim(),
        expiryDate: expiryDate.trim() || '12-2028',
        boxStock: Math.max(0, Number(boxStock) || 0),
        purchaseCost: Math.max(0, Number(purchaseCost) || 0),
        boxPrice: Math.max(0, Number(boxPrice) || 0),
        boxSellingPrice: Math.max(0, Number(boxPrice) || 0),
        rackLocation: rackLocation.trim(),
      });
    }
    onClose();
  };

  if (!isOpen || (!medicine && !batch)) return null;

  const medName = medicine?.name || medicine?.brandName || batch?.medicineName || 'Medicine';
  const medCode = medicine?.itemCode || medicine?.id || batch?.itemCode || '-';
  const formula = medicine?.formula || medicine?.genericFormula || '';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
            <Layers size={18} color="#0284c7" /> Edit Batch Details & Lot Number
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            {medName} {formula ? `(${formula})` : ''} • Item Code: <strong>{medCode}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.2rem', color: '#0f172a' }}>
              Batch Number / Lot # (Strict PO Match) *:
            </label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              placeholder="e.g. EN-2602, B-334, LOT-981"
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '2px solid #0284c7', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', outline: 'none', backgroundColor: '#f0f9ff' }}
              required
              autoFocus
            />
            <span style={{ fontSize: '10.5px', color: '#0284c7', display: 'block', marginTop: '0.2rem' }}>
              This batch number will appear identically in Stock, POS billing, and on generated A4/Thermal invoices.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Expiry Date (MM-YYYY) *:
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="MM-YYYY e.g. 12-2028"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Available Box Stock *:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={boxStock}
                onChange={(e) => setBoxStock(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Purchase Cost / Box (Rs.) *:
              </label>
              <input
                type="number"
                step="any"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Trade Base Rate / Price (Rs.) *:
              </label>
              <input
                type="number"
                step="any"
                value={boxPrice}
                onChange={(e) => setBoxPrice(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Physical Shelf / Rack Location:
            </label>
            <input
              type="text"
              value={rackLocation}
              onChange={(e) => setRackLocation(e.target.value)}
              placeholder="e.g. Rack B-04 / Shelf 2"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '12px', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '12px', borderRadius: '8px', backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <CheckCircle size={14} /> Update Batch & Sync
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBatchModal;
