import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const prevTenantRef = useRef(activeTenantId);

  useEffect(() => {
    if (prevTenantRef.current !== activeTenantId) {
      prevTenantRef.current = activeTenantId;

      if (activeTenantId === 'TEN-TESTING-SHOP') {
        const savedWs = localStorage.getItem('pharmalink_pk_suppliers');
        const savedRet = localStorage.getItem('pharmalink_retail_suppliers');
        setWholesaleSuppliers(savedWs ? JSON.parse(savedWs) : INITIAL_SUPPLIERS);
        setRetailSuppliers(savedRet ? JSON.parse(savedRet) : INITIAL_SUPPLIERS);

        const savedWsPO = localStorage.getItem('pharmalink_pk_purchase_orders');
        const savedRetPO = localStorage.getItem('pharmalink_retail_purchase_orders');
        setWholesalePurchaseOrders(savedWsPO ? JSON.parse(savedWsPO) : INITIAL_PURCHASE_ORDERS);
        setRetailPurchaseOrders(savedRetPO ? JSON.parse(savedRetPO) : INITIAL_PURCHASE_ORDERS);
      } else {
        const wsKey = `pharmalink_${activeTenantId}_wholesale_suppliers`;
        const retKey = `pharmalink_${activeTenantId}_retail_suppliers`;
        const savedWs = localStorage.getItem(wsKey);
        const savedRet = localStorage.getItem(retKey);
        setWholesaleSuppliers(savedWs ? JSON.parse(savedWs) : []);
        setRetailSuppliers(savedRet ? JSON.parse(savedRet) : []);

        const wsPOKey = `pharmalink_${activeTenantId}_wholesale_purchase_orders`;
        const retPOKey = `pharmalink_${activeTenantId}_retail_purchase_orders`;
        const savedWsPO = localStorage.getItem(wsPOKey);
        const savedRetPO = localStorage.getItem(retPOKey);
        setWholesalePurchaseOrders(savedWsPO ? JSON.parse(savedWsPO) : []);
        setRetailPurchaseOrders(savedRetPO ? JSON.parse(savedRetPO) : []);
      }
    }
  }, [activeTenantId]);

  useEffect(() => {
    try {
      const key = activeTenantId === 'TEN-TESTING-SHOP' ? 'pharmalink_pk_suppliers' : `pharmalink_${activeTenantId}_wholesale_suppliers`;
      localStorage.setItem(key, JSON.stringify(wholesaleSuppliers));
    } catch (e) {}
  }, [wholesaleSuppliers, activeTenantId]);

  useEffect(() => {
    try {
      const key = activeTenantId === 'TEN-TESTING-SHOP' ? 'pharmalink_retail_suppliers' : `pharmalink_${activeTenantId}_retail_suppliers`;
      localStorage.setItem(key, JSON.stringify(retailSuppliers));
    } catch (e) {}
  }, [retailSuppliers, activeTenantId]);

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
