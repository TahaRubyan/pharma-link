import React, { useState } from 'react';
import { X, MapPin, Plus } from 'lucide-react';

export const AddRegionModal = ({ isOpen, onClose, onAddRegion }) => {
  const [regionName, setRegionName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!regionName.trim()) return;

    onAddRegion(regionName.trim());
    setRegionName('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.15rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={18} color="#0284C7" /> Add New Wholesale Territory Region
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Create a custom regional delivery zone for organizing credit ledgers & manifest reports
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
              Region / City Territory Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Gujrat / Karianwala / Tanda / Rawalpindi"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#111827' }}>
              <Plus size={15} /> Add Territory Region
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRegionModal;
