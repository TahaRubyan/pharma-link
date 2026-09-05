import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useCart } from '../../context/CartContext';
import { usePatient } from '../../context/PatientContext';
import { ShieldAlert, UserCheck, Search, CheckCircle, FileText } from 'lucide-react';

export const PatientRxDrawer = () => {
  const { activeModal, closeModal, rxPatient, setRxPatient, addToast } = useCart();
  const { patients, searchPatients } = usePatient();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'Male',
    age: '',
    doctorName: '',
    doctorRegNo: '',
    rxDate: new Date().toISOString().split('T')[0]
  });

  const isOpen = activeModal === 'patientRx' || activeModal === 'rx_drawer';

  useEffect(() => {
    if (rxPatient) {
      setFormData({
        name: rxPatient.name || '',
        phone: rxPatient.phone || '',
        gender: rxPatient.gender || 'Male',
        age: rxPatient.age || '',
        doctorName: rxPatient.doctorName || '',
        doctorRegNo: rxPatient.doctorRegNo || '',
        rxDate: rxPatient.rxDate || new Date().toISOString().split('T')[0]
      });
    }
  }, [rxPatient, isOpen]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setSearchResults(searchPatients(query));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPatient = (patient) => {
    setFormData((prev) => ({
      ...prev,
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender || 'Male',
      age: patient.age || '',
      doctorName: patient.doctorName || patient.prescribingDoctor || prev.doctorName || '',
      doctorRegNo: patient.doctorRegNo || prev.doctorRegNo || ''
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Validation Error', 'Patient Name is required.', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      addToast('Validation Error', 'Patient Phone number is required.', 'error');
      return;
    }
    if (!formData.doctorName.trim()) {
      addToast('Validation Error', 'Prescribing Doctor Name is required.', 'error');
      return;
    }

    setRxPatient({ ...formData });
    addToast('Rx Recorded', `Prescription details saved for ${formData.name}`, 'success');
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Schedule H Drug Control — Prescription Collector"
      subtitle="Mandatory regulatory compliance record for dispensing Schedule H medicines"
      icon={ShieldAlert}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Compliance Warning Banner */}
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}
        >
          <ShieldAlert color="#991B1B" size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#7F1D1D', lineHeight: 1.4 }}>
            <strong>Schedule H / H1 Drug Regulatory Notice:</strong> Under Drugs & Cosmetics Rules, Schedule H drugs can only be sold against a valid prescription from a Registered Medical Practitioner.
          </div>
        </div>

        {/* Existing Patient Quick Search */}
        {/* Existing Patient Quick Search */}
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.35rem', display: 'block' }}>
            🔍 Search Existing Patient Directory
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
            <input
              type="text"
              placeholder="Type Patient Name or Mobile No to auto-fill..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Autocomplete Search Dropdown */}
          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                zIndex: 10,
                maxHeight: '180px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  style={{
                    padding: '0.65rem 0.875rem',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                      👤 {patient.name} ({patient.phone || 'No Phone'})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Dr: {patient.doctorName || 'N/A'} {patient.cnic ? `• CNIC: ${patient.cnic}` : ''}
                    </div>
                  </div>
                  <UserCheck size={16} color="#0284c7" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Patient Banner */}
        {formData.name && (
          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.65rem 0.85rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 700 }}>
              Active Patient: <strong style={{ color: '#047857' }}>{formData.name}</strong> ({formData.phone})
            </span>
            <span style={{ fontSize: '11px', color: '#047857' }}>✓ Details Loaded</span>
          </div>
        )}

        {/* Patient Details Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.3rem', display: 'block' }}>
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.3rem', display: 'block' }}>
              Patient Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.3rem', display: 'block' }}>
              Prescribing Doctor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. S. K. Gupta (MD)"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.3rem', display: 'block' }}>
              Doctor Reg No / Council
            </label>
            <input
              type="text"
              placeholder="e.g. MMC-48921"
              value={formData.doctorRegNo}
              onChange={(e) => setFormData({ ...formData, doctorRegNo: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.3rem', display: 'block' }}>
              Prescription Date
            </label>
            <input
              type="date"
              value={formData.rxDate}
              onChange={(e) => setFormData({ ...formData, rxDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.3rem', display: 'block' }}>
              Gender & Age
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="number"
                placeholder="Age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                style={{
                  width: '80px',
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-outline" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <CheckCircle size={16} /> Save Prescription Details
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientRxDrawer;
