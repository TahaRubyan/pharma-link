import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PATIENTS } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  const [wholesalePatients, setWholesalePatients] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved patients', e);
      }
    }
    return INITIAL_PATIENTS;
  });

  const [retailPatients, setRetailPatients] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_patients') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_PATIENTS;
  });

  const patients = isRetail ? retailPatients : wholesalePatients;
  const setPatients = (updater) => {
    if (isRetail) setRetailPatients(updater);
    else setWholesalePatients(updater);
  };

  const [activePatientForPOS, setActivePatientForPOS] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_patients', JSON.stringify(wholesalePatients));
    } catch (e) {}
  }, [wholesalePatients]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_retail_patients', JSON.stringify(retailPatients));
    } catch (e) {}
  }, [retailPatients]);

  const addPatient = (patientData) => {
    if (!patientData || !patientData.name) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const newPatient = {
      id: patientData.id || `PAT-${Date.now().toString().slice(-4)}`,
      name: patientData.name,
      age: patientData.age || '',
      phone: patientData.phone || '',
      prescribingDoctor: patientData.prescribingDoctor || '',
      address: patientData.address || '',
      lastVisit: todayStr,
      totalSpend: patientData.totalSpend || 0,
    };

    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  };

  const servePatientInPOS = (patient) => {
    setActivePatientForPOS(patient);
  };

  const clearActivePatientForPOS = () => {
    setActivePatientForPOS(null);
  };

  const searchPatients = (query) => {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return patients.filter((p) => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.prescribingDoctor && p.prescribingDoctor.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    });
  };

  const deletePatient = (patientId) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    if (activePatientForPOS?.id === patientId) {
      setActivePatientForPOS(null);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        activePatientForPOS,
        addPatient,
        deletePatient,
        searchPatients,
        servePatientInPOS,
        clearActivePatientForPOS,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};

export default PatientContext;
