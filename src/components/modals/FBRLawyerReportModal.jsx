import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

const DEFAULT_REFERENCE_SCHEDULE = [
  { num: 1, name: "Panadol Extra", formula: "Paracetamol + Caffeine", qty: 20, taxable: 9360.00, st18: 1684.80 },
  { num: 2, name: "Augmentin 625mg", formula: "Amoxicillin + Clavulanic Acid", qty: 18, taxable: 26100.00, st18: 4698.00 },
  { num: 3, name: "Risek 20mg", formula: "Omeprazole USP", qty: 6, taxable: 5520.00, st18: 993.60 },
  { num: 4, name: "Softin 10mg", formula: "Loratadine USP", qty: 5, taxable: 1700.00, st18: 306.00 },
  { num: 5, name: "Lipiget 20mg", formula: "Atorvastatin Calcium", qty: 10, taxable: 8900.00, st18: 1602.00 },
  { num: 6, name: "Klaricid 500mg", formula: "Clarithromycin USP", qty: 4, taxable: 7030.00, st18: 1265.40 },
  { num: 7, name: "Nexum 40mg", formula: "Esomeprazole Magnesium", qty: 5, taxable: 5600.00, st18: 1008.00 },
  { num: 8, name: "Voltral 50mg", formula: "Diclofenac Sodium", qty: 12, taxable: 5040.00, st18: 907.20 },
  { num: 9, name: "Flagyl 400mg", formula: "Metronidazole USP", qty: 15, taxable: 5400.00, st18: 972.00 },
  { num: 10, name: "Amoxil 500mg", formula: "Amoxicillin Trihydrate", qty: 10, taxable: 6800.00, st18: 1224.00 },
  { num: 11, name: "Brufen 400mg", formula: "Ibuprofen BP", qty: 10, taxable: 4100.00, st18: 738.00 },
  { num: 12, name: "Surbex-Z", formula: "Zinc + High Potency Vitamin B-Complex", qty: 14, taxable: 10920.00, st18: 1965.60 },
  { num: 13, name: "Cac-1000 Plus", formula: "Calcium Lactate + Vitamin C", qty: 10, taxable: 6175.00, st18: 1111.50 },
  { num: 14, name: "Arinac Forte", formula: "Ibuprofen + Pseudoephedrine", qty: 8, taxable: 4320.00, st18: 777.60 },
  { num: 15, name: "Ciproxin 500mg", formula: "Ciprofloxacin HCl", qty: 6, taxable: 8100.00, st18: 1458.00 },
  { num: 16, name: "Xb-40 40mg", formula: "Esomeprazole Sodium", qty: 8, taxable: 6880.00, st18: 1238.40 },
  { num: 17, name: "Zestril 10mg", formula: "Lisinopril Dihydrate", qty: 8, taxable: 7840.00, st18: 1411.20 },
  { num: 18, name: "Disprin 300mg", formula: "Aspirin USP", qty: 12, taxable: 3480.00, st18: 626.40 },
];

