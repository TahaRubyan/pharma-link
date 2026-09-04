import React from 'react';
import { ShoppingCart, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ModeSelectionPage = ({ onSelectMode }) => {
  const { user } = useAuth();

  const handleSelect = (mode) => {
    if (onSelectMode) {
      onSelectMode(mode); // 'RETAIL' | 'WHOLESALE'
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3E3D0', // Warm Canvas
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '850px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              backgroundColor: '#AACDDC',
              color: '#1E293B',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <ShieldCheck size={14} /> Welcome Back, {user.name} ({user.role})
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', marginTop: '0.75rem' }}>
            Select Active Operations Mode
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '500px', margin: '0.35rem auto 0' }}>
            Choose whether to launch the **Retail Customer Pharmacy** interface or the **Wholesale Bulk Distribution** interface.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* CARD 1: RETAIL STORE */}
          <div
            onClick={() => handleSelect('RETAIL')}
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #81A6C6',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#5F85A5';
              e.currentTarget.style.boxShadow = '0 12px 25px rgba(129, 166, 198, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#81A6C6';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                backgroundColor: '#81A6C6',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <ShoppingCart size={26} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', marginBottom: '0.5rem' }}>
              🛒 Retail Pharmacy Counter
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Designed for fast patient counter sales. Features per-tablet pricing, doctor prescription tracking, patient records, 80mm thermal receipts, and sales returns.
            </p>

            <button
              className="btn btn-primary"
              style={{
                backgroundColor: '#81A6C6',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                width: '100%',
                padding: '0.65rem',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              Launch Retail Mode <ArrowRight size={16} />
            </button>
          </div>

          {/* CARD 2: WHOLESALE STORE */}
          <div
            onClick={() => handleSelect('WHOLESALE')}
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #D2C4B4',
              borderRadius: '16px',
              padding: '2rem 1.5rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#81A6C6';
              e.currentTarget.style.boxShadow = '0 12px 25px rgba(210, 196, 180, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#D2C4B4';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                backgroundColor: '#AACDDC',
                color: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Package size={26} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', marginBottom: '0.5rem' }}>
              📦 Wholesale Medical Store
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Designed for bulk pharmacy distribution. Features full box pricing, contact person info, supplier inward POs, vendor returns, and A4 commercial tax invoices.
            </p>

            <button
              className="btn btn-outline"
              style={{
                backgroundColor: '#AACDDC',
                color: '#1E293B',
                fontWeight: 800,
                fontSize: '0.85rem',
                width: '100%',
                padding: '0.65rem',
                border: 'none',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              Launch Wholesale Mode <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectionPage;
