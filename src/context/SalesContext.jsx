import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_INVOICES } from '../data/mockData';
import { useAuth } from './AuthContext';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
  let isRetail = false;
  try {
    const auth = useAuth();
    isRetail = auth?.currentShop?.mode === 'RETAIL';
  } catch (e) {
    isRetail = false;
  }

  const [wholesaleInvoices, setWholesaleInvoices] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved invoices', e);
      }
    }
    return INITIAL_INVOICES;
  });

  const [retailInvoices, setRetailInvoices] = useState(() => {
    const saved = localStorage.getItem('pharmalink_retail_invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const invoices = isRetail ? retailInvoices : wholesaleInvoices;
  const setInvoices = (updater) => {
    if (isRetail) setRetailInvoices(updater);
    else setWholesaleInvoices(updater);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_invoices', JSON.stringify(wholesaleInvoices));
    } catch (e) {}
  }, [wholesaleInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_retail_invoices', JSON.stringify(retailInvoices));
    } catch (e) {}
  }, [retailInvoices]);

  const [wholesaleReturns, setWholesaleReturns] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_returns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [retailReturns, setRetailReturns] = useState(() => {
    const saved = localStorage.getItem('pharmalink_retail_returns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const returns = isRetail ? retailReturns : wholesaleReturns;
  const setReturns = (updater) => {
    if (isRetail) setRetailReturns(updater);
    else setWholesaleReturns(updater);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_returns', JSON.stringify(wholesaleReturns));
    } catch (e) {}
  }, [wholesaleReturns]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_retail_returns', JSON.stringify(retailReturns));
    } catch (e) {}
  }, [retailReturns]);

  // Record a new POS Sale
  const recordSale = (saleData) => {
    setInvoices((prev) => [saleData, ...prev]);
  };

  // Process a Sales Return
  const recordReturn = (returnData) => {
    setReturns((prev) => [returnData, ...prev]);
  };

  // Helper to find invoice by Invoice No or Customer Phone
  const findInvoice = (query) => {
    if (!query) return null;
    const q = String(query).trim().toLowerCase();
    return invoices.find(
      (inv) =>
        inv.invoiceNo.toLowerCase() === q ||
        (inv.customerPhone && inv.customerPhone.toLowerCase() === q)
    );
  };

  return (
    <SalesContext.Provider
      value={{
        invoices,
        returns,
        recordSale,
        recordReturn,
        findInvoice,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export default SalesContext;
