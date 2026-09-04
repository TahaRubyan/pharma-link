import React, { useState } from 'react';
import { X, RotateCcw, Search, CheckCircle, Package } from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { useInventory } from '../../context/InventoryContext';

export const RetailSalesReturnModal = ({ isOpen, onClose }) => {
  const { invoices = [] } = useSales();
  const { restoreStock } = useInventory();

  const [receiptQuery, setReceiptQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnedUnits, setReturnedUnits] = useState({});

  if (!isOpen) return null;

  const handleSearchReceipt = () => {
    const found = invoices.find((inv) => inv.invoiceNo.toLowerCase().includes(receiptQuery.toLowerCase().trim()));
    if (found) {
      setSelectedInvoice(found);
      const initial = {};
      (found.items || []).forEach((item, idx) => {
        initial[idx] = 0;
      });
      setReturnedUnits(initial);
    } else {
      alert('Thermal Receipt # not found. Please verify the receipt barcode.');
    }
  };

  const handleUnitChange = (idx, val, maxUnits) => {
    const num = Math.min(maxUnits, Math.max(0, Number(val) || 0));
    setReturnedUnits((prev) => ({ ...prev, [idx]: num }));
  };

  const totalRefund = selectedInvoice
    ? (selectedInvoice.items || []).reduce((sum, item, idx) => {
        const units = returnedUnits[idx] || 0;
        const rate = Number(item.unitPrice || item.price || item.boxPrice || 0);
        return sum + units * rate;
      }, 0)
    : 0;

  const handleProcessReturn = () => {
    if (totalRefund <= 0) {
      alert('Please select at least 1 unit to return.');
      return;
    }

    const itemsToRestore = (selectedInvoice.items || [])
      .map((item, idx) => ({
        ...item,
        quantity: returnedUnits[idx] || 0,
        qty: returnedUnits[idx] || 0,
        unitSelection: item.unitSelection || item.unitType || 'Tablet',
      }))
      .filter((i) => i.quantity > 0);

    restoreStock(itemsToRestore);
    alert(`Retail Return processed! Restocked loose units on shelf and refunded Rs. ${totalRefund.toFixed(2)} cash.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '88vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626' }}>
            <RotateCcw size={18} color="#dc2626" /> Retail Counter Fast Sales Return & Exchange
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Scan thermal receipt barcode or enter receipt # to refund loose tablets/strips and restock shelf
          </p>
        </div>

        {/* RECEIPT SEARCH */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Scan Barcode or Enter Receipt # (e.g. INV-20260822-320791)..."
            value={receiptQuery}
            onChange={(e) => setReceiptQuery(e.target.value)}
            style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            autoFocus
          />
          <button onClick={handleSearchReceipt} className="btn btn-primary" style={{ borderRadius: '10px', backgroundColor: '#0284c7', fontSize: '12px' }}>
            <Search size={14} /> Lookup Receipt
          </button>
        </div>

        {selectedInvoice && (
          <div>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Receipt #{selectedInvoice.invoiceNo} — {selectedInvoice.customerName || 'Walk-in Customer'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Date: {selectedInvoice.date} {selectedInvoice.time} | Total: Rs. {Number(selectedInvoice.netTotal || 0).toFixed(2)}
              </div>
            </div>

            <div className="table-container" style={{ marginBottom: '1rem' }}>
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Batch #</th>
                    <th>Sold Qty</th>
                    <th>Unit Rate</th>
                    <th style={{ width: '100px' }}>Return Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item, idx) => {
                    const unitRate = Number(item.unitPrice || item.price || (item.boxPrice / 200) || 3.0);
                    const qtySold = Number(item.qty || item.quantity || 1);

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700 }}>{item.name || item.brandName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.batchNo || item.batchNumber}</td>
                        <td>{qtySold} {item.unitSelection || item.unitType || 'Units'}</td>
                        <td>Rs. {unitRate.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={qtySold}
                            value={returnedUnits[idx] || 0}
                            onChange={(e) => handleUnitChange(idx, e.target.value, qtySold)}
                            style={{ width: '65px', padding: '0.25rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b' }}>Cash Refund to Customer:</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>Rs. {totalRefund.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
                Cancel
              </button>
              <button onClick={handleProcessReturn} className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#dc2626' }}>
                <RotateCcw size={14} /> Process Cash Refund & Restock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailSalesReturnModal;
