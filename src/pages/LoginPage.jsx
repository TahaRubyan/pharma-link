import React, { useState } from 'react';
import { 
  Pill, 
  ArrowRight, 
  AlertCircle, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  User,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hashPassword, verifyPassword } from '../utils/cryptoUtils';
import { dbSyncService } from '../services/dbSyncService';

export const LoginPage = ({ onLoginSuccess }) => {
  const { loginAsSuperAdmin, loginAsClientUser, staffAccounts = [], setStaffAccounts, tenantsList = [] } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal State with Dynamic Random Security Key
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [activeRandomKey, setActiveRandomKey] = useState('');
  const [forgotUser, setForgotUser] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // First-Time Login / Temp Password Change State
  const [isFirstLoginModalOpen, setIsFirstLoginModalOpen] = useState(false);
  const [pendingUserSession, setPendingUserSession] = useState(null);
  const [firstLoginNewPass, setFirstLoginNewPass] = useState('');
  const [firstLoginConfirmPass, setFirstLoginConfirmPass] = useState('');
  const [firstLoginError, setFirstLoginError] = useState('');
  const [firstLoginSuccess, setFirstLoginSuccess] = useState('');
  const [isSubmittingFirstLogin, setIsSubmittingFirstLogin] = useState(false);

  const generateNewSecurityKey = () => {
    // Generate a fresh 6-digit random number
    const key = String(Math.floor(100000 + Math.random() * 900000));
    setActiveRandomKey(key);
    return key;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    // 1. Master Super Admin Authentication
    const isMasterUser = cleanUser === 'masteradmin' || cleanUser === 'superadmin' || cleanUser === 'master' || cleanUser === 'admin';
    const masterSavedHash = localStorage.getItem('pharmalink_master_pass_hash');
    const isMasterMatch = masterSavedHash 
      ? await verifyPassword(cleanPass, masterSavedHash)
      : cleanPass === 'admin123';

    if (isMasterUser && isMasterMatch) {
      loginAsSuperAdmin();
      onLoginSuccess('SUPER_ADMIN', 'NONE', 'SUPER_ADMIN', 'SuperAdmin', 'master');
      return;
    }

    // 2. Testing Shop Admin Authentication (Hybrid Mode)
    if (cleanUser === 'testing.admin') {
      const testingSavedHash = localStorage.getItem('pharmalink_testing_admin_pass_hash');
      const isTestingMatch = testingSavedHash 
        ? await verifyPassword(cleanPass, testingSavedHash)
        : cleanPass === 'admin123';

      if (isTestingMatch) {
        loginAsClientUser('TEN-TESTING-SHOP', 'Admin', 'HYBRID');
        onLoginSuccess('CLIENT_USER', 'TEN-TESTING-SHOP', 'HYBRID', 'Admin', 'dashboard');
        return;
      }
    }

    // 3. Dynamic check against provisioned staff accounts with cryptographic hash support
    for (const s of (staffAccounts || [])) {
      const u = (s.username || '').toLowerCase().replace(/\s+/g, '');
      const em = (s.email || '').toLowerCase().replace(/\s+/g, '');
      if (u === cleanUser || em === cleanUser) {
        const storedCredential = s.password || s.pin || s.passcode;
        const passMatch = await verifyPassword(cleanPass, storedCredential);
        if (passMatch) {
          const staffMode = s.storeMode || s.mode || 'HYBRID';
          const staffRole = s.role || 'Cashier';
          const staffTenantId = s.tenantId || 'TEN-TESTING-SHOP';
          const targetScreen = staffRole === 'Cashier' ? 'pos' : 'dashboard';

          // First-time login: if account was created with temporary password, force reset
          if (s.mustChangePassword) {
            setPendingUserSession({
              staffRecord: s,
              staffTenantId,
              staffRole,
              staffMode,
              targetScreen
            });
            setIsFirstLoginModalOpen(true);
            return;
          }

          loginAsClientUser(staffTenantId, staffRole, staffMode);
          onLoginSuccess('CLIENT_USER', staffTenantId, staffMode, staffRole, targetScreen);
          return;
        }
      }
    }

    // 4. Dynamic check against onboarded pharmacy tenants (for instant admin login & mandatory first-time password setup)
    for (const t of (tenantsList || [])) {
      const tu = (t.adminUsername || '').toLowerCase().replace(/\s+/g, '');
      if (tu && tu === cleanUser) {
        const storedPass = t.tempPassword || t.password;
        const passMatch = storedPass && (cleanPass === storedPass || (await verifyPassword(cleanPass, storedPass)));
        if (passMatch) {
          const tenantMode = t.subscribedSystemScope === 'RETAIL_ONLY' ? 'RETAIL' : (t.subscribedSystemScope === 'WHOLESALE_ONLY' ? 'WHOLESALE' : 'HYBRID');
          const targetScreen = 'dashboard';
          if (t.isTempPassword || t.mustChangePassword) {
            setPendingUserSession({
              staffRecord: {
                id: `STAFF-ADMIN-${t.tenantId}`,
                tenantId: t.tenantId,
                name: t.ownerName || `${t.shopName} Admin`,
                username: t.adminUsername,
                role: 'Admin',
                status: 'Active',
                storeMode: tenantMode,
                mustChangePassword: true
              },
              staffTenantId: t.tenantId,
              staffRole: 'Admin',
              staffMode: tenantMode,
              targetScreen
            });
            setIsFirstLoginModalOpen(true);
            return;
          }
          loginAsClientUser(t.tenantId, 'Admin', tenantMode);
          onLoginSuccess('CLIENT_USER', t.tenantId, tenantMode, 'Admin', targetScreen);
          return;
        }
      }
    }

    setErrorMsg('Invalid username or password. Please check your credentials and try again.');
  };

  // Handler for mandatory first-time password reset
  const handleFirstLoginPasswordSubmit = async (e) => {
    e.preventDefault();
    setFirstLoginError('');
    setFirstLoginSuccess('');

    if (!firstLoginNewPass || firstLoginNewPass.length < 6) {
      setFirstLoginError('New password must be at least 6 characters long.');
      return;
    }
    if (firstLoginNewPass !== firstLoginConfirmPass) {
      setFirstLoginError('New password and confirm password do not match.');
      return;
    }
    if (!pendingUserSession) return;

    setIsSubmittingFirstLogin(true);
    try {
      const encryptedHash = await hashPassword(firstLoginNewPass);
      const { staffRecord, staffTenantId, staffRole, staffMode, targetScreen } = pendingUserSession;

      const updatedRecord = {
        ...staffRecord,
        password: encryptedHash,
        mustChangePassword: false
      };

      // Save to Supabase
      await dbSyncService.saveStaffAccount({
        id: updatedRecord.id,
        tenantId: staffTenantId,
        name: updatedRecord.name,
        username: updatedRecord.username,
        password: encryptedHash,
        role: staffRole,
        status: updatedRecord.status || 'Active',
        storeMode: staffMode,
        mustChangePassword: false
      });

      // Update local storage and state
      const updatedList = (staffAccounts || []).map((s) =>
        s.id === updatedRecord.id ? updatedRecord : s
      );
      if (typeof setStaffAccounts === 'function') {
        setStaffAccounts(updatedList);
      }
      localStorage.setItem('pharmalink_staff_accounts', JSON.stringify(updatedList));

      setFirstLoginSuccess('Permanent password saved! Logging you in...');

      setTimeout(() => {
        setIsFirstLoginModalOpen(false);
        loginAsClientUser(staffTenantId, staffRole, staffMode);
        onLoginSuccess('CLIENT_USER', staffTenantId, staffMode, staffRole, targetScreen);
      }, 900);
    } catch (err) {
      setFirstLoginError('Failed to save permanent password: ' + err.message);
    } finally {
      setIsSubmittingFirstLogin(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanU = forgotUser.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = recoveryPin.trim();

    if (!cleanU) {
      setForgotError('Please enter your username or email.');
      return;
    }
    // Dynamic random key validation (also accepts emergency fallback 2026/PHARMA2026)
    if (cleanPin !== activeRandomKey && cleanPin !== '2026' && cleanPin !== 'PHARMA2026') {
      setForgotError(`Invalid Verification Key. Please enter the generated code: ${activeRandomKey}`);
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('New password and confirm password do not match.');
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const encryptedHash = await hashPassword(newPassword);
      const isMasterReset = cleanU === 'masteradmin' || cleanU === 'superadmin' || cleanU === 'master' || cleanU === 'admin';

      if (isMasterReset) {
        localStorage.setItem('pharmalink_master_pass_hash', encryptedHash);
        setForgotSuccess('Master Super Admin password updated successfully! Please sign in with username "masteradmin".');
        setUsername('masteradmin');
        setPassword(newPassword);
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setForgotSuccess('');
          setForgotError('');
          setRecoveryPin('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1200);
        return;
      }

      if (cleanU === 'testing.admin') {
        localStorage.setItem('pharmalink_testing_admin_pass_hash', encryptedHash);
        setForgotSuccess('Testing Shop Admin password updated successfully! Please sign in with username "testing.admin".');
        setUsername('testing.admin');
        setPassword(newPassword);
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setForgotSuccess('');
          setForgotError('');
          setRecoveryPin('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1200);
        return;
      }

      // Find in provisioned staffAccounts
      let found = false;
      const updatedList = (staffAccounts || []).map((s) => {
        const su = (s.username || '').toLowerCase().replace(/\s+/g, '');
        const se = (s.email || '').toLowerCase().replace(/\s+/g, '');
        if (su === cleanU || se === cleanU) {
          found = true;
          const updatedStaff = { ...s, password: encryptedHash, pin: encryptedHash, mustChangePassword: false };
          // Persist to Supabase
          dbSyncService.saveStaffAccount({
            id: updatedStaff.id,
            tenantId: updatedStaff.tenantId || 'TEN-TESTING-SHOP',
            name: updatedStaff.name,
            username: updatedStaff.username,
            password: encryptedHash,
            role: updatedStaff.role,
            status: updatedStaff.status,
            storeMode: updatedStaff.storeMode || 'WHOLESALE',
            mustChangePassword: false,
          }).catch(console.warn);
          return updatedStaff;
        }
        return s;
      });

      if (!found) {
        setForgotError(`Staff user account "${cleanU}" not found. Store user accounts must be provisioned by Master Admin.`);
        return;
      }

      if (typeof setStaffAccounts === 'function') {
        setStaffAccounts(updatedList);
      }
      localStorage.setItem('pharmalink_staff_accounts', JSON.stringify(updatedList));

      setForgotSuccess('Password reset successfully! Encrypted and saved.');
      setUsername(cleanU);
      setPassword(newPassword);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotSuccess('');
        setForgotError('');
        setRecoveryPin('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1200);
    } catch (err) {
      setForgotError('Failed to encrypt and update password. Please try again.');
    } finally {
      setIsSubmittingForgot(false);
    }
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)'
          }}>
            <Pill size={28} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '0.35rem',
            letterSpacing: '-0.02em'
          }}>
            PharmaLink ERP & POS
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            margin: 0
          }}>
            Multi-Tenant Medical Store & Wholesale Management
          </p>
        </div>

        {/* Error Notification */}
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
              Username or Staff ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.95rem 0.75rem 2.4rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
                required
                autoFocus
              />
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="subtext" style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>
                Encrypted Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotError('');
                  setForgotSuccess('');
                  generateNewSecurityKey();
                  setIsForgotModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.6rem 0.75rem 2.4rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
                required
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#16a34a" /> SHA-256 Encrypted & Protected
        </div>
      </div>

      {/* FORGOT PASSWORD & SET NEW PASSWORD MODAL */}
      {isForgotModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            padding: '2rem',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsForgotModalOpen(false)}
              style={{
                position: 'absolute',
                right: '1.25rem',
                top: '1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <KeyRound size={20} color="#0284c7" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Reset & Set New Password
                </h3>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                  Enter your username and security recovery PIN
                </p>
              </div>
            </div>

            {forgotError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                fontSize: '11.5px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <AlertCircle size={14} /> {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                fontSize: '11.5px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <CheckCircle2 size={14} /> {forgotSuccess}
              </div>
            )}

            {/* DYNAMIC RANDOM VERIFICATION KEY CARD */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.15rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>
                  🔑 Generated Security Verification Key
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#15803d', letterSpacing: '0.12em', margin: '0.15rem 0' }}>
                  {activeRandomKey}
                </div>
                <div style={{ fontSize: '10px', color: '#4b5563' }}>
                  Enter this random verification key below to authorize your password reset
                </div>
              </div>

              <button
                type="button"
                onClick={generateNewSecurityKey}
                className="btn btn-outline"
                style={{
                  fontSize: '11px',
                  padding: '0.35rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#ffffff',
                  borderColor: '#86efac',
                  color: '#166534'
                }}
                title="Generate another random key"
              >
                <RefreshCw size={12} /> New Key
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Account Username or Email *
                </label>
                <input
                  type="text"
                  placeholder="e.g. wholesale.admin"
                  value={forgotUser}
                  onChange={(e) => setForgotUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                    Enter Security Verification Key *
                  </label>
                  <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 700 }}>Code: {activeRandomKey}</span>
                </div>
                <input
                  type="text"
                  placeholder={`Enter 6-digit key: ${activeRandomKey}`}
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  New Encrypted Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <KeyRound size={14} /> {isSubmittingForgot ? 'Encrypting...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIRST-TIME LOGIN: MANDATORY TEMPORARY PASSWORD CHANGE MODAL */}
      {isFirstLoginModalOpen && pendingUserSession && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', border: '1px solid #cbd5e1' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <KeyRound size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Set Your Permanent Password
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.35rem' }}>
                Welcome <strong>{pendingUserSession.staffRecord?.name || pendingUserSession.staffRecord?.username}</strong>! Your account was initialized with a temporary password by the Administrator. Please set your permanent password to continue.
              </p>
            </div>

            {firstLoginError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '11.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={14} /> {firstLoginError}
              </div>
            )}

            {firstLoginSuccess && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '0.6rem 0.8rem', borderRadius: '10px', fontSize: '11.5px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} /> {firstLoginSuccess}
              </div>
            )}

            <form onSubmit={handleFirstLoginPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  New Permanent Password *
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={firstLoginNewPass}
                  onChange={(e) => setFirstLoginNewPass(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Confirm Permanent Password *
                </label>
                <input
                  type="password"
                  placeholder="Re-enter permanent password"
                  value={firstLoginConfirmPass}
                  onChange={(e) => setFirstLoginConfirmPass(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFirstLogin}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.5rem'
                }}
              >
                <KeyRound size={15} /> {isSubmittingFirstLogin ? 'Encrypting & Saving...' : 'Save Password & Enter System'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
