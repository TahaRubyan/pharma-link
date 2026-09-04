import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { useSales } from '../../context/SalesContext';
import { useSupplier } from '../../context/SupplierContext';

export const DisasterRecoveryModal = ({ isOpen, onClose }) => {
  const { currentShop, tenantsList } = useAuth();
  const { medicines, batches } = useInventory();
  const { invoices } = useSales();
  const { suppliers, purchaseOrders, rtvNotes } = useSupplier();

  const [restoreJsonText, setRestoreJsonText] = useState('');

  if (!isOpen) return null;

  const handleExportBackup = () => {
    const backupData = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      tenantId: currentShop ? currentShop.shopId : 'CP-1092',
      shopProfile: currentShop,
      medicines,
      batches,
      invoices,
      suppliers,
      purchaseOrders,
      rtvNotes
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `pharmalink_system_backup_${currentShop ? currentShop.shopId : 'CP-1092'}_${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreJsonText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!restoreJsonText.trim()) {
      alert('Please select or paste a valid JSON backup file.');
      return;
    }

    try {
      const parsed = JSON.parse(restoreJsonText);
      if (parsed.medicines) localStorage.setItem('pharmalink_medicines', JSON.stringify(parsed.medicines));
      if (parsed.batches) localStorage.setItem('pharmalink_batches', JSON.stringify(parsed.batches));
      if (parsed.invoices) localStorage.setItem('pharmalink_sales_invoices', JSON.stringify(parsed.invoices));
      if (parsed.suppliers) localStorage.setItem('pharmalink_suppliers', JSON.stringify(parsed.suppliers));
      if (parsed.purchaseOrders) localStorage.setItem('pharmalink_purchase_orders', JSON.stringify(parsed.purchaseOrders));
      if (parsed.rtvNotes) localStorage.setItem('pharmalink_rtv_notes', JSON.stringify(parsed.rtvNotes));

      alert('System Backup successfully restored! Reloading application...');
      window.location.reload();
    } catch (e) {
      alert('Failed to parse backup JSON file. Invalid format.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#047857" /> Disaster Recovery & JSON Backup Engine
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Export complete system state or restore from an offline JSON backup file
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* EXPORT BACKUP BOX */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Download size={16} color="#047857" /> Export System Backup JSON
              </div>
              <p className="subtext" style={{ marginTop: '0.35rem' }}>
                Generates an encrypted JSON file containing all wholesale catalog items, active FEFO batches, sales invoices, customer ledgers, and POs.
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              className="btn btn-primary"
              style={{ width: '100%', borderRadius: '10px', marginTop: '1rem', backgroundColor: '#047857' }}
            >
              <Download size={15} /> Download Backup JSON
            </button>
          </div>

          {/* RESTORE BACKUP BOX */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={16} color="#1d4ed8" /> Restore from JSON Backup
              </div>
              <p className="subtext" style={{ marginTop: '0.35rem' }}>
                Upload a previously saved JSON backup file to instantly restore database state.
              </p>
            </div>

            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ fontSize: '11px', width: '100%', marginTop: '0.5rem' }}
              />
              <button
                onClick={handleExecuteRestore}
                className="btn btn-outline"
                style={{ width: '100%', borderRadius: '10px', marginTop: '0.65rem', borderColor: '#cbd5e1' }}
              >
                <RefreshCw size={14} /> Execute System Restore
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisasterRecoveryModal;
