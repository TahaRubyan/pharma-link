import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, ShoppingCart, UserCheck, CheckCircle, HeartPulse, ShieldAlert, Phone, MapPin, FileText, FileCheck } from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { useCart } from '../context/CartContext';
import NewPatientModal from '../components/modals/NewPatientModal';
import PatientHistoryDrawer from '../components/modals/PatientHistoryDrawer';
import GovtSectorClaimModal from '../components/modals/GovtSectorClaimModal';

export const PatientsPage = ({ onNavigate }) => {
  const { patients = [] } = usePatient();
  const { setRxPatient } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [selectedPatientForRx, setSelectedPatientForRx] = useState(null);
  const [selectedPatientForGovtClaim, setSelectedPatientForGovtClaim] = useState(null);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.cnic && p.cnic.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.doctorName && p.doctorName.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  const handleServeInPos = (patient) => {
    setRxPatient({
      name: patient.name,
      phone: patient.phone || '0300-1234567',
      gender: patient.gender || 'Male',
      age: patient.age || '35',
      doctorName: patient.doctorName || 'Dr. Aamir Khan (PMC-45812)',
      doctorRegNo: 'PMC-45812',
      rxDate: new Date().toISOString().split('T')[0]
    });
    alert(`Patient ${patient.name} (${patient.phone || 'Walk-in'}) selected! Routing to POS Counter...`);
    if (onNavigate) onNavigate('pos');
  };

  const handleOpenGovtClaim = (patient) => {
    const mockInvoice = {
      invoiceNo: `GOVT-CLM-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: patient.name,
      doctorName: patient.doctorName || 'Dr. Aamir Khan (PMC-45812)',
      subtotal: 3850.00,
      fbrTax: 38.50,
      netTotal: 3888.50,
      items: [
        { brandName: 'Augmentin 625mg', genericFormula: 'Amoxicillin + Clavulanate', batchNumber: 'B26-Aug-03', quantity: 2, unitSelection: 'Box', unitPrice: 480.00, total: 960.00 },
        { brandName: 'Risek 20mg', genericFormula: 'Omeprazole 20mg', batchNumber: 'B26-Ris-09', quantity: 4, unitSelection: 'Box', unitPrice: 350.00, total: 1400.00 },
        { brandName: 'Deltacortril 5mg', genericFormula: 'Prednisolone 5mg', batchNumber: 'B26-Del-05', quantity: 30, unitSelection: 'Tablet', unitPrice: 3.20, total: 96.00 },
        { brandName: 'Panadol 500mg', genericFormula: 'Paracetamol 500mg', batchNumber: 'B26-Pan-01', quantity: 2, unitSelection: 'Box', unitPrice: 600.00, total: 1200.00 },
      ]
    };
    setSelectedPatientForGovtClaim(mockInvoice);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* Page Header */}
      <div className="flex-between">
        <div>
          <h2 className="page-title" style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Patient & Prescription Registry
          </h2>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Patient master directory, chronic condition profiles, prescription history & Govt stipend claim invoices
          </p>
        </div>

        <button
          onClick={() => setIsNewPatientOpen(true)}
          className="btn btn-primary"
          style={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#0284c7', padding: '0.55rem 1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={15} /> Add New Patient Record
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
          <input
            type="text"
            placeholder="Search Patient Name, CNIC, Phone, Doctor, Address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          Registered Patients: <strong style={{ color: '#0f172a' }}>{filteredPatients.length}</strong>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid-3">
        {filteredPatients.map((p, idx) => (
          <div key={p.id || idx} className="card card-hover" style={{ borderRadius: '18px', padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
            <div>
              <div className="flex-between" style={{ marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', border: '1px solid #bae6fd' }}>
                    {p.name ? p.name.substring(0, 2).toUpperCase() : 'PT'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{p.name}</h3>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{p.cnic || 'CNIC: 35201-1234567-1'}</div>
                  </div>
                </div>

                {p.govtEmployee && (
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>
                    Govt Stipend
                  </span>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#475569', backgroundColor: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
                <div><strong>Phone:</strong> {p.phone || '0300-1234567'}</div>
                <div><strong>Doctor:</strong> {p.doctorName || 'Dr. Aamir Khan (PMC-45812)'}</div>
                <div><strong>Active Rx:</strong> {p.activeMedication || 'Panadol 500mg, Risek 20mg'}</div>
                {p.address && <div><strong>Address:</strong> {p.address}</div>}
              </div>
            </div>

            {/* 3 ACTIONS: PRESCRIPTION HISTORY, GOVT CLAIM INVOICE, SERVE IN POS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <button
                  onClick={() => setSelectedPatientForRx(p)}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', padding: '0.35rem 0.5rem', borderRadius: '8px', color: '#0284c7', borderColor: '#bae6fd', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                >
                  <FileText size={12} /> Prescriptions
                </button>

                <button
                  onClick={() => handleOpenGovtClaim(p)}
                  className="btn btn-outline"
                  style={{ fontSize: '11px', padding: '0.35rem 0.5rem', borderRadius: '8px', color: '#047857', borderColor: '#a7f3d0', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                >
                  <FileCheck size={12} /> Govt Claim
                </button>
              </div>

              <button
                onClick={() => handleServeInPos(p)}
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: '8px', fontSize: '11px', backgroundColor: '#0284c7', fontWeight: 700, padding: '0.45rem' }}
              >
                <ShoppingCart size={13} /> Serve Patient in POS
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NEW PATIENT REGISTRATION MODAL */}
      {isNewPatientOpen && (
        <NewPatientModal
          isOpen={isNewPatientOpen}
          onClose={() => setIsNewPatientOpen(false)}
        />
      )}

      {/* PRESCRIPTION HISTORY DRAWER */}
      {selectedPatientForRx && (
        <PatientHistoryDrawer
          isOpen={Boolean(selectedPatientForRx)}
          patient={selectedPatientForRx}
          onClose={() => setSelectedPatientForRx(null)}
        />
      )}

      {/* GOVT REIMBURSEMENT CLAIM MODAL */}
      {selectedPatientForGovtClaim && (
        <GovtSectorClaimModal
          invoice={selectedPatientForGovtClaim}
          onClose={() => setSelectedPatientForGovtClaim(null)}
        />
      )}
    </div>
  );
};

export default PatientsPage;
