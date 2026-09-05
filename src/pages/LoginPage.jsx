import React, { useState } from 'react';
import { Pill, ShieldCheck, UserCheck, Key, ArrowRight, AlertCircle } from 'lucide-react';
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

    if (cleanUser === 'masteradmin' && cleanPass === 'admin123') {
      loginAsSuperAdmin();
      onLoginSuccess('SUPER_ADMIN', 'NONE', 'SUPER_ADMIN');
    } else if (
      (cleanUser === 'idrees.retail' || cleanUser === 'retailadmin' || cleanUser === 'retail' || cleanUser === 'medicalstore') &&
      cleanPass === 'admin123'
    ) {
      loginAsClientUser('TEN-IDREES-RT', 'Admin', 'RETAIL'); // Clean-Slate Retail Sandbox Context
      onLoginSuccess('CLIENT_USER', 'TEN-IDREES-RT', 'RETAIL');
    } else if (
      (cleanUser === 'idrees.wholesale' || cleanUser === 'wholesaleadmin' || cleanUser === 'wholesale' || cleanUser === 'distributor' || cleanUser === 'idrees') &&
      cleanPass === 'admin123'
    ) {
      loginAsClientUser('TEN-IDREES-WS', 'Admin', 'WHOLESALE'); // Full Wholesale Production Context
      onLoginSuccess('CLIENT_USER', 'TEN-IDREES-WS', 'WHOLESALE');
    } else {
      // Dynamic check against staff accounts
      const matchedStaff = (staffAccounts || []).find(
        (s) => s.username?.toLowerCase().replace(/\s+/g, '') === cleanUser && s.password === cleanPass
      );

      if (matchedStaff) {
        const staffMode = matchedStaff.storeMode || matchedStaff.mode || 'WHOLESALE';
        const staffTenantId = matchedStaff.tenantId || (staffMode === 'RETAIL' ? 'TEN-IDREES-RT' : 'TEN-IDREES-WS');
        loginAsClientUser(staffTenantId, matchedStaff.role || 'Cashier', staffMode);
        onLoginSuccess('CLIENT_USER', staffTenantId, staffMode);
      } else {
        setErrorMsg('Invalid Credentials. Please verify your username and password.');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f4f5f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
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
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)'
          }}>
            <Pill size={28} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            PharmaLink ERP & POS
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.25rem' }}>
            Multi-Tenant Pharmacy Management System
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
            gap: '0.4rem'
          }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username or email"
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
            <label className="subtext" style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem', color: '#334155' }}>
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
              marginTop: '0.5rem',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
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
