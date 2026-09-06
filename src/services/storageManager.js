/**
 * Storage Quota Manager & Safe Storage Operations
 * Protects localStorage against browser QuotaExceededError (5MB limit)
 * under high-pressure, long-term retail POS transaction volume.
 */

const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024; // Standard 5MB browser quota

const memoryStore = new Map();

const getStorage = () => {
  if (typeof localStorage !== 'undefined') return localStorage;
  return {
    getItem: (k) => memoryStore.get(k) || null,
    setItem: (k, v) => memoryStore.set(k, String(v)),
    removeItem: (k) => memoryStore.delete(k),
    clear: () => memoryStore.clear(),
    get length() { return memoryStore.size; },
    key: (i) => Array.from(memoryStore.keys())[i] || null,
  };
};

export const storageManager = {
  // Calculate approximate storage usage
  getStorageStats: () => {
    let usedBytes = 0;
    const storage = getStorage();
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        const value = storage.getItem(key);
        if (key && value) {
          usedBytes += (key.length + value.length) * 2; // UTF-16 characters = 2 bytes
        }
      }
    } catch (e) {
      console.warn('Failed to calculate storage stats', e);
    }

    const usagePercent = Math.min(100, Math.round((usedBytes / ESTIMATED_QUOTA_BYTES) * 100));
    return {
      usedBytes,
      totalBytes: ESTIMATED_QUOTA_BYTES,
      usagePercent,
      isNearQuota: usagePercent >= 80,
      usedKB: (usedBytes / 1024).toFixed(1),
    };
  },

  // Safe setItem that catches QuotaExceededError and performs compaction
  safeSetItem: (key, value) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const storage = getStorage();
    try {
      storage.setItem(key, stringValue);
      return true;
    } catch (err) {
      const isQuotaError = 
        err.name === 'QuotaExceededError' || 
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
        err.code === 22 || 
        err.code === 1014;

      if (isQuotaError) {
        console.warn(`[StorageManager] ⚠️ QuotaExceededError on key "${key}". Compacting historical records...`);
        storageManager.compactHistoricalInvoices();

        // Retry write after compaction
        try {
          storage.setItem(key, stringValue);
          return true;
        } catch (retryErr) {
          console.error('[StorageManager] ❌ Storage critically full even after compaction!', retryErr);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pharmalink_storage_critical', {
              detail: { key, error: retryErr.message }
            }));
          }
          return false;
        }
      } else {
        console.error(`[StorageManager] Storage write error on key "${key}"`, err);
        return false;
      }
    }
  },

  safeGetItem: (key, defaultValue = null) => {
    try {
      const storage = getStorage();
      const item = storage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  },

  safeRemoveItem: (key) => {
    try {
      const storage = getStorage();
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  // Compact historical invoices older than 60 days
  compactHistoricalInvoices: () => {
    const storage = getStorage();
    const keys = ['pharmalink_retail_invoices', 'pharmalink_pk_invoices'];
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffStr = sixtyDaysAgo.toISOString().split('T')[0];

    keys.forEach((storageKey) => {
      try {
        const raw = storage.getItem(storageKey);
        if (!raw) return;
        const invoices = JSON.parse(raw);
        if (!Array.isArray(invoices) || invoices.length <= 50) return;

        // Keep last 50 full, compact older ones to essential ledger lines
        const compacted = invoices.map((inv, idx) => {
          if (idx < 50) return inv; // keep newest 50 untouched
          if (inv.date && inv.date < cutoffStr) {
            // Trim verbose item metadata
            return {
              invoiceNo: inv.invoiceNo,
              date: inv.date,
              time: inv.time,
              customerName: inv.customerName || 'Customer',
              netTotal: inv.netTotal || inv.grossTotal || 0,
              itemsCount: Array.isArray(inv.items) ? inv.items.length : 0,
              isCompacted: true
            };
          }
          return inv;
        });

        storage.setItem(storageKey, JSON.stringify(compacted));
        console.log(`[StorageManager] Compacted ${storageKey}`);
      } catch (e) {
        console.warn(`[StorageManager] Compaction skipped for ${storageKey}`, e);
      }
    });
  }
};

export default storageManager;
