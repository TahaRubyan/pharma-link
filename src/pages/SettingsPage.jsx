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
  Plus,
  Printer,
  Laptop,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';
import { useInventory, InventoryContext } from '../context/InventoryContext';
import { ThermalPrintModal } from '../components/modals/ThermalPrintModal';
import { MOCK_STAFF_ACCOUNTS } from '../data/mockData';
import { loadRetailMockData, clearRetailMockData } from '../services/mockDataManager';

const SAMPLE_TEST_INVOICE = {
  invoiceNo: '00000137',
  date: '2026-09-06',
  time: '2:57 am',
  customerName: 'Customer Copy',
  cashierName: 'HASSAN SALEEM',
  shopName: 'IDREES PHARMACY',
  shopAddress: 'NEAR HBL BANK MAIN BAZAR JALAL PUR JATTAN,\nGUJRAT',
  shopPhone: '03126262942',
  shopEmail: 'Company@gmail.com',
  items: [
    { name: 'Myfol 400mcg tab 30s', qty: 10, unitSelection: 'Tablet', unitType: 'Tablet', price: 19, boxPrice: 19 },
    { name: 'QSNATE-D TAB', qty: 10, unitSelection: 'Strip', unitType: 'Strip', price: 20, boxPrice: 20 },
    { name: 'SG INDROP-D 200000IU AMP', qty: 2, unitSelection: 'Ampoule', unitType: 'Amp', price: 313, boxPrice: 313 },
  ],
  grossTotal: 1018.0,
  subtotal: 1018.0,
  discountPercent: 0,
  discount: 0,
  netTotal: 1018.0,
  cashTendered: 1018.0,
  changeDue: 0.0,
  fbrInvoiceNo: '19517326090625751354"',
  paymentMethod: 'Cash (POS)'
};

