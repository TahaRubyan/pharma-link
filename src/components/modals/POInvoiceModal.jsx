import React, { useRef } from 'react';
import { X, Printer, Building, FileText, CheckCircle2, Truck, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const POInvoiceModal = ({ isOpen, po, onClose }) => {
  const { currentShop } = useAuth();
  const printAreaRef = useRef(null);

  if (!isOpen || !po) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const items = Array.isArray(po.items) && po.items.length > 0 ? po.items : [];
  const poCode = po.poNumber || po.poReference || 'PO-000000';
  const supplier = po.distributor || po.supplierName || 'Pharma Distributor';
  const date = po.inwardDate || po.date || new Date().toISOString().split('T')[0];
  const challanNo = po.challanNo || 'N/A';
  const grossCost = Number(po.grossCost || po.subtotal || po.totalAmount || 0);
  const itemDiscounts = Number(po.itemDiscountsTotal || 0);
  const billDiscount = Number(po.billDiscount || 0);
  const totalDiscount = Number(po.totalDiscount || po.discount || (itemDiscounts + billDiscount) || 0);
  const netGoods = Number(po.netGoodsValue || Math.max(0, grossCost - totalDiscount));
  const isSalesTaxGloballyEnabled = currentShop?.taxSettings?.enableSalesTax18 !== false;
  const stRate = Number(po.salesTaxRate !== undefined ? po.salesTaxRate : (po.salesTaxAmount > 0 ? 18 : 0));
  const stAmount = Number(po.salesTaxAmount || (stRate > 0 ? (netGoods * stRate / 100) : 0));
  const advRate = Number(po.advTaxRate !== undefined ? po.advTaxRate : 0.5);
  const advAmount = Number(po.advTaxAmount || 0);
  const totalAmount = Number(po.totalAmount || po.totalCost || (netGoods + stAmount + advAmount));
  const amountPaid = Number(po.amountPaid !== undefined ? po.amountPaid : totalAmount);
  const remainingDebt = Math.max(0, totalAmount - amountPaid);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      fontFamily: 'var(--font-sans)',
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '95vw',
        maxWidth: '920px',
        maxHeight: '92vh',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER ACTIONS */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#0284c7" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Purchase Order Inward Invoice & Delivery Voucher
            </h3>
            <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>
              {poCode}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-outline"
              style={{
                fontSize: '11.5px',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                backgroundColor: '#ffffff'
              }}
            >
              <Printer size={13} /> Print Invoice
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} color="#64748b" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div ref={printAreaRef} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {/* HEADER SECTION: BUYER STORE & VOUCHER TITLE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {currentShop?.shopName || 'Idrees Pharma Distributor'}
              </div>
              {currentShop?.description && (
                <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, marginTop: '0.1rem' }}>
                  {currentShop.description}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '0.25rem' }}>
                {currentShop?.address || 'Wholesale Medicine Market, Circular Road, Lahore, Pakistan'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '0.15rem' }}>
                Phone: {currentShop?.phone || '0300-5551234'} • Drug License: {currentShop?.dlNumber || (currentShop?.form20 ? `${currentShop.form20} & ${currentShop.form21}` : 'DL-20-IDR-101')}
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                NTN: {currentShop?.ntn || '4442705-8'} • GSTIN / STRN: {currentShop?.gstin || '3277876174588'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0284c7',
                backgroundColor: '#e0f2fe',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                STOCK INWARD INVOICE
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.35rem', color: '#0f172a' }}>
                #{poCode}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
                Inward Date: <strong>{date}</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Challan #: <strong>{challanNo}</strong>
              </div>
            </div>
          </div>

          {/* VENDOR & SETTLEMENT INFO CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Truck size={13} color="#0284c7" /> Supplier / Pharmaceutical Distributor
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{supplier}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.15rem' }}>Payment Terms: <strong>{po.paymentMode || 'Cash'}</strong></div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Stock Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ {po.stockStatus || 'Stock Received'}</span></div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <DollarSign size={13} color="#059669" /> Payment Settlement & Clearance
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                Status: <span style={{ color: remainingDebt <= 0 ? '#16a34a' : '#b45309' }}>{po.paymentStatus || (remainingDebt <= 0 ? 'PAID IN FULL' : 'CREDIT DUE')}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.15rem' }}>
                Amount Paid: <strong>PKR {amountPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ fontSize: '11px', color: remainingDebt > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                Balance Debt: PKR {remainingDebt.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* LINE ITEMS TABLE */}
          <div style={{ marginBottom: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <table className="table" style={{ fontSize: '11px', width: '100%', margin: 0 }}>
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr>
                  <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '75px' }}>Item Code</th>
                  <th>Medicine Name</th>
                  <th>Formula</th>
                  <th style={{ width: '80px' }}>Batch Lot</th>
                  <th style={{ width: '85px' }}>Expiry</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Inward Qty</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Cost / Box</th>
                  <th style={{ width: '75px', textAlign: 'right' }}>Discount</th>
                  <th style={{ width: '95px', textAlign: 'right' }}>Total (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                      {po.itemLines || '1 Inward Shipment Line'}
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const qty = Number(it.inwardBoxes || it.quantity || 1);
                    const cost = Number(it.purchaseCost || it.boxCost || 0);
                    const disc = Number(it.itemDiscount || 0);
                    const total = it.lineTotal !== undefined ? Number(it.lineTotal) : Math.max(0, qty * cost - disc);

                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{it.itemCode || '-'}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{it.tradeName || it.name || 'Medicine Item'}</td>
                        <td style={{ color: '#64748b' }}>{it.genericFormula || it.formula || '-'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{it.batchNo || it.batchNumber || 'B26-001'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0284c7' }}>{it.expiryDate || '12-2028'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{qty} {qty === 1 ? 'Box' : 'Boxes'}</td>
                        <td style={{ textAlign: 'right' }}>PKR {cost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right', color: disc > 0 ? '#dc2626' : '#94a3b8', fontWeight: disc > 0 ? 700 : 400 }}>
                          {disc > 0 ? `- PKR ${disc.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : 'Rs. 0'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          PKR {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY & RECONCILIATION */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '380px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Gross Goods Total:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>PKR {grossCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>

              {itemDiscounts > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '0.35rem', color: '#dc2626' }}>
                  <span>Item-Level Discounts:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>- PKR {itemDiscounts.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {billDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '0.35rem', color: '#dc2626' }}>
                  <span>Whole-Bill Additional Discount:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>- PKR {billDiscount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '0.35rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.3rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Net Taxable Goods Value:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>PKR {netGoods.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Distributor Sales Tax ({stRate}%):</span>
                <span style={{ fontWeight: 700, color: stAmount > 0 ? '#0284c7' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                  {stAmount > 0 ? `+ PKR ${stAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : 'PKR 0.00 (Tax-Exempt / Disabled)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '0.45rem' }}>
                <span style={{ color: '#64748b' }}>Advance Tax / WHT ({advRate}%):</span>
                <span style={{ fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)' }}>+ PKR {advAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900, borderTop: '2px solid #0284c7', paddingTop: '0.5rem', color: '#0284c7' }}>
                <span>Total PO Cost (Payable):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>PKR {totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginTop: '0.4rem', color: '#475569' }}>
                <span>Amount Paid Now:</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>PKR {amountPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginTop: '0.25rem', color: remainingDebt > 0 ? '#dc2626' : '#16a34a' }}>
                <span>Remaining Ledger Debt:</span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>PKR {remainingDebt.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* SIGNATURE / AUDIT STAMP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
            <div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '180px', height: '28px' }}></div>
              <div style={{ marginTop: '0.35rem', fontWeight: 700, color: '#0f172a' }}>Inward Warehouse Officer</div>
              <div>Stock inspected, verified & checked in</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '180px', height: '28px', marginLeft: 'auto' }}></div>
              <div style={{ marginTop: '0.35rem', fontWeight: 700, color: '#0f172a' }}>Managing Pharmacist / Admin</div>
              <div>Authorized signature & compliance stamp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POInvoiceModal;
