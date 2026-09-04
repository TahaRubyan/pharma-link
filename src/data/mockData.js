// Pakistani Pharmacy Store Information & Production Setup (Clean Slate — Zero Pre-Added Data)

export const MULTI_TENANT_SHOPS = [
  {
    shopId: "SHOP-ISB-01",
    shopName: "Idrees Pharma Distributor",
    city: "Gujrat",
    dlNumber: "09-342-0139-045748D",
    gstin: "3277876174544",
    ntn: "4442705-7",
    address: "Jalal Pur Jattan, Gujrat",
    phone: "053-3724601, 053-3724602",
  },
  {
    shopId: "SHOP-LHR-02",
    shopName: "Al-Madina Wholesale Medicine Depot",
    city: "Lahore",
    dlNumber: "PK-DL-20-99410 & Form 21",
    gstin: "PK-9876543-2",
    ntn: "7741920-3",
    address: "Main Wholesale Market, Lahore",
    phone: "042-3578900",
  },
];

export const STORE_INFO = {
  shopId: "SHOP-ISB-01",
  name: "IDREES PHARMA DISTRIBUTOR",
  address: "Jalal Pur Jattan, Gujrat",
  phone: "053-3724601, 053-3724602",
  dlNumber: "09-342-0139-045748D",
  gstin: "3277876174544",
  ntn: "4442705-7",
};

export const MOCK_STAFF_ACCOUNTS = [
  {
    id: "EMP-101",
    name: "Idrees (Admin)",
    username: "idrees.admin",
    role: "Admin",
    title: "Authorized Signatory | Owner",
    phone: "+92 300 1234567",
    status: "Active",
  },
  {
    id: "EMP-102",
    name: "Hassan (Cashier)",
    username: "hassan.cashier",
    role: "Cashier",
    title: "POS Billing & Invoicing Cashier",
    phone: "+92 300 7654321",
    status: "Active",
  },
  {
    id: "EMP-103",
    name: "Ayan (Delivery)",
    username: "ayan.delivery",
    role: "Delivery Staff",
    title: "Regional Delivery Logistics Driver",
    phone: "+92 333 5566778",
    status: "Active",
  },
];

// Clean Production Slates (Zero Pre-Added Mock Data)
export const INITIAL_MEDICINES = [];
export const INITIAL_BATCHES = [];
export const INITIAL_SUPPLIERS = [];
export const INITIAL_PURCHASE_ORDERS = [];
export const INITIAL_VENDOR_RETURNS = [];
export const INITIAL_INVOICES = [];
export const INITIAL_PATIENTS = [];
