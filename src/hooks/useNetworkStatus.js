import { useState, useEffect } from 'react';
import { offlineSyncService } from '../services/offlineSyncService';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => offlineSyncService.getQueue().length);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const queue = offlineSyncService.getQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        try {
          await offlineSyncService.processQueue();
          setPendingSyncCount(0);
        } catch (e) {
          console.error('Sync flush error:', e);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check for pending offline mutations
    const interval = setInterval(() => {
      setPendingSyncCount(offlineSyncService.getQueue().length);
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isSyncing, pendingSyncCount };
};