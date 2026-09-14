import React, { useState, useEffect } from 'react';
import { X, UserCheck, MapPin, Phone, FileText, CheckCircle, Truck, User, ShieldCheck } from 'lucide-react';

export const WholesaleCustomerModal = ({ isOpen, customerData, onClose, onSave }) => {
  const [customerName, setCustomerName] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [ntn, setNtn] = useState('');
  const [gst, setGst] = useState('');
  const [filerStatus, setFilerStatus] = useState('FILER');
  const [phone, setPhone] = useState('');

  // Personnel Details
  const [bookingPerson, setBookingPerson] = useState('');
  const [bookingPersonPhone, setBookingPersonPhone] = useState('');
  const [refNo, setRefNo] = useState('');
  
  const [salesPerson, setSalesPerson] = useState('');
  const [salesPersonRole, setSalesPersonRole] = useState('Counter Cashier');

  const [deliveryBoy, setDeliveryBoy] = useState('');
  const [deliveryBoyPhone, setDeliveryBoyPhone] = useState('');
  const [deliveryBoyVehicle, setDeliveryBoyVehicle] = useState('');

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
      
      setBookingPerson(customerData.bookingPerson || customerData.bookingMan || '');
      setBookingPersonPhone(customerData.bookingPersonPhone || '');
      setRefNo(customerData.refNo || '');

      setSalesPerson(customerData.salesPerson || customerData.cashierName || '');
      setSalesPersonRole(customerData.salesPersonRole || 'Counter Cashier');

      setDeliveryBoy(customerData.deliveryBoy || customerData.deliveryMan || '');
      setDeliveryBoyPhone(customerData.deliveryBoyPhone || '');
      setDeliveryBoyVehicle(customerData.deliveryBoyVehicle || '');
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
      
      bookingPerson,
      bookingMan: bookingPerson,
      bookingPersonPhone,
      refNo,

      salesPerson,
      cashierName: salesPerson,
      salesPersonRole,

      deliveryBoy,
      deliveryMan: deliveryBoy,
      deliveryBoyPhone,
      deliveryBoyVehicle,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '720px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '18px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7' }}>
            <UserCheck size={18} color="#0284C7" /> Customer & Complete Logistics Personnel Details
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Enter customer profile, order booker details, biller details, and delivery boy information for invoices.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* SECTION 1: CUSTOMER PROFILE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
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
                Region / Territory:
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Dinga Road, Gujrat"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
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
                Cust. STRN / GST #:
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
                Customer Contact Phone:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0300-1234567"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          {/* SECTION 2: ORDER BOOKER & PERSONNEL DETAILS */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', marginTop: '0.35rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} color="#0284c7" /> 1. Order Booking Person Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Booking Person Name:
                </label>
                <input
                  type="text"
                  value={bookingPerson}
                  onChange={(e) => setBookingPerson(e.target.value)}
                  placeholder="e.g. Muhammad Usman"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Booking Person Phone:
                </label>
                <input
                  type="text"
                  value={bookingPersonPhone}
                  onChange={(e) => setBookingPersonPhone(e.target.value)}
                  placeholder="e.g. 0321-9876543"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Booking / Ref #:
                </label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="e.g. BK-2041"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: SALE MADE BY (BILLER) */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} color="#0284c7" /> 2. Details of Person Who Made the Sale (Biller)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.65rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Sale Made By (Biller Name):
                </label>
                <input
                  type="text"
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Role / Counter Terminal:
                </label>
                <input
                  type="text"
                  value={salesPersonRole}
                  onChange={(e) => setSalesPersonRole(e.target.value)}
                  placeholder="e.g. Counter Cashier / Terminal 1"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: DELIVERY BOY / LOGISTICS */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={14} color="#0284c7" /> 3. Details of Person Who is a Delivery Boy (Rider)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Delivery Boy Name:
                </label>
                <input
                  type="text"
                  value={deliveryBoy}
                  onChange={(e) => setDeliveryBoy(e.target.value)}
                  placeholder="e.g. Ali Hassan (Rider)"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Delivery Boy Contact Phone:
                </label>
                <input
                  type="text"
                  value={deliveryBoyPhone}
                  onChange={(e) => setDeliveryBoyPhone(e.target.value)}
                  placeholder="e.g. 0345-7654321"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem', color: '#475569', fontSize: '11px' }}>
                  Vehicle / Route ID:
                </label>
                <input
                  type="text"
                  value={deliveryBoyVehicle}
                  onChange={(e) => setDeliveryBoyVehicle(e.target.value)}
                  placeholder="e.g. Van-02 / Dinga Route"
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '10px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, borderRadius: '10px', backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <CheckCircle size={15} /> Save Customer & Personnel Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WholesaleCustomerModal;
