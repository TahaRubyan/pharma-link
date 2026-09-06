import React from 'react';
import { Printer, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ThermalPrintModal = ({ invoice, onClose }) => {
  const { currentShop } = useAuth();
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || invoice.grossTotal || 0);
  const discount = Number(invoice.discount || invoice.discountAmount || 0);
  const netTotal = Number(invoice.netTotal || subtotal - discount);
  const tendered = Number(invoice.cashTendered || invoice.tendered || 0);
  const change = Number(invoice.changeDue || invoice.change || 0);

  const activeShopName = currentShop?.shopName || 'Idrees Medical Store';
  const activeAddress = currentShop?.address || 'F-7 Markaz, Islamabad, Pakistan';
  const activePhone = currentShop?.phone || '051-2345678';
  const activeDL = currentShop?.dlNumber || 'PK-DL-20-45812 & Form 21';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '1.25rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Printer size={20} color="#10B981" />
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>80mm Customer Thermal Receipt</h3>
        </div>

        {/* 80mm Receipt Box */}
        <div id="thermal-receipt" style={{ backgroundColor: '#FFF', border: '1px dashed #CBD5E1', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#000', lineHeight: 1.4 }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            {activeShopName.toUpperCase()}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>{activeAddress} | Ph: {activePhone}</div>
          <div style={{ textAlign: 'center', fontSize: '0.7rem' }}>Form 20/21 DL: {activeDL}</div>
          <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />

          <div>Inv #: <strong>{invoice.invoiceNo}</strong></div>
          <div>Date: {invoice.date} {invoice.time}</div>
          <div>Customer: {invoice.customerName || invoice.shopName}</div>
          {invoice.doctorName && invoice.doctorName !== '-' && <div>Dr: {invoice.doctorName}</div>}
          <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontWeight: 'bold' }}>
            <span>Item</span>
            <span style={{ textAlign: 'center' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Total</span>
          </div>

          {items.map((item, idx) => {
            const itemQty = Number(item.qty || item.quantity || 1);
            let itemPrice = Number(item.boxPrice || item.price || item.unitPrice || 0);

            if (item.unitSelection === 'Tablet') {
              itemPrice = Number(item.pricePerTablet || (item.boxPrice / (item.tabletsPerBox || 200)) || 3.0);
            } else if (item.unitSelection === 'Strip') {
              itemPrice = Number(item.stripPrice || ((item.boxPrice || 600) / (item.stripsPerBox || 10)) || 30.0);
            }

            const itemTotal = itemPrice * itemQty;

            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', marginTop: '0.2rem' }}>
                <span>{item.name || item.brandName}</span>
                <span style={{ textAlign: 'center' }}>{itemQty} {item.unitType || item.unitSelection || 'Box'}</span>
                <span style={{ textAlign: 'right' }}>Rs. {itemTotal.toFixed(2)}</span>
              </div>
            );
          })}

          <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
              <span>Discount ({invoice.discountPercent || 0}%):</span>
              <span>-Rs. {discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            <span>NET TOTAL:</span>
            <span>Rs. {netTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <span>Cash Tendered:</span>
            <span>Rs. {tendered.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Change Return:</span>
            <span>Rs. {change.toFixed(2)}</span>
          </div>

          <hr style={{ borderTop: '1px dashed #000', margin: '0.5rem 0' }} />
          <div style={{ textAlign: 'center', fontSize: '0.65rem', whiteSpace: 'pre-line' }}>
            {localStorage.getItem('pharmalink_receipt_footer') || '* Medicines once sold can be returned/exchanged within 7 days with original receipt. *'}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Thank you! Wish you good health.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Close</button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10B981', color: '#FFF', fontWeight: 800 }}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrintModal;
