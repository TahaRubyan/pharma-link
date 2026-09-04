import React, { useState, useMemo } from 'react';
import { X, Users, Search, Plus, CheckCircle, CreditCard } from 'lucide-react';
import { useCustomerDebt } from '../../context/CustomerDebtContext';

export const POSDebtCustomerModal = ({ isOpen, onClose, onConfirmCreditSale, totalAmount = 0 }) => {
  const { debtCustomers = [], addDebtCustomer } = useCustomerDebt();
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAdd, setIsQuickAdd] = useState(false);

  // Quick Add State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return debtCustomers;
    const q = searchQuery.toLowerCase().trim();
    return debtCustomers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [debtCustomers, searchQuery]);

  if (!isOpen) return null;

  const handleSelectCustomer = (customer) => {
    onConfirmCreditSale(customer);
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please provide Customer Name and WhatsApp Phone number.');
      return;
    }
    const created = addDebtCustomer({ name, phone, address, creditLimit });
    onConfirmCreditSale(created);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem', fontFamily: 'var(--font-sans)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={18} color="#64748b" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="#0284c7" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Select Customer for Debt / Khata Sale
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Bill Amount: <strong style={{ color: '#0284c7' }}>Rs. {Number(totalAmount).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickAdd(!isQuickAdd)}
            className="btn btn-outline"
            style={{ fontSize: '11px', padding: '0.3rem 0.65rem', borderRadius: '8px', color: '#0284c7', borderColor: '#bae6fd' }}
          >
            {isQuickAdd ? '← Select Existing' : '+ Quick Register'}
          </button>
        </div>

        {!isQuickAdd ? (
          <div>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
              <input
                type="text"
                placeholder="Search registered customer by Name or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem 0.45rem 2.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                autoFocus
              />
            </div>

            {/* Customer List */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {filteredCustomers.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  No customer found. Click "+ Quick Register" above to add this customer.
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>
                        👤 {c.name} ({c.phone})
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {c.address || 'Local Area'} • Registered Khata Account
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Current Debt:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: c.currentBalance > 0 ? '#dc2626' : '#16a34a' }}>
                        Rs. {c.currentBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Quick Register Form */
          <form onSubmit={handleQuickAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Customer Full Name *:</label>
              <input type="text" placeholder="e.g. Tariq Mahmood" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} required autoFocus />
            </div>

            <div>
              <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>WhatsApp Phone *:</label>
              <input type="text" placeholder="e.g. 0300-1234567" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Address (Optional):</label>
              <input type="text" placeholder="e.g. Sector F-7/1, Islamabad" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0284c7', borderRadius: '10px', fontSize: '12px', fontWeight: 800, padding: '0.6rem', marginTop: '0.35rem' }}>
              <CheckCircle size={14} /> Register & Add Bill to Debt
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default POSDebtCustomerModal;
