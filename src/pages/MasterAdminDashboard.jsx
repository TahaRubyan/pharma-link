import React, { useState, useMemo } from 'react';
import { 
  Building, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Plus, 
  CreditCard, 
  Eye, 
  FileText,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  UserPlus,
  LogOut,
  RotateCcw,
  Trash2,
  KeyRound,
  CheckCircle2,
  X,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useAuth, formatDateDDMMYYYY, parseDDMMYYYYToDate } from '../context/AuthContext';
import { dbSyncService } from '../services/dbSyncService';
import { hashPassword } from '../utils/cryptoUtils';
import NewClientOnboardModal from '../components/modals/NewClientOnboardModal';
import LogClientPaymentModal from '../components/modals/LogClientPaymentModal';
import ShopDetailsModal from '../components/modals/ShopDetailsModal';

export const MasterAdminDashboard = () => {
  const { 
    tenantsList, 
    setTenantsList,
    clientPaymentLogs, 
    inspectTenant, 
    loginAsClientUser,
    logout,
    staffAccounts = [],
    setStaffAccounts,
    deleteTenant
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL_TIME'); // 'ALL_TIME' | '08-2026' | '07-2026' | '06-2026'
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [activePaymentTenant, setActivePaymentTenant] = useState(null);
  const [activeDetailsTenant, setActiveDetailsTenant] = useState(null);

  // Tenant Deletion State
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);
  const [deleteTenantError, setDeleteTenantError] = useState('');
  const [deleteTenantSuccess, setDeleteTenantSuccess] = useState('');

  // User Provisioning Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provTenantId, setProvTenantId] = useState(tenantsList?.[0]?.tenantId || 'TEN-TESTING-SHOP');
  const [provName, setProvName] = useState('');
  const [provUsername, setProvUsername] = useState('');
  const [provRole, setProvRole] = useState('Cashier');
  const [provStoreMode, setProvStoreMode] = useState('WHOLESALE');
  const [provTempPass, setProvTempPass] = useState('');
  const [provSuccess, setProvSuccess] = useState('');
  const [provError, setProvError] = useState('');
  const [isSubmittingProv, setIsSubmittingProv] = useState(false);

  // Factory Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const generateRandomTempPass = () => {
    const p = 'Temp-' + Math.floor(1000 + Math.random() * 9000) + '!';
    setProvTempPass(p);
    return p;
  };

  const handleOpenProvisionModal = () => {
    setProvName('');
    setProvUsername('');
    setProvRole('Cashier');
    setProvStoreMode('WHOLESALE');
    setProvSuccess('');
    setProvError('');
    generateRandomTempPass();
    setIsProvisionModalOpen(true);
  };

  const handleCreateUserWithTempPassword = async (e) => {
    e.preventDefault();
    setProvError('');
    setProvSuccess('');

    if (!provName.trim() || !provUsername.trim() || !provTempPass.trim()) {
      setProvError('Please fill in all user details and temporary password.');
      return;
    }

    const cleanUsername = provUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = provTempPass.trim();

    setIsSubmittingProv(true);
    try {
      // 1. Ensure the tenant exists in Supabase first so Foreign Key constraint succeeds
      const matchedTenant = (tenantsList || []).find((t) => t.tenantId === provTenantId);
      if (matchedTenant) {
        await dbSyncService.saveTenant(matchedTenant);
      }

      // Hash password using cryptoUtils for encrypted storage
      const encryptedHash = await hashPassword(cleanPassword);
      const newStaff = {
        id: `STAFF-${Date.now()}`,
        tenantId: provTenantId,
        name: provName.trim(),
        username: cleanUsername,
        password: encryptedHash,
        role: provRole,
        status: 'Active',
        storeMode: provStoreMode,
        mustChangePassword: true,
      };

      // 2. Sync to Supabase staff_accounts table
      await dbSyncService.saveStaffAccount(newStaff);

      // 3. Update local state and localStorage
      if (setStaffAccounts) {
        setStaffAccounts((prev) => [newStaff, ...(prev || [])]);
      }
      try {
        const stored = JSON.parse(localStorage.getItem('pharmalink_staff_accounts') || '[]');
        const updated = [newStaff, ...stored.filter((s) => s.username !== cleanUsername)];
        localStorage.setItem('pharmalink_staff_accounts', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update local staff accounts storage:', err);
      }

      setProvSuccess(`User account "${cleanUsername}" created successfully with temporary password! When this user logs in, they will be forced to change this temporary password.`);
    } catch (err) {
      setProvError(err.message || 'Failed to create user account.');
    } finally {
      setIsSubmittingProv(false);
    }
  };

  const handleDeleteTenantConfirm = async () => {
    if (!tenantToDelete) return;
    if (tenantToDelete.tenantId === 'TEN-TESTING-SHOP') {
      setDeleteTenantError('The default demo shop (TEN-TESTING-SHOP) cannot be deleted as it is required for baseline system demonstration.');
      return;
    }

    setIsDeletingTenant(true);
    setDeleteTenantError('');
    try {
      if (typeof deleteTenant === 'function') {
        await deleteTenant(tenantToDelete.tenantId);
      } else {
        await dbSyncService.deleteTenant(tenantToDelete.tenantId);
        if (setTenantsList) setTenantsList((prev) => prev.filter((t) => t.tenantId !== tenantToDelete.tenantId));
        if (setStaffAccounts) setStaffAccounts((prev) => prev.filter((s) => s.tenantId !== tenantToDelete.tenantId));
      }

      setDeleteTenantSuccess(`Tenant shop "${tenantToDelete.shopName}" (${tenantToDelete.tenantId}) and its associated staff records were successfully deleted.`);
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setTenantToDelete(null);
        setDeleteTenantSuccess('');
      }, 1300);
    } catch (err) {
      setDeleteTenantError(err.message || 'Failed to delete tenant.');
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const handleExecuteFactoryReset = async () => {
    setIsResetting(true);
    setResetError('');
    setResetSuccess('');
    try {
      const res = await dbSyncService.factoryResetSystemData();
      if (res && res.success) {
        setResetSuccess('System reset complete! All operational records (medicines, batches, invoices, purchase orders, suppliers, customers, debts) have been wiped from local storage and Supabase cloud. The system is clean and demo-ready.');
      } else {
        setResetError(res?.error || 'Factory reset failed.');
      }
    } catch (err) {
      setResetError(err.message || 'Failed to execute factory reset.');
    } finally {
      setIsResetting(false);
    }
  };

  // Month Filter Engine
  const filterByMonth = (ddmmyyyyStr) => {
    if (!ddmmyyyyStr || selectedMonthFilter === 'ALL_TIME') return true;
    // ddmmyyyyStr is formatted as 'DD-MM-YYYY'
    const parts = String(ddmmyyyyStr).split('-');
    if (parts.length === 3) {
      const monthYear = `${parts[1]}-${parts[2]}`; // MM-YYYY
      return monthYear === selectedMonthFilter;
    }
    return true;
  };

  // Filtered Datasets based on selected month
  const monthFilteredTenants = useMemo(() => {
    return (tenantsList || []).filter((t) => filterByMonth(t.createdDate || t.lastPaymentDate));
  }, [tenantsList, selectedMonthFilter]);

  const monthFilteredLogs = useMemo(() => {
    return (clientPaymentLogs || []).filter((log) => filterByMonth(log.loggedDate));
  }, [clientPaymentLogs, selectedMonthFilter]);

  // Financial Metrics Calculations based on Month Filter
  const totalOnboardedInMonth = monthFilteredTenants.length;
  const totalSaaSRevenueInMonth = monthFilteredLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
  const totalMonthlyReceivablesInMonth = monthFilteredTenants.reduce((sum, t) => sum + Number(t.monthlyFee || 0), 0);

  const activeTenantsCount = (tenantsList || []).filter((t) => t.subscriptionStatus === 'Active').length;
  const overdueTenants = (tenantsList || []).filter((t) => t.subscriptionStatus === 'Overdue');
  const dueSoonTenants = (tenantsList || []).filter((t) => t.subscriptionStatus === 'Due Soon');

  // Search filter applied on top of month filter
  const displayedTenants = (tenantsList || []).filter((t) => {
    const matchesSearch =
      t.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMonth = selectedMonthFilter === 'ALL_TIME' || filterByMonth(t.createdDate || t.lastPaymentDate);
    return matchesSearch && matchesMonth;
  });

  const handleInspect = (tenantId) => {
    inspectTenant(tenantId);
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)', backgroundColor: '#f4f5f7', minHeight: '100vh' }}>
      {/* Header Banner */}
      <div className="flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="page-title" style={{ fontSize: '20px' }}>Master SaaS Platform Command Center</h2>
            <span className="badge badge-success">Super Admin Level</span>
          </div>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Manage client pharmacy subscriptions, monthly SaaS revenue, onboarding & system scope entitlements
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="btn btn-primary master-btn-primary"
            style={{ borderRadius: '12px', fontSize: '12px', padding: '0.65rem 1.15rem', backgroundColor: '#111827' }}
          >
            <Plus size={16} /> Onboard New Client Shop
          </button>

          {/* User Provisioning Button */}
          <button
            onClick={handleOpenProvisionModal}
            className="btn btn-outline master-btn-secondary"
            style={{
              borderRadius: '12px',
              fontSize: '12px',
              padding: '0.65rem 1.15rem',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Create user with temporary password and force password reset on first login"
          >
            <UserPlus size={15} color="#0284c7" />
            <span>Create User / Staff</span>
          </button>

          {/* 1-Click Factory Reset Button */}
          <button
            onClick={() => {
              setResetSuccess('');
              setResetError('');
              setIsResetModalOpen(true);
            }}
            className="master-btn-danger"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              padding: '0.65rem 1.25rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
            }}
            title="Reset system operational data across Wholesale & Retail in 1 click for demo readiness"
          >
            <RotateCcw size={15} color="#ffffff" />
            <span>Clear / Reset System Data</span>
          </button>

          {/* Dedicated Super Admin Logout Button */}
          <button
            onClick={logout}
            className="master-btn-logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '0.65rem 1.15rem',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)'
            }}
            title="Sign out of Super Admin command center and return to login"
          >
            <LogOut size={15} color="#b91c1c" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* SYSTEM READINESS & FACTORY CLEAN SLATE QUICK BAR */}
      <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>System Readiness: Clean Slate Production / Demo Mode</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Operational tables start with 0 mock records. Real entries sync directly to Supabase cloud. Click "Clear / Reset System Data" anytime to return to 0.</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => {
              setResetSuccess('');
              setResetError('');
              setIsResetModalOpen(true);
            }}
            className="master-quickbar-btn"
            style={{ fontSize: '11.5px', padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} /> Clear System Data (0 Records)
          </button>
        </div>
      </div>

      {/* MINIMALIST DROPDOWN MONTH FILTER BAR */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Filter size={16} color="#111827" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Monthly SaaS Revenue & Onboarding Filter</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Select a month to inspect total clients onboarded & revenue generated in that period</div>
          </div>
        </div>

        {/* Minimalist Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="subtext" style={{ fontWeight: 600, color: '#334155' }}>Filter Period:</label>
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="master-filter-select"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL_TIME">📅 All Time (Cumulative Total)</option>
            <option value="08-2026">📆 August 2026 (08-2026)</option>
            <option value="07-2026">📆 July 2026 (07-2026)</option>
            <option value="06-2026">📆 June 2026 (06-2026)</option>
          </select>

          {selectedMonthFilter !== 'ALL_TIME' && (
            <button
              onClick={() => setSelectedMonthFilter('ALL_TIME')}
              className="btn btn-outline master-filter-reset"
              style={{ fontSize: '11px', padding: '0.35rem 0.65rem', borderRadius: '8px' }}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* OVERDUE SUBSCRIPTION ALERT BANNER (If any) */}
      {overdueTenants.length > 0 && (
        <div style={{ backgroundColor: '#fffbe0', border: '1px solid #fde68a', borderRadius: '14px', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertTriangle size={18} color="#b45309" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>
                ⚠️ Overdue Subscription Alert ({overdueTenants.length} Client Shops)
              </div>
              <div style={{ fontSize: '11px', color: '#78350f' }}>
                {overdueTenants.map((t) => `${t.shopName} (${t.tenantId})`).join(', ')} payments are overdue. Contact client owner to collect payment.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE SAAS METRIC CARDS (Dynamically updated by Month Filter) */}
      <div className="grid-4">
        <div className="card card-hover master-kpi-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <span className="subtext" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {selectedMonthFilter === 'ALL_TIME' ? 'Subscribed Clients' : 'Onboarded In Month'}
            </span>
            <UserPlus size={18} color="#111827" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
            {totalOnboardedInMonth} Shops
          </div>
          <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600, marginTop: '0.3rem' }}>
            {selectedMonthFilter === 'ALL_TIME' ? `${activeTenantsCount} Active Subscriptions` : `New Client Onboardings in Period`}
          </div>
        </div>

        <div className="card card-hover master-kpi-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <span className="subtext" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
              {selectedMonthFilter === 'ALL_TIME' ? 'Total SaaS Revenue' : 'Revenue In Month'}
            </span>
            <DollarSign size={18} color="#047857" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857' }}>
            Rs. {totalSaaSRevenueInMonth.toLocaleString('en-PK')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.3rem' }}>
            {selectedMonthFilter === 'ALL_TIME' ? 'Setup & Monthly Billings Collected' : `Payments Logged in Selected Month`}
          </div>
        </div>

        <div className="card card-hover master-kpi-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <span className="subtext" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Monthly Receivables</span>
            <Clock size={18} color="#111827" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
            Rs. {totalMonthlyReceivablesInMonth.toLocaleString('en-PK')} / mo
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.3rem' }}>
            Recurring Monthly Subscription Total
          </div>
        </div>

        <div className="card card-hover master-kpi-card" style={{ backgroundColor: overdueTenants.length > 0 ? '#fffbe0' : '#ffffff', borderColor: overdueTenants.length > 0 ? '#fde68a' : '#e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
            <span className="subtext" style={{ fontWeight: 700, color: overdueTenants.length > 0 ? '#b45309' : '#9ca3af', textTransform: 'uppercase' }}>Overdue Follow-ups</span>
            <AlertTriangle size={18} color={overdueTenants.length > 0 ? '#b45309' : '#9ca3af'} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: overdueTenants.length > 0 ? '#b45309' : '#111827' }}>
            {overdueTenants.length} Pending
          </div>
          <div style={{ fontSize: '11px', color: overdueTenants.length > 0 ? '#b45309' : '#9ca3af', marginTop: '0.3rem' }}>
            {dueSoonTenants.length} Due Soon (Next 7 Days)
          </div>
        </div>
      </div>

      {/* CLIENT DIRECTORY & SUBSCRIPTION LEDGER TABLE */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 className="section-title">Client Directory & Subscription Entitlements</h3>
            <p className="subtext" style={{ marginTop: '0.15rem' }}>
              Showing {displayedTenants.length} client shops • Dates formatted in DD-MM-YYYY
            </p>
          </div>

          <div style={{ position: 'relative', width: '340px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search Shop Name, Owner, Tenant ID, or City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="master-search-input"
              style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.3rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant ID</th>
                <th>Shop Name & Owner</th>
                <th>City & Phone</th>
                <th>Subscribed Scope</th>
                <th>Onboarded Date (DD-MM-YYYY)</th>
                <th>Monthly Fee</th>
                <th>Status</th>
                <th>Next Due Date (DD-MM-YYYY)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTenants.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No client shops found matching search or month filter.
                  </td>
                </tr>
              ) : (
                displayedTenants.map((tenant) => (
                  <tr key={tenant.tenantId} className="master-tenant-row">
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      #{tenant.tenantId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{tenant.shopName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Owner: {tenant.ownerName} (Form 20: {tenant.form20})</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{tenant.city}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{tenant.phone}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        tenant.subscribedSystemScope === 'RETAIL_ONLY'
                          ? 'badge-otc'
                          : tenant.subscribedSystemScope === 'WHOLESALE_ONLY'
                          ? 'badge-narcotic'
                          : 'badge-success'
                      }`}>
                        {tenant.subscribedSystemScope === 'RETAIL_ONLY'
                          ? '🛒 Retail Only'
                          : tenant.subscribedSystemScope === 'WHOLESALE_ONLY'
                          ? '📦 Wholesale Only'
                          : '🔄 Hybrid (Both)'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formatDateDDMMYYYY(tenant.createdDate || tenant.lastPaymentDate)}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      Rs. {Number(tenant.monthlyFee).toLocaleString('en-PK')} / mo
                    </td>
                    <td>
                      <span className={`badge ${
                        tenant.subscriptionStatus === 'Active'
                          ? 'badge-success'
                          : tenant.subscriptionStatus === 'Due Soon'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#b45309' }}>
                      {formatDateDDMMYYYY(tenant.nextDueDate)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {/* Shop Details Action */}
                        <button
                          onClick={() => setActiveDetailsTenant(tenant)}
                          className="btn btn-outline master-action-btn-neutral"
                          style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
                          title="Show overall shop details, licensing & payment ledger"
                        >
                          <FileText size={13} color="#111827" /> Shop Details
                        </button>

                        {/* Log Payment Button */}
                        <button
                          onClick={() => setActivePaymentTenant(tenant)}
                          className="btn btn-outline master-action-btn-success"
                          style={{ fontSize: '11px', padding: '0.3rem 0.6rem', backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                          title="Record client monthly payment"
                        >
                          <CreditCard size={13} /> Log Payment
                        </button>

                        {/* Inspect Client Shop Button */}
                        <button
                          onClick={() => handleInspect(tenant.tenantId)}
                          className="btn btn-outline master-action-btn-inspect"
                          style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
                          title="Inspect client store in read-only mode"
                        >
                          <Eye size={13} /> Inspect
                        </button>

                        {/* Login Test Action */}
                        <button
                          onClick={() => loginAsClientUser(tenant.tenantId, 'Admin')}
                          className="btn btn-primary master-action-btn-admin"
                          style={{ fontSize: '11px', padding: '0.3rem 0.65rem', backgroundColor: '#111827' }}
                          title="Log in as Client Admin for this shop"
                        >
                          Login as Admin
                        </button>

                        {/* Delete Tenant Action */}
                        {tenant.tenantId !== 'TEN-TESTING-SHOP' && (
                          <button
                            onClick={() => {
                              setDeleteTenantError('');
                              setDeleteTenantSuccess('');
                              setTenantToDelete(tenant);
                              setIsDeleteModalOpen(true);
                            }}
                            className="btn btn-outline master-action-btn-danger"
                            style={{
                              fontSize: '11px',
                              padding: '0.3rem 0.6rem',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              borderColor: '#fca5a5'
                            }}
                            title="Permanently delete this pharmacy client and its records"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {isOnboardModalOpen && (
        <NewClientOnboardModal
          isOpen={isOnboardModalOpen}
          onClose={() => setIsOnboardModalOpen(false)}
        />
      )}

      {activePaymentTenant && (
        <LogClientPaymentModal
          tenant={activePaymentTenant}
          onClose={() => setActivePaymentTenant(null)}
        />
      )}

      {activeDetailsTenant && (
        <ShopDetailsModal
          tenant={activeDetailsTenant}
          onClose={() => setActiveDetailsTenant(null)}
        />
      )}

      {/* DELETE TENANT CONFIRMATION MODAL */}
      {isDeleteModalOpen && tenantToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem', fontFamily: 'var(--font-sans)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', border: '1px solid #fecdd3' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={22} color="#e11d48" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#9f1239', margin: 0 }}>Delete Client Tenant Shop</h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0.15rem 0 0' }}>Permanently remove pharmacy subscription & all linked staff accounts</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isDeletingTenant) setIsDeleteModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {deleteTenantSuccess ? (
              <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '13px' }}>
                  <CheckCircle2 size={18} color="#16a34a" /> {deleteTenantSuccess}
                </div>
              </div>
            ) : (
              <div>
                {deleteTenantError && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {deleteTenantError}
                  </div>
                )}

                <div style={{ padding: '1rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#9f1239', marginBottom: '0.35rem' }}>
                    Confirm deletion of pharmacy store:
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    {tenantToDelete.shopName} (#{tenantToDelete.tenantId})
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '0.25rem' }}>
                    Owner: {tenantToDelete.ownerName || 'N/A'} • City: {tenantToDelete.city || 'N/A'} • Scope: {tenantToDelete.subscribedSystemScope}
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fef08a', borderRadius: '12px', fontSize: '11.5px', color: '#854d0e', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  ⚠️ <strong>Warning:</strong> This will delete this tenant from the cloud database and remove all staff credentials associated with it. This action cannot be undone.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                  <button
                    type="button"
                    disabled={isDeletingTenant}
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '0.6rem 1.25rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingTenant}
                    onClick={handleDeleteTenantConfirm}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '0.6rem 1.4rem', backgroundColor: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {isDeletingTenant ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                    <span>{isDeletingTenant ? 'Deleting Tenant...' : 'Yes, Delete Tenant'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER PROVISIONING WITH TEMPORARY PASSWORD MODAL */}
      {isProvisionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', fontFamily: 'var(--font-sans)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Provision User / Staff Account</h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0.15rem 0 0' }}>Assign temporary password with mandatory first-login password reset</p>
                </div>
              </div>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {provSuccess ? (
              <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '13px', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} color="#16a34a" /> User Account Successfully Created!
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {provSuccess}
                </div>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff', border: '1px dashed #86efac', borderRadius: '10px', marginBottom: '1rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <div><strong>Username:</strong> {provUsername}</div>
                  <div><strong>Temp Password:</strong> {provTempPass}</div>
                  <div><strong>Assigned Shop:</strong> {provTenantId} ({provStoreMode})</div>
                  <div><strong>Role:</strong> {provRole}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`MediStore Credentials:\nShop: ${provTenantId} (${provStoreMode})\nUsername: ${provUsername}\nTemp Password: ${provTempPass}\nNote: Change password required on first login.`);
                      alert('Credentials copied to clipboard!');
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Copy size={14} /> Copy Credentials
                  </button>
                  <button
                    onClick={() => {
                      setIsProvisionModalOpen(false);
                      setProvSuccess('');
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '0.5rem 1rem', backgroundColor: '#111827' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateUserWithTempPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {provError && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {provError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Client Store Shop</label>
                    <select
                      value={provTenantId}
                      onChange={(e) => {
                        setProvTenantId(e.target.value);
                        const match = (tenantsList || []).find((t) => t.tenantId === e.target.value);
                        if (match && match.subscribedSystemScope === 'RETAIL_ONLY') {
                          setProvStoreMode('RETAIL');
                        } else if (match && match.subscribedSystemScope === 'WHOLESALE_ONLY') {
                          setProvStoreMode('WHOLESALE');
                        }
                      }}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                    >
                      {(tenantsList || []).map((t) => (
                        <option key={t.tenantId} value={t.tenantId}>
                          {t.shopName} ({t.tenantId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Store Mode</label>
                    <select
                      value={provStoreMode}
                      onChange={(e) => setProvStoreMode(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                    >
                      <option value="WHOLESALE">Wholesale Distribution (B2B)</option>
                      <option value="RETAIL">Retail Pharmacy (OTC / Counter)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Staff Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Tariq Mehmood"
                      value={provName}
                      onChange={(e) => setProvName(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Username</label>
                    <input
                      type="text"
                      placeholder="e.g. tariq.cashier"
                      value={provUsername}
                      onChange={(e) => setProvUsername(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Role Permission</label>
                    <select
                      value={provRole}
                      onChange={(e) => setProvRole(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                    >
                      <option value="Cashier">Cashier (POS Checkout Only)</option>
                      <option value="Admin">Admin (Full Operational Control)</option>
                      <option value="Pharmacist">Pharmacist (Rx Verification)</option>
                      <option value="Manager">Manager (Inventory & Audits)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Temporary Password</label>
                      <button
                        type="button"
                        onClick={generateRandomTempPass}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <RefreshCw size={11} /> Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={provTempPass}
                      onChange={(e) => setProvTempPass(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                      required
                    />
                  </div>
                </div>

                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', fontSize: '11.5px', color: '#1e40af', lineHeight: '1.4' }}>
                  🛡️ <strong>Security Policy:</strong> The user will be flagged with <code>mustChangePassword: true</code>. Upon first login with this temporary password, the system blocks access until they choose their own encrypted permanent password.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '0.6rem 1.25rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProv}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '0.6rem 1.35rem', backgroundColor: '#0284c7' }}
                  >
                    {isSubmittingProv ? 'Creating Account...' : 'Provision User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 1-CLICK FACTORY RESET SYSTEM DATA MODAL */}
      {isResetModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', fontFamily: 'var(--font-sans)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', border: '1px solid #fecdd3' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={22} color="#e11d48" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#9f1239', margin: 0 }}>Factory Reset All System Data</h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0.15rem 0 0' }}>1-Click complete wipe of operational data for clean demo readiness</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isResetting) setIsResetModalOpen(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {resetSuccess ? (
              <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '13px', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={20} color="#16a34a" /> System Reset Complete!
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                  {resetSuccess}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '0.65rem 1.4rem', backgroundColor: '#15803d' }}
                  >
                    Reload System in Clean State
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {resetError && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#b91c1c', fontSize: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {resetError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#e11d48', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Trash2 size={13} /> Records Cleared:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '11px', color: '#9f1239', lineHeight: '1.6' }}>
                      <li>Invoices & Sales receipts</li>
                      <li>Medicines & FEFO Batches</li>
                      <li>Purchase Orders & Receiving</li>
                      <li>Suppliers & Return Notes</li>
                      <li>Customer debt khata & Patients</li>
                      <li>Supabase Cloud operational rows</li>
                    </ul>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={13} /> Records Preserved:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '11px', color: '#166534', lineHeight: '1.6' }}>
                      <li>Tenant Store Registrations</li>
                      <li>Super Admin credentials</li>
                      <li>Staff login accounts</li>
                      <li>Licensing & Tax configurations</li>
                      <li>Subscription payment logs</li>
                    </ul>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fef08a', borderRadius: '12px', fontSize: '11.5px', color: '#854d0e', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  ⚠️ <strong>Notice:</strong> This action is instant. Once confirmed, both Wholesale and Retail databases will start with 0 items, ready for you to input your real production data or conduct a live demonstration.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setIsResetModalOpen(false)}
                    className="btn btn-outline"
                    style={{ fontSize: '12px', padding: '0.6rem 1.25rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleExecuteFactoryReset}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '0.6rem 1.4rem', backgroundColor: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {isResetting ? <RefreshCw size={14} className="spin" /> : <RotateCcw size={14} />}
                    <span>{isResetting ? 'Wiping System Data...' : 'Confirm 1-Click Factory Reset'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAdminDashboard;
