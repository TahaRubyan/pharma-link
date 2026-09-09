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
    tenantId: 'TEN-TESTING-SHOP',
    shopName: 'Testing Shop',
    ownerName: 'Testing Administrator',
    phone: '0300-1234567',
    form20: 'TEST-DL-20-001',
    form21: 'TEST-DL-21-001',
    gstin: '3277876174544',
    ntn: '4442705-7',
    city: 'Lahore',
    address: 'Main Commercial Market, Lahore',
    subscribedSystemScope: 'HYBRID_BOTH',
    setupFeePaid: 50000,
    monthlyFee: 5000,
    subscriptionStatus: 'Active',
    lastPaymentDate: '01-09-2026',
    nextDueDate: '01-10-2026',
    adminUsername: 'testing.admin',
    isTempPassword: false,
    createdDate: '01-09-2026',
  }
];

const INITIAL_CLIENT_PAYMENT_LOGS = [];

export const AuthProvider = ({ children }) => {
  const [userAccountType, setUserAccountType] = useState(() => {
    return localStorage.getItem('medistore_account_type') || 'CLIENT_USER';
  });

  const [inspectingTenantId, setInspectingTenantId] = useState(null);

  const [tenantsList, setTenantsList] = useState(() => {
    const saved = localStorage.getItem('medistore_tenants_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved tenants list', e);
      }
    }
    return INITIAL_TENANTS;
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
    const savedStaff = localStorage.getItem('pharmalink_staff_accounts');
    if (savedStaff) {
      try {
        return JSON.parse(savedStaff);
      } catch (e) {
        console.error('Failed to parse saved staff accounts', e);
      }
    }
    return [];
  });

  // Cloud sync staff accounts from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadCloudStaff = async () => {
      try {
        const tenantId = currentShop?.shopId || 'TEN-TESTING-SHOP';
        const cloudStaff = await dbSyncService.fetchStaffAccounts(tenantId);
        if (isMounted && cloudStaff && cloudStaff.length > 0) {
          setStaffAccounts((prev) => {
            const map = new Map();
            prev.forEach((item) => map.set(item.id, item));
            cloudStaff.forEach((item) => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('[AuthContext] Cloud staff sync warning:', err);
      }
    };
    loadCloudStaff();
    return () => {
      isMounted = false;
    };
  }, [currentShop?.shopId]);

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

  const [sessionLoginRole, setSessionLoginRole] = useState(() => {
    return localStorage.getItem('pharmalink_session_login_role') || 'Admin';
  });

  useEffect(() => {
    localStorage.setItem('pharmalink_user_role', role);
    if (userAccountType === 'CLIENT_USER') {
      const isRetail = currentShop?.mode === 'RETAIL';
      const isHybrid = currentShop?.subscribedSystemScope === 'HYBRID_BOTH' || currentShop?.mode === 'HYBRID';
      setUser({
        name: role === 'Admin' 
          ? (isHybrid ? 'Testing Admin' : isRetail ? 'Testing Retail Admin' : 'Testing Wholesale Admin')
          : (isRetail ? 'Retail Counter Cashier' : 'Wholesale Billing Cashier'),
        role: role,
        staffId: role === 'Admin' ? 'EMP-001' : 'EMP-002',
        title: role === 'Admin' 
          ? (isHybrid ? 'Store Operations Head' : isRetail ? 'Chief Pharmacist & Store Manager' : 'Distributor Operations Head')
          : (isRetail ? 'Counter Cashier & POS Dispenser' : 'B2B Billing & Dispatch Cashier')
      });
    } else {
      setUser({
        name: 'Master Super Admin',
        role: 'SuperAdmin',
        staffId: 'SA-001',
        title: 'MediStore SaaS Platform Owner'
      });
    }
  }, [role, userAccountType, currentShop?.mode, currentShop?.subscribedSystemScope]);

  useEffect(() => {
    localStorage.setItem('pharmalink_custom_roles', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('pharmalink_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pharmalink_is_auth') === 'true';
  });

  const logout = () => {
    setIsAuthenticated(false);
    setUserAccountType('CLIENT_USER');
    setRoleState('Admin');
    setSessionLoginRole('Admin');
    setInspectingTenantId(null);
    localStorage.removeItem('pharmalink_is_auth');
    localStorage.removeItem('medistore_account_type');
    localStorage.removeItem('pharmalink_user_role');
    localStorage.removeItem('pharmalink_session_login_role');
    localStorage.removeItem('pharmalink_current_screen');
  };

  const loginAsSuperAdmin = () => {
    setIsAuthenticated(true);
    setUserAccountType('SUPER_ADMIN');
    setRoleState('Admin');
    setSessionLoginRole('Admin');
    setInspectingTenantId(null);
    localStorage.setItem('pharmalink_is_auth', 'true');
    localStorage.setItem('medistore_account_type', 'SUPER_ADMIN');
    localStorage.setItem('pharmalink_session_login_role', 'Admin');
  };

  const loginAsClientUser = (tenantId = 'TEN-TESTING-SHOP', roleType = 'Admin', mode = 'HYBRID') => {
    setIsAuthenticated(true);
    setUserAccountType('CLIENT_USER');
    setRoleState(roleType);
    setSessionLoginRole(roleType);
    setInspectingTenantId(null);
    localStorage.setItem('pharmalink_is_auth', 'true');
    localStorage.setItem('medistore_account_type', 'CLIENT_USER');
    localStorage.setItem('pharmalink_user_role', roleType);
    localStorage.setItem('pharmalink_session_login_role', roleType);

    const activeTenant = (tenantsList || []).find((t) => t.tenantId === tenantId) || INITIAL_TENANTS[0];

    let existingData = {};
    try {
      const savedShop = localStorage.getItem('pharmalink_active_shop');
      if (savedShop) {
        existingData = JSON.parse(savedShop);
      }
    } catch (e) {}

    const resolvedMode = mode === 'HYBRID' || activeTenant?.subscribedSystemScope === 'HYBRID_BOTH'
      ? 'HYBRID'
      : mode === 'RETAIL'
      ? 'RETAIL'
      : 'WHOLESALE';

    setCurrentShopState({
      shopId: tenantId || activeTenant?.tenantId || 'TEN-TESTING-SHOP',
      shopName: existingData.shopName || activeTenant?.shopName || 'Testing Shop',
      city: existingData.city || activeTenant?.city || 'Lahore',
      dlNumber: existingData.dlNumber || activeTenant?.form20 || 'TEST-DL-20-001',
      gstin: existingData.gstin || activeTenant?.gstin || '3277876174544',
      ntn: existingData.ntn || activeTenant?.ntn || '4442705-7',
      address: existingData.address || activeTenant?.address || 'Main Commercial Market, Lahore',
      phone: existingData.phone || activeTenant?.phone || '0300-1234567',
      mode: resolvedMode,
      subscribedSystemScope: activeTenant?.subscribedSystemScope || 'HYBRID_BOTH',
      ...existingData
    });
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

  const updateStoreProfile = (profileData) => {
    setCurrentShopState((prev) => {
      const updated = { ...(prev || {}), ...profileData };
      localStorage.setItem('pharmalink_active_shop', JSON.stringify(updated));
      return updated;
    });
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
    onboardNewTenant,
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
