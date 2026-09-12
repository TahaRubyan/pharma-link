import React from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  PackageX, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  FilePlus, 
  ExternalLink 
} from 'lucide-react';

/**
 * Pre-defined and designed alert pop-up modal component
 * Replaces raw browser alert() with polished, theme-compliant dialogs.
 * 
 * Supports alert types:
 * - 'QUARANTINED': Item is locked under DRAP / RTV Quarantine. Cannot add to cart or make PO on it.
 * - 'OUT_OF_STOCK': Item has 0 stock available. Cannot add to cart, but can make a PO to restock.
 * - 'SHORT_EXPIRY': Wholesale rule: item expires within 6 months.
 * - 'WARNING': Generic warning message.
 * - 'INFO': General information notification.
 */
export const AppAlertModal = ({ 
  isOpen, 
  type = 'QUARANTINED', 
  title, 
  message, 
  itemDetails = null, 
  onClose, 
  onAction = null, 
  actionLabel = null 
}) => {
  if (!isOpen) return null;

  // Type configurations
  const config = {
    QUARANTINED: {
      headerBg: '#fef2f2',
      headerBorder: '#fee2e2',
      accentColor: '#dc2626',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      badgeText: 'REGULATORY LOCK (QUARANTINE)',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c',
      Icon: ShieldAlert,
      defaultTitle: 'Item Quarantined — Regulatory Restriction',
      defaultMessage: 'You cannot add this item to cart or make a PO on it. This pharmaceutical product is currently placed under Quarantine (DRAP / Vendor RTV) and is legally restricted from counter dispensing and purchasing until cleared.',
    },
    OUT_OF_STOCK: {
      headerBg: '#fffbeb',
      headerBorder: '#fef3c7',
      accentColor: '#d97706',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      badgeText: 'OUT OF STOCK (0 AVAILABLE)',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      Icon: PackageX,
      defaultTitle: 'Stock Depleted (Zero Inventory)',
      defaultMessage: 'You cannot add this item to the POS cart because available counter stock is 0 boxes. You can generate an Inward Purchase Order (PO) to replenish stock from authorized distributors.',
    },
    SHORT_EXPIRY: {
      headerBg: '#fff7ed',
      headerBorder: '#ffedd5',
      accentColor: '#ea580c',
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      badgeText: 'DRAP WHOLESALE RULE (≤ 6M)',
      badgeBg: '#ffedd5',
      badgeColor: '#9a3412',
      Icon: Clock,
      defaultTitle: 'Short Expiry Compliance Violation',
      defaultMessage: 'Under Wholesale Drug Regulations (DRAP Form 20/21), medicines expiring within 6 months cannot be sold from wholesale stock. This lot is quarantined and routed to Vendor Returns (RTV).',
    },
    WARNING: {
      headerBg: '#fffbeb',
      headerBorder: '#fef3c7',
      accentColor: '#f59e0b',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      badgeText: 'ACTION REQUIRED',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      Icon: AlertTriangle,
      defaultTitle: 'Compliance Alert',
      defaultMessage: 'Please review requirements before proceeding.',
    },
    INFO: {
      headerBg: '#f0f9ff',
      headerBorder: '#e0f2fe',
      accentColor: '#0284c7',
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      badgeText: 'NOTIFICATION',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      Icon: CheckCircle,
      defaultTitle: 'System Notification',
      defaultMessage: '',
    },
  }[type] || config.QUARANTINED;

  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;
  const Icon = config.Icon;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        fontFamily: 'var(--font-sans)',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: `1px solid ${config.headerBorder}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Header Banner */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: config.headerBg,
            borderBottom: `1px solid ${config.headerBorder}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            position: 'relative',
          }}
        >
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: config.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={24} color={config.iconColor} />
          </div>

          <div style={{ flex: 1 }}>
            <span 
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                backgroundColor: config.badgeBg,
                color: config.badgeColor,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                display: 'inline-block',
                marginBottom: '0.35rem',
              }}
            >
              {config.badgeText}
            </span>
            <h3 
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {displayTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '8px',
              color: '#64748b',
              backgroundColor: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              top: '1rem',
              right: '1rem',
            }}
            title="Close Alert"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p 
            style={{
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {displayMessage}
          </p>

          {/* Optional Item Details Card */}
          {itemDetails && (
            <div 
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.65rem',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Medicine / Brand:</span>
                <strong style={{ color: '#0f172a' }}>{itemDetails.name || itemDetails.brandName || itemDetails.tradeName || 'N/A'}</strong>
              </div>

              {itemDetails.itemCode && (
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Item Code:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{itemDetails.itemCode}</strong>
                </div>
              )}

              {itemDetails.batchNo && (
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Batch Number:</span>
                  <strong style={{ color: '#0f172a' }}>{itemDetails.batchNo || itemDetails.batchNumber}</strong>
                </div>
              )}

              {itemDetails.expiryDate && (
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Expiry Date:</span>
                  <strong style={{ color: '#0f172a' }}>{itemDetails.expiryDate}</strong>
                </div>
              )}

              {itemDetails.status && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>System Status:</span>
                  <span 
                    style={{
                      display: 'inline-block',
                      marginTop: '0.15rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: type === 'QUARANTINED' ? '#fee2e2' : '#f1f5f9',
                      color: type === 'QUARANTINED' ? '#dc2626' : '#475569',
                    }}
                  >
                    {itemDetails.status}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.65rem',
          }}
        >
          {onAction && actionLabel && (
            <button
              onClick={() => {
                onAction();
                onClose();
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: config.accentColor,
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              {actionLabel}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
            }}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppAlertModal;
