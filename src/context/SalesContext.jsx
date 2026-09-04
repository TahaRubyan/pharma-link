import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_INVOICES } from '../data/mockData';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
  const [invoices, setInvoices] = useState(() => {
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

  const [returns, setReturns] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_returns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved returns', e);
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_invoices', JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices to localStorage', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_returns', JSON.stringify(returns));
    } catch (e) {
      console.error('Failed to save returns to localStorage', e);
    }
  }, [returns]);

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
