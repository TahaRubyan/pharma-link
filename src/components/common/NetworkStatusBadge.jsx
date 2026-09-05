import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkStatusBadge = () => {
  const { isOnline, isSyncing, pendingSyncCount } = useNetworkStatus();

  if (isSyncing) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe'
      }}>
        <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        Syncing to Cloud...
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#fffbeb',
        color: '#b45309',
        border: '1px solid #fde68a'
      }} title="Internet disconnected. Local counter continues to work offline; sales will sync once connection returns.">
        <WifiOff size={12} />
        Offline Mode {pendingSyncCount > 0 ? `(${pendingSyncCount} queued)` : ''}
      </div>
    );
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.25rem 0.65rem',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      border: '1px solid #bbf7d0'
    }} title="Connected to Cloud. Data synchronized in real-time.">
      <Wifi size={12} />
      Online
    </div>
  );
};

export default NetworkStatusBadge;