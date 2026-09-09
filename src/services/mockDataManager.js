/**
 * Retail Mock Data Manager
 * Allows testing users to load rich Pakistani retail pharmaceutical sample data
 * (medicines, batches, customer khata, invoices, suppliers, and patients)
 * and cleanly wipe it back to an absolute empty slate when testing is finished.
 */

import {
  DEMO_MEDICINES,
  DEMO_BATCHES,
  DEMO_INVOICES,
  DEMO_DEBT_CUSTOMERS,
  DEMO_SUPPLIERS,
  DEMO_PURCHASE_ORDERS,
  DEMO_PATIENTS,
  DEMO_VENDOR_RETURNS,
} from '../data/mockData.js';
import { storageManager } from './storageManager.js';

export const RETAIL_STORAGE_KEYS = {
  MEDICINES: 'pharmalink_retail_medicines',
  BATCHES: 'pharmalink_retail_batches',
  INVOICES: 'pharmalink_retail_invoices',
  DEBT_CUSTOMERS: 'pharmalink_retail_debt_customers',
  SUPPLIERS: 'pharmalink_retail_suppliers',
  PURCHASE_ORDERS: 'pharmalink_retail_purchase_orders',
  PATIENTS: 'pharmalink_retail_patients',
  VENDOR_RETURNS: 'pharmalink_retail_vendor_returns',
  CLEARED_FLAG: 'pharmalink_retail_cleared',
};

/**
 * Check if the retail shop currently has mock or real catalog data loaded
 */
export const hasRetailData = () => {
  try {
    const isCleared = storageManager.safeGetItem(RETAIL_STORAGE_KEYS.CLEARED_FLAG) === 'true';
    if (isCleared) return false;

    const meds = storageManager.safeGetItem(RETAIL_STORAGE_KEYS.MEDICINES);
    if (meds === null) return true; // Default state is pre-stocked for testing
    return Array.isArray(meds) && meds.length > 0;
  } catch {
    return false;
  }
};

/**
 * Get summary stats for the current retail data
 */
export const getRetailDataStats = () => {
  const isCleared = storageManager.safeGetItem(RETAIL_STORAGE_KEYS.CLEARED_FLAG) === 'true';

  const getCount = (key, defaultArr = []) => {
    try {
      const val = storageManager.safeGetItem(key);
      if (val === null) return isCleared ? 0 : defaultArr.length;
      return Array.isArray(val) ? val.length : 0;
    } catch {
      return 0;
    }
  };

  const hasData = hasRetailData();

  return {
    hasData,
    medicinesCount: getCount(RETAIL_STORAGE_KEYS.MEDICINES, DEMO_MEDICINES),
    batchesCount: getCount(RETAIL_STORAGE_KEYS.BATCHES, DEMO_BATCHES),
    invoicesCount: getCount(RETAIL_STORAGE_KEYS.INVOICES, DEMO_INVOICES),
    customersCount: getCount(RETAIL_STORAGE_KEYS.DEBT_CUSTOMERS, DEMO_DEBT_CUSTOMERS),
  };
};

/**
 * Load complete Pakistani retail pharmacy sample dataset
 */
export const loadRetailMockData = (reload = true) => {
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.MEDICINES, DEMO_MEDICINES);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.BATCHES, DEMO_BATCHES);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.INVOICES, DEMO_INVOICES);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.DEBT_CUSTOMERS, DEMO_DEBT_CUSTOMERS);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.SUPPLIERS, DEMO_SUPPLIERS);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.PURCHASE_ORDERS, DEMO_PURCHASE_ORDERS);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.PATIENTS, DEMO_PATIENTS);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.VENDOR_RETURNS, DEMO_VENDOR_RETURNS);

  storageManager.safeRemoveItem(RETAIL_STORAGE_KEYS.CLEARED_FLAG);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pharmalink_retail_mock_data_changed', {
      detail: { action: 'LOADED', count: DEMO_MEDICINES.length }
    }));
    if (reload) {
      window.location.reload();
    }
  }

  return true;
};

/**
 * Wipe all retail sample data back to a 100% clean slate
 */
export const clearRetailMockData = (reload = true) => {
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.MEDICINES, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.BATCHES, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.INVOICES, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.DEBT_CUSTOMERS, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.SUPPLIERS, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.PURCHASE_ORDERS, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.PATIENTS, []);
  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.VENDOR_RETURNS, []);

  storageManager.safeSetItem(RETAIL_STORAGE_KEYS.CLEARED_FLAG, 'true');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pharmalink_retail_mock_data_changed', {
      detail: { action: 'CLEARED' }
    }));
    if (reload) {
      window.location.reload();
    }
  }

  return true;
};
