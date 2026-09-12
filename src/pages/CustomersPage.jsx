import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  FileText, 
  CheckCircle, 
  CreditCard, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Download, 
  ShoppingCart,
  Building2,
  Filter
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useAuth } from '../context/AuthContext';
import CustomerFormModal from '../components/modals/CustomerFormModal';

export const CustomersPage = ({ onNavigate }) => {
  const { customers = [], addCustomer, updateCustomer, deleteCustomer } = useCustomer();
  const { currentShop } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedFilerStatus, setSelectedFilerStatus] = useState('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Distinct regions from customer list
  const availableRegions = useMemo(() => {
    const set = new Set();
    customers.forEach((c) => {
      if (c.region) set.add(c.region);
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedRegion !== 'ALL' && c.region !== selectedRegion) return false;
      if (selectedFilerStatus !== 'ALL' && c.filerStatus !== selectedFilerStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.shopName && c.shopName.toLowerCase().includes(q)) ||
          (c.region && c.region.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.ntn && c.ntn.toLowerCase().includes(q)) ||
          (c.gstn && c.gstn.toLowerCase().includes(q)) ||
          (c.licenseNo && c.licenseNo.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [customers, selectedRegion, selectedFilerStatus, searchQuery]);

  // Summary Metrics
  const totalCustomersCount = customers.length;
  const filersCount = customers.filter((c) => c.filerStatus === 'FILER').length;
  const nonFilersCount = totalCustomersCount - filersCount;
  const totalCreditAllocated = customers.reduce((sum, c) => sum + (Number(c.creditLimit) || 0), 0);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setIsFormModalOpen(true);
  };

  const handleSaveCustomer = (data) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    } else {
      addCustomer(data);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove customer "${name}" from the directory?`)) {
      deleteCustomer(id);
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      alert('No customers to export.');
      return;
    }
    const headers = ['ID', 'Name', 'Shop Name', 'Region', 'Address', 'Phone', 'NTN', 'GSTN', 'License No', 'Filer Status', 'Credit Limit'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.shopName || c.name}"`,
      `"${c.region || ''}"`,
      `"${c.address || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.ntn || ''}"`,
      `"${c.gstn || ''}"`,
      `"${c.licenseNo || ''}"`,
      c.filerStatus || 'FILER',
      c.creditLimit || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmalink_customers_${currentShop?.shopId || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* HEADER BANNER */}
      <div 
        className="card" 
        style={{ 
          padding: '1rem 1.5rem', 
          backgroundColor: '#0284c7', 
          color: '#ffffff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '1rem',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.18)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Wholesale Customer Directory & Territory Accounts
            </h2>
            <p style={{ fontSize: '12px', margin: '0.2rem 0 0', opacity: 0.9 }}>
              Manage customer profiles, regional mapping, NTN / GSTN tax compliance, drug licenses & counter invoicing
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-outline"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              color: '#ffffff', 
              borderColor: 'rgba(255,255,255,0.3)', 
              fontSize: '12px', 
              padding: '0.5rem 0.85rem',
              borderRadius: '8px'
            }}
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={handleOpenAddModal}
            className="btn"
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#0284c7', 
              fontWeight: 800, 
              fontSize: '12px', 
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={15} /> + Add New Customer
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Customers</span>
            <Users size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {totalCustomersCount}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '0.2rem', fontWeight: 600 }}>
            Registered Wholesale & Retail Buyers
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Territories</span>
            <MapPin size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {availableRegions.length} Regions
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
            {availableRegions.slice(0, 3).join(', ') || 'No custom regions added'}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>FBR Tax Filers</span>
            <ShieldCheck size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {filersCount} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>/ {nonFilersCount} Non-Filers</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '0.2rem', fontWeight: 600 }}>
            0.5% Advance Tax Qualifying
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Credit Authorized</span>
            <CreditCard size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            Rs. {totalCreditAllocated.toLocaleString('en-PK')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '0.2rem' }}>
            Approved Exposure Limit
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div 
        className="card" 
        style={{ 
          padding: '0.85rem 1rem', 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by customer name, shop, region, phone, NTN, GSTN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={13} color="#64748b" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
                backgroundColor: '#ffffff',
                color: '#334155',
              }}
            >
              <option value="ALL">All Regions ({availableRegions.length})</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedFilerStatus}
              onChange={(e) => setSelectedFilerStatus(e.target.value)}
              style={{
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
                backgroundColor: '#ffffff',
                color: '#334155',
              }}
            >
              <option value="ALL">All Tax Statuses</option>
              <option value="FILER">FBR Filers Only</option>
              <option value="NON_FILER">Non-Filers Only</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          Showing <strong>{filteredCustomers.length}</strong> of {customers.length} Customers
        </div>
      </div>

      {/* CUSTOMERS DATA TABLE */}
      <div className="card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <div className="table-container" style={{ maxHeight: '550px', overflowY: 'auto' }}>
          <table className="table" style={{ fontSize: '11px', width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
              <tr>
                <th style={{ width: '40px' }}>Sr.</th>
                <th>Customer / Pharmacy Name</th>
                <th>Region / Territory</th>
                <th>Complete Address</th>
                <th>Phone Number</th>
                <th>NTN & GSTN</th>
                <th>Drug License #</th>
                <th style={{ textAlign: 'center' }}>FBR Status</th>
                <th style={{ textAlign: 'right' }}>Credit Limit</th>
                <th style={{ textAlign: 'center', width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                    <div style={{ maxWidth: '360px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <Users size={36} color="#0284c7" />
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                        {customers.length === 0 ? 'Customer Directory is Empty' : 'No Customers Found'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                        {customers.length === 0 
                          ? 'Register your wholesale pharmacy buyers with their region, NTN, GSTN, and address for automated invoicing.'
                          : 'Try adjusting your search query or region filter.'
                        }
                      </div>
                      <button
                        onClick={handleOpenAddModal}
                        className="btn btn-primary"
                        style={{ backgroundColor: '#0284c7', fontSize: '12px', borderRadius: '8px', padding: '0.45rem 0.95rem' }}
                      >
                        <Plus size={14} /> Register Customer Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => (
                  <tr key={cust.id || idx}>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>
                        {cust.name || cust.customerName}
                      </div>
                      {cust.shopName && cust.shopName !== cust.name && (
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          {cust.shopName}
                        </div>
                      )}
                    </td>
                    <td>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '10px'
                        }}
                      >
                        <MapPin size={10} /> {cust.region || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ color: '#475569', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cust.address || cust.customerAddress || '-'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>
                      {cust.phone || cust.customerPhone || '-'}
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#0f172a' }}>
                        NTN: <strong>{cust.ntn || '-'}</strong>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b' }}>
                        GSTN: {cust.gstn || cust.customerStrn || '-'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#0284c7', fontWeight: 600 }}>
                      {cust.licenseNo || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        className={`badge ${cust.filerStatus === 'FILER' ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontSize: '10px', fontWeight: 800 }}
                      >
                        {cust.filerStatus || 'FILER'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      Rs. {Number(cust.creditLimit || 500000).toLocaleString('en-PK')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        {onNavigate && (
                          <button
                            onClick={() => {
                              onNavigate('pos');
                            }}
                            title="Bill in POS"
                            className="btn btn-outline"
                            style={{ 
                              padding: '0.2rem 0.45rem', 
                              fontSize: '10px', 
                              borderColor: '#0284c7', 
                              color: '#0284c7',
                              borderRadius: '6px'
                            }}
                          >
                            <ShoppingCart size={11} /> Bill
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(cust)}
                          title="Edit Customer"
                          className="btn btn-outline"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '10px', borderRadius: '6px' }}
                        >
                          <Edit size={11} />
                        </button>
                        <button
                          onClick={() => handleDelete(cust.id, cust.name)}
                          title="Delete Customer"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '0.2rem',
                          }}
                        >
                          <Trash2 size={13} />
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

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};

export default CustomersPage;
