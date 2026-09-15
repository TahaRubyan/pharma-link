import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_STAFF_ACCOUNTS, MULTI_TENANT_SHOPS } from '../data/mockData';
import { dbSyncService } from '../services/dbSyncService';

const AuthContext = createContext();

export const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(String(dateInput).trim())) return String(dateInput).trim();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const parseDDMMYYYYToDate = (ddmmyyyyStr) => {
  if (!ddmmyyyyStr) return null;
  const parts = ddmmyyyyStr.split('-');
  if (parts.length === 3) {
    // dd-mm-yyyy
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  return new Date(ddmmyyyyStr);
};

const DEFAULT_ROLES = [
  {
    id: "ROLE-01",
    name: "Admin",
    permissions: {
      canOverrideStock: true,
      canViewFinancialProfit: true,
      canCreatePurchaseOrder: true,
      canModifyStoreSettings: true,
      canAccessRTV: true,
      canViewTaxReports: true,
    },
  },
  {
    id: "ROLE-02",
    name: "Cashier",
    permissions: {
      canOverrideStock: true,
      canViewFinancialProfit: false,
      canCreatePurchaseOrder: true,
      canModifyStoreSettings: false,
      canAccessRTV: false,
      canViewTaxReports: false,
    },
  },
  {
    id: "ROLE-03",
    name: "Pharmacist",
    permissions: {
      canOverrideStock: true,
      canViewFinancialProfit: false,
      canCreatePurchaseOrder: true,
      canModifyStoreSettings: false,
      canAccessRTV: true,
      canViewTaxReports: true,
    },
  },
];

const INITIAL_TENANTS = [
  {
    tenantId: 'TEN-IDREES-PHARMA',
    shopName: 'Idrees Pharma Distributor',
    description: 'Wholesale Medicine Distributor & Bulk B2B Supply Hub',
    ownerName: 'Muhammad Idrees',
    phone: '0300-5551234',
    form20: 'DL-20-IDR-101',
    form21: 'DL-21-IDR-101',
    gstin: '3277876174588',
    ntn: '4442705-8',
    city: 'Lahore',
    address: 'Wholesale Medicine Market, Circular Road, Lahore, Pakistan',
    subscribedSystemScope: 'WHOLESALE_ONLY',
    mode: 'WHOLESALE',
    setupFeePaid: 0,
    monthlyFee: 0,
    subscriptionStatus: 'Active',
    lastPaymentDate: '10-09-2026',
    nextDueDate: '10-10-2026',
    adminUsername: 'idrees.distributor',
    password: 'idrees123',
    tempPassword: 'idrees123',
    isTempPassword: false,
    createdDate: '10-09-2026',
  },
  {
    tenantId: 'TEN-TESTING-SHOP',
    shopName: 'Testing Shop',
    description: 'Multi-Store Hybrid Pharmacy & Bulk Distribution Testbed',
    ownerName: 'Testing Administrator',
    phone: '0300-1234567',
    form20: 'TEST-DL-20-001',
    form21: 'TEST-DL-21-001',
    gstin: '3277876174544',
    ntn: '4442705-7',
    city: 'Lahore',
    address: 'Main Commercial Market, Lahore',
    subscribedSystemScope: 'HYBRID_BOTH',
    mode: 'HYBRID',
    setupFeePaid: 0,
    monthlyFee: 0,
    subscriptionStatus: 'Active',
    lastPaymentDate: '01-09-2026',
    nextDueDate: '01-10-2026',
    adminUsername: 'testing.admin',
    isTempPassword: false,
    createdDate: '01-09-2026',
  }
];

const DEFAULT_STAFF_ACCOUNTS = [
  {
    id: 'STAFF-IDREES-ADMIN',
    tenantId: 'TEN-IDREES-PHARMA',
    name: 'Muhammad Idrees',
    username: 'idrees.distributor',
    password: 'idrees123',
    role: 'Admin',
    status: 'Active',
    storeMode: 'WHOLESALE',
    title: 'Store Administrator',
    mustChangePassword: false,
  }
];

const INITIAL_CLIENT_PAYMENT_LOGS = [];

export const AuthProvider = ({ children }) => {
  const [userAccountType, setUserAccountType] = useState(() => {
    return localStorage.getItem('medistore_account_type') || 'CLIENT_USER';
  });

  const [inspectingTenantId, setInspectingTenantId] = useState(null);

  const [tenantsList, setTenantsList] = useState(() => {
    const map = new Map();
    INITIAL_TENANTS.forEach((t) => map.set(t.tenantId, t));
    const saved = localStorage.getItem('medistore_tenants_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => {
            const initial = map.get(t.tenantId) || {};
            const merged = { ...initial, ...t };
            if (t.tenantId === 'TEN-TESTING-SHOP' || t.tenantId === 'TEN-IDREES-PHARMA') {
              merged.setupFeePaid = 0;
              merged.monthlyFee = 0;
              if (initial.subscribedSystemScope) merged.subscribedSystemScope = initial.subscribedSystemScope;
              if (initial.description) merged.description = initial.description;
              if (initial.mode) merged.mode = initial.mode;
            }
            map.set(t.tenantId, merged);
          });
        }
      } catch (e) {
        console.error('Failed to parse saved tenants list', e);
      }
    }
    return Array.from(map.values());
  });

  const [clientPaymentLogs, setClientPaymentLogs] = useState(() => {
    const saved = localStorage.getItem('medistore_client_payment_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved payment logs', e);
      }
    }
    return INITIAL_CLIENT_PAYMENT_LOGS;
  });

  const [currentShop, setCurrentShopState] = useState(() => {
    const saved = localStorage.getItem('pharmalink_active_shop');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved active shop', e);
      }
    }
    return MULTI_TENANT_SHOPS[0];
  });

  const [role, setRoleState] = useState(() => {
    const savedRole = localStorage.getItem('pharmalink_user_role');
    return savedRole === 'Cashier' ? 'Cashier' : 'Admin';
  });

  const [user, setUser] = useState({
    name: userAccountType === 'SUPER_ADMIN' ? 'Master Super Admin' : 'Testing Shop Admin',
    role: userAccountType === 'SUPER_ADMIN' ? 'SuperAdmin' : role,
    staffId: userAccountType === 'SUPER_ADMIN' ? 'SA-001' : 'EMP-001',
    title: userAccountType === 'SUPER_ADMIN' ? 'MediStore SaaS Platform Owner' : 'Shop Administrator'
  });

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem('pharmalink_custom_roles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse custom roles', e);
      }
    }
    return DEFAULT_ROLES;
  });

  const [staffAccounts, setStaffAccounts] = useState(() => {
    const map = new Map();
    DEFAULT_STAFF_ACCOUNTS.forEach((s) => map.set(s.id, s));
    const savedStaff = localStorage.getItem('pharmalink_staff_accounts');
    if (savedStaff) {
      try {
        const parsed = JSON.parse(savedStaff);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => map.set(s.id, { ...(map.get(s.id) || {}), ...s }));
        }
      } catch (e) {
        console.error('Failed to parse saved staff accounts', e);
      }
    }
    return Array.from(map.values());
  });

  // Cloud sync tenants & staff accounts from Supabase (unified cross-device SaaS registry)
  useEffect(() => {
    let isMounted = true;
    const loadCloudData = async () => {
      try {
        // 1. Fetch tenants from Supabase
        const cloudTenants = await dbSyncService.fetchTenants();
        if (isMounted && cloudTenants && cloudTenants.length > 0) {
          setTenantsList((prev) => {
            const map = new Map();
            prev.forEach((t) => map.set(t.tenantId, t));
            cloudTenants.forEach((t) => map.set(t.tenantId, { ...(map.get(t.tenantId) || {}), ...t }));
            return Array.from(map.values());
          });
        }
        // 2. Fetch staff from Supabase
        const cloudStaff = await dbSyncService.fetchStaffAccounts();
        if (isMounted && cloudStaff && cloudStaff.length > 0) {
          setStaffAccounts((prev) => {
            const map = new Map();
            prev.forEach((item) => map.set(item.id, item));
            cloudStaff.forEach((item) => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('[AuthContext] Cloud data sync warning:', err);
      }
    };
    loadCloudData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('medistore_account_type', userAccountType);
  }, [userAccountType]);

  useEffect(() => {
    localStorage.setItem('medistore_tenants_list', JSON.stringify(tenantsList));
  }, [tenantsList]);

  useEffect(() => {
    localStorage.setItem('medistore_client_payment_logs', JSON.stringify(clientPaymentLogs));
  }, [clientPaymentLogs]);

  useEffect(() => {
    localStorage.setItem('pharmalink_active_shop', JSON.stringify(currentShop));
  }, [currentShop]);

  const [currentUserProfile, setCurrentUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmalink_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [sessionLoginRole, setSessionLoginRole] = useState(() => {
    return localStorage.getItem('pharmalink_session_login_role') || 'Admin';
  });

  useEffect(() => {
    localStorage.setItem('pharmalink_user_role', role);
    if (userAccountType === 'CLIENT_USER') {
      const isRetail = currentShop?.mode === 'RETAIL';
      const isHybrid = currentShop?.subscribedSystemScope === 'HYBRID_BOTH' || currentShop?.mode === 'HYBRID';
      const isTestingShop = !currentShop?.shopId || currentShop?.shopId === 'TEN-TESTING-SHOP';
      const shopDisplayName = currentShop?.shopName || 'Store';

      const resolvedName = currentUserProfile?.name 
        ? currentUserProfile.name 
        : (isTestingShop 
            ? (role === 'Admin' ? (isHybrid ? 'Testing Admin' : isRetail ? 'Testing Retail Admin' : 'Testing Wholesale Admin') : (isRetail ? 'Retail Counter Cashier' : 'Wholesale Billing Cashier'))
            : (role === 'Admin' ? `${shopDisplayName} Admin` : `${shopDisplayName} Cashier`));

      const resolvedStaffId = currentUserProfile?.staffId || currentUserProfile?.id || (role === 'Admin' ? 'EMP-001' : 'EMP-002');
      const resolvedTitle = currentUserProfile?.title || (role === 'Admin' 
        ? (isHybrid ? 'Store Operations Head' : isRetail ? 'Chief Pharmacist & Store Manager' : 'Distributor Operations Head')
        : (isRetail ? 'Counter Cashier & POS Dispenser' : 'B2B Billing & Dispatch Cashier'));

      setUser({
        name: resolvedName,
        username: currentUserProfile?.username || '',
        role: role,
        staffId: resolvedStaffId,
        title: resolvedTitle
      });
    } else {
      setUser({
        name: 'Master Super Admin',
        role: 'SuperAdmin',
        staffId: 'SA-001',
        title: 'MediStore SaaS Platform Owner'
      });
    }
  }, [role, userAccountType, currentShop?.mode, currentShop?.subscribedSystemScope, currentShop?.shopName, currentShop?.shopId, currentUserProfile]);

  useEffect(() => {
    localStorage.setItem('pharmalink_custom_roles', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('pharmalink_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Purge legacy persistent localStorage auth token for enhanced security
    try {
      localStorage.removeItem('pharmalink_is_auth');
    } catch (e) {}
    try {
      return sessionStorage.getItem('pharmalink_session_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const logout = () => {
    setIsAuthenticated(false);
    setUserAccountType('CLIENT_USER');
    setRoleState('Admin');
    setSessionLoginRole('Admin');
    setInspectingTenantId(null);
    setCurrentUserProfile(null);
    try {
      sessionStorage.removeItem('pharmalink_session_auth');
      localStorage.removeItem('pharmalink_is_auth');
      localStorage.removeItem('medistore_account_type');
      localStorage.removeItem('pharmalink_user_role');
      localStorage.removeItem('pharmalink_session_login_role');
      localStorage.removeItem('pharmalink_current_screen');
      localStorage.removeItem('pharmalink_user_profile');
      localStorage.removeItem('pharmalink_active_shop');
    } catch (e) {}
    setCurrentShopState(MULTI_TENANT_SHOPS[0]);
  };

  const loginAsSuperAdmin = () => {
    setIsAuthenticated(true);
    setUserAccountType('SUPER_ADMIN');
    setRoleState('Admin');
    setSessionLoginRole('Admin');
    setInspectingTenantId(null);
    try {
      sessionStorage.setItem('pharmalink_session_auth', 'true');
      localStorage.removeItem('pharmalink_is_auth');
      localStorage.setItem('medistore_account_type', 'SUPER_ADMIN');
      localStorage.setItem('pharmalink_session_login_role', 'Admin');
    } catch (e) {}
  };

  const loginAsClientUser = (tenantId = 'TEN-TESTING-SHOP', roleType = 'Admin', mode = null, tenantDetails = null, userDetails = null) => {
    setIsAuthenticated(true);
    setUserAccountType('CLIENT_USER');
    setRoleState(roleType);
    setSessionLoginRole(roleType);
    setInspectingTenantId(null);
    try {
      sessionStorage.setItem('pharmalink_session_auth', 'true');
      localStorage.removeItem('pharmalink_is_auth');
      localStorage.setItem('medistore_account_type', 'CLIENT_USER');
      localStorage.setItem('pharmalink_user_role', roleType);
      localStorage.setItem('pharmalink_session_login_role', roleType);
    } catch (e) {}

    // 1. Resolve Active Tenant
    let activeTenant = tenantDetails || (tenantsList || []).find((t) => t.tenantId === tenantId);
    if (!activeTenant) {
      try {
        const savedTenants = JSON.parse(localStorage.getItem('medistore_tenants_list') || '[]');
        activeTenant = savedTenants.find((t) => t.tenantId === tenantId);
      } catch (e) {}
    }
    if (!activeTenant && tenantId === 'TEN-TESTING-SHOP') {
      activeTenant = INITIAL_TENANTS[0];
    }

    // 2. Resolve System / Store Mode
    const targetScope = activeTenant?.subscribedSystemScope || (activeTenant?.mode === 'WHOLESALE' ? 'WHOLESALE_ONLY' : 'HYBRID_BOTH');
    const resolvedMode = targetScope === 'WHOLESALE_ONLY' || activeTenant?.mode === 'WHOLESALE'
      ? 'WHOLESALE'
      : (targetScope === 'RETAIL_ONLY' ? 'RETAIL' : (mode || 'HYBRID'));

    // 3. Build Fresh Shop Object strictly from the Active Tenant, merging any persisted profile
    const targetShopId = tenantId || activeTenant?.tenantId || 'TEN-TESTING-SHOP';
    let savedProfile = {};
    try {
      const stored = localStorage.getItem(`pharmalink_${targetShopId}_profile`);
      if (stored) savedProfile = JSON.parse(stored);
    } catch (e) {}

    const freshShop = {
      shopId: targetShopId,
      shopName: savedProfile.shopName || activeTenant?.shopName || 'Testing Shop',
      description: savedProfile.description || activeTenant?.description || '',
      ownerName: savedProfile.ownerName || activeTenant?.ownerName || '',
      city: savedProfile.city || activeTenant?.city || 'Lahore',
      dlNumber: savedProfile.dlNumber || activeTenant?.dlNumber || (activeTenant?.form20 && activeTenant?.form21 ? `${activeTenant.form20} & ${activeTenant.form21}` : (activeTenant?.form20 || activeTenant?.form21 || 'TEST-DL-20-001')),
      form20: savedProfile.form20 || activeTenant?.form20 || '',
      form21: savedProfile.form21 || activeTenant?.form21 || '',
      gstin: savedProfile.gstin || activeTenant?.gstin || '3277876174544',
      ntn: savedProfile.ntn || activeTenant?.ntn || '4442705-7',
      address: savedProfile.address || activeTenant?.address || (activeTenant?.city ? `${activeTenant.city}, Pakistan` : 'Main Commercial Market, Lahore'),
      phone: savedProfile.phone || activeTenant?.phone || '0300-1234567',
      signatoryName: savedProfile.signatoryName || activeTenant?.signatoryName || '',
      signatoryRole: savedProfile.signatoryRole || activeTenant?.signatoryRole || '',
      signatureImage: savedProfile.signatureImage || '',
      taxSettings: savedProfile.taxSettings || activeTenant?.taxSettings || null,
      warrantySettings: savedProfile.warrantySettings || activeTenant?.warrantySettings || null,
      printSettings: savedProfile.printSettings || activeTenant?.printSettings || null,
      mode: resolvedMode,
      subscribedSystemScope: targetScope,
    };

    setCurrentShopState(freshShop);
    try {
      localStorage.setItem('pharmalink_active_shop', JSON.stringify(freshShop));
    } catch (e) {}

    // 4. Resolve User Profile
    const isTestingShop = freshShop.shopId === 'TEN-TESTING-SHOP';
    const resolvedUserName = userDetails?.name 
      || activeTenant?.ownerName 
      || (isTestingShop ? 'Testing Admin' : `${freshShop.shopName} Admin`);

    const profile = {
      name: resolvedUserName,
      username: userDetails?.username || activeTenant?.adminUsername || (isTestingShop ? 'testing.admin' : ''),
      role: roleType,
      staffId: userDetails?.id || userDetails?.staffId || (roleType === 'Admin' ? 'EMP-001' : 'EMP-002'),
      title: userDetails?.title || (roleType === 'Admin' ? 'Store Administrator' : 'Counter Cashier')
    };

    setCurrentUserProfile(profile);
    try {
      localStorage.setItem('pharmalink_user_profile', JSON.stringify(profile));
    } catch (e) {}
  };

  const updateStoreProfile = async (updatedData) => {
    if (!updatedData) return;
    const targetShopId = currentShop?.shopId || 'TEN-TESTING-SHOP';

    // 1. Update currentShop in state and local storage
    setCurrentShopState((prev) => {
      const next = { ...prev, ...updatedData };
      try {
        localStorage.setItem('pharmalink_active_shop', JSON.stringify(next));
        localStorage.setItem(`pharmalink_${targetShopId}_profile`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 2. Update tenant in tenantsList
    setTenantsList((prev) => {
      const next = prev.map((t) => {
        if (t.tenantId === targetShopId) {
          return {
            ...t,
            ...updatedData,
            shopName: updatedData.shopName || t.shopName,
            phone: updatedData.phone || t.phone,
            address: updatedData.address || t.address,
            ntn: updatedData.ntn || t.ntn,
            gstin: updatedData.gstin || t.gstin,
            dlNumber: updatedData.dlNumber || t.dlNumber,
            form20: updatedData.form20 || t.form20,
            form21: updatedData.form21 || t.form21,
            signatoryName: updatedData.signatoryName || t.signatoryName,
            signatoryRole: updatedData.signatoryRole || t.signatoryRole,
            taxSettings: updatedData.taxSettings || t.taxSettings,
            warrantySettings: updatedData.warrantySettings || t.warrantySettings,
            printSettings: updatedData.printSettings || t.printSettings,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('medistore_tenants_list', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 3. Persist to Supabase tenants table in background
    try {
      await dbSyncService.updateTenantProfile(targetShopId, updatedData);
    } catch (e) {
      console.warn('Could not sync store profile to cloud:', e);
    }
  };

  const onboardNewTenant = (tenantData) => {
    const nextNum = tenantsList.length + 1093;
    const newTenantId = `CP-${nextNum}`;
    const tempPass = `Pharma#${Math.floor(1000 + Math.random() * 9000)}`;
    const todayDDMMYYYY = formatDateDDMMYYYY(new Date());

    const newTenant = {
      tenantId: newTenantId,
      shopName: tenantData.shopName.trim(),
      ownerName: tenantData.ownerName.trim(),
      phone: tenantData.phone.trim(),
      form20: tenantData.form20 ? tenantData.form20.trim() : `PK-DL-20-${nextNum}`,
      form21: tenantData.form21 ? tenantData.form21.trim() : `PK-DL-21-${nextNum}`,
      gstin: tenantData.gstin ? tenantData.gstin.trim() : `PK-${nextNum}-0`,
      city: tenantData.city ? tenantData.city.trim() : 'Islamabad',
      subscribedSystemScope: tenantData.subscribedSystemScope || 'HYBRID_BOTH',
      setupFeePaid: Number(tenantData.setupFeePaid || 50000),
      monthlyFee: Number(tenantData.monthlyFee || 5000),
      subscriptionStatus: 'Active',
      lastPaymentDate: todayDDMMYYYY,
      nextDueDate: tenantData.firstDueDate ? formatDateDDMMYYYY(tenantData.firstDueDate) : '28-09-2026',
      adminUsername: tenantData.adminUsername || `admin@${tenantData.shopName.toLowerCase().replace(/[^a-z]/g, '')}.pk`,
      tempPassword: tempPass,
      isTempPassword: true,
      createdDate: todayDDMMYYYY,
    };

    setTenantsList((prev) => [newTenant, ...prev]);

    // Provision default Admin staff account for this tenant with temporary password
    const cleanAdminUser = (newTenant.adminUsername || '').toLowerCase().replace(/\s+/g, '');
    const initialAdminStaff = {
      id: `STAFF-ADMIN-${newTenantId}`,
      tenantId: newTenantId,
      name: newTenant.ownerName || `${newTenant.shopName} Admin`,
      username: cleanAdminUser,
      password: tempPass,
      role: 'Admin',
      status: 'Active',
      storeMode: newTenant.subscribedSystemScope === 'RETAIL_ONLY' ? 'RETAIL' : (newTenant.subscribedSystemScope === 'WHOLESALE_ONLY' ? 'WHOLESALE' : 'HYBRID'),
      mustChangePassword: true,
    };
    setStaffAccounts((prev) => [initialAdminStaff, ...(prev || [])]);

    // Immediate localStorage persistence
    try {
      const storedTenants = JSON.parse(localStorage.getItem('medistore_tenants_list') || '[]');
      localStorage.setItem('medistore_tenants_list', JSON.stringify([newTenant, ...storedTenants.filter(t => t.tenantId !== newTenant.tenantId)]));
      const storedStaff = JSON.parse(localStorage.getItem('pharmalink_staff_accounts') || '[]');
      localStorage.setItem('pharmalink_staff_accounts', JSON.stringify([initialAdminStaff, ...storedStaff.filter(s => s.username !== cleanAdminUser)]));
    } catch (e) {}

    // Cloud database persistence: Save tenant first, then staff account to satisfy foreign key constraint!
    dbSyncService.saveTenant(newTenant)
      .then(() => dbSyncService.saveStaffAccount(initialAdminStaff))
      .catch((e) => console.warn('Sync new tenant and staff error:', e));

    const newPaymentLog = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      tenantId: newTenantId,
      shopName: newTenant.shopName,
      amount: newTenant.setupFeePaid,
      paymentMethod: 'One-Time Onboarding Fee',
      loggedDate: todayDDMMYYYY,
      loggedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loggedBy: 'Master Super Admin',
    };
    setClientPaymentLogs((prev) => [newPaymentLog, ...prev]);

    return { tenant: newTenant, tempPassword: tempPass };
  };

  const deleteTenant = async (tenantId) => {
    if (!tenantId) return { success: false, error: 'Tenant ID required' };
    if (tenantId === 'TEN-TESTING-SHOP') {
      throw new Error('The default demo shop (TEN-TESTING-SHOP) cannot be deleted.');
    }

    // 1. Delete from Supabase cloud (cascading deletes staff, inventory, invoices)
    await dbSyncService.deleteTenant(tenantId);

    // 2. Remove from local React states
    setTenantsList((prev) => prev.filter((t) => t.tenantId !== tenantId));
    setStaffAccounts((prev) => prev.filter((s) => s.tenantId !== tenantId));
    setClientPaymentLogs((prev) => prev.filter((p) => p.tenantId !== tenantId));

    // 3. Update localStorage
    try {
      const curTenants = JSON.parse(localStorage.getItem('medistore_tenants_list') || '[]');
      localStorage.setItem('medistore_tenants_list', JSON.stringify(curTenants.filter((t) => t.tenantId !== tenantId)));
      const curStaff = JSON.parse(localStorage.getItem('pharmalink_staff_accounts') || '[]');
      localStorage.setItem('pharmalink_staff_accounts', JSON.stringify(curStaff.filter((s) => s.tenantId !== tenantId)));
      const curLogs = JSON.parse(localStorage.getItem('medistore_client_payment_logs') || '[]');
      localStorage.setItem('medistore_client_payment_logs', JSON.stringify(curLogs.filter((p) => p.tenantId !== tenantId)));
    } catch (e) {}

    return { success: true };
  };

  const logClientPayment = (tenantId, amount, paymentMethod = 'Bank Transfer') => {
    const todayDDMMYYYY = formatDateDDMMYYYY(new Date());

    setTenantsList((prev) =>
      prev.map((t) => {
        if (t.tenantId === tenantId) {
          const currentDueDateObj = parseDDMMYYYYToDate(t.nextDueDate) || new Date();
          currentDueDateObj.setDate(currentDueDateObj.getDate() + 30);
          const nextDueDateStr = formatDateDDMMYYYY(currentDueDateObj);

          return {
            ...t,
            subscriptionStatus: 'Active',
            lastPaymentDate: todayDDMMYYYY,
            nextDueDate: nextDueDateStr,
          };
        }
        return t;
      })
    );

    const matchTenant = tenantsList.find((t) => t.tenantId === tenantId);
    const newLog = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      tenantId,
      shopName: matchTenant ? matchTenant.shopName : tenantId,
      amount: Number(amount),
      paymentMethod,
      loggedDate: todayDDMMYYYY,
      loggedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loggedBy: 'Master Super Admin',
    };

    setClientPaymentLogs((prev) => [newLog, ...prev]);
  };

  const inspectTenant = (tenantId) => {
    const target = tenantsList.find((t) => t.tenantId === tenantId);
    if (target) {
      setInspectingTenantId(tenantId);
      setUserAccountType('CLIENT_USER');
      setCurrentShopState({
        shopId: target.tenantId,
        shopName: target.shopName,
        city: target.city,
        dlNumber: `${target.form20} & ${target.form21}`,
        address: `${target.city}, Pakistan`,
        phone: target.phone
      });
    }
  };

  const stopInspecting = () => {
    setInspectingTenantId(null);
    setUserAccountType('SUPER_ADMIN');
  };

  const addCustomRole = (roleName, permissionObj) => {
    const newRole = {
      id: `ROLE-${Date.now().toString().slice(-4)}`,
      name: roleName.trim(),
      permissions: permissionObj,
    };
    setRoles((prev) => [...prev, newRole]);
    return newRole;
  };

  const addStaffAccount = (staffData) => {
    const newId = staffData.id || `EMP-${String(staffAccounts.length + 1).padStart(3, '0')}`;
    const newStaff = {
      id: newId,
      name: staffData.name || '',
      username: staffData.username || staffData.email || '',
      email: staffData.email || staffData.username || '',
      role: staffData.role || 'Cashier',
      title: staffData.title || (staffData.role === 'Admin' ? 'Managing Pharmacist & Admin' : 'Billing Cashier'),
      phone: staffData.phone || '',
      status: staffData.status || 'Active',
      storeMode: staffData.storeMode || currentShop?.mode || 'WHOLESALE',
    };
    setStaffAccounts((prev) => [newStaff, ...prev]);

    // Asynchronously save to cloud database
    const tenantId = currentShop?.shopId || 'TEN-TESTING-SHOP';
    dbSyncService.saveStaffAccount({
      id: newStaff.id,
      tenantId: tenantId,
      name: newStaff.name,
      username: newStaff.username,
      password: staffData.password || '123456',
      role: newStaff.role,
      status: newStaff.status,
      storeMode: newStaff.storeMode,
    });

    return newStaff;
  };

  const isSuperAdmin = userAccountType === 'SUPER_ADMIN';
  const isAdmin = role === 'Admin' && !isSuperAdmin;
  const isCashier = role === 'Cashier' && !isSuperAdmin;

  const activeRoleObj = roles.find((r) => r.name === role) || DEFAULT_ROLES[0];
  const permissions = activeRoleObj.permissions || {
    canOverrideStock: true,
    canViewFinancialProfit: isAdmin,
    canCreatePurchaseOrder: true,
    canModifyStoreSettings: isAdmin,
    canAccessRTV: isAdmin,
    canViewTaxReports: isAdmin,
  };

  const value = {
    isAuthenticated,
    setIsAuthenticated,
    logout,
    userAccountType,
    isSuperAdmin,
    loginAsSuperAdmin,
    loginAsClientUser,
    tenantsList,
    setTenantsList,
    onboardNewTenant,
    deleteTenant,
    logClientPayment,
    clientPaymentLogs,
    inspectingTenantId,
    inspectTenant,
    stopInspecting,
    currentShop,
    updateStoreProfile,
    changeShop: (shopId) => {
      const match = MULTI_TENANT_SHOPS.find((s) => s.shopId === shopId);
      if (match) setCurrentShopState(match);
    },
    shopsList: MULTI_TENANT_SHOPS,
    role,
    user,
    setRole: setRoleState,
    toggleRole: () => setRoleState((prev) => (prev === 'Admin' ? 'Cashier' : 'Admin')),
    isAdmin,
    isCashier,
    roles,
    addCustomRole,
    permissions,
    staffAccounts,
    setStaffAccounts,
    addStaffAccount,
    sessionLoginRole,
    setSessionLoginRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
export default AuthContext;
