import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_INVOICES } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';
import { storageManager } from '../services/storageManager';
import { dbSyncService } from '../services/dbSyncService';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  const [wholesaleInvoices, setWholesaleInvoices] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
    if (isCleared) return [];

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
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_invoices') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_INVOICES;
  });

  const invoices = isRetail ? retailInvoices : wholesaleInvoices;
  const setInvoices = (updater) => {
    if (isRetail) setRetailInvoices(updater);
    else setWholesaleInvoices(updater);
  };

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_pk_invoices', wholesaleInvoices);
  }, [wholesaleInvoices]);

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_retail_invoices', retailInvoices);
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
    storageManager.safeSetItem('pharmalink_pk_returns', wholesaleReturns);
  }, [wholesaleReturns]);

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_retail_returns', retailReturns);
  }, [retailReturns]);

  // Initial cloud sync from Supabase
  useEffect(() => {
    const tenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
    dbSyncService.fetchInvoices(tenantId).then((cloudInvoices) => {
      if (cloudInvoices && cloudInvoices.length > 0) {
        setInvoices((prev) => {
          const map = new Map(prev.map((i) => [i.invoiceNo, i]));
          cloudInvoices.forEach((i) => map.set(i.invoiceNo, i));
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
  }, [auth?.currentShop?.shopId]);

  // Record a new POS Sale
  const recordSale = (saleData) => {
    setInvoices((prev) => [saleData, ...prev]);
    const tenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
    dbSyncService.saveInvoice(tenantId, saleData).catch((err) => {
      console.warn('[SalesContext] Background cloud sync warning:', err);
    });
  };

  // Process a Sales Return
  const recordReturn = (returnData) => {
    setReturns((prev) => [returnData, ...prev]);
  };

  // Look up an invoice by invoiceNo, id, or reference
  const findInvoice = (invoiceNo) => {
    if (!invoiceNo) return null;
    return invoices.find((inv) => inv.invoiceNo === invoiceNo || inv.invoiceNumber === invoiceNo || inv.id === invoiceNo) || null;
  };

  // Record an inline cash settlement or payment against an invoice's debt (Territory Delivery Ledger & Khata)
  const recordDebtPayment = (invoiceNo, amountPaid, staffName = 'Testing Shop Admin') => {
    if (!invoiceNo || isNaN(amountPaid) || Number(amountPaid) <= 0) return null;
    const paid = Number(amountPaid);
    let updatedInvoice = null;

    setInvoices((prev) => {
      const next = prev.map((inv) => {
        if (inv.invoiceNo === invoiceNo) {
          const originalNet = Number(inv.netTotal || inv.subtotal || 0);
          const currentRemaining = inv.remainingDebt !== undefined 
            ? Number(inv.remainingDebt) 
            : (inv.paymentStatus === 'PAID' ? 0 : originalNet);
          
          const newRemaining = Math.max(0, Math.round((currentRemaining - paid) * 100) / 100);
          const isFullyPaid = newRemaining === 0;

          const newLog = {
            id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            amountPaid: paid,
            remainingDebt: newRemaining,
            collectedBy: staffName,
            method: 'Cash Settlement'
          };

          updatedInvoice = {
            ...inv,
            remainingDebt: newRemaining,
            paymentStatus: isFullyPaid ? 'PAID' : 'PARTIAL',
            paymentLogs: [...(inv.paymentLogs || []), newLog]
          };
          return updatedInvoice;
        }
        return inv;
      });

      return next;
    });

    if (updatedInvoice) {
      const tenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
      dbSyncService.saveInvoice(tenantId, updatedInvoice).catch((err) => {
        console.warn('[SalesContext] Background cloud sync warning on debt payment:', err);
      });
    }

    return updatedInvoice;
  };

  return (
    <SalesContext.Provider
      value={{
        invoices,
        returns,
        recordSale,
        recordReturn,
        findInvoice,
        recordDebtPayment,
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
