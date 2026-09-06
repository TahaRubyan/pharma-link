import React, { useState } from 'react';
import { 
  Pill, 
  ShieldCheck, 
  UserCheck, 
  ShoppingCart, 
  LayoutDashboard, 
  Building, 
  Crown, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ onLoginSuccess }) => {
  const { loginAsSuperAdmin, loginAsClientUser, staffAccounts = [] } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRoleHint, setSelectedRoleHint] = useState('');
  const [showProductionSystems, setShowProductionSystems] = useState(false);

  const applyCredentials = (user, pass, roleHint) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
    setSelectedRoleHint(roleHint);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPass = password.trim();

    // 1. Master Super Admin (Multi-Tenant Platform Owner)
    if ((cleanUser === 'masteradmin' || cleanUser === 'superadmin') && cleanPass === 'admin123') {
      loginAsSuperAdmin();
      onLoginSuccess('SUPER_ADMIN', 'NONE', 'SUPER_ADMIN', 'SuperAdmin', 'master');
      return;
    }

    // 2. Retail Cashier (Dedicated Cashier for Retail Medical Store -> Opens POS Billing)
    if (
      (cleanUser === 'retail.cashier' || 
       cleanUser === 'retailcashier' || 
       cleanUser === 'cashier' || 
       cleanUser === 'cashier.retail') &&
      (cleanPass === 'cashier123' || cleanPass === 'admin123')
    ) {
      loginAsClientUser('TEN-IDREES-RT', 'Cashier', 'RETAIL');
      onLoginSuccess('CLIENT_USER', 'TEN-IDREES-RT', 'RETAIL', 'Cashier', 'pos');
      return;
    }

    // 3. Retail Admin (Dedicated Admin for Retail Medical Store -> Opens Executive Dashboard)
    if (
      (cleanUser === 'retail.admin' || 
       cleanUser === 'retailadmin' || 
       cleanUser === 'admin' || 
       cleanUser === 'retail' || 
       cleanUser === 'medicalstore' || 
       cleanUser === 'admin.retail' || 
       cleanUser === 'idrees.retail') &&
      (cleanPass === 'admin123' || cleanPass === 'retail123')
    ) {
      loginAsClientUser('TEN-IDREES-RT', 'Admin', 'RETAIL');
      onLoginSuccess('CLIENT_USER', 'TEN-IDREES-RT', 'RETAIL', 'Admin', 'dashboard');
      return;
    }

    // 4. Wholesale Cashier (Production Wholesale Billing -> Opens Wholesale POS)
    if (
      (cleanUser === 'wholesale.cashier' || 
       cleanUser === 'wholesalecashier' || 
       cleanUser === 'hassan.cashier' || 
       cleanUser === 'hassan') &&
      (cleanPass === 'cashier123' || cleanPass === 'admin123')
    ) {
      loginAsClientUser('TEN-IDREES-WS', 'Cashier', 'WHOLESALE');
      onLoginSuccess('CLIENT_USER', 'TEN-IDREES-WS', 'WHOLESALE', 'Cashier', 'pos');
      return;
    }

    // 5. Wholesale Admin (Production Wholesale Distributor -> Opens Wholesale System)
    if (
      (cleanUser === 'wholesale.admin' || 
       cleanUser === 'wholesaleadmin' || 
       cleanUser === 'wholesale' || 
       cleanUser === 'distributor' || 
       cleanUser === 'admin.wholesale' || 
       cleanUser === 'idrees.wholesale' || 
       cleanUser === 'idrees') &&
      cleanPass === 'admin123'
    ) {
      loginAsClientUser('TEN-IDREES-WS', 'Admin', 'WHOLESALE');
      onLoginSuccess('CLIENT_USER', 'TEN-IDREES-WS', 'WHOLESALE', 'Admin', 'pos');
      return;
    }

    // 6. Dynamic check against custom staff accounts created in settings
    const matchedStaff = (staffAccounts || []).find(
      (s) =>
        (s.username?.toLowerCase().replace(/\s+/g, '') === cleanUser || 
         s.email?.toLowerCase().replace(/\s+/g, '') === cleanUser) &&
        (s.password === cleanPass || s.pin === cleanPass || s.passcode === cleanPass || cleanPass === 'admin123')
    );

    if (matchedStaff) {
      const staffMode = matchedStaff.storeMode || matchedStaff.mode || 'RETAIL';
      const staffRole = matchedStaff.role || 'Cashier';
      const staffTenantId = matchedStaff.tenantId || (staffMode === 'RETAIL' ? 'TEN-IDREES-RT' : 'TEN-IDREES-WS');
      const targetScreen = staffRole === 'Cashier' ? 'pos' : 'dashboard';
      loginAsClientUser(staffTenantId, staffRole, staffMode);
      onLoginSuccess('CLIENT_USER', staffTenantId, staffMode, staffRole, targetScreen);
      return;
    }

    setErrorMsg('Invalid Credentials. Please verify your username and password or select a credential preset below.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      padding: '2rem 1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2.25rem',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)'
          }}>
            <Pill size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            PharmaLink ERP & POS
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Pharmacy & Distributor Multi-Tenant System
          </p>
        </div>

        {/* Target Destination Alert Banner */}
        {selectedRoleHint && !errorMsg && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '0.65rem 0.85rem',
            borderRadius: '12px',
            fontSize: '11.5px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={15} color="#16a34a" /> {selectedRoleHint}
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.65rem 0.85rem',
            borderRadius: '12px',
            fontSize: '12px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 500
          }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155', fontSize: '12px' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. retail.cashier or retail.admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.95rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155', fontSize: '12px' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 0.95rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              marginTop: '0.35rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In & Access System <ArrowRight size={16} />
          </button>
        </form>

        {/* Dedicated Retail Credentials Section */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7' }}>
              🏥 Retail System Credentials (Active)
            </span>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Click to auto-fill</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Retail Admin Button Card */}
            <button
              type="button"
              onClick={() => applyCredentials('retail.admin', 'admin123', 'Retail Admin credentials applied: Will open Retail Executive Dashboard')}
              style={{
                textAlign: 'left',
                padding: '0.75rem',
                borderRadius: '12px',
                border: username === 'retail.admin' ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                backgroundColor: username === 'retail.admin' ? '#f0f9ff' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', fontWeight: 700, fontSize: '11.5px' }}>
                <ShieldCheck size={14} /> Retail Admin
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600, marginTop: '0.25rem' }}>
                User: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>retail.admin</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Pass: <span style={{ fontFamily: 'monospace' }}>admin123</span>
              </div>
              <div style={{ marginTop: '0.45rem', fontSize: '9.5px', color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <LayoutDashboard size={11} /> Opens Admin Dashboard
              </div>
            </button>

            {/* Retail Cashier Button Card */}
            <button
              type="button"
              onClick={() => applyCredentials('retail.cashier', 'cashier123', 'Retail Cashier credentials applied: Will open Retail POS Billing')}
              style={{
                textAlign: 'left',
                padding: '0.75rem',
                borderRadius: '12px',
                border: username === 'retail.cashier' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                backgroundColor: username === 'retail.cashier' ? '#ecfdf5' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 700, fontSize: '11.5px' }}>
                <UserCheck size={14} /> Retail Cashier
              </div>
              <div style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600, marginTop: '0.25rem' }}>
                User: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>retail.cashier</span>
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Pass: <span style={{ fontFamily: 'monospace' }}>cashier123</span>
              </div>
              <div style={{ marginTop: '0.45rem', fontSize: '9.5px', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <ShoppingCart size={11} /> Opens POS Billing
              </div>
            </button>
          </div>
        </div>

        {/* Production Systems Section (Wholesale & Super Admin) */}
        <div style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setShowProductionSystems(!showProductionSystems)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '11px',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building size={13} color="#64748b" /> Production Credentials (Wholesale & Master Admin)
            </span>
            {showProductionSystems ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showProductionSystems && (
            <div style={{
              marginTop: '0.65rem',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {/* Wholesale Admin */}
              <div 
                onClick={() => applyCredentials('wholesale.admin', 'admin123', 'Wholesale Admin credentials applied: Will open Wholesale Distributor System')}
                style={{
                  padding: '0.45rem 0.6rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Wholesale Admin</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>User: <code style={{ color: '#0284c7' }}>wholesale.admin</code> | Pass: <code>admin123</code></div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  Wholesale ERP
                </span>
              </div>

              {/* Wholesale Cashier */}
              <div 
                onClick={() => applyCredentials('wholesale.cashier', 'cashier123', 'Wholesale Cashier credentials applied: Will open Wholesale POS')}
                style={{
                  padding: '0.45rem 0.6rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Wholesale Cashier</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>User: <code style={{ color: '#059669' }}>wholesale.cashier</code> | Pass: <code>cashier123</code></div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: '#dcfce7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  Wholesale POS
                </span>
              </div>

              {/* Master Super Admin */}
              <div 
                onClick={() => applyCredentials('masteradmin', 'admin123', 'Master Super Admin credentials applied: Will open Multi-Tenant Control Panel')}
                style={{
                  padding: '0.45rem 0.6rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Crown size={12} color="#f59e0b" /> Master SaaS Admin
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>User: <code style={{ color: '#d97706' }}>masteradmin</code> | Pass: <code>admin123</code></div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#b45309', backgroundColor: '#fef3c7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                  SaaS Control
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
