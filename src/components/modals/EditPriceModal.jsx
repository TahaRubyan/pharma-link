import React, { useState } from 'react';
import { X, Edit, DollarSign, CheckCircle } from 'lucide-react';

export const EditPriceModal = ({ isOpen, medicine, onClose, onSave }) => {
  if (!isOpen || !medicine) return null;

  const [boxSellingPrice, setBoxSellingPrice] = useState(medicine.boxSellingPrice || medicine.boxPrice || medicine.price || 600);
  const [purchaseCost, setPurchaseCost] = useState(medicine.purchaseCost || medicine.purchasePriceBox || 480);
  const [rackLocation, setRackLocation] = useState(medicine.rackLocation || 'Rack A-01 / Shelf 2');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(medicine.id, {
      boxSellingPrice: Number(boxSellingPrice) || 0,
      boxPrice: Number(boxSellingPrice) || 0,
      price: Number(boxSellingPrice) || 0,
      purchaseCost: Number(purchaseCost) || 0,
      purchasePriceBox: Number(purchaseCost) || 0,
      rackLocation,
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
            <Edit size={18} color="#0284c7" /> Edit Selling Price & Physical Rack
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            {medicine.name || medicine.brandName} ({medicine.itemCode || medicine.id})
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Selling Box Price (Rs.) *:
            </label>
            <input
              type="number"
              step="any"
              value={boxSellingPrice}
              onChange={(e) => setBoxSellingPrice(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
              required
            />
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Purchase Cost Box (Rs.) *:
            </label>
            <input
              type="number"
              step="any"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
              required
            />
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Physical Rack / Shelf Location:
            </label>
            <input
              type="text"
              value={rackLocation}
              onChange={(e) => setRackLocation(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#0284c7' }}>
              <CheckCircle size={15} /> Update Price & Rack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPriceModal;
