import React, { useState, useEffect } from 'react';
import { X, UserCheck, MapPin, Phone, FileText, CheckCircle } from 'lucide-react';

export const WholesaleCustomerModal = ({ isOpen, customerData, onClose, onSave }) => {
  const [customerName, setCustomerName] = useState(customerData?.customerName || customerData?.shopName || '');
  const [region, setRegion] = useState(customerData?.region || '');
  const [address, setAddress] = useState(customerData?.customerAddress || '');
  const [licenseNo, setLicenseNo] = useState(customerData?.licenseNo || '');
  const [ntn, setNtn] = useState(customerData?.customerNtn || '');
  const [gst, setGst] = useState(customerData?.customerStrn || '');
  const [filerStatus, setFilerStatus] = useState(customerData?.filerStatus || 'FILER');
  const [phone, setPhone] = useState(customerData?.customerPhone || '');
  const [bookingMan, setBookingMan] = useState(customerData?.bookingMan || '');
  const [refNo, setRefNo] = useState(customerData?.refNo || '');
  const [deliveryMan, setDeliveryMan] = useState(customerData?.deliveryMan || '');

  useEffect(() => {
    if (customerData) {
      setCustomerName(customerData.customerName || customerData.shopName || '');
      setRegion(customerData.region || '');
      setAddress(customerData.customerAddress || '');
      setLicenseNo(customerData.licenseNo || '');
      setNtn(customerData.customerNtn || '');
      setGst(customerData.customerStrn || '');
      setFilerStatus(customerData.filerStatus || 'FILER');
      setPhone(customerData.customerPhone || '');
      setBookingMan(customerData.bookingMan || '');
      setRefNo(customerData.refNo || '');
      setDeliveryMan(customerData.deliveryMan || '');
    }
  }, [customerData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      customerName,
      shopName: customerName,
      region,
      customerAddress: address,
      licenseNo,
      customerNtn: ntn,
      customerStrn: gst,
      filerStatus,
      customerPhone: phone,
      bookingMan,
      refNo,
      deliveryMan,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '680px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '88vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserCheck size={18} color="#0284C7" /> Wholesale Customer & Logistics Metadata
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Enter customer license, NTN, tax filer status and booking details for A4 Tax Invoice
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Customer / Business Name *:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter Shop / Business Name (e.g. Al-Razi Pharma)"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                required
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Region / Territory *:
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Gujrat">Gujrat</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karianwala">Karianwala</option>
                <option value="Tanda">Tanda</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Peshawar">Peshawar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
              Business Address:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Business / Shop Address"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Cust. License #:
              </label>
              <input
                type="text"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="e.g. PK-342-0139"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Cust. NTN #:
              </label>
              <input
                type="text"
                value={ntn}
                onChange={(e) => setNtn(e.target.value)}
                placeholder="Enter NTN #"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Cust. GST #:
              </label>
              <input
                type="text"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                placeholder="Enter GST #"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                FBR Tax Filer Status:
              </label>
              <select
                value={filerStatus}
                onChange={(e) => setFilerStatus(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="FILER">FILER (Standard Rates)</option>
                <option value="NON-FILER">NON-FILER (Higher Advance Tax)</option>
              </select>
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Contact Phone:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 053-3724601"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Booking Man:
              </label>
              <input
                type="text"
                value={bookingMan}
                onChange={(e) => setBookingMan(e.target.value)}
                placeholder="Booking Agent"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Reference No:
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="Ref No"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: '#334155' }}>
                Delivery Man:
              </label>
              <input
                type="text"
                value={deliveryMan}
                onChange={(e) => setDeliveryMan(e.target.value)}
                placeholder="Delivery Driver Name"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#0284c7' }}>
              <CheckCircle size={15} /> Save Customer Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WholesaleCustomerModal;
