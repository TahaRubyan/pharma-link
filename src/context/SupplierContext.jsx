import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';
import { dbSyncService } from '../services/dbSyncService';

const SupplierContext = createContext();

const getSupplierStorageKey = (tenantId, type, mode) => {
  const tid = tenantId || 'TEN-TESTING-SHOP';
  if (tid === 'TEN-TESTING-SHOP') {
    return mode === 'RETAIL' ? `pharmalink_retail_${type}` : `pharmalink_pk_${type}`;
  }
  return `pharmalink_${tid}_${mode === 'RETAIL' ? 'retail' : 'wholesale'}_${type}`;
};

export const SupplierProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const isTestingShop = activeTenantId === 'TEN-TESTING-SHOP';
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  // Wholesale Suppliers: strictly scoped per-tenant. Non-testing shops start blank [].
  const [wholesaleSuppliers, setWholesaleSuppliers] = useState(() => {
    const wsKey = getSupplierStorageKey(activeTenantId, 'suppliers', 'WHOLESALE');
    const saved = localStorage.getItem(wsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_SUPPLIERS;
    }
    return [];
  });

  // Retail Suppliers: strictly scoped per-tenant. Non-testing shops start blank [].
  const [retailSuppliers, setRetailSuppliers] = useState(() => {
    const retKey = getSupplierStorageKey(activeTenantId, 'suppliers', 'RETAIL');
    const saved = localStorage.getItem(retKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_SUPPLIERS;
    }
    return [];
  });

  const suppliers = isRetail ? retailSuppliers : wholesaleSuppliers;
  const setSuppliers = (updater) => {
    if (isRetail) setRetailSuppliers(updater);
    else setWholesaleSuppliers(updater);
  };

  // Wholesale Purchase Orders: strictly scoped per-tenant. Non-testing shops start blank [].
  const [wholesalePurchaseOrders, setWholesalePurchaseOrders] = useState(() => {
    const wsPOKey = getSupplierStorageKey(activeTenantId, 'purchase_orders', 'WHOLESALE');
    const saved = localStorage.getItem(wsPOKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_PURCHASE_ORDERS;
    }
    return [];
  });

  // Retail Purchase Orders: strictly scoped per-tenant. Non-testing shops start blank [].
  const [retailPurchaseOrders, setRetailPurchaseOrders] = useState(() => {
    const retPOKey = getSupplierStorageKey(activeTenantId, 'purchase_orders', 'RETAIL');
    const saved = localStorage.getItem(retPOKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_PURCHASE_ORDERS;
    }
    return [];
  });

  const purchaseOrders = isRetail ? retailPurchaseOrders : wholesalePurchaseOrders;
  const setPurchaseOrders = (updater) => {
    if (isRetail) setRetailPurchaseOrders(updater);
    else setWholesalePurchaseOrders(updater);
  };

  // Sync to local storage strictly with tenant-scoped keys
  useEffect(() => {
    try {
      const key = getSupplierStorageKey(activeTenantId, 'suppliers', 'WHOLESALE');
      localStorage.setItem(key, JSON.stringify(wholesaleSuppliers));
    } catch (e) {}
  }, [wholesaleSuppliers, activeTenantId]);

  useEffect(() => {
    try {
      const key = getSupplierStorageKey(activeTenantId, 'suppliers', 'RETAIL');
      localStorage.setItem(key, JSON.stringify(retailSuppliers));
    } catch (e) {}
  }, [retailSuppliers, activeTenantId]);

  useEffect(() => {
    try {
      const key = getSupplierStorageKey(activeTenantId, 'purchase_orders', 'WHOLESALE');
      localStorage.setItem(key, JSON.stringify(wholesalePurchaseOrders));
    } catch (e) {}
  }, [wholesalePurchaseOrders, activeTenantId]);

  useEffect(() => {
    try {
      const key = getSupplierStorageKey(activeTenantId, 'purchase_orders', 'RETAIL');
      localStorage.setItem(key, JSON.stringify(retailPurchaseOrders));
    } catch (e) {}
  }, [retailPurchaseOrders, activeTenantId]);

  // Initial cloud sync from Supabase
  useEffect(() => {
    let isMounted = true;
    dbSyncService.fetchSuppliers(activeTenantId).then((cloudSuppliers) => {
      if (!isMounted) return;
      if (cloudSuppliers && Array.isArray(cloudSuppliers) && cloudSuppliers.length > 0) {
        if (isRetail) {
          setRetailSuppliers(cloudSuppliers);
        } else {
          setWholesaleSuppliers(cloudSuppliers);
        }
      }
    }).catch(() => {});

    dbSyncService.fetchPurchaseOrders(activeTenantId).then((cloudPOs) => {
      if (!isMounted) return;
      if (cloudPOs && Array.isArray(cloudPOs) && cloudPOs.length > 0) {
        if (isRetail) {
          setRetailPurchaseOrders(cloudPOs);
        } else {
          setWholesalePurchaseOrders(cloudPOs);
        }
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [activeTenantId, isRetail]);

  // Helper to generate PO Number: PO-YYYYMMDD-XXXX
  const generatePONumber = () => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const seq = String(purchaseOrders.length + 1).padStart(4, '0');
    return `PO-${dateStr}-${seq}`;
  };

  const addSupplier = (supplierData) => {
    const newId = `SUP-${Date.now().toString().slice(-4)}`;
    const newSupplier = {
      id: newId,
      companyName: supplierData.companyName || supplierData.distributorName || supplierData.name || 'New Supplier',
      name: supplierData.name || supplierData.companyName || 'New Supplier',
      contactPerson: supplierData.contactPerson || '-',
      phone: supplierData.phone || '-',
      email: supplierData.email || '-',
      gstin: supplierData.gstin || 'PK-0000000-0',
      city: supplierData.city || 'Lahore',
      pendingBalance: Number(supplierData.pendingBalance) || 0,
      outstandingBalance: Number(supplierData.pendingBalance) || 0,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    const tenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
    dbSyncService.saveSupplier(tenantId, newSupplier).catch(() => {});
    return newSupplier;
  };

  const recordSupplierPayment = (supplierId, paymentAmount, paymentMode = 'Bank Transfer', reference = '') => {
    const amountPaid = Number(paymentAmount) || 0;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId || s.companyName === supplierId || s.name === supplierId) {
          const currentDebt = Number(s.outstandingDebt !== undefined ? s.outstandingDebt : (s.pendingBalance || 0));
          const newDebt = Math.max(0, currentDebt - amountPaid);
          const currentPaid = Number(s.totalPaidToDate || 0);
          const newPaid = currentPaid + amountPaid;

          const paymentEntry = {
            id: `PAY-${Date.now().toString().slice(-4)}`,
            date: dateStr,
            amount: amountPaid,
            paymentMode,
            reference: reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
            remainingDebt: newDebt,
          };

          const history = Array.isArray(s.paymentHistory) ? [...s.paymentHistory, paymentEntry] : [paymentEntry];

          return {
            ...s,
            outstandingDebt: newDebt,
            pendingBalance: newDebt,
            totalPaidToDate: newPaid,
            paymentHistory: history,
          };
        }
        return s;
      })
    );
  };

  const clearSupplierBalance = (supplierId, paymentAmount) => {
    recordSupplierPayment(supplierId, paymentAmount, 'Cash', 'Account Settlement');
  };

  const createPurchaseOrder = (poData) => {
    const newPo = {
      poNumber: poData.poNumber || generatePONumber(),
      distributorName: poData.distributorName || poData.supplierName || 'Muller & Phipps Pakistan',
      supplierName: poData.supplierName || poData.distributorName || 'Muller & Phipps Pakistan',
      inwardDate: poData.inwardDate || poData.date || new Date().toISOString().split('T')[0],
      deliveryDate: poData.deliveryDate || '',
      challanNo: poData.challanNo || '',
      paymentMethod: poData.paymentMode || poData.paymentMethod || 'Cash',
      paymentStatus: poData.paymentStatus || 'PAID',
      amountPaid: Number(poData.amountPaid || poData.totalAmount || 0),
      grossCost: Number(poData.grossCost || poData.subtotal || 0),
      salesTaxRate: Number(poData.salesTaxRate || 0),
      salesTaxAmount: Number(poData.salesTaxAmount || 0),
      advTaxRate: Number(poData.advTaxRate || 0),
      advTaxAmount: Number(poData.advTaxAmount || 0),
      inputTax: Number(poData.inputTax || (Number(poData.salesTaxAmount || 0) + Number(poData.advTaxAmount || 0))),
      totalAmount: Number(poData.totalAmount || poData.grossCost || 0),
      items: poData.items || [],
      itemLines: poData.itemLines || '',
      notes: poData.notes || '',
      stockStatus: poData.stockStatus || 'Stock Received',
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    const tenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
    dbSyncService.savePurchaseOrder(tenantId, newPo).catch(() => {});
    return newPo;
  };

  return (
    <SupplierContext.Provider
      value={{
        suppliers,
        purchaseOrders,
        addSupplier,
        recordSupplierPayment,
        clearSupplierBalance,
        createPurchaseOrder,
        generatePONumber,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};

export default SupplierContext;
