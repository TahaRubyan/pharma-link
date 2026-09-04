import React, { useState, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { SupplierProvider } from './context/SupplierContext';
import { PatientProvider } from './context/PatientContext';
import { SalesProvider } from './context/SalesContext';
import { CartProvider } from './context/CartContext';
import { CustomerDebtProvider } from './context/CustomerDebtContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import ModeSelectionPage from './pages/ModeSelectionPage';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import ExpiryRadarPage from './pages/ExpiryRadarPage';
import ControlledSubstancesPage from './pages/ControlledSubstancesPage';
import SuppliersPage from './pages/SuppliersPage';
import PatientsPage from './pages/PatientsPage';
import FBRTaxPage from './pages/FBRTaxPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import RegionLedgerPage from './pages/RegionLedgerPage';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import CustomerDebtPage from './pages/CustomerDebtPage';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Clean-slate deployment migration: Purge old test cache so user starts completely clean
if (typeof window !== 'undefined' && !localStorage.getItem('pharmalink_clean_slate_v5')) {
  [
    'pharmalink_pk_medicines',
    'pharmalink_pk_batches',
    'pharmalink_pk_invoices',
    'pharmalink_debt_customers',
    'pharmalink_pk_patients',
    'pharmalink_pk_suppliers',
    'pharmalink_pk_purchase_orders',
    'pharmalink_pk_vendor_returns',
    'pharmalink_pk_audit_logs',
    'pharmalink_po_tax_logs',
    'pharmalink_regions',
    'pharmalink_pk_returns',
  ].forEach((key) => localStorage.removeItem(key));
  localStorage.setItem('pharmalink_clean_slate_v5', 'true');
}

// Error Boundary Fallback
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f5f7', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '480px', width: '100%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>System View Recovery Notice</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '0.4rem', marginBottom: '1.5rem' }}>
              An unexpected layout or state conflict occurred ({this.state.error?.message || 'State Mismatch'}). Resetting local cache will restore system stability immediately.
            </p>
            <button
              onClick={this.handleReset}
              style={{ padding: '0.65rem 1.25rem', backgroundColor: '#111827', color: '#ffffff', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Clear Cache & Restore View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const { isSuperAdmin, tenantsList, isAuthenticated, setIsAuthenticated, currentShop } = useAuth();
  const [isModeSelected, setIsModeSelected] = useState(true);
  const [storeMode, setStoreMode] = useState(() => currentShop?.mode || 'RETAIL'); // 'RETAIL' | 'WHOLESALE'
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const handleLoginSuccess = (accountType, tenantId, mode) => {
    setIsAuthenticated(true);

    if (accountType === 'SUPER_ADMIN') {
      // Super Admin Dashboard
    } else if (mode === 'RETAIL') {
      setStoreMode('RETAIL');
      setCurrentScreen('dashboard');
    } else {
      setStoreMode('WHOLESALE');
      setCurrentScreen('pos');
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (isSuperAdmin) {
    return <MasterAdminDashboard />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentScreen} />;
      case 'pos':
        return <POSPage storeMode={storeMode} />;
      case 'inventory':
        return <InventoryPage />;
      case 'customer-debt':
        return <CustomerDebtPage />;
      case 'expiry':
        return <ExpiryRadarPage />;
      case 'controlled':
        return <ControlledSubstancesPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'region-ledger':
        return <RegionLedgerPage />;
      case 'customer-ledger':
        return <CustomerLedgerPage />;
      case 'patients':
        return <PatientsPage onNavigate={setCurrentScreen} />;
      case 'fbr':
        return <FBRTaxPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage storeMode={storeMode} />;
      default:
        return <DashboardPage onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <Layout
      currentScreen={currentScreen}
      setCurrentScreen={setCurrentScreen}
      storeMode={storeMode}
      onSwitchMode={(newMode) => {
        if (newMode) setStoreMode(newMode);
        else setIsModeSelected(false);
      }}
    >
      {renderScreen()}
    </Layout>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <InventoryProvider>
          <SupplierProvider>
            <PatientProvider>
              <SalesProvider>
                <CartProvider>
                  <CustomerDebtProvider>
                    <AppContent />
                  </CustomerDebtProvider>
                </CartProvider>
              </SalesProvider>
            </PatientProvider>
          </SupplierProvider>
        </InventoryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
