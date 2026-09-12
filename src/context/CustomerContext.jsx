import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { fetchCustomers, syncCustomersUpstream } from '../services/dbSyncService';

const CustomerContext = createContext();

const INITIAL_DEMO_CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'Al-Razi Medicos',
    shopName: 'Al-Razi Medicos & Surgical',
    customerName: 'Al-Razi Medicos',
    region: 'Gujrat',
    address: 'Shop # 12, Circular Road, Near GTS Chowk, Gujrat',
    customerAddress: 'Shop # 12, Circular Road, Near GTS Chowk, Gujrat',
    phone: '0300-5551234',
    customerPhone: '0300-5551234',
    ntn: '4442705-8',
    customerNtn: '4442705-8',
    gstn: '32-77-8761-745-88',
    customerStrn: '32-77-8761-745-88',
    strn: '32-77-8761-745-88',
    licenseNo: 'DL-20-GJT-108',
    filerStatus: 'FILER',
    creditLimit: 750000,
    currentBalance: 0,
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'CUST-002',
    name: 'Shafiq Pharmacy',
    shopName: 'Shafiq Medicos & General Store',
    customerName: 'Shafiq Pharmacy',
    region: 'Lahore',
    address: 'Main Market, Gulberg III, Lahore',
    customerAddress: 'Main Market, Gulberg III, Lahore',
    phone: '0321-9876543',
    customerPhone: '0321-9876543',
    ntn: '2819204-1',
    customerNtn: '2819204-1',
    gstn: '24-00-9812-401-11',
    customerStrn: '24-00-9812-401-11',
    strn: '24-00-9812-401-11',
    licenseNo: 'DL-20-LHR-940',
    filerStatus: 'FILER',
    creditLimit: 500000,
    currentBalance: 0,
    createdAt: '2026-09-02T11:30:00.000Z',
  },
  {
    id: 'CUST-003',
    name: 'Khyber Drug Store',
    shopName: 'Khyber Drug & Distribution Agency',
    customerName: 'Khyber Drug Store',
    region: 'Rawalpindi',
    address: 'Bohra Bazar, Saddar, Rawalpindi',
    customerAddress: 'Bohra Bazar, Saddar, Rawalpindi',
    phone: '0333-5128901',
    customerPhone: '0333-5128901',
    ntn: '3104928-4',
    customerNtn: '3104928-4',
    gstn: '17-00-3104-928-22',
    customerStrn: '17-00-3104-928-22',
    strn: '17-00-3104-928-22',
    licenseNo: 'DL-21-RWP-442',
    filerStatus: 'NON_FILER',
    creditLimit: 300000,
    currentBalance: 0,
    createdAt: '2026-09-03T14:15:00.000Z',
  },
  {
    id: 'CUST-004',
    name: 'Capital Care Clinic',
    shopName: 'Capital Care Pharmacy & Diagnostics',
    customerName: 'Capital Care Clinic',
    region: 'Islamabad',
    address: 'Blue Area, Sector F-6, Islamabad',
    customerAddress: 'Blue Area, Sector F-6, Islamabad',
    phone: '0345-8761234',
    customerPhone: '0345-8761234',
    ntn: '5920148-7',
    customerNtn: '5920148-7',
    gstn: '08-01-5920-148-33',
    customerStrn: '08-01-5920-148-33',
    strn: '08-01-5920-148-33',
    licenseNo: 'DL-20-ISB-205',
    filerStatus: 'FILER',
    creditLimit: 1000000,
    currentBalance: 0,
    createdAt: '2026-09-04T09:45:00.000Z',
  },
];

export const getCustomerStorageKey = (tenantId) => {
  const tid = tenantId || 'TEN-TESTING-SHOP';
  return `pharmalink_${tid}_customers`;
};

