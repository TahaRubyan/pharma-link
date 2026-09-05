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
  LogOut
} from 'lucide-react';
import { useAuth, formatDateDDMMYYYY, parseDDMMYYYYToDate } from '../context/AuthContext';
import NewClientOnboardModal from '../components/modals/NewClientOnboardModal';
import LogClientPaymentModal from '../components/modals/LogClientPaymentModal';
import ShopDetailsModal from '../components/modals/ShopDetailsModal';

export const MasterAdminDashboard = () => {
  const { 
    tenantsList, 
    clientPaymentLogs, 
    inspectTenant, 
    loginAsClientUser,
    logout
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL_TIME'); // 'ALL_TIME' | '08-2026' | '07-2026' | '06-2026'
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [activePaymentTenant, setActivePaymentTenant] = useState(null);
  const [activeDetailsTenant, setActiveDetailsTenant] = useState(null);

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
            className="btn btn-primary"
            style={{ borderRadius: '12px', fontSize: '12px', padding: '0.65rem 1.25rem', backgroundColor: '#111827' }}
          >
            <Plus size={16} /> Onboard New Client Shop
          </button>

          {/* Dedicated Super Admin Logout Button */}
          <button
            onClick={logout}
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
            title="Sign out of Super Admin command center and return to login"
          >
            <LogOut size={15} color="#b91c1c" />
            <span>Log Out</span>
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
              className="btn btn-outline"
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
        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
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

        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
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

        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
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

        <div className="card card-hover" style={{ backgroundColor: overdueTenants.length > 0 ? '#fffbe0' : '#ffffff', borderColor: overdueTenants.length > 0 ? '#fde68a' : '#e2e8f0' }}>
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
                  <tr key={tenant.tenantId}>
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
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
                          title="Show overall shop details, licensing & payment ledger"
                        >
                          <FileText size={13} color="#111827" /> Shop Details
                        </button>

                        {/* Log Payment Button */}
                        <button
                          onClick={() => setActivePaymentTenant(tenant)}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '0.3rem 0.6rem', backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                          title="Record client monthly payment"
                        >
                          <CreditCard size={13} /> Log Payment
                        </button>

                        {/* Inspect Client Shop Button */}
                        <button
                          onClick={() => handleInspect(tenant.tenantId)}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '0.3rem 0.6rem' }}
                          title="Inspect client store in read-only mode"
                        >
                          <Eye size={13} /> Inspect
                        </button>

                        {/* Login Test Action */}
                        <button
                          onClick={() => loginAsClientUser(tenant.tenantId, 'Admin')}
                          className="btn btn-primary"
                          style={{ fontSize: '11px', padding: '0.3rem 0.65rem', backgroundColor: '#111827' }}
                          title="Log in as Client Admin for this shop"
                        >
                          Login as Admin
                        </button>
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
    </div>
  );
};

export default MasterAdminDashboard;
