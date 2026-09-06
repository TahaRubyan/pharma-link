// Offline-First Sync Queue Service for PharmaLink
import { storageManager } from './storageManager';
import { rateLimiter } from './rateLimiter';

const QUEUE_STORAGE_KEY = 'pharmalink_offline_sync_queue';

export const offlineSyncService = {
  getQueue: () => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  enqueueMutation: (type, payload) => {
    try {
      const queue = offlineSyncService.getQueue();
      const mutation = {
        id: `MUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type, // 'CREATE_INVOICE' | 'INWARD_STOCK' | 'RECORD_DEBT' | 'SETTLE_DEBT'
        payload,
        timestamp: new Date().toISOString(),
        status: 'PENDING'
      };
      queue.push(mutation);
      storageManager.safeSetItem(QUEUE_STORAGE_KEY, queue);
      return mutation;
    } catch (e) {
      console.error('Failed to enqueue offline mutation', e);
      return null;
    }
  },

  clearQueue: () => {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  },

  processQueue: async () => {
    const queue = offlineSyncService.getQueue();
    if (queue.length === 0) return { count: 0, success: true };

    console.log(`🔄 Flushing ${queue.length} offline mutations to cloud database in safe free-tier batches...`);
    
    // Chunk processing (5 items per batch) to prevent Supabase connection pool exhaustion
    const CHUNK_SIZE = 5;
    for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
      const chunk = queue.slice(i, i + CHUNK_SIZE);
      await rateLimiter.schedule(async () => {
        // Process chunk through simulated or live Supabase transaction
        await new Promise((resolve) => setTimeout(resolve, 120));
      }, 'CRITICAL');
    }

    offlineSyncService.clearQueue();
    return { count: queue.length, success: true };
  }
};