export const CustomerProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const isTestingShop = activeTenantId === 'TEN-TESTING-SHOP';

  // Initialize customers from strictly tenant-scoped localStorage
  const [customers, setCustomers] = useState(() => {
    const key = getCustomerStorageKey(activeTenantId);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    // Only Testing Shop starts with demo customer accounts; client shops start clean slate
    return isTestingShop ? INITIAL_DEMO_CUSTOMERS : [];
  });

  const isHydratedRef = useRef(false);

  // Hydrate from Supabase cloud database
  useEffect(() => {
    let isCancelled = false;

    async function hydrateCustomers() {
      try {
        const remote = await fetchCustomers(activeTenantId);
        if (!isCancelled && Array.isArray(remote)) {
          if (remote.length > 0) {
            setCustomers(remote);
          } else if (isTestingShop && customers.length === 0) {
            setCustomers(INITIAL_DEMO_CUSTOMERS);
            syncCustomersUpstream(activeTenantId, INITIAL_DEMO_CUSTOMERS).catch(() => {});
          }
          isHydratedRef.current = true;
        }
      } catch (err) {
        console.warn('[CustomerContext] Cloud hydration error:', err);
      }
    }

    hydrateCustomers();
    return () => { isCancelled = true; };
  }, [activeTenantId, isTestingShop]);

  // Persist to tenant-scoped localStorage and sync upstream
  useEffect(() => {
    const key = getCustomerStorageKey(activeTenantId);
    localStorage.setItem(key, JSON.stringify(customers));

    // Background upstream sync
    const timer = setTimeout(() => {
      syncCustomersUpstream(activeTenantId, customers).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [customers, activeTenantId]);

  // Add new customer
  const addCustomer = (customerData) => {
    const newCustomer = {
      id: customerData.id || `CUST-${Date.now().toString().slice(-6)}`,
      name: customerData.name?.trim() || customerData.customerName?.trim() || 'New Customer',
      shopName: customerData.shopName?.trim() || customerData.name?.trim() || 'New Customer',
      customerName: customerData.name?.trim() || customerData.customerName?.trim() || 'New Customer',
      region: customerData.region?.trim() || '',
      address: customerData.address?.trim() || customerData.customerAddress?.trim() || '',
      customerAddress: customerData.address?.trim() || customerData.customerAddress?.trim() || '',
      phone: customerData.phone?.trim() || customerData.customerPhone?.trim() || '',
      customerPhone: customerData.phone?.trim() || customerData.customerPhone?.trim() || '',
      ntn: customerData.ntn?.trim() || customerData.customerNtn?.trim() || '-',
      customerNtn: customerData.ntn?.trim() || customerData.customerNtn?.trim() || '-',
      gstn: customerData.gstn?.trim() || customerData.customerStrn?.trim() || customerData.strn?.trim() || '-',
      customerStrn: customerData.gstn?.trim() || customerData.customerStrn?.trim() || customerData.strn?.trim() || '-',
      strn: customerData.gstn?.trim() || customerData.customerStrn?.trim() || customerData.strn?.trim() || '-',
      licenseNo: customerData.licenseNo?.trim() || 'DL-20/21-PENDING',
      filerStatus: customerData.filerStatus || 'FILER',
      creditLimit: Number(customerData.creditLimit) || 500000,
      currentBalance: Number(customerData.currentBalance) || 0,
      createdAt: customerData.createdAt || new Date().toISOString(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  // Update existing customer
  const updateCustomer = (id, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
  };

  // Delete customer
  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Instant multi-field search
  const searchCustomers = (query) => {
    if (!query || !query.trim()) return customers;
    const q = query.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.shopName && c.shopName.toLowerCase().includes(q)) ||
        (c.region && c.region.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.ntn && c.ntn.toLowerCase().includes(q)) ||
        (c.gstn && c.gstn.toLowerCase().includes(q))
    );
  };

  const getCustomerById = (id) => {
    return customers.find((c) => c.id === id) || null;
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        searchCustomers,
        getCustomerById,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

export default CustomerContext;