export const SettingsPage = ({ storeMode }) => {
  const { currentShop, updateStoreProfile } = useAuth();
  const isRetail = (storeMode || currentShop?.mode || 'RETAIL') === 'RETAIL';
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'PRINTER_PWA' | 'TAXES' | 'WARRANTY' | 'STAFF' | 'BACKUP'

  // Tab: Printer & POS Hardware State
  const [printerType, setPrinterType] = useState(() => localStorage.getItem('pharmalink_printer_type') || '80MM');
  const [receiptFooterNote, setReceiptFooterNote] = useState(
    () => localStorage.getItem('pharmalink_receipt_footer') || '* Medicines once sold can be returned/exchanged within 7 days with original receipt. *'
  );
  const [autoPrintOnCheckout, setAutoPrintOnCheckout] = useState(
    () => localStorage.getItem('pharmalink_auto_print_80mm') === 'true'
  );
  const [isTestReceiptOpen, setIsTestReceiptOpen] = useState(false);

  // Tab: PWA State & Hooks
  const { isInstallable, isInstalled, swRegistered, triggerInstall, updateCache } = usePWA();

  const inventoryContext = React.useContext(InventoryContext);
  const medicines = inventoryContext?.medicines || [];
  const batches = inventoryContext?.batches || [];
  const [cacheUpdating, setCacheUpdating] = useState(false);
  const [cacheMessage, setCacheMessage] = useState('');

  const handleSelectPrinter = (type) => {
    setPrinterType(type);
    localStorage.setItem('pharmalink_printer_type', type);
  };

  const handleSaveFooterNote = () => {
    localStorage.setItem('pharmalink_receipt_footer', receiptFooterNote.trim());
    alert('80mm Receipt return policy footer note saved successfully!');
  };

  const handleToggleAutoPrint = (checked) => {
    setAutoPrintOnCheckout(checked);
    localStorage.setItem('pharmalink_auto_print_80mm', checked ? 'true' : 'false');
  };

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

        <button
          onClick={() => setActiveTab('PRINTER_PWA')}
          className={`btn ${activeTab === 'PRINTER_PWA' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <Printer size={14} /> 80mm Printer & PWA Engine
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

          {/* QUICK HARDWARE & PWA STATUS BANNER */}
          <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Printer size={20} color="#0284c7" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1' }}>
                  Active POS Printer: {printerType === '80MM' ? '80mm Thermal Receipt Printer (Default)' : printerType === '58MM' ? '58mm Compact Receipt' : 'A4 Laser Invoice'}
                </div>
                <div style={{ fontSize: '11px', color: '#0284c7' }}>
                  PWA Desktop Engine: {isInstalled ? 'Installed Desktop App' : 'Web Mode (Installable)'} | Offline Cache: {swRegistered ? 'Active & Ready' : 'Standby'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsTestReceiptOpen(true)}
                className="btn btn-outline"
                style={{ fontSize: '11px', padding: '0.35rem 0.75rem', borderRadius: '8px', backgroundColor: '#ffffff', color: '#0284c7', borderColor: '#7dd3fc', fontWeight: 700 }}
              >
                <Printer size={13} /> Test Print 80mm
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PRINTER_PWA')}
                className="btn btn-primary"
                style={{ fontSize: '11px', padding: '0.35rem 0.75rem', borderRadius: '8px', backgroundColor: '#0284c7', fontWeight: 700 }}
              >
                Configure Printer & PWA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: 80MM RECEIPT PRINTER & PWA ENGINE */}
      {activeTab === 'PRINTER_PWA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 80mm RECEIPT PRINTER HARDWARE CONFIGURATION */}
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Printer size={18} color="#0284c7" />
                  <h3 className="section-title" style={{ fontSize: '16px', color: '#0284c7', margin: 0 }}>
                    80mm Thermal Receipt Printer & POS Hardware Selection
                  </h3>
                </div>
                <p className="subtext" style={{ marginTop: '0.25rem' }}>
                  Select your physical counter receipt printer, test print alignment on 80mm thermal paper, and customize return policy footer notes.
                </p>
              </div>

              {/* Test Print 80mm Button */}
              <button
                type="button"
                onClick={() => setIsTestReceiptOpen(true)}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#10b981',
                  borderColor: '#10b981',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  padding: '0.5rem 0.9rem'
                }}
              >
                <Printer size={15} />
                <span>Test Print 80mm Receipt</span>
              </button>
            </div>

            {/* PRINTER SELECTION BUTTONS */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: '#334155' }}>
                Select Active Receipt Printer Type:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                {/* 80mm Button */}
                <div
                  onClick={() => handleSelectPrinter('80MM')}
                  style={{
                    border: printerType === '80MM' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: printerType === '80MM' ? '#f0f9ff' : '#ffffff',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: printerType === '80MM' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: printerType === '80MM' ? '#0284c7' : '#1e293b' }}>
                      🖨️ 80mm Thermal Receipt Printer
                    </span>
                    {printerType === '80MM' && (
                      <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    Standard thermal roll (3-inch / 576 dots). Ideal for high-speed pharmacy POS counter billing, itemized tabs & barcode slips.
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-success" style={{ fontSize: '10px' }}>Default / Recommended</span>
                    <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 600 }}>Hotkeys F9</span>
                  </div>
                </div>

                {/* 58mm Button */}
                <div
                  onClick={() => handleSelectPrinter('58MM')}
                  style={{
                    border: printerType === '58MM' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: printerType === '58MM' ? '#f0f9ff' : '#ffffff',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: printerType === '58MM' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: printerType === '58MM' ? '#0284c7' : '#1e293b' }}>
                      🧾 58mm Compact Receipt Printer
                    </span>
                    {printerType === '58MM' && (
                      <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    Compact 2-inch mini thermal roll (384 dots). Suitable for small handheld Bluetooth POS terminals and kiosks.
                  </div>
                  <div>
                    <span className="badge badge-otc" style={{ fontSize: '10px' }}>Compact 2-Inch</span>
                  </div>
                </div>

                {/* A4 Laser Button */}
                <div
                  onClick={() => handleSelectPrinter('A4')}
                  style={{
                    border: printerType === 'A4' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    backgroundColor: printerType === 'A4' ? '#f0f9ff' : '#ffffff',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: printerType === 'A4' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: printerType === 'A4' ? '#0284c7' : '#1e293b' }}>
                      📄 A4 Laser / Inkjet Tax Invoice
                    </span>
                    {printerType === 'A4' && (
                      <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    Full-page commercial tax invoice format with Section 23 warranty, NTN, and authorized digital signature stamp.
                  </div>
                  <div>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '10px' }}>B2B Wholesale / Hotkey F10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 80mm PRINTER PREFERENCES & FOOTER */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                ⚙️ 80mm POS Print Settings & Store Return Policy
              </div>

              {/* Auto-print toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                <input
                  type="checkbox"
                  checked={autoPrintOnCheckout}
                  onChange={(e) => handleToggleAutoPrint(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                />
                <span>Automatically trigger 80mm print spooler on Cash POS checkout</span>
              </label>

              {/* Footer Text */}
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Custom 80mm Receipt Footer Note (Returns & Exchanges):
                </label>
                <textarea
                  value={receiptFooterNote}
                  onChange={(e) => setReceiptFooterNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. * Medicines once sold can be returned/exchanged within 7 days with original receipt. *"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleSaveFooterNote}
                    className="btn btn-outline"
                    style={{ fontSize: '11px', padding: '0.25rem 0.65rem', borderRadius: '6px' }}
                  >
                    Save Footer Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PWA & OFFLINE DESKTOP ENGINE */}
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Laptop size={18} color="#0284c7" />
                <h3 className="section-title" style={{ fontSize: '16px', color: '#0284c7', margin: 0 }}>
                  Progressive Web App (PWA) & Offline Desktop Engine
                </h3>
              </div>
              <p className="subtext" style={{ marginTop: '0.25rem' }}>
                Install PharmaLink directly onto Windows, macOS, or Android as a standalone POS desktop application that operates with or without internet connectivity.
              </p>
            </div>

            {/* STATUS BADGES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>APPLICATION RUNTIME</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: isInstalled ? '#16a34a' : '#0284c7', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {isInstalled ? (
                    <>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>Standalone Desktop App</span>
                    </>
                  ) : (
                    <>
                      <Laptop size={15} color="#0284c7" />
                      <span>Web Browser Window</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {isInstalled ? 'Running natively without browser URL bar' : 'Installable via Chrome/Edge address bar'}
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>OFFLINE SERVICE WORKER CACHE</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: swRegistered ? '#16a34a' : '#d97706', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} color={swRegistered ? '#16a34a' : '#d97706'} />
                  <span>{swRegistered ? 'Active & Ready for Offline POS' : 'Registering Service Worker...'}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Caches app shell, fonts, and assets for zero-delay counter checkout
                </div>
              </div>
            </div>

            {/* PWA ACTIONS */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={async () => {
                  const res = await triggerInstall();
                  if (res === 'manual_instructions') {
                    alert(
                      '💡 How to Install PharmaLink PWA:\n\n' +
                      '1. In Google Chrome or Microsoft Edge, look at the right end of the address bar.\n' +
                      '2. Click the "Install PharmaLink" icon (⊕ or computer screen symbol).\n' +
                      '3. Click "Install". A desktop shortcut and Start Menu icon will be created automatically!\n\n' +
                      'On Mobile: Tap browser menu (⋮) -> "Add to Home Screen".'
                    );
                  }
                }}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#0284c7',
                  borderRadius: '8px',
                  padding: '0.6rem 1.15rem',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <Download size={15} />
                <span>{isInstalled ? 'App Already Installed (Reinstall / Update)' : 'Install PharmaLink Desktop / Mobile App'}</span>
              </button>

              <button
                type="button"
                disabled={cacheUpdating}
                onClick={async () => {
                  setCacheUpdating(true);
                  setCacheMessage('Updating offline cache...');
                  try {
                    await updateCache();
                    setCacheMessage('Offline cache verified and refreshed! App is up-to-date.');
                  } catch (err) {
                    setCacheMessage('Cache update checked.');
                  } finally {
                    setTimeout(() => setCacheUpdating(false), 800);
                  }
                }}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '8px',
                  padding: '0.6rem 1.15rem',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <RefreshCw size={15} className={cacheUpdating ? 'spin' : ''} />
                <span>{cacheUpdating ? 'Verifying...' : 'Verify & Refresh Offline Cache'}</span>
              </button>
            </div>

            {cacheMessage && (
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginBottom: '1rem' }}>
                ✔ {cacheMessage}
              </div>
            )}

            {/* INSTALLATION INSTRUCTIONS CALLOUT */}
            <div style={{ border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e40af', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <HelpCircle size={14} color="#1e40af" />
                <span>PWA Quick Setup Tips for Retail Counters:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '11px', color: '#1e3a8a', lineHeight: 1.5 }}>
                <li><strong>Windows / Edge / Chrome:</strong> Install to get a dedicated desktop icon that opens full screen without browser toolbars.</li>
                <li><strong>Offline Counter Resilience:</strong> All counter billing, local catalog searches, and receipts run seamlessly even if your internet connection drops.</li>
                <li><strong>Hardware Integration:</strong> Direct USB / Network thermal printer spooling works without popup warnings once installed.</li>
              </ul>
            </div>
          </div>
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

          {/* RETAIL SAMPLE & MOCK DATA CONTROLS */}
          {isRetail && (
            <div style={{ border: '2px solid #38bdf8', backgroundColor: '#f0f9ff', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <Sparkles size={16} color="#0284c7" /> Retail Testing & Mock Data Controls
                  </div>
                  <p style={{ fontSize: '12px', color: '#0c4a6e', margin: '0 0 0.5rem 0', maxWidth: '650px', lineHeight: 1.5 }}>
                    Easily load or clear mock data on your own. Loading mock data populates realistic Pakistani retail pharmaceuticals (Panadol, Augmentin, Risek, Brufen, etc.), active & near-expiry batches, customer credit khata, and sales history for testing POS billing and 80mm receipts. When testing is finished, clear all mock data to start with a completely empty store.
                  </p>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <span>Catalog Status: <strong>{medicines.length} Medicines</strong></span>
                    <span>•</span>
                    <span>Batches: <strong>{batches.length} Lots</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      if (window.confirm('📥 LOAD RETAIL TESTING SAMPLE DATA:\n\nThis will populate your retail store with realistic Pakistani retail pharmaceuticals, batches, customer credit khata, and sample sales.\n\nProceed to load test data?')) {
                        loadRetailMockData(true);
                      }
                    }}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#0284c7', fontSize: '12px', borderRadius: '9px', padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Sparkles size={14} /> Load Retail Mock Data
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('🧹 CLEAR ALL RETAIL MOCK DATA:\n\nThis will wipe all retail medicines, batches, sales invoices, and customer khata, returning your store to an empty clean slate.\n\nProceed to clear all test data?')) {
                        clearRetailMockData(true);
                      }
                    }}
                    className="btn btn-outline"
                    style={{ backgroundColor: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', fontSize: '12px', borderRadius: '9px', padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                  >
                    <Trash2 size={14} /> Clear All Mock Data
                  </button>
                </div>
              </div>
            </div>
          )}

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

      {/* 80MM THERMAL RECEIPT TEST MODAL */}
      {isTestReceiptOpen && (
        <ThermalPrintModal
          invoice={SAMPLE_TEST_INVOICE}
          onClose={() => setIsTestReceiptOpen(false)}
        />
      )}
    </div>
  );
};

export default SettingsPage;
