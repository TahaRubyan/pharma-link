import React, { useState } from 'react';
import { Pill, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ onLoginSuccess }) => {
  const { loginAsSuperAdmin, loginAsClientUser, staffAccounts = [] } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

    setErrorMsg('Invalid username or password. Please verify your credentials and try again.');
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
        maxWidth: '420px',
        padding: '2.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.85rem',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.28)'
          }}>
            <Pill size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            PharmaLink ERP & POS
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
            Pharmacy Management System
          </p>
        </div>

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
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155', fontSize: '12px' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.95rem',
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
                padding: '0.75rem 0.95rem',
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
              padding: '0.85rem',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              marginTop: '0.4rem',
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
      </div>
    </div>
  );
};

export default LoginPage;
