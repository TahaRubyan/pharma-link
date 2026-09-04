import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  TrendingUp, 
  FileText,
  MapPin,
  AlertTriangle,
  Settings,
  CreditCard,
  ShieldCheck,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Power
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RETAIL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAdmin: false },
  { id: 'pos', label: 'Retail POS Billing', icon: ShoppingCart, hasBadge: 'Loose & Rx', requiresAdmin: false },
  { id: 'inventory', label: 'Stock & Loose Units', icon: Package, hasBadge: 'FEFO', requiresAdmin: false },
  { id: 'customer-debt', label: 'Customer Debt (Khata)', icon: CreditCard, hasBadge: 'Udhar', requiresAdmin: false },
  { id: 'patients', label: 'Patients & Rx Logs', icon: HeartPulse, requiresAdmin: false },
  { id: 'controlled', label: 'Narcotics Register', icon: ShieldCheck, hasBadge: 'Form 6/7', requiresAdmin: true },
  { id: 'analytics', label: 'Sales & Movement Analytics', icon: FileText, requiresAdmin: true },
  { id: 'expiry', label: 'Expiry Radar', icon: AlertTriangle, hasBadge: '<6m', requiresAdmin: false },
  { id: 'suppliers', label: 'Suppliers & Inward POs', icon: Truck, requiresAdmin: true },
  { id: 'settings', label: 'Settings & Printers', icon: Settings, requiresAdmin: true },
];

export const WHOLESALE_NAV_ITEMS = [
  { id: 'pos', label: 'Wholesale POS', icon: ShoppingCart, requiresAdmin: false },
  { id: 'inventory', label: 'Stock & Regional Audit', icon: Package, hasBadge: 'FEFO', requiresAdmin: false },
  { id: 'customer-debt', label: 'Customer Receivables & Khata', icon: CreditCard, requiresAdmin: true },
  { id: 'expiry', label: 'Expiry Radar & Loss', icon: AlertTriangle, hasBadge: '<6m RTV', requiresAdmin: false },
  { id: 'region-ledger', label: 'Territory Ledger', icon: MapPin, requiresAdmin: true },
  { id: 'customer-ledger', label: 'Customer Receivables', icon: Users, requiresAdmin: true },
  { id: 'suppliers', label: 'Suppliers & RTV', icon: Truck, requiresAdmin: true },
  { id: 'fbr', label: 'FBR Tax Audit (Annex-C)', icon: TrendingUp, requiresAdmin: true },
  { id: 'analytics', label: 'Sales & Movement Analytics', icon: FileText, requiresAdmin: true },
  { id: 'settings', label: 'Store Profile & Signatures', icon: Settings, requiresAdmin: true },
];

export const Sidebar = ({ currentScreen, onNavigate, storeMode, onSwitchMode }) => {
  const { user, isCashier, currentShop, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('pharmalink_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('pharmalink_sidebar_collapsed', String(next));
      return next;
    });
  };

  const activeNavItems = storeMode === 'RETAIL' ? RETAIL_NAV_ITEMS : WHOLESALE_NAV_ITEMS;

  const visibleNavItems = activeNavItems.filter((item) => {
    if (isCashier && item.requiresAdmin) {
      return false;
    }
    return true;
  });

  return (
    <aside style={{
      width: isCollapsed ? '72px' : '240px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      fontFamily: 'var(--font-sans)',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 20
    }}>
      {/* Header & Toggle */}
      <div style={{
        padding: isCollapsed ? '1rem 0.5rem 0.75rem' : '1.25rem 1rem 0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid #f1f5f9',
        minHeight: '68px'
      }}>
        {!isCollapsed ? (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              {storeMode === 'RETAIL' ? 'Pharmacy Retail POS' : 'Wholesale ERP'}
            </h1>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentShop ? currentShop.shopName : 'Idrees Medical Store'}
            </p>
          </div>
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '14px' }}>
            {storeMode === 'RETAIL' ? 'IMS' : 'IPD'}
          </div>
        )}

        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '0.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.color = '#0284c7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Mode Tag */}
      {!isCollapsed && (
        <div style={{ padding: '0.65rem 1rem 0.35rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: storeMode === 'RETAIL' ? '#ecfdf5' : '#eff6ff',
            border: `1px solid ${storeMode === 'RETAIL' ? '#a7f3d0' : '#bfdbfe'}`,
            padding: '0.3rem 0.65rem',
            borderRadius: '8px',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '9.5px', color: storeMode === 'RETAIL' ? '#047857' : '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ● {storeMode === 'RETAIL' ? 'RETAIL COUNTER MODE' : 'WHOLESALE B2B'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: isCollapsed ? '0.5rem 0.35rem' : '0.35rem 0.65rem', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: 0, margin: 0 }}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    borderLeft: isActive && !isCollapsed ? '3px solid #0284c7' : 'none',
                    backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                    color: isActive ? '#0284c7' : '#475569',
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.color = '#0284c7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={17} color={isActive ? '#0284c7' : '#64748b'} style={{ flexShrink: 0 }} />
                    {!isCollapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && item.hasBadge && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      backgroundColor: isActive ? '#bae6fd' : '#f1f5f9',
                      color: isActive ? '#0369a1' : '#64748b',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '6px',
                    }}>
                      {item.hasBadge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Profile & Prominent Logout */}
      <div style={{
        padding: isCollapsed ? '0.75rem 0.35rem' : '0.75rem 1rem',
        borderTop: '1px solid #f1f5f9',
        backgroundColor: '#fafafa'
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>{user ? user.name : 'Dr. Idrees'}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{user ? user.role : 'Pharmacist'}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'none',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '10.5px',
                fontWeight: 700
              }}
            >
              <Power size={13} color="#dc2626" /> Logout
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              padding: '0.45rem 0',
              cursor: 'pointer',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Power size={15} color="#dc2626" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
