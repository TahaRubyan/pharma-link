import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { hashPassword } from '../../utils/cryptoUtils';

export const StaffCredentialModal = ({ isOpen, staff, onSave, onClose }) => {
  // Unconditional hook declarations at top level
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Cashier');
  const [status, setStatus] = useState('Active');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state whenever staff prop updates
  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setUsername(staff.username || staff.email || '');
      setPassword(staff.password || staff.pin || staff.passcode || 'cashier123');
      setRole(staff.role || 'Cashier');
      setStatus(staff.status || 'Active');
      setErrorMsg('');
      setSuccessMsg('');
      setShowPassword(false);
    }
  }, [staff]);

  // STRICT HOOK RULE: Early return placed right before JSX return
  if (!isOpen || !staff) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMsg('Username cannot be empty.');
      return;
    }
    if (cleanPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    try {
      const encryptedPassword = cleanPassword.startsWith('sha256$') 
        ? cleanPassword 
        : await hashPassword(cleanPassword);

      const updatedStaff = {
        ...staff,
        name: name.trim(),
        username: cleanUsername,
        password: encryptedPassword,
        pin: encryptedPassword,
        role,
        status
      };

      if (typeof onSave === 'function') {
        onSave(updatedStaff);
      }

      setSuccessMsg('Staff credentials encrypted & updated successfully!');
      setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 600);
    } catch (err) {
      setErrorMsg('Failed to encrypt credentials. Please try again.');
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
        backdropFilter: 'blur(4px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000, 
        fontFamily: 'var(--font-sans)',
        padding: '1rem' 
      }}
    >
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '520px', 
          padding: '1.75rem', 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)', 
          border: '1px solid #e2e8f0' 
        }}
      >
        {/* Header */}
        <div className="flex-between" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={18} color="#0284c7" />
            </div>
            <div>
              <h3 className="section-title" style={{ fontSize: '16px', margin: 0, color: '#0f172a' }}>
                Manage Staff Credentials & Access
              </h3>
              <p className="subtext" style={{ margin: 0, fontSize: '11px' }}>
                Employee ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{staff.id}</strong>
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11.5px', color: '#dc2626' }}>
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11.5px', color: '#16a34a' }}>
            <CheckCircle2 size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Full Name */}
          <div>
            <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
              Staff Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hassan Raza"
              required
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          </div>

          {/* Username */}
          <div>
            <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
              System Login Username *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. wholesale.cashier"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
                }}
              />
              <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '0.2rem' }}>
              This username is used at login. Characters will be converted to lowercase.
            </div>
          </div>

          {/* Reset Password / PIN */}
          <div>
            <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
              <label className="subtext" style={{ fontWeight: 700, color: '#334155' }}>
                Password / Security PIN *
              </label>
              <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 600 }}>
                Min 4 characters
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password or 4-digit PIN"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 2.4rem 0.55rem 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  fontFamily: showPassword ? 'var(--font-mono)' : 'inherit',
                  outline: 'none'
                }}
              />
              <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Role & Account Status in 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Cashier">Cashier (POS & Billing)</option>
                <option value="Admin">Admin (Full Access)</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Delivery Staff">Delivery Staff</option>
              </select>
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 700, display: 'block', marginBottom: '0.25rem', color: '#334155' }}>
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Active">Active (Allowed to Log in)</option>
                <option value="Suspended">Suspended (Locked Out)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '0.5rem 1rem', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '0.5rem 1.25rem', borderRadius: '8px', backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCircle2 size={14} /> Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffCredentialModal;
