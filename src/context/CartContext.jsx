import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useInventory } from './InventoryContext';
import { useSales } from './SalesContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { deductStock } = useInventory();
  const { recordSale } = useSales();

  // Persistent state for cart items so navigating screens doesn't clear cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [customerName, setCustomerName] = useState(() => localStorage.getItem('pharmalink_pos_cust') || '');
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('pharmalink_pos_doc') || '');
  const [rxPatient, setRxPatient] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [saleType, setSaleType] = useState('Retail'); // 'Retail' vs 'Bulk'
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' | 'rupees'
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Card' | 'Mobile Banking'
  const [cashTendered, setCashTendered] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('pharmalink_pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pharmalink_pos_cust', customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem('pharmalink_pos_doc', doctorName);
  }, [doctorName]);

  const addToCart = (medicine, batch, unitSelection = 'Box') => {
    setCart((prev) => {
      const medId = medicine.id || medicine.medicineId;
      const bNo = batch ? (batch.batchNo || batch.batchNumber) : 'B-9481';
      const existingIdx = prev.findIndex((i) => (i.medicineId === medId || i.id === medId) && (i.batchNo === bNo || i.batchNumber === bNo));
      const boxPrice = Number(medicine.boxSellingPrice || medicine.price || (batch ? batch.boxPrice : 150));

      if (existingIdx >= 0) {
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            const newQty = item.qty + 1;
            return {
              ...item,
              qty: newQty,
              quantity: newQty,
              total: newQty * boxPrice
            };
          }
          return item;
        });
      } else {
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
            expiryDate: batch ? (batch.expiryDate || '12/2027') : '12/2027',
            unitSelection,
            unitType: unitSelection,
            price: boxPrice,
            boxPrice: boxPrice,
            unitPrice: boxPrice,
            qty: 1,
            quantity: 1,
            discount: 0,
            salesTax18: 0,
            advTax05: 0,
            total: boxPrice
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
          const rate = item.boxPrice || item.price || item.unitPrice || 0;
          return { ...item, qty: q, quantity: q, total: q * rate };
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
          const rate = item.boxPrice || item.price || item.unitPrice || 0;
          return { ...item, qty: q, quantity: q, total: q * rate };
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

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const saleRecord = {
      invoiceNo,
      date: new Date().toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      saleType,
      cashierName: 'Dr. Idrees',
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
        rxPatient,
        setRxPatient,
        activeModal,
        openModal: (m) => setActiveModal(m),
        closeModal: () => setActiveModal(null),
        addToast: (title, message, type = 'info') => console.log(`[Toast] ${title}: ${message}`),
        addToCart,
        updateCartQuantity,
        updateQty,
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
