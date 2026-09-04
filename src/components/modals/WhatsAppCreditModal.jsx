import React from 'react';
import { X, Send, CheckCircle, MessageSquare, Phone, DollarSign } from 'lucide-react';

export const WhatsAppCreditModal = ({ isOpen, onClose, customer, saleData, shopName = 'Idrees Medical Store' }) => {
  if (!isOpen || !customer || !saleData) return null;

  const phoneClean = (customer.phone || '').replace(/[^0-9]/g, '');
  const internationalPhone = phoneClean.startsWith('0')
    ? '92' + phoneClean.slice(1)
    : phoneClean.startsWith('92')
    ? phoneClean
    : '92' + phoneClean;

  const itemsText = (saleData.items || [])
    .map((item, idx) => `• ${item.name || item.brandName} (${item.qty} ${item.unitSelection || 'Units'}) — Rs. ${Number(item.total || (item.qty * (item.price || item.boxPrice || 10))).toFixed(2)}`)
    .join('\n');

  const newTotalBalance = (customer.currentBalance || 0) + Number(saleData.netTotal || 0);

  const message = `*${shopName.toUpperCase()} — CREDIT BILL SLIP*\n` +
    `-----------------------------------------\n` +
    `*Customer:* ${customer.name}\n` +
    `*Invoice #:* ${saleData.invoiceNo}\n` +
    `*Date:* ${saleData.date} ${saleData.time || ''}\n` +
    `-----------------------------------------\n` +
    `*ITEMS PURCHASED:*\n${itemsText}\n` +
    `-----------------------------------------\n` +
    `*This Bill Amount Added to Debt:* Rs. ${Number(saleData.netTotal).toFixed(2)}\n` +
    `*Current Outstanding Balance:* Rs. ${newTotalBalance.toFixed(2)}\n` +
    `-----------------------------------------\n` +
    `Thank you for shopping with ${shopName}.`;

  const encodedUrl = `https://api.whatsapp.com/send?phone=${internationalPhone}&text=${encodeURIComponent(message)}`;

  const handleSendWhatsApp = () => {
    window.open(encodedUrl, '_blank');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem', fontFamily: 'var(--font-sans)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} color="#64748b" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} color="#16a34a" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Send Credit Slip on WhatsApp
            </h3>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Instantly notify customer of added purchase & current debt balance
            </div>
          </div>
        </div>

        {/* Customer & Bill Summary Card */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#166534', fontWeight: 700 }}>Customer:</span>
            <strong style={{ color: '#0f172a' }}>{customer.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#166534', fontWeight: 700 }}>WhatsApp Phone:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{customer.phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #86efac', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
            <span style={{ color: '#166534', fontWeight: 700 }}>Bill Added to Khata:</span>
            <strong style={{ color: '#0284c7' }}>Rs. {Number(saleData.netTotal).toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#166534', fontWeight: 700 }}>Total Balance Due:</span>
            <strong style={{ color: '#dc2626' }}>Rs. {newTotalBalance.toFixed(2)}</strong>
          </div>
        </div>

        {/* Preview of WhatsApp Message */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Message Preview:
          </div>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', fontSize: '10.5px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto', color: '#334155', lineHeight: 1.4 }}>
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem' }}>
          <button
            onClick={handleSendWhatsApp}
            className="btn btn-primary"
            style={{ backgroundColor: '#25D366', color: '#ffffff', borderRadius: '10px', fontSize: '12px', fontWeight: 800, padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: 'none' }}
          >
            <Send size={14} /> Send WhatsApp Receipt
          </button>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
          >
            Skip / Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCreditModal;
