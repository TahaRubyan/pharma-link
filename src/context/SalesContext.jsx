import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_INVOICES } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';
import { storageManager } from '../services/storageManager';
import { dbSyncService } from '../services/dbSyncService';

const SalesContext = createContext();

const getSalesStorageKey = (tenantId, type, mode) => {
  const tid = tenantId || 'TEN-TESTING-SHOP';
  if (tid === 'TEN-TESTING-SHOP') {
    return mode === 'RETAIL' ? `pharmalink_retail_${type}` : `pharmalink_pk_${type}`;
  }
  return `pharmalink_${tid}_${mode === 'RETAIL' ? 'retail' : 'wholesale'}_${type}`;
};

export const SalesProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const isTestingShop = activeTenantId === 'TEN-TESTING-SHOP';
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  // Wholesale Invoices: strictly scoped per-tenant. Non-testing shops start blank [].
  const [wholesaleInvoices, setWholesaleInvoices] = useState(() => {
    const wsKey = getSalesStorageKey(activeTenantId, 'invoices', 'WHOLESALE');
    const saved = storageManager.safeGetItem(wsKey, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_INVOICES;
    }
    return [];
  });

  // Retail Invoices: strictly scoped per-tenant. Non-testing shops start blank [].
  const [retailInvoices, setRetailInvoices] = useState(() => {
    const retKey = getSalesStorageKey(activeTenantId, 'invoices', 'RETAIL');
    const saved = storageManager.safeGetItem(retKey, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_INVOICES;
    }
    return [];
  });

  const invoices = isRetail ? retailInvoices : wholesaleInvoices;
  const setInvoices = (updater) => {
    if (isRetail) setRetailInvoices(updater);
    else setWholesaleInvoices(updater);
  };

  // Sync to local storage strictly with tenant-scoped keys
  useEffect(() => {
    const key = getSalesStorageKey(activeTenantId, 'invoices', 'WHOLESALE');
    storageManager.safeSetItem(key, wholesaleInvoices);
  }, [wholesaleInvoices, activeTenantId]);

  useEffect(() => {
    const key = getSalesStorageKey(activeTenantId, 'invoices', 'RETAIL');
    storageManager.safeSetItem(key, retailInvoices);
  }, [retailInvoices, activeTenantId]);

  const [wholesaleReturns, setWholesaleReturns] = useState(() => {
    const key = getSalesStorageKey(activeTenantId, 'returns', 'WHOLESALE');
    const saved = storageManager.safeGetItem(key, null);
    return (saved && Array.isArray(saved)) ? saved : [];
  });

  const [retailReturns, setRetailReturns] = useState(() => {
    const key = getSalesStorageKey(activeTenantId, 'returns', 'RETAIL');
    const saved = storageManager.safeGetItem(key, null);
    return (saved && Array.isArray(saved)) ? saved : [];
  });

  const returns = isRetail ? retailReturns : wholesaleReturns;
  const setReturns = (updater) => {
    if (isRetail) setRetailReturns(updater);
    else setWholesaleReturns(updater);
  };

  useEffect(() => {
    const key = getSalesStorageKey(activeTenantId, 'returns', 'WHOLESALE');
    storageManager.safeSetItem(key, wholesaleReturns);
  }, [wholesaleReturns, activeTenantId]);

  useEffect(() => {
    const key = getSalesStorageKey(activeTenantId, 'returns', 'RETAIL');
    storageManager.safeSetItem(key, retailReturns);
  }, [retailReturns, activeTenantId]);

  // Initial cloud sync from Supabase
  useEffect(() => {
    let isMounted = true;
    dbSyncService.fetchInvoices(activeTenantId).then((cloudInvoices) => {
      if (!isMounted) return;
      if (cloudInvoices && Array.isArray(cloudInvoices) && cloudInvoices.length > 0) {
        if (isRetail) {
          setRetailInvoices(cloudInvoices);
        } else {
          setWholesaleInvoices(cloudInvoices);
        }
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [activeTenantId, isRetail]);

  // Record a new POS Sale
  const recordSale = (saleData) => {
    setInvoices((prev) => [saleData, ...prev]);
    dbSyncService.saveInvoice(activeTenantId, saleData).catch((err) => {
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
