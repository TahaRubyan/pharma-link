import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_DEBT_CUSTOMERS } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';

const CustomerDebtContext = createContext();

const getDebtStorageKey = (tenantId, mode) => {
  const tid = tenantId || 'TEN-TESTING-SHOP';
  if (tid === 'TEN-TESTING-SHOP') {
    return mode === 'RETAIL' ? 'pharmalink_retail_debt_customers' : 'pharmalink_debt_customers';
  }
  return `pharmalink_${tid}_${mode === 'RETAIL' ? 'retail' : 'wholesale'}_customers`;
};

export const CustomerDebtProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const isTestingShop = activeTenantId === 'TEN-TESTING-SHOP';
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  // Wholesale Debt Customers: strictly scoped per-tenant. Non-testing shops start blank [].
  const [wholesaleDebtCustomers, setWholesaleDebtCustomers] = useState(() => {
    const wsKey = getDebtStorageKey(activeTenantId, 'WHOLESALE');
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
      return INITIAL_DEBT_CUSTOMERS;
    }
    return [];
  });

  // Retail Debt Customers: strictly scoped per-tenant. Non-testing shops start blank [].
  const [retailDebtCustomers, setRetailDebtCustomers] = useState(() => {
    const retKey = getDebtStorageKey(activeTenantId, 'RETAIL');
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
      return INITIAL_DEBT_CUSTOMERS;
    }
    return [];
  });

  const debtCustomers = isRetail ? retailDebtCustomers : wholesaleDebtCustomers;
  const setDebtCustomers = (updater) => {
    if (isRetail) setRetailDebtCustomers(updater);
    else setWholesaleDebtCustomers(updater);
  };

  useEffect(() => {
    const key = getDebtStorageKey(activeTenantId, 'WHOLESALE');
    localStorage.setItem(key, JSON.stringify(wholesaleDebtCustomers));
  }, [wholesaleDebtCustomers, activeTenantId]);

  useEffect(() => {
    const key = getDebtStorageKey(activeTenantId, 'RETAIL');
    localStorage.setItem(key, JSON.stringify(retailDebtCustomers));
  }, [retailDebtCustomers, activeTenantId]);

  // Register a new customer for credit/debt khata
  const addDebtCustomer = (customerData) => {
    const newCustomer = {
      id: `CUST-DEBT-${Date.now().toString().slice(-4)}`,
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      address: customerData.address ? customerData.address.trim() : 'Local Area',
      cnic: customerData.cnic ? customerData.cnic.trim() : '-',
      creditLimit: Number(customerData.creditLimit || 30000),
      currentBalance: 0,
      activeTransactions: [],
      settledCyclesHistory: [],
    };
    setDebtCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  // Record a credit sale to customer debt
  const recordCreditSale = (customerId, saleData) => {
    let updatedCustomer = null;
    setDebtCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const transaction = {
            invoiceNo: saleData.invoiceNo || `INV-RET-${Date.now().toString().slice(-6)}`,
            date: saleData.date || new Date().toISOString().split('T')[0],
            time: saleData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: [...saleData.items],
            grossTotal: Number(saleData.grossTotal || saleData.subtotal || 0),
            discount: Number(saleData.discount || 0),
            netTotal: Number(saleData.netTotal || 0),
            status: 'UNPAID',
          };
          const newBal = c.currentBalance + transaction.netTotal;
          updatedCustomer = {
            ...c,
            currentBalance: newBal,
            activeTransactions: [...c.activeTransactions, transaction],
          };
          return updatedCustomer;
        }
        return c;
      })
    );
    return updatedCustomer;
  };

  // Settle Customer Debt (Full or Partial Settlement)
  const settleCustomerDebt = (customerId, paymentAmount, paymentMode = 'Cash', notes = '') => {
    let settlementResult = null;
    setDebtCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const paid = Number(paymentAmount);
          const newBalance = Math.max(0, c.currentBalance - paid);
          const isFull = newBalance === 0;

          const settledCycle = {
            cycleId: `CYCLE-${Date.now().toString().slice(-6)}`,
            settledDate: new Date().toISOString().split('T')[0],
            settledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            customerName: c.name,
            customerPhone: c.phone,
            previousBalance: c.currentBalance,
            settledAmount: paid,
            remainingBalance: newBalance,
            paymentMode,
            notes: notes || (isFull ? 'Full Balance Settlement' : 'Partial Payment on Account'),
            invoicesCount: c.activeTransactions.length,
            settledItems: c.activeTransactions.flatMap((t) => t.items || []),
            settledInvoices: c.activeTransactions.map((t) => t.invoiceNo),
          };

          settlementResult = settledCycle;

          return {
            ...c,
            currentBalance: newBalance,
            // If full settlement, clear active transactions; if partial, retain active items with adjusted balance
            activeTransactions: isFull ? [] : c.activeTransactions,
            settledCyclesHistory: [settledCycle, ...c.settledCyclesHistory],
          };
        }
        return c;
      })
    );
    return settlementResult;
  };

  // Generate WhatsApp Share URL & Text for Instant Credit Slip
  const generateWhatsAppCreditSlip = (customer, saleData, shopName = 'Testing Shop') => {
    const phoneClean = customer.phone.replace(/[^0-9]/g, '');
    const internationalPhone = phoneClean.startsWith('0')
      ? '92' + phoneClean.slice(1)
      : phoneClean.startsWith('92')
      ? phoneClean
      : '92' + phoneClean;

    const itemsText = (saleData.items || [])
      .map((item, idx) => `${idx + 1}. ${item.name || item.brandName} (${item.qty} ${item.unitSelection || 'Tab'}) - Rs. ${Number(item.total || (item.qty * (item.price || item.boxPrice || 10))).toFixed(2)}`)
      .join('\n');

    const message = `*${shopName.toUpperCase()} — CREDIT PURCHASE SLIP*\n` +
      `-----------------------------------------\n` +
      `*Customer:* ${customer.name}\n` +
      `*Invoice #:* ${saleData.invoiceNo}\n` +
      `*Date:* ${saleData.date} ${saleData.time || ''}\n` +
      `-----------------------------------------\n` +
      `*PURCHASED ITEMS:*\n${itemsText}\n` +
      `-----------------------------------------\n` +
      `*Bill Amount Added to Debt:* Rs. ${Number(saleData.netTotal).toFixed(2)}\n` +
      `*Total Outstanding Khata Balance:* Rs. ${(customer.currentBalance + Number(saleData.netTotal)).toFixed(2)}\n` +
      `-----------------------------------------\n` +
      `Thank you for shopping with ${shopName}. Please clear at month-end.`;

    const encoded = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${internationalPhone}&text=${encoded}`;
  };

  // Delete Customer Debt/Khata (Only allowed if current balance is 0 / fully settled)
  const deleteDebtCustomer = (customerId) => {
    const customer = debtCustomers.find((c) => c.id === customerId);
    if (!customer) return { success: false, message: 'Customer record not found.' };

    if (customer.currentBalance > 0) {
      return {
        success: false,
        message: `Cannot delete Khata Account: Outstanding balance of Rs. ${customer.currentBalance.toFixed(2)} is pending. The customer debt can only be deleted once cash is fully settled.`
      };
    }

    setDebtCustomers((prev) => prev.filter((c) => c.id !== customerId));
    return { success: true, message: `Customer ${customer.name} Khata account deleted successfully.` };
  };

  return (
    <CustomerDebtContext.Provider
      value={{
        debtCustomers,
        addDebtCustomer,
        deleteDebtCustomer,
        recordCreditSale,
        settleCustomerDebt,
        generateWhatsAppCreditSlip,
      }}
    >
      {children}
    </CustomerDebtContext.Provider>
  );
};

export const useCustomerDebt = () => {
  const context = useContext(CustomerDebtContext);
  if (!context) {
    throw new Error('useCustomerDebt must be used within a CustomerDebtProvider');
  }
  return context;
};

export default CustomerDebtContext;