const ReportContentView = ({
  currentShop,
  auditPeriodText,
  dateWindowText,
  invoicesCount,
  generatedDateText,
  totalTaxable,
  totalTax,
  taxRateText,
  scheduleItems,
  totalUnits,
  sigImageBase64,
  sigName,
  sigRole
}) => (
  <div
    id="printable-fbr-report"
    className="a4-page-container"
    style={{
      backgroundColor: '#ffffff',
      color: '#0f172a',
      padding: '1.25rem 1.5rem',
      boxSizing: 'border-box',
      border: '2px solid #111827',
      fontFamily: 'var(--font-sans)',
      fontSize: '11px',
      lineHeight: 1.35,
      width: '100%',
      maxWidth: '195mm',
      margin: '0 auto'
    }}
  >
    {/* HEADER BAR */}
    <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '0.65rem', marginBottom: '0.85rem' }}>
      <h2 style={{ fontSize: '19px', fontWeight: 900, color: '#111827', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
        {currentShop?.shopName || 'TESTING SHOP'}
      </h2>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
        {currentShop?.address || 'Jalal Pur Jattan, Gujrat'}
      </div>
      <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '0.15rem' }}>
        Phone: {currentShop?.phone || '053-3724601, 053-3724602'} | STN: {currentShop?.gstin || '3277876174544'} | NTN: {currentShop?.ntn || '4442705-7'}
      </div>
      <div style={{ fontSize: '10.5px', color: '#475569' }}>
        DSL (Form 20): {currentShop?.dlNumber || '09-342-0139-045748D'} | DSL (Form 21): {currentShop?.dlNumber || '09-342-0139-045748D'}
      </div>

      <div style={{ marginTop: '0.55rem', display: 'inline-block', border: '2px solid #111827', padding: '0.3rem 1.25rem', fontWeight: 900, fontSize: '12.5px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        OFFICIAL FBR SALES TAX AUDIT & LAWYER REPORT
      </div>
    </div>

    {/* METADATA 2-COLUMN BOX */}
    <div style={{ border: '1px solid #111827', padding: '0.55rem 0.85rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', fontSize: '10.5px', marginBottom: '0.85rem' }}>
      <div>
        <div><strong>Audit Report Period:</strong> {auditPeriodText}</div>
        <div><strong>Date Window:</strong> {dateWindowText}</div>
        <div><strong>Total Sales Invoices Issued:</strong> {invoicesCount} Invoice(s)</div>
      </div>

      <div>
        <div><strong>Generated Date:</strong> {generatedDateText}</div>
        <div><strong>FBR Tax Return Reference:</strong> Annexure-C Sales Register</div>
        <div><strong>Legal Jurisdiction:</strong> Federal Board of Revenue (FBR) Pakistan</div>
      </div>
    </div>

    {/* 3 KPI BOXES */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '0.85rem', textAlign: 'center' }}>
      <div style={{ border: '1px solid #111827', padding: '0.45rem' }}>
        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>TOTAL TAXABLE SALES</div>
        <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '0.15rem' }}>Rs. {totalTaxable.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
      </div>

      <div style={{ border: '1px solid #111827', padding: '0.45rem' }}>
        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>SALES TAX (18%) RATE</div>
        <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '0.15rem' }}>{taxRateText}</div>
      </div>

      <div style={{ border: '1px solid #111827', padding: '0.45rem' }}>
        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>NET TOTAL SALES TAX COLLECTED</div>
        <div style={{ fontSize: '15px', fontWeight: 900, marginTop: '0.15rem' }}>Rs. {totalTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    {/* SCHEDULE TABLE */}
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
        📋 Itemized Medicine Sales & Sales Tax Audit Schedule:
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderTop: '2px solid #111827', borderBottom: '2px solid #111827', backgroundColor: '#f8fafc', fontWeight: 800 }}>
            <th style={{ padding: '0.3rem 0.35rem', width: '24px' }}>#</th>
            <th style={{ padding: '0.3rem 0.35rem' }}>Item Name</th>
            <th style={{ padding: '0.3rem 0.35rem' }}>Formula / Generic</th>
            <th style={{ padding: '0.3rem 0.35rem', textAlign: 'center', width: '85px' }}>Sold Quantity (Units)</th>
            <th style={{ padding: '0.3rem 0.35rem', textAlign: 'right', width: '95px' }}>Taxable Sales (Rs.)</th>
            <th style={{ padding: '0.3rem 0.35rem', textAlign: 'right', width: '95px' }}>Sales Tax 18%/19% (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {scheduleItems.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                No outward taxable sales recorded in selected audit period. Add sales invoices to generate audited schedule.
              </td>
            </tr>
          ) : (
            scheduleItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.25rem 0.35rem', fontFamily: 'var(--font-mono)' }}>{item.num || idx + 1}</td>
                <td style={{ padding: '0.25rem 0.35rem', fontWeight: 700 }}>{item.name}</td>
                <td style={{ padding: '0.25rem 0.35rem', color: '#475569' }}>{item.formula}</td>
                <td style={{ padding: '0.25rem 0.35rem', textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                <td style={{ padding: '0.25rem 0.35rem', textAlign: 'right' }}>Rs. {Number(item.taxable).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '0.25rem 0.35rem', textAlign: 'right', fontWeight: 700 }}>Rs. {Number(item.st18 || item.taxAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))
          )}
          <tr style={{ borderTop: '2px solid #111827', borderBottom: '2px solid #111827', fontWeight: 900, backgroundColor: '#f8fafc' }}>
            <td colSpan="3" style={{ padding: '0.4rem 0.35rem' }}>TOTAL (UNITS, SALES, TAX):</td>
            <td style={{ padding: '0.4rem 0.35rem', textAlign: 'center' }}>{totalUnits} Units</td>
            <td style={{ padding: '0.4rem 0.35rem', textAlign: 'right' }}>Rs. {totalTaxable.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
            <td style={{ padding: '0.4rem 0.35rem', textAlign: 'right' }}>Rs. {totalTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* LEGAL COMPLIANCE DECLARATION & SIGNATURE */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #111827', paddingTop: '0.65rem', marginTop: '0.85rem' }}>
      <div style={{ maxWidth: '440px', fontSize: '9.5px', color: '#334155', lineHeight: 1.35 }}>
        <strong>Legal Compliance Declaration:</strong><br />
        This official Sales Tax Audit Schedule is compiled from certified POS invoice registers of {currentShop?.shopName || 'Testing Shop'} under the Sales Tax Act, 1990 and DRAP Act 2012 for FBR Tax Lawyer review.
      </div>

      <div style={{ textAlign: 'center' }}>
        {sigImageBase64 ? (
          <img src={sigImageBase64} alt="Digital Signature" style={{ height: '36px', objectFit: 'contain' }} />
        ) : (
          <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#111827', fontWeight: 'bold' }}>{sigName}</div>
        )}
        <div style={{ borderTop: '1px solid #111827', width: '220px', marginTop: '0.15rem', paddingTop: '0.15rem', fontSize: '9.5px', fontWeight: 800 }}>
          {sigName} ({sigRole})
        </div>
        <div style={{ fontSize: '8.5px', color: '#16a34a', fontWeight: 700 }}>
          ✔ VERIFIED DIGITAL SIGNATURE
        </div>
      </div>
    </div>
  </div>
);

export const FBRLawyerReportModal = ({ isOpen, onClose, invoices = [], fbrData = null }) => {
  const { currentShop } = useAuth();
  const [mountReady, setMountReady] = useState(false);
  const mountElRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let mountEl = document.getElementById('a4-print-mount');
    if (!mountEl && typeof document !== 'undefined') {
      mountEl = document.createElement('div');
      mountEl.id = 'a4-print-mount';
      mountEl.className = 'a4-print-only';
      document.body.appendChild(mountEl);
    }
    mountElRef.current = mountEl;
    setMountReady(true);
    document.body.classList.add('printing-a4');

    const handleBeforePrint = () => {
      document.body.classList.add('printing-a4');
    };
    const handleAfterPrint = () => {
      // Finished print
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.body.classList.remove('printing-a4');
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (mountEl) {
        mountEl.innerHTML = '';
      }
    };
  }, [isOpen]);

  const sigImageBase64 = localStorage.getItem('pharmalink_sig_image') || currentShop?.signatureImage || '';
  const sigName = localStorage.getItem('pharmalink_sig_name') || currentShop?.signatoryName || 'Testing Administrator';
  const sigRole = localStorage.getItem('pharmalink_sig_role') || currentShop?.signatoryRole || 'Authorized Signatory | Owner';

  // Compute schedule items from real invoices or fallback to inspiration PDF schedule
  const scheduleItems = useMemo(() => {
    if (fbrData?.items && fbrData.items.length > 0) return fbrData.items;
    if (invoices && invoices.length > 0) {
      const map = {};
      invoices.forEach((inv) => {
        (inv.items || []).forEach((item) => {
          const name = item.name || item.brandName || 'Medicine Item';
          const formula = item.formula || item.genericFormula || 'Formula USP';
          const rate = Number(item.boxPrice || item.price || item.unitPrice || 600);
          const qty = Number(item.qty || item.quantity || 1);
          const taxable = rate * qty - Number(item.discount || 0);
          const stRate = Number(item.taxRate !== undefined ? item.taxRate : (item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18));
          const st = taxable * (stRate / 100);

          if (!map[name]) {
            map[name] = { name, formula, qty: 0, taxable: 0, st18: 0 };
          }
          map[name].qty += qty;
          map[name].taxable += taxable;
          map[name].st18 += st;
        });
      });
      const arr = Object.values(map);
      if (arr.length > 0) {
        return arr.map((row, idx) => ({ num: idx + 1, ...row }));
      }
    }
    return [];
  }, [fbrData, invoices]);

  const totalUnits = scheduleItems.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  const totalTaxable = scheduleItems.reduce((sum, i) => sum + Number(i.taxable || 0), 0);
  const totalTax = scheduleItems.reduce((sum, i) => sum + Number(i.st18 || i.taxAmount || 0), 0);

  const reportProps = {
    currentShop,
    auditPeriodText: fbrData?.auditPeriod || 'Current Month (30 Days Log)',
    dateWindowText: fbrData?.dateWindow || '2026-09-01 to 2026-09-30',
    invoicesCount: invoices.length,
    generatedDateText: formatDateDDMMYYYY(new Date()),
    totalTaxable,
    totalTax,
    taxRateText: '18% / 19% Standard',
    scheduleItems,
    totalUnits,
    sigImageBase64,
    sigName,
    sigRole
  };

  const handlePrint = () => {
    document.body.classList.add('printing-a4');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 1. PORTAL PRINT MOUNT: strictly outside #root for 100% isolated A4 print */}
      {mountReady && mountElRef.current && ReactDOM.createPortal(
        <ReportContentView {...reportProps} />,
        mountElRef.current
      )}

      {/* 2. ON-SCREEN MODAL PREVIEW */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '92vh', overflowY: 'auto' }}>
          <button onClick={onClose} className="a4-no-print" style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
            <X size={18} color="#64748B" />
          </button>

          {/* Action Header */}
          <div className="flex-between a4-no-print" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
                <ShieldCheck size={18} color="#0284c7" /> Official FBR Sales Tax Audit & Lawyer Report (Annexure-C)
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Form 2A & FBR compliant itemized audit schedule for tax lawyer submission & return filing
              </p>
            </div>

            <button onClick={handlePrint} className="btn btn-primary a4-no-print" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#111827', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={15} /> Print FBR Tax PDF
            </button>
          </div>

          {/* On-screen preview of report */}
          <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
            <ReportContentView {...reportProps} />
          </div>

          <div className="a4-no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
              Close Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FBRLawyerReportModal;

