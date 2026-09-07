import React, { useState, useEffect } from 'react';
import { X, Edit3, Percent, DollarSign, CheckCircle } from 'lucide-react';

export const EditLineDiscountTaxModal = ({ isOpen, item, onClose, onSave }) => {
  const [qty, setQty] = useState(item?.qty || item?.quantity || 1);
  const [rate, setRate] = useState(item?.boxPrice || item?.price || item?.unitPrice || 600);
  const [discPercent, setDiscPercent] = useState(item?.discountPercent || 0);
  const [saleTaxPercent, setSaleTaxPercent] = useState(item?.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
  const [advTaxPercent, setAdvTaxPercent] = useState(item?.advTaxPercent !== undefined ? item.advTaxPercent : 0.5);

  useEffect(() => {
    if (item) {
      setQty(item.qty || item.quantity || 1);
      setRate(item.boxPrice || item.price || item.unitPrice || 600);
      setDiscPercent(item.discountPercent || 0);
      setSaleTaxPercent(item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
      setAdvTaxPercent(item.advTaxPercent !== undefined ? item.advTaxPercent : 0.5);
    }
  }, [item, isOpen]);

  const parsedQty = Math.max(1, Number(qty) || 1);
  const parsedRate = Number(rate) || 0;
  const grossAmount = parsedQty * parsedRate;

  const discAmount = (grossAmount * (Number(discPercent) || 0)) / 100;
  const taxableAmount = Math.max(0, grossAmount - discAmount);
  const saleTaxAmount = (taxableAmount * (Number(saleTaxPercent) || 0)) / 100;
  const advTaxAmount = (taxableAmount * (Number(advTaxPercent) || 0)) / 100;
  const netItemTotal = taxableAmount + saleTaxAmount + advTaxAmount;

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      ...item,
      qty: parsedQty,
      quantity: parsedQty,
      boxPrice: parsedRate,
      price: parsedRate,
      discountPercent: Number(discPercent) || 0,
      discount: discAmount,
      saleTaxPercent: Number(saleTaxPercent) || 0,
      salesTax18: saleTaxAmount,
      advTaxPercent: Number(advTaxPercent) || 0,
      advTax05: advTaxAmount,
      netTotal: netItemTotal,
      total: netItemTotal,
    });
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Edit3 size={18} color="#0284C7" /> Edit Line Item Discount & Tax Rates
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem', color: '#0284C7', fontWeight: 600 }}>
            {item.itemCode || item.id || 'MED-101'} / {item.name || item.brandName} ({item.batchNo || item.batchNumber || 'B26-Pan-01'})
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
                Box Quantity:
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
                Rate per Box (Rs.):
              </label>
              <input
                type="number"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Gross Amount:</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Rs. {grossAmount.toFixed(2)}</span>
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
              Item Discount %:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                step="any"
                value={discPercent}
                onChange={(e) => setDiscPercent(e.target.value)}
                style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
              />
              <span style={{ minWidth: '100px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                - Rs. {discAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
                Sale Tax (18%):
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <input
                  type="number"
                  step="any"
                  value={saleTaxPercent}
                  onChange={(e) => setSaleTaxPercent(e.target.value)}
                  style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                  +Rs. {saleTaxAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
                Adv Tax (0.5% – Editable):
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <input
                  type="number"
                  step="any"
                  value={advTaxPercent}
                  onChange={(e) => setAdvTaxPercent(e.target.value)}
                  style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                  +Rs. {advTaxAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* NET ITEM TOTAL LARGE BLUE BOX */}
          <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.85rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>NET ITEM TOTAL:</span>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>Rs. {netItemTotal.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#0284c7' }}>
              <CheckCircle size={15} /> Save Item Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLineDiscountTaxModal;
