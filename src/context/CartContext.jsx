import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useInventory } from './InventoryContext';
import { useSales } from './SalesContext';
import { AuthContext } from './AuthContext';
import { storageManager } from '../services/storageManager';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const { deductStock } = useInventory();
  const { recordSale } = useSales();

  // Persistent state for cart items strictly scoped to active tenant
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(`pharmalink_${activeTenantId}_pos_cart`);
    return saved ? JSON.parse(saved) : [];
  });

  const [customerName, setCustomerName] = useState(() => localStorage.getItem(`pharmalink_${activeTenantId}_pos_cust`) || '');
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem(`pharmalink_${activeTenantId}_pos_doc`) || '');
  const [rxPatient, setRxPatient] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [saleType, setSaleType] = useState('Retail'); // 'Retail' vs 'Bulk'
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'rupees'
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Card' | 'Mobile Banking'
  const [cashTendered, setCashTendered] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Sync cart to storage strictly scoped to active tenant
  useEffect(() => {
    storageManager.safeSetItem(`pharmalink_${activeTenantId}_pos_cart`, cart);
  }, [cart, activeTenantId]);

  useEffect(() => {
    storageManager.safeSetItem(`pharmalink_${activeTenantId}_pos_cust`, customerName);
  }, [customerName, activeTenantId]);

  useEffect(() => {
    storageManager.safeSetItem(`pharmalink_${activeTenantId}_pos_doc`, doctorName);
  }, [doctorName, activeTenantId]);

  const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

  const addToCart = (medicine, batch, unitSelection = 'Box') => {
    setCart((prev) => {
      const medId = medicine.id || medicine.medicineId;
      const bNo = (batch ? (batch.batchNo || batch.batchNumber) : '') || medicine.batchNo || medicine.batchNumber || 'PO-BATCH';
      const existingIdx = prev.findIndex((i) => (i.medicineId === medId || i.id === medId) && (i.batchNo === bNo || i.batchNumber === bNo));
      const itemCost = Number(medicine.purchaseCost !== undefined ? medicine.purchaseCost : (medicine.purchasePriceBox !== undefined ? medicine.purchasePriceBox : (medicine.boxCost || (batch ? (batch.purchasePriceBox || batch.purchaseRate || batch.purchaseCost) : 0))));
      const itemSelling = Number(medicine.boxSellingPrice !== undefined ? medicine.boxSellingPrice : (medicine.boxPrice !== undefined ? medicine.boxPrice : (batch ? (batch.boxPrice || batch.boxSellingPrice) : itemCost)));
      const boxPrice = round2(itemSelling > 0 ? itemSelling : (itemCost > 0 ? itemCost : (medicine.price || 0)));
      const saleTaxRate = Number(medicine.saleTaxPercent !== undefined ? medicine.saleTaxPercent : (medicine.salesTaxRate !== undefined ? medicine.salesTaxRate : 18));
      const advTaxRate = Number(medicine.advTaxPercent !== undefined ? medicine.advTaxPercent : 0.5);

      if (existingIdx >= 0) {
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            const newQty = item.qty + 1;
            const rate = Number(item.boxPrice !== undefined ? item.boxPrice : (item.price !== undefined ? item.price : boxPrice));
            const gross = round2(newQty * rate);
            const discPercent = Number(item.discountPercent || 0);
            const discAmount = round2((gross * discPercent) / 100);
            const taxable = Math.max(0, round2(gross - discAmount));
            const tr = Number(item.saleTaxPercent !== undefined ? item.saleTaxPercent : saleTaxRate);
            const ar = Number(item.advTaxPercent !== undefined ? item.advTaxPercent : advTaxRate);
            const st = round2((taxable * tr) / 100);
            const adv = round2((taxable * ar) / 100);
            const net = round2(taxable + st + adv);

            return {
              ...item,
              qty: newQty,
              quantity: newQty,
              boxPrice: rate,
              price: rate,
              gross,
              discount: discAmount,
              saleTaxPercent: tr,
              salesTax18: st,
              advTaxPercent: ar,
              advTax05: adv,
              netTotal: net,
              total: net
            };
          }
          return item;
        });
      } else {
        const gross = boxPrice;
        const st = round2((gross * saleTaxRate) / 100);
        const adv = round2((gross * advTaxRate) / 100);
        const net = round2(gross + st + adv);

        return [
          ...prev,
          {
            id: medId,
            medicineId: medId,
            name: medicine.name || medicine.brandName,
            brandName: medicine.name || medicine.brandName,
            genericFormula: medicine.genericFormula || medicine.formula,
            formula: medicine.formula || medicine.genericFormula,
            requiresPrescription: medicine.requiresPrescription || false,
            tabletsPerBox: medicine.tabletsPerBox || 100,
            batchNo: bNo,
            batchNumber: bNo,
            expiryDate: (batch && batch.expiryDate) ? batch.expiryDate : (medicine.expiryDate || '12-2028'),
            unitSelection,
            unitType: unitSelection,
            costPrice: itemCost,
            purchaseCost: itemCost,
            purchasePriceBox: itemCost,
            boxCost: itemCost,
            price: boxPrice,
            boxPrice: boxPrice,
            boxSellingPrice: boxPrice,
            unitPrice: boxPrice,
            qty: 1,
            quantity: 1,
            discountPercent: 0,
            discount: 0,
            gross,
            saleTaxPercent: saleTaxRate,
            salesTax18: st,
            advTaxPercent: advTaxRate,
            advTax05: adv,
            netTotal: net,
            total: net
          }
        ];
      }
    });
  };

  const updateCartQuantity = (index, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setCart((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const rate = Number(item.boxPrice || item.price || item.unitPrice || 0);
          const gross = round2(q * rate);
          const discPercent = Number(item.discountPercent || 0);
          const discAmount = round2((gross * discPercent) / 100);
          const taxable = Math.max(0, round2(gross - discAmount));
          const tr = Number(item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
          const ar = Number(item.advTaxPercent !== undefined ? item.advTaxPercent : 0.5);
          const st = round2((taxable * tr) / 100);
          const adv = round2((taxable * ar) / 100);
          const net = round2(taxable + st + adv);

          return {
            ...item,
            qty: q,
            quantity: q,
            gross,
            discount: discAmount,
            salesTax18: st,
            advTax05: adv,
            netTotal: net,
            total: net
          };
        }
        return item;
      })
    );
  };

  const updateQty = (medicineId, batchNo, newQty) => {
    const q = Math.max(1, Number(newQty) || 1);
    setCart((prev) =>
      prev.map((item) => {
        if ((item.medicineId === medicineId || item.id === medicineId) && (item.batchNo === batchNo || item.batchNumber === batchNo)) {
          const rate = Number(item.boxPrice || item.price || item.unitPrice || 0);
          const gross = round2(q * rate);
          const discPercent = Number(item.discountPercent || 0);
          const discAmount = round2((gross * discPercent) / 100);
          const taxable = Math.max(0, round2(gross - discAmount));
          const tr = Number(item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
          const ar = Number(item.advTaxPercent !== undefined ? item.advTaxPercent : 0.5);
          const st = round2((taxable * tr) / 100);
          const adv = round2((taxable * ar) / 100);
          const net = round2(taxable + st + adv);

          return {
            ...item,
            qty: q,
            quantity: q,
            gross,
            discount: discAmount,
            salesTax18: st,
            advTax05: adv,
            netTotal: net,
            total: net
          };
        }
        return item;
      })
    );
  };

  const updateCartItem = (updatedItem) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.medicineId === updatedItem.medicineId || item.id === updatedItem.id) &&
            (item.batchNo === updatedItem.batchNo || item.batchNumber === updatedItem.batchNumber)) {
          const q = Number(updatedItem.qty || updatedItem.quantity || 1);
          const rate = Number(updatedItem.boxPrice || updatedItem.price || item.boxPrice || 0);
          const gross = round2(q * rate);
          const discPercent = Number(updatedItem.discountPercent !== undefined ? updatedItem.discountPercent : (item.discountPercent || 0));
          const discAmount = updatedItem.discount !== undefined ? round2(updatedItem.discount) : round2((gross * discPercent) / 100);
          const taxable = Math.max(0, round2(gross - discAmount));
          const tr = Number(updatedItem.saleTaxPercent !== undefined ? updatedItem.saleTaxPercent : (item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18));
          const ar = Number(updatedItem.advTaxPercent !== undefined ? updatedItem.advTaxPercent : (item.advTaxPercent !== undefined ? item.advTaxPercent : 0.5));
          const st = updatedItem.salesTax18 !== undefined ? round2(updatedItem.salesTax18) : round2((taxable * tr) / 100);
          const adv = updatedItem.advTax05 !== undefined ? round2(updatedItem.advTax05) : round2((taxable * ar) / 100);
          const net = round2(taxable + st + adv);

          return {
            ...item,
            ...updatedItem,
            qty: q,
            quantity: q,
            boxPrice: rate,
            price: rate,
            gross,
            discountPercent: discPercent,
            discount: discAmount,
            saleTaxPercent: tr,
            salesTax18: st,
            advTaxPercent: ar,
            advTax05: adv,
            netTotal: net,
            total: net
          };
        }
        return item;
      })
    );
  };

  const updateUnitType = (medicineId, batchNo, unitType) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.medicineId === medicineId || item.id === medicineId) && (item.batchNo === batchNo || item.batchNumber === batchNo)) {
          return { ...item, unitType, unitSelection: unitType };
        }
        return item;
      })
    );
  };

  const updateLineTax = (medicineId, batchNo, salesTax18, advTax05) => {
    setCart((prev) =>
      prev.map((item) => {
        if ((item.medicineId === medicineId || item.id === medicineId) && (item.batchNo === batchNo || item.batchNumber === batchNo)) {
          return { ...item, salesTax18: Number(salesTax18 || 0), advTax05: Number(advTax05 || 0) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (medicineId, batchNo) => {
    if (typeof medicineId === 'number' && batchNo === undefined) {
      // Called by index
      setCart((prev) => prev.filter((_, i) => i !== medicineId));
    } else {
      setCart((prev) =>
        prev.filter((item) => !((item.medicineId === medicineId || item.id === medicineId) && (item.batchNo === batchNo || item.batchNumber === batchNo)))
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setDoctorName('');
    setDiscountValue(0);
    setCashTendered('');
    localStorage.removeItem('pharmalink_pos_cart');
    localStorage.removeItem('pharmalink_pos_cust');
    localStorage.removeItem('pharmalink_pos_doc');
  };

  const calculations = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const rate = Number(item.boxPrice || item.price || item.unitPrice || 0);
      const q = Number(item.qty || item.quantity || 1);
      return sum + (rate * q);
    }, 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
    } else {
      discountAmount = Math.min(subtotal, Number(discountValue) || 0);
    }

    const netTotal = Math.max(0, subtotal - discountAmount);
    const tendered = Number(cashTendered) || 0;
    const change = Math.max(0, tendered - netTotal);

    return {
      subtotal,
      discountAmount,
      netTotal,
      tendered,
      change,
    };
  }, [cart, discountType, discountValue, cashTendered]);

  const getCartSubtotal = () => calculations.subtotal;

  const processCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return false;
    }
    if (isProcessingCheckout) {
      console.warn('[Cart] Checkout already in progress, blocking duplicate submit');
      return false;
    }

    setIsProcessingCheckout(true);
    try {
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
      const now = new Date();

      const saleRecord = {
        invoiceNo,
        date: new Date().toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        saleType,
        cashierName: 'Store Admin',
        customerName: customerName || 'Walk-in Cash Customer',
        doctorName: doctorName || '-',
        items: [...cart],
        subtotal: calculations.subtotal,
        discount: calculations.discountAmount,
        netTotal: calculations.netTotal,
        tendered: calculations.tendered,
        change: calculations.change,
        paymentMode,
      };

      deductStock(cart);
      recordSale(saleRecord);
      setLastCompletedSale(saleRecord);
      clearCart();

      alert(`Sale confirmed! Invoice #${invoiceNo} created.`);
      return saleRecord;
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        customerName,
        setCustomerName,
        doctorName,
        setDoctorName,
        saleType,
        setSaleType,
        discountType,
        setDiscountType,
        discountValue,
        setDiscountValue,
        paymentMode,
        setPaymentMode,
        cashTendered,
        setCashTendered,
        lastCompletedSale,
        isProcessingCheckout,
        rxPatient,
        setRxPatient,
        activeModal,
        openModal: (m) => setActiveModal(m),
        closeModal: () => setActiveModal(null),
        addToast: (title, message, type = 'info') => console.log(`[Toast] ${title}: ${message}`),
        addToCart,
        updateCartQuantity,
        updateQty,
        updateCartItem,
        updateUnitType,
        updateLineTax,
        removeFromCart,
        clearCart,
        getCartSubtotal,
        calculations,
        processCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
