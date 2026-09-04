import React, { useState } from 'react';
import { X, RotateCcw, Truck, Package, AlertTriangle, Printer, CheckCircle } from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useInventory } from '../../context/InventoryContext';

export const RTVModal = ({ isOpen, onClose }) => {
  const { suppliers = [], createRTVNote } = useSupplier();
  const { medicines = [], batches = [], markItemAsRTV } = useInventory();

  const [selectedSupplierName, setSelectedSupplierName] = useState(suppliers[0]?.name || '');
  const [selectedBatchNumber, setSelectedBatchNumber] = useState(batches[0]?.batchNumber || batches[0]?.batchNo || '');
  const [returnedBoxes, setReturnedBoxes] = useState('');
  const [agreedRefund, setAgreedRefund] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const currentSupplier = suppliers.find((s) => s.name === selectedSupplierName) || suppliers[0];
  const currentBatch = batches.find((b) => (b.batchNumber || b.batchNo) === selectedBatchNumber) || batches[0];
  const currentMed = medicines.find((m) => m.id === currentBatch?.medicineId) || medicines[0];

  const totalCreditVal = Number(agreedRefund || 0) * (Number(returnedBoxes) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const rtvNote = {
      rtvNumber: `RTV-${Date.now().toString().slice(-6)}`,
      supplierName: selectedSupplierName,
      batchNo: selectedBatchNumber,
      brandName: currentMed?.name || currentMed?.brandName || 'Medicine',
      reason: reason || 'Near Expiry Stock Return to Distributor',
      boxesReturned: Number(returnedBoxes) || 1,
      refundAmount: totalCreditVal,
      date: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
    };

    createRTVNote(rtvNote);
    if (currentBatch) {
      markItemAsRTV(currentBatch.id || currentBatch.batchNumber, Number(returnedBoxes) || 1, reason);
    }

    alert(`RTV Debit Note ${rtvNote.rtvNumber} created! Rs. ${totalCreditVal.toFixed(2)} credited to ${selectedSupplierName} balance.`);
    window.print();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}>
            <RotateCcw size={18} color="#dc2626" /> Return Near-Expiry Stock to Distributor (RTV Debit Note)
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem', color: '#64748b' }}>
            Ref #: RTV-{Date.now().toString().slice(-4)} | Deducts inventory & credits supplier ledger balance
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Select Pharmaceutical Distributor / Supplier *:
            </label>
            <select
              value={selectedSupplierName}
              onChange={(e) => setSelectedSupplierName(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              required
            >
              {suppliers.map((s, idx) => (
                <option key={idx} value={s.name}>
                  {s.name} (Balance Due: Rs. {Number(s.pendingBalance || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Select Near-Expiry / Target Inventory Batch *:
            </label>
            <select
              value={selectedBatchNumber}
              onChange={(e) => setSelectedBatchNumber(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              {batches.map((b, idx) => {
                const med = medicines.find((m) => m.id === b.medicineId);
                return (
                  <option key={idx} value={b.batchNumber || b.batchNo}>
                    {med?.name || med?.brandName || 'Medicine'} — Batch: {b.batchNumber || b.batchNo} (Exp: {b.expiryDate}) | Available: {b.boxStock || 0} Boxes
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3 STATUS BADGES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#9a3412', fontWeight: 700 }}>SELECTED MEDICINE:</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#431407' }}>{currentMed?.name || currentMed?.brandName || 'No Medicine'}</div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#9a3412', fontWeight: 700 }}>BATCH & EXPIRY:</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#431407' }}>{currentBatch ? `${currentBatch.batchNumber || currentBatch.batchNo} (${currentBatch.expiryDate})` : 'None'}</div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#9a3412', fontWeight: 700 }}>STOCK AVAILABLE:</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#431407' }}>{currentBatch?.boxStock !== undefined ? `${currentBatch.boxStock} Boxes` : '0 Boxes'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Returned Boxes Quantity *:
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5"
                max={currentBatch?.boxStock || 100}
                value={returnedBoxes}
                onChange={(e) => setReturnedBoxes(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Agreed Refund / Credit Amount (Rs.) *:
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2400"
                value={agreedRefund}
                onChange={(e) => setAgreedRefund(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Reason for Return / Debit Note Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Near Expiry Stock Return to Distributor"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>

          {/* TOTAL CREDIT VALUE PINK BOX */}
          <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '0.85rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#9f1239' }}>TOTAL RTV DEBIT NOTE CREDIT VALUE:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#e11d48' }}>Rs. {totalCreditVal.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#e11d48' }}>
              <CheckCircle size={15} /> [Process RTV & Print Debit Note PDF]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RTVModal;
