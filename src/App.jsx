import React, { useState, useEffect, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { SupplierProvider } from './context/SupplierContext';
import { PatientProvider } from './context/PatientContext';
import { SalesProvider } from './context/SalesContext';
import { CartProvider } from './context/CartContext';
import { CustomerDebtProvider } from './context/CustomerDebtContext';
import { CustomerProvider } from './context/CustomerContext';
import { PWAProvider } from './context/PWAContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import ModeSelectionPage from './pages/ModeSelectionPage';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
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
import WholesaleDashboardPage from './pages/WholesaleDashboardPage';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Clean-slate deployment migration: Purge old test cache so user starts completely clean
if (typeof window !== 'undefined' && !localStorage.getItem('pharmalink_clean_slate_v8_isolation')) {
  [
    'pharmalink_medicines',
    'pharmalink_pk_medicines',
    'pharmalink_batches',
    'pharmalink_pk_batches',
    'pharmalink_invoices',
    'pharmalink_pk_invoices',
    'pharmalink_suppliers',
    'pharmalink_pk_suppliers',
    'pharmalink_purchase_orders',
    'pharmalink_pk_purchase_orders',
    'pharmalink_vendor_returns',
    'pharmalink_pk_vendor_returns',
    'pharmalink_pk_returns',
    'pharmalink_customers',
    'pharmalink_debt_customers',
    'pharmalink_patients',
    'pharmalink_pk_patients',
    'pharmalink_retail_medicines',
    'pharmalink_retail_batches',
    'pharmalink_retail_invoices',
    'pharmalink_retail_debt_customers',
    'pharmalink_retail_suppliers',
    'pharmalink_retail_purchase_orders',
    'pharmalink_retail_patients',
    'pharmalink_retail_vendor_returns',
    'pharmalink_cart',
    'pharmalink_hold_carts',
    'pharmalink_last_invoice',
    'pharmalink_last_sale',
  ].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  });

  // Purge any contaminated tenant-prefixed inventory keys from prior cache
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((k) => {
      if (
        k.startsWith('pharmalink_TEN-IDREES-PHARMA_wholesale_') ||
        k.startsWith('pharmalink_TEN-IDREES-PHARMA_retail_') ||
        k.startsWith('pharmalink_CP-')
      ) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {}

  localStorage.setItem('pharmalink_clean_slate_v8_isolation', 'true');
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
  const { isSuperAdmin, tenantsList, isAuthenticated, setIsAuthenticated, currentShop, isCashier, userAccountType } = useAuth();
  const [isModeSelected, setIsModeSelected] = useState(true);
  const [storeMode, setStoreMode] = useState(() => {
    try {
      const savedShop = localStorage.getItem('pharmalink_active_shop');
      if (savedShop) {
        const parsed = JSON.parse(savedShop);
        if (parsed.mode) return parsed.mode;
      }
    } catch (e) {}
    return currentShop?.mode || 'RETAIL';
  });

  const [currentScreen, setCurrentScreen] = useState(() => {
    const savedScreen = localStorage.getItem('pharmalink_current_screen');
    const savedRole = localStorage.getItem('pharmalink_user_role');
    if (savedScreen) return savedScreen;
    return savedRole === 'Cashier' ? 'pos' : 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('pharmalink_current_screen', currentScreen);
  }, [currentScreen]);

  // Synchronize storeMode when active shop profile changes
  useEffect(() => {
    if (currentShop?.mode) {
      if (currentShop.mode === 'RETAIL') {
        setStoreMode('RETAIL');
      } else if (currentShop.mode === 'WHOLESALE') {
        setStoreMode('WHOLESALE');
      } else if (currentShop.subscribedSystemScope === 'RETAIL_ONLY') {
        setStoreMode('RETAIL');
      } else if (currentShop.subscribedSystemScope === 'WHOLESALE_ONLY') {
        setStoreMode('WHOLESALE');
      }
    }
  }, [currentShop?.shopId, currentShop?.mode, currentShop?.subscribedSystemScope]);

  // Synchronize browser tab title dynamically with active store profile
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isSuperAdmin || userAccountType === 'SUPER_ADMIN') {
        document.title = 'PharmaLink Master Admin | SaaS Platform Owner';
      } else {
        const activeName = currentShop?.shopName || 'Testing Shop';
        document.title = `${activeName} | PharmaLink ERP & POS`;
      }
    }
  }, [currentShop?.shopName, isSuperAdmin, userAccountType]);

  const handleLoginSuccess = (accountType, tenantId, mode, userRole = 'Admin', targetScreen = null) => {
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('pharmalink_session_auth', 'true');
      localStorage.removeItem('pharmalink_is_auth');
    } catch (e) {}

    if (accountType === 'SUPER_ADMIN') {
      // Handled by isSuperAdmin state
    } else if (mode === 'RETAIL') {
      setStoreMode('RETAIL');
      if (targetScreen) {
        setCurrentScreen(targetScreen);
      } else if (userRole === 'Cashier') {
        setCurrentScreen('pos');
      } else {
        setCurrentScreen('dashboard');
      }
    } else {
      setStoreMode('WHOLESALE');
      if (targetScreen) {
        setCurrentScreen(targetScreen);
      } else if (userRole === 'Cashier') {
        setCurrentScreen('pos');
      } else {
        setCurrentScreen('dashboard');
      }
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
        return storeMode === 'WHOLESALE' ? (
          <WholesaleDashboardPage onNavigate={setCurrentScreen} />
        ) : (
          <DashboardPage onNavigate={setCurrentScreen} />
        );
      case 'pos':
        return <POSPage storeMode={storeMode} />;
      case 'inventory':
        return <InventoryPage />;
      case 'customers':
        return <CustomersPage onNavigate={setCurrentScreen} />;
      case 'customer-debt':
        return <CustomerDebtPage />;
      case 'expiry':
        return <ExpiryRadarPage />;
      case 'controlled':
        return <ControlledSubstancesPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'region-ledger':
        return isCashier ? <POSPage storeMode={storeMode} /> : <RegionLedgerPage />;
      case 'customer-ledger':
        return <CustomersPage onNavigate={setCurrentScreen} />;
      case 'patients':
        return <PatientsPage onNavigate={setCurrentScreen} />;
      case 'fbr':
        return isCashier ? <POSPage storeMode={storeMode} /> : <FBRTaxPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return isCashier ? <POSPage storeMode={storeMode} /> : <SettingsPage storeMode={storeMode} />;
      default:
        return isCashier ? (
          <POSPage storeMode={storeMode} />
        ) : storeMode === 'WHOLESALE' ? (
          <WholesaleDashboardPage onNavigate={setCurrentScreen} />
        ) : (
          <DashboardPage onNavigate={setCurrentScreen} />
        );
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

function TenantDataProviders({ children }) {
  const { currentShop } = useAuth();
  const activeTenantId = currentShop?.shopId || 'TEN-TESTING-SHOP';

  return (
    <CustomerProvider key={`cust-${activeTenantId}`}>
      <InventoryProvider key={`inv-${activeTenantId}`}>
        <SupplierProvider key={`sup-${activeTenantId}`}>
          <PatientProvider key={`pat-${activeTenantId}`}>
            <SalesProvider key={`sales-${activeTenantId}`}>
              <CartProvider key={`cart-${activeTenantId}`}>
                <CustomerDebtProvider key={`debt-${activeTenantId}`}>
                  {children}
                </CustomerDebtProvider>
              </CartProvider>
            </SalesProvider>
          </PatientProvider>
        </SupplierProvider>
      </InventoryProvider>
    </CustomerProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <PWAProvider>
        <AuthProvider>
          <TenantDataProviders>
            <AppContent />
          </TenantDataProviders>
        </AuthProvider>
      </PWAProvider>
    </ErrorBoundary>
  );
}

export default App;
