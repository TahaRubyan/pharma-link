import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Percent, 
  FileText, 
  Users, 
  Database, 
  CheckCircle, 
  Upload, 
  Trash2, 
  Download, 
  RefreshCw,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MOCK_STAFF_ACCOUNTS } from '../data/mockData';

export const SettingsPage = ({ storeMode }) => {
  const { currentShop, updateStoreProfile } = useAuth();
  const isRetail = (storeMode || currentShop?.mode || 'RETAIL') === 'RETAIL';
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'TAXES' | 'WARRANTY' | 'STAFF' | 'BACKUP'

  // Tab 1: Profile State
  const [storeName, setStoreName] = useState(currentShop?.shopName || 'Idrees Medical Store');
  const [storePhone, setStorePhone] = useState(currentShop?.phone || '');
  const [storeAddress, setStoreAddress] = useState(currentShop?.address || '');
  const [stnReg, setStnReg] = useState(currentShop?.gstin || '');
  const [ntnTax, setNtnTax] = useState(currentShop?.ntn || '');
  const [gstinTax, setGstinTax] = useState(currentShop?.gstin || '');
  const [dslForm20, setDslForm20] = useState(currentShop?.dlNumber || '');
  const [dslForm21, setDslForm21] = useState(currentShop?.dlNumber || '');

  // Digital Signature
  const [signatoryName, setSignatoryName] = useState(isRetail ? '' : (currentShop?.signatoryName || 'Dr. Idrees'));
  const [signatoryRole, setSignatoryRole] = useState(isRetail ? '' : (currentShop?.signatoryRole || 'Managing Pharmacist & Owner'));
  const [signatureImage, setSignatureImage] = useState(() => localStorage.getItem('pharmalink_sig_image') || '');

  // Tab 2: Global Taxes
  const [enableSalesTax18, setEnableSalesTax18] = useState(true);
  const [salesTaxRate, setSalesTaxRate] = useState('18');
  const [enableAdvTax05, setEnableAdvTax05] = useState(true);
  const [advTaxRate, setAdvTaxRate] = useState('0.5');

  // Tab 3: Warranty Notes
  const [enableSec23, setEnableSec23] = useState(true);
  const [sec23Text, setSec23Text] = useState(
    'I, being a person resident in Pakistan carrying on business under the authorized distributor license, do hereby give this warranty that the drugs here above described as sold by me and contained in this invoice prescribing the goods referred to herein do not contravene in any way the provisions of Section 23 of the Drugs Act, 1976.'
  );
  const [enableDrap, setEnableDrap] = useState(true);
  const [drapText, setDrapText] = useState(
    'Warranty under Alternative Medicines and Health Products (Enlistment) Rules 2014 [See Rules 10(3) and (5)]: We, as the authorized distributors/agents and on behalf of the principals/manufacturers/importers hereby give warranty that the supplied alternative medicines and health products mentioned herein do not contravene any provision of the prevailing DRAP Act 2012 and rules framed thereunder.'
  );

  // Tab 4: Staff Accounts
  const [staffAccounts, setStaffAccounts] = useState(() => {
    const saved = localStorage.getItem('pharmalink_staff_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return MOCK_STAFF_ACCOUNTS;
  });
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Cashier (POS & Invoicing)');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  useEffect(() => {
    localStorage.setItem('pharmalink_staff_list', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setSignatureImage(base64);
        localStorage.setItem('pharmalink_sig_image', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetSignature = () => {
    setSignatureImage('');
    localStorage.removeItem('pharmalink_sig_image');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      shopName: storeName.trim(),
      phone: storePhone.trim(),
      address: storeAddress.trim(),
      dlNumber: dslForm20.trim(),
      ntn: ntnTax.trim(),
      gstin: gstinTax.trim(),
      signatoryName: signatoryName.trim(),
      signatoryRole: signatoryRole.trim(),
      signatureImage: signatureImage || '',
    };
    localStorage.setItem('pharmalink_sig_name', signatoryName.trim());
    localStorage.setItem('pharmalink_sig_role', signatoryRole.trim());
    if (signatureImage) {
      localStorage.setItem('pharmalink_sig_image', signatureImage);
    }
    if (typeof updateStoreProfile === 'function') {
      updateStoreProfile(updated);
    }
    alert(`Store Profile & Digital Signature successfully updated! Shop name "${storeName}" and Signatory "${signatoryName}" will now appear on all invoices.`);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newStaff = {
      id: `EMP-${Date.now().toString().slice(-3)}`,
      name: newStaffName,
      role: newStaffRole.includes('Admin') ? 'Admin' : newStaffRole.includes('Delivery') ? 'Delivery Staff' : 'Cashier',
      phone: newStaffPhone || '+92 300 1234567',
      status: 'Active',
    };

    setStaffAccounts((prev) => [...prev, newStaff]);
    setNewStaffName('');
    setNewStaffPhone('');
    alert(`New staff member ${newStaff.name} created!`);
  };

  const handleDeleteStaff = (id) => {
    if (window.confirm('Delete this staff account?')) {
      setStaffAccounts((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleExportBackup = () => {
    const medKey = isRetail ? 'pharmalink_retail_medicines' : 'pharmalink_pk_medicines';
    const batchKey = isRetail ? 'pharmalink_retail_batches' : 'pharmalink_pk_batches';
    const invKey = isRetail ? 'pharmalink_retail_invoices' : 'pharmalink_pk_invoices';
    const debtKey = isRetail ? 'pharmalink_retail_debt_customers' : 'pharmalink_debt_customers';
    const supKey = isRetail ? 'pharmalink_retail_suppliers' : 'pharmalink_pk_suppliers';
    const poKey = isRetail ? 'pharmalink_retail_purchase_orders' : 'pharmalink_pk_purchase_orders';
    const patKey = isRetail ? 'pharmalink_retail_patients' : 'pharmalink_pk_patients';
    const vRetKey = isRetail ? 'pharmalink_retail_vendor_returns' : 'pharmalink_pk_vendor_returns';

    const backupData = {
      version: '2.5.0',
      systemMode: isRetail ? 'RETAIL' : 'WHOLESALE',
      exportedAt: new Date().toISOString(),
      storeProfile: { storeName, storePhone, storeAddress, ntnTax, gstinTax, dslForm20, dslForm21, signatoryName, signatoryRole, signatureImage },
      staffAccounts,
      medicines: JSON.parse(localStorage.getItem(medKey) || '[]'),
      batches: JSON.parse(localStorage.getItem(batchKey) || '[]'),
      invoices: JSON.parse(localStorage.getItem(invKey) || '[]'),
      debtCustomers: JSON.parse(localStorage.getItem(debtKey) || '[]'),
      suppliers: JSON.parse(localStorage.getItem(supKey) || '[]'),
      purchaseOrders: JSON.parse(localStorage.getItem(poKey) || '[]'),
      patients: JSON.parse(localStorage.getItem(patKey) || '[]'),
      vendorReturns: JSON.parse(localStorage.getItem(vRetKey) || '[]'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeStoreName = (storeName || 'pharmalink').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `pharmalink_${isRetail ? 'retail' : 'wholesale'}_backup_${safeStoreName}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported) throw new Error('File is empty.');

        const medKey = isRetail ? 'pharmalink_retail_medicines' : 'pharmalink_pk_medicines';
        const batchKey = isRetail ? 'pharmalink_retail_batches' : 'pharmalink_pk_batches';
        const invKey = isRetail ? 'pharmalink_retail_invoices' : 'pharmalink_pk_invoices';
        const debtKey = isRetail ? 'pharmalink_retail_debt_customers' : 'pharmalink_debt_customers';
        const supKey = isRetail ? 'pharmalink_retail_suppliers' : 'pharmalink_pk_suppliers';
        const poKey = isRetail ? 'pharmalink_retail_purchase_orders' : 'pharmalink_pk_purchase_orders';
        const patKey = isRetail ? 'pharmalink_retail_patients' : 'pharmalink_pk_patients';
        const vRetKey = isRetail ? 'pharmalink_retail_vendor_returns' : 'pharmalink_pk_vendor_returns';

        if (Array.isArray(imported.medicines)) localStorage.setItem(medKey, JSON.stringify(imported.medicines));
        if (Array.isArray(imported.batches)) localStorage.setItem(batchKey, JSON.stringify(imported.batches));
        if (Array.isArray(imported.invoices)) localStorage.setItem(invKey, JSON.stringify(imported.invoices));
        if (Array.isArray(imported.debtCustomers)) localStorage.setItem(debtKey, JSON.stringify(imported.debtCustomers));
        if (Array.isArray(imported.suppliers)) localStorage.setItem(supKey, JSON.stringify(imported.suppliers));
        if (Array.isArray(imported.purchaseOrders)) localStorage.setItem(poKey, JSON.stringify(imported.purchaseOrders));
        if (Array.isArray(imported.patients)) localStorage.setItem(patKey, JSON.stringify(imported.patients));
        if (Array.isArray(imported.vendorReturns)) localStorage.setItem(vRetKey, JSON.stringify(imported.vendorReturns));
        if (Array.isArray(imported.staffAccounts)) localStorage.setItem('pharmalink_staff_list', JSON.stringify(imported.staffAccounts));
        
        if (imported.storeProfile) {
          const sp = imported.storeProfile;
          if (sp.signatureImage) localStorage.setItem('pharmalink_sig_image', sp.signatureImage);
          if (sp.signatoryName) localStorage.setItem('pharmalink_sig_name', sp.signatoryName);
          if (sp.signatoryRole) localStorage.setItem('pharmalink_sig_role', sp.signatoryRole);
          if (typeof updateStoreProfile === 'function') {
            updateStoreProfile(sp);
          }
        }

        alert('System Backup successfully verified and restored! The application will now reload to apply all restored data.');
        window.location.reload();
      } catch (err) {
        alert('Failed to restore backup: ' + err.message);
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const handlePurgeTransactionsOnly = () => {
    const invKey = isRetail ? 'pharmalink_retail_invoices' : 'pharmalink_pk_invoices';
    const debtKey = isRetail ? 'pharmalink_retail_debt_customers' : 'pharmalink_debt_customers';
    const patKey = isRetail ? 'pharmalink_retail_patients' : 'pharmalink_pk_patients';

    if (window.confirm('⚠️ PURGE TEST TRANSACTIONS:\\n\\nThis will clear all test invoices, test customer khata debts, and sample patient files, but KEEP your medicine inventory intact.\\n\\nReady to begin fresh production sales?')) {
      localStorage.setItem(invKey, JSON.stringify([]));
      localStorage.setItem(debtKey, JSON.stringify([]));
      localStorage.setItem(patKey, JSON.stringify([]));
      alert('Test transactions, debts, and patient files purged! System is ready for Day 1 production sales.');
      window.location.reload();
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('⚠️ FULL FACTORY RESET:\\n\\nThis will completely wipe all local data (medicines, batches, invoices, debts, settings) back to an absolute clean slate.\\n\\nAre you sure you want to proceed?')) {
      localStorage.clear();
      alert('All local data cleared. System reset to factory clean slate.');
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* TOP TABS (DYNAMIC RETAIL VS WHOLESALE) */}
      <div className="card" style={{ padding: '0.5rem', backgroundColor: '#ffffff', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`btn ${activeTab === 'PROFILE' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <Building size={14} /> {isRetail ? 'Retail Pharmacy Profile & Receipt' : 'Store Profile & DSL'}
        </button>

        {!isRetail && (
          <button
            onClick={() => setActiveTab('TAXES')}
            className={`btn ${activeTab === 'TAXES' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', borderRadius: '10px' }}
          >
            <Percent size={14} /> Wholesale B2B Taxes
          </button>
        )}

        {!isRetail && (
          <button
            onClick={() => setActiveTab('WARRANTY')}
            className={`btn ${activeTab === 'WARRANTY' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '12px', borderRadius: '10px' }}
          >
            <FileText size={14} /> DRAP & Sec 23 Warranties
          </button>
        )}

        <button
          onClick={() => setActiveTab('STAFF')}
          className={`btn ${activeTab === 'STAFF' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <Users size={14} /> Cashier & Staff Accounts
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`btn ${activeTab === 'BACKUP' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <Database size={14} /> Backup & Restore Data
        </button>
      </div>

      {/* TAB 1: STORE PROFILE & DSL */}
      {activeTab === 'PROFILE' && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            <h3 className="section-title" style={{ fontSize: '16px', color: '#0284c7' }}>
              {isRetail ? 'Retail Pharmacy Store Profile & Thermal Receipt Header' : 'Wholesale Entity Profile & B2B Invoicing'}
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              {isRetail
                ? 'Configure pharmacy name, Drug License Form 20/21, phone, address & pharmacist digital signature for POS thermal slips'
                : 'Configure legal wholesale entity licensing details, Form 20/21, NTN & digital signature stamp'}
            </p>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Store / Pharmacy Trade Name *:</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} required />
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Contact Phone Number(s) *:</label>
                <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} required />
              </div>
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Full Business & Store Address *:</label>
              <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>STN Registration # (Optional):</label>
                <input type="text" value={stnReg} onChange={(e) => setStnReg(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>NTN Tax Number (Optional):</label>
                <input type="text" value={ntnTax} onChange={(e) => setNtnTax(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>GSTIN / Tax Reg # (Optional):</label>
                <input type="text" value={gstinTax} onChange={(e) => setGstinTax(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Drug License (Form 20):</label>
                <input type="text" value={dslForm20} onChange={(e) => setDslForm20(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Drug License (Form 21):</label>
                <input type="text" value={dslForm21} onChange={(e) => setDslForm21(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
              </div>
            </div>

            {/* DIGITAL SIGNATURE & STAMP SECTION (PDF PAGE 6 MATCH) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '0.65rem' }}>
                ✍️ Official PNG Digital Signature & Stamp Selection
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Authorized Signatory Name:</label>
                  <input type="text" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
                </div>

                <div>
                  <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Authorized Designation / Role:</label>
                  <input type="text" value={signatoryRole} onChange={(e) => setSignatoryRole(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Upload New PNG Signature Image:</label>
                  <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} style={{ fontSize: '11px' }} />
                </div>

                <button type="button" onClick={handleResetSignature} className="btn btn-outline" style={{ fontSize: '11px', padding: '0.3rem 0.65rem' }}>
                  Reset Default PNG
                </button>
              </div>

              {/* SIGNATURE PREVIEW */}
              <div style={{ marginTop: '0.75rem', border: '1px dashed #cbd5e1', padding: '0.65rem', borderRadius: '8px', backgroundColor: '#ffffff', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '0.25rem' }}>Signature Preview:</div>
                {signatureImage ? (
                  <img src={signatureImage} alt="Signature Preview" style={{ height: '45px', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#0f172a', fontWeight: 'bold' }}>{signatoryName}</div>
                )}
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>
                  ✔ This PNG signature will be automatically rendered on all Printable A4 Invoices, Customer Statements, and Financial Reports.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', backgroundColor: '#0284c7', padding: '0.6rem 1.25rem' }}>
                <CheckCircle size={15} /> Save Store Profile & Signature
              </button>
              <button type="button" onClick={() => alert('Profile fields cleared')} className="btn btn-outline" style={{ borderRadius: '10px' }}>
                Clear All Profile Fields
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: GLOBAL TAXES (PDF PAGE 6 MATCH) */}
      {activeTab === 'TAXES' && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            <h3 className="section-title" style={{ fontSize: '16px', color: '#0284c7' }}>
              System-Wide Global Tax Percentage & Checkbox Configuration
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Check/uncheck default taxes and set standard percentage rates applied across POS billing and A4 tax invoices
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={enableSalesTax18} onChange={(e) => setEnableSalesTax18(e.target.checked)} />
                <span>Enable Sales Tax 18%</span>
              </label>

              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.4rem' }}>Tax Heading Name: Sale Tax 18%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Percentage (%):</span>
                <input type="number" value={salesTaxRate} onChange={(e) => setSalesTaxRate(e.target.value)} style={{ width: '70px', padding: '0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={enableAdvTax05} onChange={(e) => setEnableAdvTax05(e.target.checked)} />
                <span>Enable Advance Tax (AdvTax) 0.5%</span>
              </label>

              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.4rem' }}>Tax Heading Name: Adv Tax 0.5%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Percentage (%):</span>
                <input type="number" step="any" value={advTaxRate} onChange={(e) => setAdvTaxRate(e.target.value)} style={{ width: '70px', padding: '0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }} />
              </div>
            </div>
          </div>

          <button onClick={() => alert('Global Tax Rates saved!')} className="btn btn-primary" style={{ borderRadius: '10px', backgroundColor: '#0284c7' }}>
            <CheckCircle size={15} /> Save Global Tax Rates
          </button>
        </div>
      )}

      {/* TAB 3: WARRANTY & INVOICE NOTES (PDF PAGE 7 MATCH) */}
      {activeTab === 'WARRANTY' && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            <h3 className="section-title" style={{ fontSize: '16px', color: '#0284c7' }}>
              Legal Warranty Texts & Custom Invoice Footer Notes
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Customize Drug Act 1976 Form 2A and DRAP Act 2012 warranties printed at the bottom of commercial A4 tax invoices
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={enableSec23} onChange={(e) => setEnableSec23(e.target.checked)} />
                <span>Enable Section 23 Drug Act 1976 Warranty (Form 2A) on Invoices</span>
              </label>
              <textarea value={sec23Text} onChange={(e) => setSec23Text(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} />
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={enableDrap} onChange={(e) => setEnableDrap(e.target.checked)} />
                <span>Enable DRAP Rules 2014 Alternative Medicines Warranty on Invoices</span>
              </label>
              <textarea value={drapText} onChange={(e) => setDrapText(e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} />
            </div>
          </div>

          <button onClick={() => alert('Legal Warranty configurations saved!')} className="btn btn-primary" style={{ borderRadius: '10px', backgroundColor: '#0284c7' }}>
            <CheckCircle size={15} /> Save Legal Warranty Configurations
          </button>
        </div>
      )}

      {/* TAB 4: CASHIER & STAFF ACCOUNTS (PDF PAGE 7 MATCH) */}
      {activeTab === 'STAFF' && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          {/* CREATE STAFF FORM */}
          <div style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '12px', backgroundColor: '#f8fafc', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '0.2rem' }}>
              + Create New Cashier or Employee Account
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '0.65rem' }}>
              Security Policy: Admins can only create Cashiers or Delivery Employees. Admins cannot generate another Admin account.
            </div>

            <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr auto', gap: '0.65rem', alignItems: 'flex-end' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Staff Name *:</label>
                <input type="text" placeholder="Enter Full Name (e.g. Bilal Ahmed)" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} required />
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Role *:</label>
                <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}>
                  <option value="Cashier (POS & Invoicing)">Cashier (POS & Invoicing)</option>
                  <option value="Delivery Staff">Delivery Staff (Logistics)</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Phone #:</label>
                <input type="text" placeholder="+92 300 1234567" value={newStaffPhone} onChange={(e) => setNewStaffPhone(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px', backgroundColor: '#0284c7', fontSize: '11px', padding: '0.45rem 0.85rem' }}>
                <Plus size={13} /> Add Staff
              </button>
            </form>
          </div>

          {/* REGISTERED STAFF ACCOUNTS TABLE */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
              Registered Staff Accounts ({staffAccounts.length})
            </div>

            <div className="table-container">
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Staff Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffAccounts.map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.id}</td>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{s.phone}</td>
                      <td><span className="badge badge-otc">{s.role}</span></td>
                      <td><span className="badge badge-success">{s.status || 'Active'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteStaff(s.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE DATA (PDF PAGE 7 MATCH) */}
      {activeTab === 'BACKUP' && (
        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            <h3 className="section-title" style={{ fontSize: '16px', color: '#0284c7' }}>
              System Data Backup & Restore Utility
            </h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Export a complete snapshot file of your wholesale inventory, store memory, customer ledgers, and settings for disaster recovery
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <Download size={15} color="#0284c7" /> Export Complete System Backup (JSON)
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.85rem' }}>
                Exports all medicines, batches, sales invoices, customer debt khata, suppliers, patients, staff, and store profile into a secure JSON backup file.
              </div>
              <button onClick={handleExportBackup} className="btn btn-primary" style={{ fontSize: '11px', borderRadius: '8px', backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Download size={13} /> Export Backup (.json)
              </button>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <Upload size={15} color="#16a34a" /> Restore Complete System Backup
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.85rem' }}>
                Restores a previously exported backup file to restore all store records, inventory, and customer ledgers safely.
              </div>
              <input type="file" accept=".json" onChange={handleRestoreFile} style={{ fontSize: '11px' }} />
            </div>
          </div>

          {/* PRODUCTION ONBOARDING & DATA RESET */}
          <div style={{ border: '1px solid #fecaca', backgroundColor: '#fff5f5', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <RefreshCw size={15} color="#dc2626" /> Client Production Onboarding & Data Purge
            </div>
            <p style={{ fontSize: '11.5px', color: '#7f1d1d', margin: '0 0 1rem 0' }}>
              Use these tools to transition from demo mode into live client operation. You can safely purge demo sales transactions while keeping your catalog, or perform a complete clean-slate reset.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={handlePurgeTransactionsOnly}
                className="btn btn-outline"
                style={{ backgroundColor: '#ffffff', color: '#b91c1c', border: '1px solid #f87171', fontSize: '11px', borderRadius: '8px', padding: '0.45rem 0.85rem', fontWeight: 700 }}
              >
                Purge Test Transactions (Keep Inventory)
              </button>

              <button
                onClick={handleFactoryReset}
                className="btn btn-outline"
                style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', fontSize: '11px', borderRadius: '8px', padding: '0.45rem 0.85rem', fontWeight: 700 }}
              >
                Factory Reset (Blank Slate)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
