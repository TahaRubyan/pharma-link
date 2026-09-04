import React from 'react';
import { Printer, X, ShieldCheck, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const GovtSectorClaimModal = ({ invoice, onClose }) => {
  const { currentShop } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) return null;

  const shopName = currentShop?.shopName || 'Idrees Medical Store';
  const shopAddress = currentShop?.address || 'F-7 Markaz, Islamabad';
  const shopPhone = currentShop?.phone || '051-2345678';
  const shopDL = currentShop?.dlNumber || 'PK-DL-20-45812 & Form 21';
  const shopGSTIN = currentShop?.gstin || 'PK-1234567-8';

  const sigName = localStorage.getItem('pharmalink_sig_name') || currentShop?.signatoryName || 'Dr. Idrees';
  const sigRole = localStorage.getItem('pharmalink_sig_role') || currentShop?.signatoryRole || 'Chief Pharmacist (Reg # PMC-45812)';
  const sigImage = localStorage.getItem('pharmalink_sig_image') || currentShop?.signatureImage || '';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative', backgroundColor: '#FFF' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={24} color="#0284C7" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Govt Employee Official Sector Claim Invoice</h2>
          </div>

          <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', backgroundColor: '#0284C7', color: '#FFF' }}>
            <Printer size={16} /> Print Claim Invoice
          </button>
        </div>

        {/* Official Printable Invoice Document Body */}
        <div id="printable-govt-invoice" style={{ border: '2px solid #0284C7', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#FFF', fontFamily: 'sans-serif' }}>
          {/* Shop Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284C7', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284C7', margin: 0, textTransform: 'uppercase' }}>{shopName}</h1>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>{shopAddress} | Ph: {shopPhone}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', marginTop: '0.2rem' }}>
                Form 20 & 21 Drug Licenses: {shopDL} | GSTIN: {shopGSTIN}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginBottom: '0.3rem' }}>
                GOVT REIMBURSEMENT CLAIM
              </div>
              <div style={{ fontSize: '0.85rem' }}>Ref #: <strong>{invoice.invoiceNo}</strong></div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Date: {invoice.date} {invoice.time}</div>
            </div>
          </div>

          {/* Government Employee & Family Details */}
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div>
              <div style={{ color: '#64748B', fontWeight: 700 }}>GOVT EMPLOYEE DETAILS:</div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F2937' }}>{invoice.customerName || 'Subedar Riaz Ahmed'}</div>
              <div>Sector / Dept Claim ID: <strong>GOVT-SECT-9912</strong></div>
              <div>Department / Ministry: <strong>Defense & Secretariat Services</strong></div>
            </div>

            <div>
              <div style={{ color: '#64748B', fontWeight: 700 }}>PATIENT & DOCTOR INFO:</div>
              <div>Patient / Dependant Name: <strong>{invoice.customerName}</strong></div>
              <div>Prescribing Doctor: <strong>{invoice.doctorName || 'Dr. Aamir Khan (PMC-45812)'}</strong></div>
              <div>Payment Settlement: <span className="badge badge-success">Official Stipend Claim</span></div>
            </div>
          </div>

          {/* Itemized Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0284C7', color: '#FFF', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>#</th>
                <th style={{ padding: '0.5rem' }}>Medicine Brand Name</th>
                <th style={{ padding: '0.5rem' }}>Generic Active Formula</th>
                <th style={{ padding: '0.5rem' }}>Batch #</th>
                <th style={{ padding: '0.5rem' }}>Qty</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rate (Rs.)</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 800 }}>{item.brandName || item.name}</td>
                  <td style={{ padding: '0.5rem', color: '#64748B' }}>{item.genericFormula || item.formula || 'Paracetamol / Formula'}</td>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{item.batchNumber || item.batchNo}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 700 }}>{item.quantity || item.qty} {item.unitSelection || 'Box'}s</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>Rs. {Number(item.unitPrice || item.price || 480).toFixed(2)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>Rs. {Number(item.total || 960).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '260px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                <span>Subtotal:</span>
                <span>Rs. {invoice.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                <span>GST / FBR Tax (1%):</span>
                <span>Rs. {(invoice.fbrTax || (invoice.subtotal * 0.01)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderTop: '2px solid #0284C7', fontWeight: 900, fontSize: '1rem', color: '#0284C7' }}>
                <span>CLAIM TOTAL:</span>
                <span>Rs. {(invoice.netTotal || invoice.subtotal).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* DIGITAL SIGNATURE & STAMP VERIFICATION BLOCK */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #CBD5E1', paddingTop: '1rem', marginTop: '1rem' }}>
            <div style={{ border: '2px dashed #0284C7', padding: '0.65rem 1rem', borderRadius: '6px', textAlign: 'center', backgroundColor: '#F0F9FF' }}>
              <ShieldCheck size={24} color="#0284C7" style={{ margin: '0 auto 0.2rem' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>{shopName.toUpperCase()} STAMP</div>
              <div style={{ fontSize: '0.65rem', color: '#0369A1' }}>Licence # {shopDL}</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              {sigImage ? (
                <img src={sigImage} alt="Digital Signature" style={{ height: '40px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontFamily: 'cursive', fontSize: '1.35rem', color: '#0284C7', fontWeight: 'bold' }}>{sigName}</div>
              )}
              <div style={{ borderTop: '1px solid #000', width: '200px', marginTop: '0.2rem', paddingTop: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}>
                DIGITAL SIGNATURE & STAMP
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{sigName} ({sigRole})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovtSectorClaimModal;
