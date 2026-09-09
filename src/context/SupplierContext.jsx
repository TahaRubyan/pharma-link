import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';
import { dbSyncService } from '../services/dbSyncService';

const SupplierContext = createContext();

export const SupplierProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  const [wholesaleSuppliers, setWholesaleSuppliers] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
    if (isCleared) return [];

    const saved = localStorage.getItem('pharmalink_pk_suppliers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved suppliers', e);
      }
    }
    return INITIAL_SUPPLIERS;
  });

  const [retailSuppliers, setRetailSuppliers] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_suppliers') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_SUPPLIERS;
  });

  const suppliers = isRetail ? retailSuppliers : wholesaleSuppliers;
  const setSuppliers = (updater) => {
    if (isRetail) setRetailSuppliers(updater);
    else setWholesaleSuppliers(updater);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_suppliers', JSON.stringify(wholesaleSuppliers));
    } catch (e) {}
  }, [wholesaleSuppliers]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_retail_suppliers', JSON.stringify(retailSuppliers));
    } catch (e) {}
  }, [retailSuppliers]);

  const [wholesalePurchaseOrders, setWholesalePurchaseOrders] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
    if (isCleared) return [];

    const saved = localStorage.getItem('pharmalink_pk_purchase_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved purchase orders', e);
      }
    }
    return INITIAL_PURCHASE_ORDERS;
  });

  const [retailPurchaseOrders, setRetailPurchaseOrders] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_purchase_orders') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_PURCHASE_ORDERS;
  });

  const purchaseOrders = isRetail ? retailPurchaseOrders : wholesalePurchaseOrders;
  const setPurchaseOrders = (updater) => {
    if (isRetail) setRetailPurchaseOrders(updater);
    else setWholesalePurchaseOrders(updater);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_pk_purchase_orders', JSON.stringify(wholesalePurchaseOrders));
    } catch (e) {}
  }, [wholesalePurchaseOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmalink_retail_purchase_orders', JSON.stringify(retailPurchaseOrders));
    } catch (e) {}
  }, [retailPurchaseOrders]);

  // Initial cloud sync from Supabase
  useEffect(() => {
    const tenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
    dbSyncService.fetchSuppliers(tenantId).then((cloudSuppliers) => {
      if (cloudSuppliers && cloudSuppliers.length > 0) {
        setSuppliers((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          cloudSuppliers.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
    }).catch(() => {});

    dbSyncService.fetchPurchaseOrders(tenantId).then((cloudPOs) => {
      if (cloudPOs && cloudPOs.length > 0) {
        setPurchaseOrders((prev) => {
          const map = new Map(prev.map((p) => [p.poNumber || p.id, p]));
          cloudPOs.forEach((p) => map.set(p.poNumber || p.id, p));
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
  }, [auth?.currentShop?.shopId]);

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
