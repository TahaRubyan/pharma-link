import React, { useState } from 'react';
import { X, RotateCcw, Search, CheckCircle, Package } from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { useInventory } from '../../context/InventoryContext';

export const SalesReturnModal = ({ isOpen, onClose }) => {
  const { invoices = [] } = useSales();
  const { restoreStock } = useInventory();

  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnedBoxes, setReturnedBoxes] = useState({});
  const [returnSuccess, setReturnSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSearchInvoice = () => {
    const found = invoices.find((inv) => inv.invoiceNo.toLowerCase().includes(invoiceQuery.toLowerCase().trim()));
    if (found) {
      setSelectedInvoice(found);
      const initial = {};
      (found.items || []).forEach((item, idx) => {
        initial[idx] = 0;
      });
      setReturnedBoxes(initial);
      setReturnSuccess(false);
    } else {
      alert('Invoice not found. Please check invoice number.');
    }
  };

  const handleBoxChange = (idx, val, maxBoxes) => {
    const num = Math.min(maxBoxes, Math.max(0, Number(val) || 0));
    setReturnedBoxes((prev) => ({ ...prev, [idx]: num }));
  };

  const totalRefund = selectedInvoice
    ? (selectedInvoice.items || []).reduce((sum, item, idx) => {
        const boxes = returnedBoxes[idx] || 0;
        const rate = Number(item.boxPrice || item.price || 0);
        return sum + boxes * rate;
      }, 0)
    : 0;

  const handleProcessReturn = () => {
    if (totalRefund <= 0) {
      alert('Please select at least 1 box to return.');
      return;
    }

    const itemsToRestore = (selectedInvoice.items || [])
      .map((item, idx) => ({
        ...item,
        quantity: returnedBoxes[idx] || 0,
        qty: returnedBoxes[idx] || 0,
        unitSelection: 'Box',
      }))
      .filter((i) => i.quantity > 0);

    restoreStock(itemsToRestore);
    setReturnSuccess(true);
    alert(`Sales Return processed! Restored items to inventory stock and refunded Rs. ${totalRefund.toFixed(2)}.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '88vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RotateCcw size={18} color="#dc2626" /> Sales Return / Item Exchange Engine
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Search invoice #, select items to return, and automatically restock wholesale inventory
          </p>
        </div>

        {/* Invoice Search Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter Invoice # (e.g. INV-20260822-320791)..."
            value={invoiceQuery}
            onChange={(e) => setInvoiceQuery(e.target.value)}
            style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
          <button onClick={handleSearchInvoice} className="btn btn-primary" style={{ borderRadius: '10px', backgroundColor: '#0284c7', fontSize: '12px' }}>
            <Search size={14} /> Search Invoice
          </button>
        </div>

        {selectedInvoice && (
          <div>
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Invoice #{selectedInvoice.invoiceNo} — {selectedInvoice.customerName || selectedInvoice.shopName}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Date: {selectedInvoice.date} | Region: {selectedInvoice.region || 'Unassigned'} | Total: Rs. {Number(selectedInvoice.netTotal || 0).toFixed(2)}
              </div>
            </div>

            <div className="table-container" style={{ marginBottom: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Batch #</th>
                    <th>Sold Qty</th>
                    <th>Rate</th>
                    <th style={{ width: '100px' }}>Return Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, fontSize: '12px' }}>{item.name || item.brandName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{item.batchNo || item.batchNumber}</td>
                      <td style={{ fontSize: '12px' }}>{item.qty || item.quantity || 1} Box</td>
                      <td style={{ fontSize: '12px' }}>Rs. {Number(item.boxPrice || item.price || 0).toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={item.qty || item.quantity || 1}
                          value={returnedBoxes[idx] || 0}
                          onChange={(e) => handleBoxChange(idx, e.target.value, item.qty || item.quantity || 1)}
                          style={{ width: '70px', padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b' }}>Total Refund Amount:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>Rs. {totalRefund.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
                Cancel
              </button>
              <button onClick={handleProcessReturn} className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#dc2626' }}>
                <RotateCcw size={14} /> Process Return & Restock Stock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReturnModal;
