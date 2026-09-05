import React from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Store, 
  RefreshCw, 
  Eye, 
  Lock, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NetworkStatusBadge } from '../common/NetworkStatusBadge';

const SCREEN_TITLES = {
  dashboard: 'Executive Dashboard',
  pos: 'POS & Cart Checkout',
  inventory: 'Inventory Catalog',
  expiry: 'Expiry Radar & Quality Audit',
  controlled: 'Controlled Substances Registers',
  suppliers: 'Supplier Directory & Vendor RTV',
  patients: 'Patient Management',
  fbr: 'FBR Tax Compliance',
  analytics: 'Financial Analytics',
  settings: 'Settings & Role Access',
  'region-ledger': 'Territory Delivery Ledger',
  'customer-ledger': 'Customer Receivables Ledger'
};

export const Topbar = ({ currentScreen, onNavigate }) => {
  const { 
    user, 
    toggleRole, 
    isAdmin, 
    currentShop, 
    inspectingTenantId, 
    stopInspecting,
    logout
  } = useAuth();

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      zIndex: 10
    }}>
      {/* Master Admin Inspection Banner */}
      {inspectingTenantId && (
        <div style={{ backgroundColor: '#111827', color: '#ffffff', padding: '0.35rem 1.5rem', fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Eye size={14} color="#a7f3d0" />
            <span>MASTER SUPER ADMIN INSPECTION MODE — Read-only context for #{currentShop ? currentShop.shopId : inspectingTenantId}</span>
          </div>

          <button
            onClick={stopInspecting}
            style={{ backgroundColor: '#ffffff', color: '#111827', border: 'none', borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
          >
            Exit Inspection & Return to Master Dashboard
          </button>
        </div>
      )}

      {/* Main Header Bar (56px height) */}
      <div style={{
        height: '56px',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Active Page Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <h2 className="page-title" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            {SCREEN_TITLES[currentScreen] || 'Dashboard'}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '11px', color: '#6b7280', paddingLeft: '0.75rem', borderLeft: '1px solid #e5e7eb' }}>
            <Store size={13} color="#0284c7" />
            <span style={{ fontWeight: 700, color: '#0284c7' }}>{currentShop ? currentShop.shopName : 'Idrees Medical Store'}</span>
          </div>
        </div>

        {/* Right Controls: Prominent Logout Button & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NetworkStatusBadge />

          <button
            onClick={toggleRole}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.7rem',
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              backgroundColor: isAdmin ? '#ecfdf5' : '#f9fafb',
              color: isAdmin ? '#047857' : '#4b5563',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to toggle active user role (Admin ↔ Cashier)"
          >
            {isAdmin ? (
              <>
                <ShieldCheck size={14} color="#047857" />
                <span>Admin Role</span>
              </>
            ) : (
              <>
                <UserCheck size={14} color="#6b7280" />
                <span>Cashier Role</span>
              </>
            )}
            <RefreshCw size={10} style={{ marginLeft: '0.15rem', opacity: 0.6 }} />
          </button>

          {/* Prominent Logout Button */}
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #fca5a5',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.borderColor = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            title="Sign out of system and return to login screen"
          >
            <LogOut size={14} color="#b91c1c" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
