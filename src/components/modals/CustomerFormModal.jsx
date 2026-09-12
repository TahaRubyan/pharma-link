import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building, MapPin, Phone, FileText, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';

export const CustomerFormModal = ({ isOpen, customer = null, initialQuery = '', onClose, onSave }) => {
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [ntn, setNtn] = useState('');
  const [gstn, setGstn] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [filerStatus, setFilerStatus] = useState('FILER');
  const [creditLimit, setCreditLimit] = useState('500000');

  useEffect(() => {
    if (customer) {
      setName(customer.name || customer.customerName || '');
      setShopName(customer.shopName || customer.name || '');
      setRegion(customer.region || '');
      setAddress(customer.address || customer.customerAddress || '');
      setNtn(customer.ntn || customer.customerNtn || '');
      setGstn(customer.gstn || customer.customerStrn || customer.strn || '');
      setPhone(customer.phone || customer.customerPhone || '');
      setLicenseNo(customer.licenseNo || '');
      setFilerStatus(customer.filerStatus || 'FILER');
      setCreditLimit(String(customer.creditLimit || 500000));
    } else {
      setName(initialQuery || '');
      setShopName(initialQuery || '');
      setRegion('');
      setAddress('');
      setNtn('');
      setGstn('');
      setPhone('');
      setLicenseNo('');
      setFilerStatus('FILER');
      setCreditLimit('500000');
    }
  }, [customer, initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const resolvedRegion = region.trim() || 'General';

    const savedRecord = {
      id: customer?.id || `CUST-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      shopName: (shopName.trim() || name.trim()),
      customerName: name.trim(),
      region: resolvedRegion,
      address: address.trim() || 'Market Street, Central City',
      customerAddress: address.trim() || 'Market Street, Central City',
      ntn: ntn.trim() || '-',
      customerNtn: ntn.trim() || '-',
      gstn: gstn.trim() || '-',
      customerStrn: gstn.trim() || '-',
      strn: gstn.trim() || '-',
      phone: phone.trim() || '0300-0000000',
      customerPhone: phone.trim() || '0300-0000000',
      licenseNo: licenseNo.trim() || 'DL-20/21-PENDING',
      filerStatus: filerStatus || 'FILER',
      creditLimit: Number(creditLimit) || 500000,
      currentBalance: customer?.currentBalance || 0,
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
        fontFamily: 'var(--font-sans)',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} color="#0284c7" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {customer ? 'Edit Customer Details' : 'Register New Customer'}
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0.15rem 0 0' }}>
                Enter business identity, region, NTN, GSTN & compliance licensing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '8px',
              color: '#64748b',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {/* Customer Name */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Customer / Pharmacy Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!shopName || shopName === name) setShopName(e.target.value);
                }}
                placeholder="e.g. Al-Razi Medicos / Dr. Tariq"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Shop / Business Name */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Business / Legal Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Al-Razi Pharmacy (Pvt) Ltd"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Region / Territory */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Region / Territory <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Gujrat / Dinga / Rawalpindi / Market Zone"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>

            {/* Phone / Mobile */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Mobile / Phone Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0300-1234567"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Address */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Complete Street Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop # 14, Main Circular Road, Medicine Market, Gujrat"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* NTN */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                NTN (National Tax Number)
              </label>
              <input
                type="text"
                value={ntn}
                onChange={(e) => setNtn(e.target.value)}
                placeholder="e.g. 4442705-8"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            {/* GSTN / STRN */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                GSTN / STRN (Sales Tax ID)
              </label>
              <input
                type="text"
                value={gstn}
                onChange={(e) => setGstn(e.target.value)}
                placeholder="e.g. 32-77-8761-745-88"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            {/* Drug License No */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Drug License No (Form 20/21)
              </label>
              <input
                type="text"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="e.g. DL-20-GJT-504"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Tax Filer Status */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                FBR Tax Filer Status
              </label>
              <select
                value={filerStatus}
                onChange={(e) => setFilerStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="FILER">FILER (Standard 0.5% Advance Tax)</option>
                <option value="NON_FILER">NON-FILER (Higher 1.0% Advance Tax)</option>
              </select>
            </div>

            {/* Credit Limit */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Approved Credit Limit (PKR)
              </label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="500000"
                min="0"
                step="1000"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div 
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#ffffff',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <CheckCircle size={14} />
              {customer ? 'Update Customer' : 'Save & Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
