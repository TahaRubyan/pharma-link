import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  UserCheck, 
  AlertCircle,
  FileCheck,
  CheckCircle,
  Edit2,
  Percent,
  DollarSign,
  RotateCcw,
  UserPlus,
  ShieldAlert,
  Layers,
  CreditCard,
  Send,
  Sparkles,
  HeartPulse,
  Save,
  Truck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useCart } from '../context/CartContext';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';
import { useCustomerDebt } from '../context/CustomerDebtContext';
import { usePatient } from '../context/PatientContext';
import { useCustomer } from '../context/CustomerContext';
import { loadRetailMockData } from '../services/mockDataManager';
import A4InvoicePrintModal from '../components/modals/A4InvoicePrintModal';
import EditLineDiscountTaxModal from '../components/modals/EditLineDiscountTaxModal';
import WholesaleCustomerModal from '../components/modals/WholesaleCustomerModal';
import SalesReturnModal from '../components/modals/SalesReturnModal';
import ThermalPrintModal from '../components/modals/ThermalPrintModal';
import PatientRxDrawer from '../components/modals/PatientRxDrawer';
import RetailSalesReturnModal from '../components/modals/RetailSalesReturnModal';
import POSDebtCustomerModal from '../components/modals/POSDebtCustomerModal';
import WhatsAppCreditModal from '../components/modals/WhatsAppCreditModal';
import AppAlertModal from '../components/modals/AppAlertModal';
import CustomerFormModal from '../components/modals/CustomerFormModal';

export const POSPage = ({ storeMode: propStoreMode }) => {
  const { medicines = [], batches = [], getEarliestValidBatch, deductStock, isExpiryGreaterThan6Months, isExpiryWithin6Months } = useInventory();
  const { cart, addToCart, updateQty, updateCartItem, updateUnitType, removeFromCart, clearCart, rxPatient, setRxPatient, openModal } = useCart();
  const { recordSale } = useSales();
  const { currentShop, user } = useAuth();
  const { recordCreditSale } = useCustomerDebt();
  const { activePatientForPOS, clearActivePatientForPOS } = usePatient();

  const isRetail = (propStoreMode || currentShop?.mode) === 'RETAIL';

  useEffect(() => {
    if (activePatientForPOS) {
      setRxPatient({
        name: activePatientForPOS.name || '',
        phone: activePatientForPOS.phone || '',
        doctorName: activePatientForPOS.prescribingDoctor || '',
        doctorRegNo: activePatientForPOS.doctorRegNo || '',
        address: activePatientForPOS.address || '',
      });
    }
  }, [activePatientForPOS]);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedHighlightIndex, setSelectedHighlightIndex] = useState(0);

  // Retail Tendered Cash State
  const [cashTendered, setCashTendered] = useState('');

  // Wholesale Customer State (Clean Slate - No Mock Data)
  const [customerData, setCustomerData] = useState({
    customerName: isRetail ? 'Walk-in Retail Customer' : 'Walk-in / Cash Customer',
    shopName: isRetail ? '' : (currentShop?.shopName || 'Testing Shop'),
    region: currentShop?.city || 'Lahore',
    customerAddress: '',
    licenseNo: '',
    customerNtn: '',
    customerStrn: '',
    filerStatus: 'FILER',
    customerPhone: '',
    bookingMan: '',
    refNo: '',
    deliveryMan: 'Express Delivery / Rider',
  });

  // Wholesale Payment Terms: 'DUE' (Territory Delivery Due) | 'CASH' (Immediate Cash)
  const [wholesalePaymentTerms, setWholesalePaymentTerms] = useState('DUE');

  // Wholesale & Retail Discounts (% percentage)
  const [discountPercent, setDiscountPercent] = useState('0');
  const [includeSection23Warranty, setIncludeSection23Warranty] = useState(() => {
    if (currentShop?.warrantySettings?.enableSec23 !== undefined) return currentShop.warrantySettings.enableSec23;
    return true;
  });
  const [includeDrapWarranty, setIncludeDrapWarranty] = useState(() => {
    if (currentShop?.warrantySettings?.enableDrap !== undefined) return currentShop.warrantySettings.enableDrap;
    return true;
  });

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [isRetailReturnModalOpen, setIsRetailReturnModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [completedThermalInvoice, setCompletedThermalInvoice] = useState(null);

  // Debt & WhatsApp Modals
  const [isPOSDebtModalOpen, setIsPOSDebtModalOpen] = useState(false);
  const [completedDebtSale, setCompletedDebtSale] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Customer Context & Instant POS Customer Search State
  const { customers = [], addCustomer } = useCustomer();
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isCustomerFormModalOpen, setIsCustomerFormModalOpen] = useState(false);

  // Pre-defined Designed Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'QUARANTINED',
    title: '',
    message: '',
    itemDetails: null,
    actionLabel: null,
    onAction: null,
  });

  const showAlert = ({ type = 'QUARANTINED', title = '', message = '', itemDetails = null, actionLabel = null, onAction = null }) => {
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      itemDetails,
      actionLabel,
      onAction,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearchInput.trim()) return customers.slice(0, 8);
    const q = customerSearchInput.toLowerCase().trim();
    return customers.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.shopName && c.shopName.toLowerCase().includes(q)) ||
      (c.region && c.region.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.ntn && c.ntn.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [customers, customerSearchInput]);

  const handleSelectCustomerRecord = (c) => {
    setCustomerData({
      customerName: c.name || c.customerName || 'Customer',
      shopName: c.shopName || c.name || '',
      region: c.region || '',
      customerAddress: c.address || c.customerAddress || '',
      licenseNo: c.licenseNo || '',
      customerNtn: c.ntn || c.customerNtn || '',
      customerStrn: c.gstn || c.customerStrn || c.strn || '',
      filerStatus: c.filerStatus || 'FILER',
      customerPhone: c.phone || c.customerPhone || '',
      bookingMan: customerData.bookingMan || '',
      refNo: customerData.refNo || '',
      deliveryMan: customerData.deliveryMan || 'Express Delivery / Rider',
    });
    setCustomerSearchInput('');
    setIsCustomerSearchOpen(false);
  };

  const searchInputRef = useRef(null);
  const suggestionListRef = useRef(null);

  // Multi-field instant search with DISPLAY_LIMIT = 40 windowing for 60fps counter speed under pressure
  const DISPLAY_LIMIT = 40;
  const searchResults = useMemo(() => {
    if (!isSearchFocused && !searchQuery.trim()) return [];
    if (!searchQuery.trim()) return medicines.slice(0, DISPLAY_LIMIT);

    const q = searchQuery.toLowerCase().trim();

    // Fast O(1) scan for exact barcode or itemCode match
    const exactMatch = medicines.find(
      (m) => (m.barcode && m.barcode.toLowerCase() === q) || (m.itemCode && m.itemCode.toString().toLowerCase() === q)
    );
    if (exactMatch) {
      return [exactMatch];
    }

    const results = [];
    for (let i = 0; i < medicines.length; i++) {
      const m = medicines[i];
      const matches =
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.brandName && m.brandName.toLowerCase().includes(q)) ||
        (m.formula && m.formula.toLowerCase().includes(q)) ||
        (m.genericFormula && m.genericFormula.toLowerCase().includes(q)) ||
        (m.itemCode && m.itemCode.toString().toLowerCase().includes(q)) ||
        (m.barcode && m.barcode.toLowerCase().includes(q)) ||
        (m.rackLocation && m.rackLocation.toLowerCase().includes(q)) ||
        (m.location && m.location.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q));

      if (matches) {
        results.push(m);
        if (results.length >= DISPLAY_LIMIT) break;
      }
    }
    return results;
  }, [medicines, searchQuery, isSearchFocused]);

  // Keep highlighted index in view when navigating with arrow keys
  useEffect(() => {
    if (isSearchFocused && searchResults.length > 0) {
      const itemEl = document.getElementById(`search-result-item-${selectedHighlightIndex}`);
      if (itemEl && suggestionListRef.current) {
        itemEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedHighlightIndex, searchResults]);

  // Full Keyboard Navigation (Hotkeys F1-F9, Arrow Keys, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else if (e.key === 'F9' && isRetail && cart.length > 0) {
        e.preventDefault();
        handleRetailCheckoutPrint();
      }

      if (e.key === 'Enter') {
        if (document.activeElement === searchInputRef.current) {
          e.preventDefault();
          if (!isSearchFocused) {
            setIsSearchFocused(true);
            setSelectedHighlightIndex(0);
          } else if (searchResults.length > 0) {
            const match = searchResults[selectedHighlightIndex];
            if (match) {
              handleSelectMedicine(match);
            }
          }
        }
      } else if (e.key === 'ArrowDown' && isSearchFocused && searchResults.length > 0) {
        e.preventDefault();
        setSelectedHighlightIndex((prev) => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp' && isSearchFocused && searchResults.length > 0) {
        e.preventDefault();
        setSelectedHighlightIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, selectedHighlightIndex, isRetail, cart, isSearchFocused]);

  /**
   * Distinguish between:
   * 1. ACTIVE IN STOCK (tablets > 0, expiry valid)
   * 2. OUT OF STOCK (stock is 0 - cannot sell, but CAN make PO to restock!)
   * 3. QUARANTINED (explicit status 'Quarantined RTV' or DRAP recall - cannot sell & cannot PO)
   * 4. SHORT EXPIRY (wholesale expiry <= 6 months - routed to RTV)
   */
  const getMedicineStockStatus = (medicine) => {
    if (!medicine) return { status: 'OUT_OF_STOCK', reason: 'Item not found' };
    const medId = medicine.id || medicine.itemCode;
    const medCode = medicine.itemCode ? String(medicine.itemCode).trim().toLowerCase() : '';
    const medName = (medicine.name || medicine.brandName || '').trim().toLowerCase();

    // Batches linked to this medicine using flexible matching across ID, code, and name
    const medBatches = batches.filter((b) => {
      const bMedId = String(b.medicineId || b.id || '').trim();
      const bCode = String(b.itemCode || '').trim().toLowerCase();
      const bName = String(b.medicineName || b.name || '').trim().toLowerCase();

      return (
        (medId && bMedId === medId) ||
        (medCode && (bMedId.toLowerCase() === medCode || bCode === medCode)) ||
        (medName && (bMedId.toLowerCase() === medName || bName === medName))
      );
    });

    // Explicit quarantine flags
    const hasQuarantinedBatch = medBatches.some(
      (b) => b.status === 'Quarantined RTV' || (b.status && b.status.toLowerCase().includes('quarantine'))
    );
    const isExplicitlyQuarantined = Boolean(medicine.isQuarantined || medicine.status === 'Quarantined RTV');

    // In-stock batches (totalTabletsAvailable > 0)
    const inStockBatches = medBatches.filter(
      (b) => (b.totalTabletsAvailable !== undefined ? Number(b.totalTabletsAvailable) > 0 : (Number(b.boxStock) > 0))
    );

    // Calculate effective total stock in boxes from both medicine catalog and batch totals
    const boxStockNumber = Number(medicine.boxStock);
    const tabsPerBox = Number(medicine.tabletsPerBox || (Number(medicine.stripsPerBox || 10) * Number(medicine.tabletsPerStrip || 10)) || 200);
    const batchBoxes = inStockBatches.reduce((acc, b) => acc + ((Number(b.totalTabletsAvailable) || 0) / tabsPerBox), 0);
    const totalAvailableBoxes = Math.max(!isNaN(boxStockNumber) ? boxStockNumber : 0, batchBoxes);

    // If stock is truly depleted (0 boxes both in catalog and batches)
    if (totalAvailableBoxes <= 0 && inStockBatches.length === 0) {
      if (hasQuarantinedBatch || isExplicitlyQuarantined) {
        return { status: 'QUARANTINED', reason: 'Quarantined RTV / Regulatory Lock' };
      }
      return { status: 'OUT_OF_STOCK', reason: 'Stock Depleted (0 Boxes Available)' };
    }

    // If all remaining in-stock batches are quarantined
    const nonQuarantinedInStock = inStockBatches.filter((b) => b.status !== 'Quarantined RTV');
    if (inStockBatches.length > 0 && nonQuarantinedInStock.length === 0) {
      return { status: 'QUARANTINED', reason: 'Quarantined RTV / Regulatory Lock' };
    }

    // Resolve earliest valid batch (supports passing the medicine object)
    const resolvedBatch = getEarliestValidBatch(medicine, !isRetail);

    if (!resolvedBatch) {
      // In wholesale mode, check if item has stock but expires <= 6 months
      if (!isRetail && (inStockBatches.length > 0 || medicine.expiryDate)) {
        const candidateExpiry = inStockBatches[0]?.expiryDate || medicine.expiryDate;
        if (candidateExpiry && typeof isExpiryWithin6Months === 'function' && isExpiryWithin6Months(candidateExpiry)) {
          return { status: 'SHORT_EXPIRY', batch: inStockBatches[0], reason: `Expiry (${candidateExpiry}) is within 6 Months` };
        }
      }

      // If positive box stock exists, provision an active batch so sale is NEVER blocked
      if (totalAvailableBoxes > 0) {
        const boxCost = Number(medicine.purchaseCost !== undefined ? medicine.purchaseCost : (medicine.purchasePriceBox !== undefined ? medicine.purchasePriceBox : (medicine.boxCost || 0)));
        const sellingRate = Number(medicine.boxSellingPrice !== undefined ? medicine.boxSellingPrice : (medicine.boxPrice !== undefined ? medicine.boxPrice : (medicine.price || boxCost)));
        const activeProvisionedBatch = {
          id: `BATCH-${medicine.id || 'STOCK'}-ACTIVE`,
          batchNo: medicine.batchNo || `B26-${medicine.itemCode || 'STOCK'}`,
          batchNumber: medicine.batchNo || `B26-${medicine.itemCode || 'STOCK'}`,
          medicineId: medicine.id || medId,
          distributorName: medicine.manufacturer || 'Authorized Distributor',
          expiryDate: medicine.expiryDate || '2028-12-31',
          totalTabletsAvailable: totalAvailableBoxes * tabsPerBox,
          boxPrice: sellingRate,
          boxSellingPrice: sellingRate,
          purchasePriceBox: boxCost,
          purchaseRate: boxCost,
          purchaseCost: boxCost,
          pricePerTablet: Number(medicine.pricePerTablet || (tabsPerBox > 0 ? (sellingRate / tabsPerBox) : 0)),
          status: 'Active Stock',
          rackLocation: medicine.rackLocation || '',
        };
        return { status: 'AVAILABLE', batch: activeProvisionedBatch, availableBoxes: totalAvailableBoxes };
      }

      return { status: 'OUT_OF_STOCK', reason: 'Stock Depleted (0 Boxes Available)' };
    }

    return { status: 'AVAILABLE', batch: resolvedBatch, availableBoxes: totalAvailableBoxes };
  };

  const handleSelectMedicine = (medicine) => {
    const stockStatus = getMedicineStockStatus(medicine);

    if (stockStatus.status === 'QUARANTINED') {
      showAlert({
        type: 'QUARANTINED',
        title: 'Item Quarantined — Regulatory Restriction',
        message: `You cannot add "${medicine.brandName || medicine.name}" to cart or make a PO on it. This pharmaceutical product is currently placed under Quarantine (DRAP / Vendor RTV) and is legally restricted from counter sales and purchasing until cleared by the Pharmacist.`,
        itemDetails: {
          name: medicine.brandName || medicine.name,
          itemCode: medicine.itemCode || medicine.id,
          status: 'Quarantined RTV',
          expiryDate: medicine.expiryDate || 'N/A',
        }
      });
      return;
    }

    if (stockStatus.status === 'OUT_OF_STOCK') {
      showAlert({
        type: 'OUT_OF_STOCK',
        title: 'Stock Depleted (Zero Inventory)',
        message: `"${medicine.brandName || medicine.name}" currently has 0 available boxes in active inventory. You cannot add this item to cart. You can generate an Inward Purchase Order (PO) to replenish stock from authorized suppliers.`,
        itemDetails: {
          name: medicine.brandName || medicine.name,
          itemCode: medicine.itemCode || medicine.id,
          status: 'Out of Stock (0 Units Available)',
        }
      });
      return;
    }

    if (stockStatus.status === 'SHORT_EXPIRY') {
      showAlert({
        type: 'SHORT_EXPIRY',
        title: 'DRAP Wholesale Expiry Lock (≤ 6 Months)',
        message: `Cannot sell "${medicine.brandName || medicine.name}". The earliest available batch (${stockStatus.batch?.expiryDate || 'N/A'}) expires within 6 months. Under DRAP Wholesale Drug Rules (Form 20/21), near-expiry stock is locked from counter sales and routed to Vendor Returns (RTV).`,
        itemDetails: {
          name: medicine.brandName || medicine.name,
          itemCode: medicine.itemCode || medicine.id,
          batchNo: stockStatus.batch?.batchNo || stockStatus.batch?.batchNumber || 'N/A',
          expiryDate: stockStatus.batch?.expiryDate || 'N/A',
          status: '≤ 6M Near Expiry (RTV)',
        }
      });
      return;
    }

    // Available: Add to cart
    if (!isRetail) {
      addToCart(medicine, stockStatus.batch, 'Box');
    } else {
      addToCart(medicine, stockStatus.batch, 'Tablet');
    }

    setSearchQuery('');
    setSelectedHighlightIndex(0);
    setIsSearchFocused(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Cart Calculations
  const hasControlledOrRx = cart.some(
    (i) => i.requiresPrescription || i.controlledType === 'Narcotic' || i.controlledType === 'Steroid'
  );

  const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

  const getItemRate = (item) => {
    if (item.boxPrice !== undefined && item.boxPrice !== null && !isNaN(Number(item.boxPrice))) return Number(item.boxPrice);
    if (item.price !== undefined && item.price !== null && !isNaN(Number(item.price))) return Number(item.price);
    if (item.unitPrice !== undefined && item.unitPrice !== null && !isNaN(Number(item.unitPrice))) return Number(item.unitPrice);
    if (item.boxSellingPrice !== undefined && item.boxSellingPrice !== null && !isNaN(Number(item.boxSellingPrice))) return Number(item.boxSellingPrice);
    if (item.purchaseCost !== undefined && item.purchaseCost !== null && !isNaN(Number(item.purchaseCost))) return Number(item.purchaseCost);
    if (item.purchasePriceBox !== undefined && item.purchasePriceBox !== null && !isNaN(Number(item.purchasePriceBox))) return Number(item.purchasePriceBox);
    return 0;
  };

  const grossSubtotal = round2(cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    let unitPrice = getItemRate(item);

    if (isRetail) {
      if (item.unitSelection === 'Tablet') {
        unitPrice = Number(item.pricePerTablet || (unitPrice / (item.tabletsPerBox || 200)) || 0);
      } else if (item.unitSelection === 'Strip') {
        unitPrice = Number(item.stripPrice || (unitPrice / (item.stripsPerBox || 10)) || 0);
      }
    }

    return sum + unitPrice * q;
  }, 0));

  const totalLineDiscounts = round2(cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = getItemRate(item);
    const gross = rate * q;
    const disc = item.discount !== undefined ? Number(item.discount) : (gross * (Number(item.discountPercent || 0) / 100));
    return sum + disc;
  }, 0));

  const totalSalesTax18 = round2(cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = getItemRate(item);
    const gross = rate * q;
    const disc = item.discount !== undefined ? Number(item.discount) : (gross * (Number(item.discountPercent || 0) / 100));
    const taxable = Math.max(0, gross - disc);
    const tr = Number(item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
    if (tr === 18) {
      return sum + (item.salesTax18 !== undefined && item.salesTax18 !== null ? Number(item.salesTax18) : (taxable * 0.18));
    }
    return sum;
  }, 0));

  const totalSalesTax19 = round2(cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = getItemRate(item);
    const gross = rate * q;
    const disc = item.discount !== undefined ? Number(item.discount) : (gross * (Number(item.discountPercent || 0) / 100));
    const taxable = Math.max(0, gross - disc);
    const tr = Number(item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
    if (tr === 19) {
      return sum + (item.salesTax18 !== undefined && item.salesTax18 !== null ? Number(item.salesTax18) : (taxable * 0.19));
    }
    return sum;
  }, 0));

  const totalOtherSalesTax = round2(cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = getItemRate(item);
    const gross = rate * q;
    const disc = item.discount !== undefined ? Number(item.discount) : (gross * (Number(item.discountPercent || 0) / 100));
    const taxable = Math.max(0, gross - disc);
    const tr = Number(item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18);
    if (tr !== 18 && tr !== 19 && tr > 0) {
      return sum + (item.salesTax18 !== undefined && item.salesTax18 !== null ? Number(item.salesTax18) : (taxable * (tr / 100)));
    }
    return sum;
  }, 0));

  const totalSalesTaxAll = round2(totalSalesTax18 + totalSalesTax19 + totalOtherSalesTax);

  const totalAdvTax05 = round2(cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = getItemRate(item);
    const gross = rate * q;
    const disc = item.discount !== undefined ? Number(item.discount) : (gross * (Number(item.discountPercent || 0) / 100));
    const taxable = Math.max(0, gross - disc);
    return sum + (item.advTax05 !== undefined && item.advTax05 !== null ? Number(item.advTax05) : (taxable * 0.005));
  }, 0));

  const totalTaxes = isRetail ? 0 : round2(totalSalesTaxAll + totalAdvTax05);
  const orderDiscountAmount = round2((grossSubtotal * (Number(discountPercent) || 0)) / 100);
  const finalBillAmount = Math.max(0, round2(grossSubtotal - totalLineDiscounts - orderDiscountAmount + totalTaxes));

  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = Math.max(0, round2(tenderedNum - finalBillAmount));

  const handleRowDoubleClick = (item) => {
    if (!isRetail) {
      setEditingItem(item);
      setIsEditModalOpen(true);
    }
  };

  const handleUnitToggle = (item, newUnit) => {
    if (typeof updateUnitType === 'function') {
      updateUnitType(item.medicineId || item.id, item.batchNo || item.batchNumber, newUnit);
    }
  };

  const handleSaveItemUpdates = (updatedItem) => {
    if (typeof updateCartItem === 'function') {
      updateCartItem(updatedItem);
    } else {
      updateQty(updatedItem.medicineId || updatedItem.id, updatedItem.batchNo || updatedItem.batchNumber, updatedItem.qty);
    }
  };

  // Build Invoice Data Object
  const generateInvoiceData = (isPrint = false, paymentModeOverride = null) => {
    const isWholesaleCredit = !isRetail && (paymentModeOverride === 'CREDIT' || wholesalePaymentTerms === 'DUE');
    const isRetailCredit = isRetail && paymentModeOverride === 'CREDIT';
    const isCredit = isWholesaleCredit || isRetailCredit;
    const paymentMode = paymentModeOverride || (isCredit ? 'CREDIT' : 'Cash');
    const paymentStatus = isCredit ? 'NOT_PAID' : 'PAID';
    const remainingDebt = isCredit ? finalBillAmount : 0;

    const initialLogs = isCredit ? [] : [{
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amountPaid: finalBillAmount,
      remainingDebt: 0,
      collectedBy: user ? user.name : 'Testing Shop Admin',
      method: 'Cash at Counter'
    }];

    return {
      invoiceNo: isRetail ? `INV-RET-${Date.now().toString().slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      saleType: isRetail ? (isCredit ? 'Retail Credit / Debt' : 'Retail Cash') : (isCredit ? 'Wholesale Territory Delivery (Due)' : 'Wholesale Commercial (Cash)'),
      customerName: isRetail ? (rxPatient ? rxPatient.name : 'Walk-in Retail Customer') : (customerData.customerName || 'Walk-in Customer'),
      customerShopName: isRetail ? '' : (customerData.shopName || customerData.customerName || ''),
      shopName: currentShop?.shopName || 'Testing Shop',
      customerPhone: rxPatient ? rxPatient.phone : (customerData.customerPhone || ''),
      customerAddress: rxPatient ? rxPatient.address : (customerData.customerAddress || ''),
      region: isRetail ? (rxPatient?.city || currentShop?.city || '') : (customerData.region || currentShop?.city || ''),
      deliveryMan: customerData.deliveryMan || (isRetail ? 'Counter Handover' : 'Express Delivery / Rider'),
      bookingMan: customerData.bookingMan || '',
      licenseNo: customerData.licenseNo || '',
      customerNtn: customerData.customerNtn || '',
      customerStrn: customerData.customerStrn || '',
      filerStatus: customerData.filerStatus || 'FILER',
      doctorName: rxPatient ? rxPatient.doctorName : (hasControlledOrRx ? 'Dr. Tariq Parvez (PMC-88120)' : '-'),
      cashierName: user ? user.name : 'Testing Shop Admin',
      items: [...cart],
      subtotal: grossSubtotal,
      grossTotal: grossSubtotal,
      discountPercent: Number(discountPercent) || 0,
      discount: round2(totalLineDiscounts + orderDiscountAmount),
      totalSalesTax18,
      totalSalesTax19,
      totalOtherSalesTax,
      totalSalesTaxAll,
      totalAdvTax05,
      totalTax: totalTaxes,
      netTotal: finalBillAmount,
      grandTotal: finalBillAmount,
      cashTendered: isCredit ? 0 : (tenderedNum > 0 ? tenderedNum : finalBillAmount),
      changeDue: isCredit ? 0 : (tenderedNum > 0 ? changeDue : 0),
      includeSection23Warranty,
      includeDrapWarranty,
      paymentMode,
      paymentStatus,
      remainingDebt,
      paymentLogs: initialLogs,
    };
  };

  // 1. Action: Print Receipt & Complete Cash Checkout
  const handleRetailCheckoutPrint = () => {
    if (cart.length === 0) {
      showAlert({
        type: 'WARNING',
        title: 'Billing Cart Empty',
        message: 'Your cart is empty. Please search and add medicines before printing receipt.',
      });
      return;
    }
    if (isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      const invoiceData = generateInvoiceData(true, 'Cash');
      deductStock(cart);
      recordSale(invoiceData);
      setCompletedThermalInvoice(invoiceData);
      clearCart();
      setCashTendered('');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // 2. Action: Save Order / Instant Cash Checkout
  const handleSaveOrderCash = () => {
    if (cart.length === 0) {
      showAlert({
        type: 'WARNING',
        title: 'Billing Cart Empty',
        message: 'Your cart is empty. Please search and add medicines to bill before saving order.',
      });
      return;
    }
    if (isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      const invoiceData = generateInvoiceData(false, 'Cash');
      deductStock(cart);
      recordSale(invoiceData);
      clearCart();
      setCashTendered('');
      showAlert({
        type: 'INFO',
        title: 'Order Saved & Stock Deducted',
        message: `Invoice #${invoiceData.invoiceNo} for Rs. ${invoiceData.netTotal.toFixed(2)} completed successfully! Stock updated.`,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // 3. Action: Add to Customer Debt / Udhar (Khata)
  const handleInitiateDebtCheckout = () => {
    if (cart.length === 0) {
      showAlert({
        type: 'WARNING',
        title: 'Billing Cart Empty',
        message: 'Your cart is empty. Please search and add medicines before initiating Khata (credit) sale.',
      });
      return;
    }
    setIsPOSDebtModalOpen(true);
  };

  const handleConfirmCreditSale = (debtCustomer) => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      const invoiceData = generateInvoiceData(false, 'CREDIT');
      invoiceData.customerName = debtCustomer.name;
      invoiceData.customerPhone = debtCustomer.phone;
      invoiceData.customerAddress = debtCustomer.address;

      // Record to Customer Debt Ledger
      recordCreditSale(debtCustomer.id, invoiceData);

      // Record in global sales history
      recordSale(invoiceData);

      // Deduct stock from earliest expiry batch
      deductStock(cart);

      setIsPOSDebtModalOpen(false);
      clearCart();
      setCashTendered('');

      // Open WhatsApp Share prompt
      setCompletedDebtSale({
        customer: debtCustomer,
        saleData: invoiceData,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Wholesale Checkout -> A4 Commercial Dual-Page Invoice
  const handleWholesaleCheckout = (forcedTerms = null) => {
    if (cart.length === 0) {
      showAlert({
        type: 'WARNING',
        title: 'Billing Cart Empty',
        message: 'Please add medicines to cart to generate commercial wholesale invoice.',
      });
      return;
    }
    if (isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      const activeTerms = forcedTerms || wholesalePaymentTerms;
      const invoiceData = generateInvoiceData(true, activeTerms === 'DUE' ? 'CREDIT' : 'Cash');
      deductStock(cart);
      recordSale(invoiceData);
      setCompletedInvoice(invoiceData);
      clearCart();
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-sans)' }}>
      {/* TOP ACTION BANNER: CUSTOMER AUTO-SEARCH & DETAILS */}
      <div 
        className="card" 
        style={{ 
          padding: '0.75rem 1rem', 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '0.75rem',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Active Customer Badge & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <UserCheck size={16} color="#0284c7" />
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#64748b', fontSize: '11px' }}>Customer: </span>
              <strong style={{ color: '#0f172a' }}>{rxPatient ? rxPatient.name : (customerData.customerName || 'Walk-in Customer')}</strong>
              {customerData.region && !rxPatient && (
                <span style={{ marginLeft: '0.4rem', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                  📍 {customerData.region}
                </span>
              )}
              {customerData.customerNtn && customerData.customerNtn !== '-' && !rxPatient && (
                <span style={{ marginLeft: '0.35rem', backgroundColor: '#f1f5f9', color: '#334155', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  NTN: {customerData.customerNtn}
                </span>
              )}
            </div>

            {((customerData.customerName && customerData.customerName !== 'Walk-in Retail Customer' && customerData.customerName !== 'Walk-in / Cash Customer') || rxPatient) && (
              <button
                type="button"
                onClick={() => {
                  if (rxPatient) {
                    setRxPatient(null);
                    if (typeof clearActivePatientForPOS === 'function') clearActivePatientForPOS();
                  } else {
                    setCustomerData({
                      customerName: isRetail ? 'Walk-in Retail Customer' : 'Walk-in / Cash Customer',
                      shopName: '',
                      region: currentShop?.city || 'Lahore',
                      customerAddress: '',
                      licenseNo: '',
                      customerNtn: '',
                      customerStrn: '',
                      filerStatus: 'FILER',
                      customerPhone: '',
                      bookingMan: '',
                      refNo: '',
                      deliveryMan: 'Express Delivery / Rider',
                    });
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '0 0.25rem' }}
                title="Reset to Walk-in Customer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Instant Customer Search & On-the-spot Add */}
          <div style={{ position: 'relative', width: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', color: '#94a3b8' }} />
              <input
                type="text"
                value={customerSearchInput}
                onChange={(e) => {
                  setCustomerSearchInput(e.target.value);
                  setIsCustomerSearchOpen(true);
                }}
                onFocus={() => setIsCustomerSearchOpen(true)}
                placeholder="Search customer by name / NTN / phone..."
                style={{
                  width: '100%',
                  padding: '0.4rem 0.65rem 0.4rem 2rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Dropdown for Customer Autocomplete */}
            {isCustomerSearchOpen && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  marginTop: '0.25rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  zIndex: 110,
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '0.35rem 0.65rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Select Customer ({filteredCustomerOptions.length} Matches)</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => setIsCustomerSearchOpen(false)}>✕ Close</span>
                </div>

                {filteredCustomerOptions.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomerRecord(c)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.name || c.customerName}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {c.region ? `📍 ${c.region} • ` : ''}Ph: {c.phone || '-'} {c.ntn && c.ntn !== '-' ? `• NTN: ${c.ntn}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700 }}>Select ↵</span>
                  </div>
                ))}

                {/* On-the-spot Add Customer Action in Dropdown */}
                <div
                  onClick={() => {
                    setIsCustomerSearchOpen(false);
                    setIsCustomerFormModalOpen(true);
                  }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <UserPlus size={14} />
                  <span>+ Add New Customer &quot;{customerSearchInput || 'on the spot'}&quot;</span>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated "+ New Customer" button */}
          <button
            onClick={() => setIsCustomerFormModalOpen(true)}
            className="btn btn-outline"
            style={{ 
              borderRadius: '8px', 
              fontSize: '11px', 
              borderColor: '#0284c7', 
              color: '#0284c7', 
              padding: '0.4rem 0.75rem', 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <UserPlus size={13} /> + New Customer
          </button>

          {/* Retail Rx Drawer toggle button */}
          {isRetail && (
            <button
              onClick={() => openModal('rx_drawer')}
              className="btn btn-outline"
              style={{ borderRadius: '8px', fontSize: '11px', borderColor: '#d97706', color: '#d97706', padding: '0.4rem 0.75rem', fontWeight: 700 }}
            >
              <HeartPulse size={13} /> {rxPatient ? `Rx: ${rxPatient.name}` : '+ Patient Rx'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={clearCart}
            className="btn btn-outline"
            style={{ borderRadius: '8px', fontSize: '11px', padding: '0.4rem 0.65rem' }}
            title="Hotkey: F1"
          >
            Clear Cart (F1)
          </button>
          <button
            onClick={() => (isRetail ? setIsRetailReturnModalOpen(true) : setIsSalesReturnModalOpen(true))}
            className="btn btn-outline"
            style={{ borderRadius: '8px', fontSize: '11px', padding: '0.4rem 0.65rem', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            <RotateCcw size={13} /> {isRetail ? 'Counter Return' : 'Sales Return'}
          </button>
        </div>
      </div>

      {/* RETAIL PRESCRIPTION WARNING NOTICE */}
      {isRetail && hasControlledOrRx && (
        <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '0.65rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
            <ShieldAlert size={18} color="#b45309" />
            <span>⚠️ Prescription / Controlled Drug in Cart — Dr. Name & Patient details required for DRAP Form 6/7 Register</span>
          </div>

          <button
            onClick={() => openModal('rx_drawer')}
            className="btn btn-primary"
            style={{ fontSize: '11px', padding: '0.3rem 0.65rem', backgroundColor: '#b45309', borderRadius: '8px' }}
          >
            {rxPatient ? 'Edit Rx Details' : '+ Collect Rx Record'}
          </button>
        </div>
      )}

      {/* 2-COLUMN MAIN POS LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem' }}>
        {/* LEFT COLUMN: SEARCH BAR & BILLING CART TABLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* SEARCH BAR (ENTER ACTIVATES SUGGESTIONS) */}
          <div className="card" style={{ padding: '0.85rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#0284c7' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isRetail ? "Search Medicine (Name, Formula, Shelf Rack A-01, Barcode) — Press [Enter] to browse/select..." : "Type Item Name, Code (e.g. med-101), Formula, Location — Press [Enter]..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                  setSelectedHighlightIndex(0);
                }}
                style={{ width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.6rem', borderRadius: '12px', border: '2px solid #0284c7', fontSize: '13px', outline: 'none', fontWeight: 600 }}
                autoFocus
              />
            </div>

            {/* TESTING HELPER BANNER WHEN RETAIL INVENTORY IS EMPTY */}
            {medicines.length === 0 && isRetail && (
              <div style={{ marginTop: '0.65rem', padding: '0.6rem 0.85rem', backgroundColor: '#f0f9ff', border: '1px dashed #7dd3fc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '11.5px', color: '#0369a1' }}>
                  <strong>💡 Testing Mode:</strong> Retail inventory is empty. Load sample medicines to test fast barcode search & 80mm receipts.
                </div>
                <button
                  onClick={() => loadRetailMockData(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '0.3rem 0.75rem', borderRadius: '7px', backgroundColor: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Sparkles size={12} /> Load Sample Medicines
                </button>
              </div>
            )}

            {/* SEARCH DROPDOWN (AUTO-SCROLL ON ARROW DOWN / UP) */}
            {searchResults.length > 0 && isSearchFocused && (
              <div 
                ref={suggestionListRef}
                style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  top: '100%', 
                  marginTop: '0.35rem', 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '14px', 
                  boxShadow: '0 12px 30px -5px rgba(0,0,0,0.18)', 
                  zIndex: 100, 
                  maxHeight: '340px', 
                  overflowY: 'auto' 
                }}
              >
                <div style={{ padding: '0.4rem 0.85rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Showing {searchResults.length} Medicines (Use ↑ ↓ arrow keys to scroll, Enter to add)</span>
                  <span>Esc to close</span>
                </div>

                {searchResults.map((m, idx) => {
                  const isSelected = idx === selectedHighlightIndex;
                  const cost = Number(m.purchaseCost !== undefined ? m.purchaseCost : (m.purchasePriceBox !== undefined ? m.purchasePriceBox : (m.boxCost || 0)));
                  const price = Number(m.boxSellingPrice !== undefined ? m.boxSellingPrice : (m.boxPrice !== undefined ? m.boxPrice : (m.price || cost)));
                  const tabs = Number(m.tabletsPerBox || 200);
                  const tabPrice = Number(m.pricePerTablet || (tabs > 0 ? (price / tabs) : 0));
                  const stockInfo = getMedicineStockStatus(m);
                  const isQuarantined = stockInfo.status === 'QUARANTINED';
                  const isOutOfStock = stockInfo.status === 'OUT_OF_STOCK';
                  const isShortExpiry = stockInfo.status === 'SHORT_EXPIRY';
                  const wholesaleBatch = stockInfo.batch || (!isRetail ? getEarliestValidBatch(m.id || m.itemCode, false) : null);

                  const highlightBg = isQuarantined ? '#dc2626' : (isShortExpiry ? '#ea580c' : (isOutOfStock ? '#d97706' : '#0284c7'));

                  return (
                    <div
                      id={`search-result-item-${idx}`}
                      key={m.id || idx}
                      onClick={() => handleSelectMedicine(m)}
                      style={{
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? highlightBg : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                      onMouseEnter={() => setSelectedHighlightIndex(idx)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span>{m.name || m.brandName}</span>
                          {isRetail && m.controlledType === 'Narcotic' && <span style={{ fontSize: '9px', backgroundColor: '#dc2626', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>NARCOTIC</span>}
                          {isRetail && m.requiresPrescription && m.controlledType !== 'Narcotic' && <span style={{ fontSize: '9px', backgroundColor: '#d97706', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>Rx</span>}
                          {isQuarantined && (
                            <span style={{ fontSize: '9px', backgroundColor: isSelected ? '#7f1d1d' : '#fee2e2', color: isSelected ? '#fecaca' : '#dc2626', border: '1px solid #f87171', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                              ⛔ QUARANTINED (RTV)
                            </span>
                          )}
                          {isShortExpiry && (
                            <span style={{ fontSize: '9px', backgroundColor: isSelected ? '#7c2d12' : '#ffedd5', color: isSelected ? '#ffedd5' : '#ea580c', border: '1px solid #fdba74', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                              ⏳ ≤6M EXPIRY (RTV)
                            </span>
                          )}
                          {isOutOfStock && (
                            <span style={{ fontSize: '9px', backgroundColor: isSelected ? '#78350f' : '#fef3c7', color: isSelected ? '#fef3c7' : '#d97706', border: '1px solid #fde68a', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                              ⚠️ OUT OF STOCK
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: isSelected ? '#e0f2fe' : '#64748b', marginTop: '0.15rem' }}>
                          Code: {m.itemCode || m.id} • Formula: {m.formula || m.genericFormula} • 📍 Shelf: {m.rackLocation || 'Rack A-01'}
                          {isRetail && <span style={{ marginLeft: '0.5rem', color: '#16a34a', fontWeight: 700 }}>• Exp: {m.expiryDate || '10/2026'}</span>}
                          {!isRetail && wholesaleBatch && <span style={{ marginLeft: '0.5rem', color: isSelected ? '#ffffff' : '#0284c7', fontWeight: 700 }}>• Batch: {wholesaleBatch.batchNumber || wholesaleBatch.batchNo} ({wholesaleBatch.expiryDate})</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#ffffff' : (isQuarantined ? '#dc2626' : isShortExpiry ? '#ea580c' : isOutOfStock ? '#d97706' : '#16a34a') }}>
                          {isQuarantined 
                            ? '⛔ Quarantined' 
                            : isShortExpiry 
                            ? '⏳ ≤6M Expiry' 
                            : isOutOfStock 
                            ? '⚠️ Out of Stock' 
                            : (isRetail ? `Rs. ${tabPrice.toFixed(2)}/tab` : `Rs. ${price.toFixed(2)}/box (+ Taxes)`)}
                        </div>
                        <div style={{ fontSize: '10px', color: isSelected ? '#e0f2fe' : '#64748b' }}>
                          {isQuarantined 
                            ? 'Regulatory Lock' 
                            : isShortExpiry 
                            ? 'RTV Return Only' 
                            : isOutOfStock 
                            ? '0 Boxes Available' 
                            : `Stock: ${m.boxStock !== undefined ? m.boxStock : (stockInfo.availableBoxes || 0)} Boxes`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BILLING CART TABLE */}
          <div className="card" style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="flex-between" style={{ marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShoppingCart size={16} color="#0284c7" /> {isRetail ? 'Retail Counter Billing' : 'Billing Cart Items'} ({cart.length} Items)
                </div>
                <span style={{ fontSize: '11px', color: '#0284c7', fontStyle: 'italic', fontWeight: 600 }}>
                  {isRetail ? '⚡ Fast unit toggles (Tablet / Strip / Box) for loose sales' : '💡 Tip: Double-click any item row to edit discounts & tax rates'}
                </span>
              </div>

              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25px' }}>Sr.</th>
                      <th>Item Name</th>
                      <th>{isRetail ? 'Shelf Expiry' : 'Batch No'}</th>
                      {isRetail && <th>Unit Dispensing</th>}
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Gross</th>
                      {!isRetail && <th style={{ textAlign: 'center' }}>Disc %</th>}
                      {!isRetail && <th style={{ textAlign: 'right' }}>Sale Tax 18%</th>}
                      {!isRetail && <th style={{ textAlign: 'right' }}>Adv Tax 0.5%</th>}
                      <th style={{ textAlign: 'right' }}>Net Amount</th>
                      <th style={{ textAlign: 'center' }}>Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={isRetail ? 8 : 12} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                          Cart is empty. Type in search bar above and press Enter to add medicines to bill.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item, idx) => {
                        const itemQty = Number(item.qty || item.quantity || 1);
                        let itemRate = getItemRate(item);

                        if (isRetail) {
                          if (item.unitSelection === 'Tablet') {
                            itemRate = Number(item.pricePerTablet || (itemRate / (item.tabletsPerBox || 200)) || 0);
                          } else if (item.unitSelection === 'Strip') {
                            itemRate = Number(item.stripPrice || (itemRate / (item.stripsPerBox || 10)) || 0);
                          }
                        }

                        const itemGross = itemRate * itemQty;
                        const itemDisc = Number(item.discount || 0);
                        const itemST = item.salesTax18 !== undefined ? Number(item.salesTax18) : itemGross * 0.18;
                        const itemAdv = item.advTax05 !== undefined ? Number(item.advTax05) : itemGross * 0.005;
                        const itemNet = isRetail ? itemGross : (itemGross - itemDisc + itemST + itemAdv);

                        return (
                          <tr
                            key={idx}
                            onDoubleClick={() => handleRowDoubleClick(item)}
                            style={{ backgroundColor: '#fafafa' }}
                          >
                            <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 700 }}>
                              {item.name || item.brandName}
                              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 400 }}>{item.formula || item.genericFormula}</div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: isRetail ? '#16a34a' : '#0f172a', fontWeight: isRetail ? 700 : 400 }}>
                              {isRetail ? (item.expiryDate ? `Exp: ${item.expiryDate}` : 'Exp: 10/2026') : (item.batchNo || item.batchNumber || 'PND-8821')}
                            </td>

                            {/* RETAIL UNIT DISPENSING TOGGLE PILLS */}
                            {isRetail && (
                              <td>
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUnitToggle(item, 'Tablet')}
                                    style={{
                                      padding: '0.2rem 0.45rem',
                                      fontSize: '10px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      backgroundColor: item.unitSelection === 'Tablet' ? '#0284c7' : '#ffffff',
                                      color: item.unitSelection === 'Tablet' ? '#ffffff' : '#475569',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Tablet
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnitToggle(item, 'Strip')}
                                    style={{
                                      padding: '0.2rem 0.45rem',
                                      fontSize: '10px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      backgroundColor: item.unitSelection === 'Strip' ? '#0284c7' : '#ffffff',
                                      color: item.unitSelection === 'Strip' ? '#ffffff' : '#475569',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Strip
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnitToggle(item, 'Box')}
                                    style={{
                                      padding: '0.2rem 0.45rem',
                                      fontSize: '10px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      backgroundColor: item.unitSelection === 'Box' ? '#0284c7' : '#ffffff',
                                      color: item.unitSelection === 'Box' ? '#ffffff' : '#475569',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Box
                                  </button>
                                </div>
                              </td>
                            )}

                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateQty(item.medicineId || item.id, item.batchNo, itemQty - 1); }}
                                  style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                                >-</button>
                                <span>{itemQty}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateQty(item.medicineId || item.id, item.batchNo, itemQty + 1); }}
                                  style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                                >+</button>
                              </div>
                            </td>

                            <td style={{ textAlign: 'right' }}>{itemRate.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{itemGross.toFixed(2)}</td>

                            {!isRetail && <td style={{ textAlign: 'center', color: '#dc2626' }}>{itemDisc > 0 ? `${item.discountPercent || 0}%` : '-'}</td>}
                            {!isRetail && (
                              <td style={{ textAlign: 'right', color: '#0284c7', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  backgroundColor: (Number(item.saleTaxPercent) === 19) ? '#fef3c7' : '#e0f2fe',
                                  color: (Number(item.saleTaxPercent) === 19) ? '#b45309' : '#0284c7',
                                  padding: '0.1rem 0.3rem',
                                  borderRadius: '4px',
                                  marginRight: '4px'
                                }}>
                                  {item.saleTaxPercent !== undefined ? item.saleTaxPercent : 18}%
                                </span>
                                {itemST.toFixed(2)}
                              </td>
                            )}
                            {!isRetail && <td style={{ textAlign: 'right', color: '#16a34a' }}>{itemAdv.toFixed(2)}</td>}

                            <td style={{ textAlign: 'right', fontWeight: 800 }}>{itemNet.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.medicineId || item.id, item.batchNo); }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                title="Remove Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CASH COUNTER CARD */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'fit-content' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <DollarSign size={16} color="#0284c7" /> {isRetail ? 'Retail POS Counter Checkout' : 'Commercial Cash Counter'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '12px' }}>
              <div className="flex-between">
                <span className="subtext">Gross Subtotal:</span>
                <span style={{ fontWeight: 700 }}>Rs. {grossSubtotal.toFixed(2)}</span>
              </div>

              {!isRetail && (
                <>
                  <div className="flex-between" style={{ color: '#0284c7' }}>
                    <span className="subtext">Sales Tax (18% Standard):</span>
                    <span style={{ fontWeight: 700 }}>+ Rs. {totalSalesTax18.toFixed(2)}</span>
                  </div>

                  {totalSalesTax19 > 0 && (
                    <div className="flex-between" style={{ color: '#b45309' }}>
                      <span className="subtext">Sales Tax (19% Special):</span>
                      <span style={{ fontWeight: 700 }}>+ Rs. {totalSalesTax19.toFixed(2)}</span>
                    </div>
                  )}

                  {totalOtherSalesTax > 0 && (
                    <div className="flex-between" style={{ color: '#0284c7' }}>
                      <span className="subtext">Other Sales Tax:</span>
                      <span style={{ fontWeight: 700 }}>+ Rs. {totalOtherSalesTax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex-between" style={{ color: '#16a34a' }}>
                    <span className="subtext">Adv Tax 0.5% (Sec 236G):</span>
                    <span style={{ fontWeight: 700 }}>+ Rs. {totalAdvTax05.toFixed(2)}</span>
                  </div>

                  <div className="flex-between" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.35rem', fontWeight: 800 }}>
                    <span style={{ color: '#0f172a' }}>Total Taxes Added:</span>
                    <span style={{ color: '#0284c7' }}>+ Rs. {totalTaxes.toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Line Discounts if any */}
              {totalLineDiscounts > 0 && (
                <div className="flex-between" style={{ color: '#dc2626', fontSize: '11px' }}>
                  <span>Item Discounts:</span>
                  <span style={{ fontWeight: 700 }}>- Rs. {totalLineDiscounts.toFixed(2)}</span>
                </div>
              )}

              {/* DISCOUNT IN PERCENTAGE % */}
              <div className="flex-between">
                <span className="subtext" style={{ fontWeight: 600 }}>Discount (%):</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    style={{ width: '60px', padding: '0.25rem 0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right', fontWeight: 800 }}
                  />
                  <span style={{ fontWeight: 700, color: '#64748b' }}>%</span>
                </div>
              </div>

              {Number(discountPercent) > 0 && (
                <div className="flex-between" style={{ color: '#dc2626', fontSize: '11px' }}>
                  <span>Discount Amount:</span>
                  <span style={{ fontWeight: 700 }}>- Rs. {orderDiscountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* LARGE BLUE FINAL BILL BOX */}
            <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '1rem', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.9 }}>
                NET PAYABLE TOTAL:
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '0.2rem' }}>
                Rs. {finalBillAmount.toFixed(2)}
              </div>
            </div>

            {/* RETAIL COUNTER CASH CALCULATOR (TENDERED VS CHANGE DUE) */}
            {isRetail && (
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  💵 Counter Cash Calculator:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                  <div>
                    <label className="subtext" style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Tendered Cash (Rs.):</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, outline: 'none' }}
                    />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>CHANGE DUE:</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#16a34a' }}>Rs. {changeDue.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* WHOLESALE LEGAL WARRANTIES */}
            {!isRetail && (
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Legal Warranty Inclusions for A4 Invoice:
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '11px', color: '#334155', cursor: 'pointer', marginBottom: '0.35rem' }}>
                  <input type="checkbox" checked={includeSection23Warranty} onChange={(e) => setIncludeSection23Warranty(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                  <span>Include Section 23 Drug Act 1976 Warranty (Form 2A)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeDrapWarranty} onChange={(e) => setIncludeDrapWarranty(e.target.checked)} style={{ marginTop: '0.15rem' }} />
                  <span>Include DRAP 2014 Alternative Medicines Warranty</span>
                </label>
              </div>
            )}
          </div>

          {/* CHECKOUT ACTION BUTTONS */}
          {isRetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={handleRetailCheckoutPrint}
                disabled={isCheckingOut}
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: '12px', padding: '0.65rem', backgroundColor: '#10b981', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: isCheckingOut ? 0.7 : 1, cursor: isCheckingOut ? 'not-allowed' : 'pointer' }}
              >
                <Printer size={15} /> {isCheckingOut ? 'Processing Print...' : '[Print 80mm Receipt (F9)]'}
              </button>

              <button
                onClick={handleSaveOrderCash}
                disabled={isCheckingOut}
                className="btn btn-outline"
                style={{ width: '100%', borderRadius: '12px', padding: '0.6rem', backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: isCheckingOut ? 0.7 : 1, cursor: isCheckingOut ? 'not-allowed' : 'pointer' }}
              >
                <Save size={15} color="#0284c7" /> {isCheckingOut ? 'Saving Order...' : 'Save Order & Cash Checkout'}
              </button>

              {/* DEDICATED BUTTON: ADD TO CUSTOMER DEBT (KHATA / UDHAR) */}
              <button
                onClick={handleInitiateDebtCheckout}
                disabled={isCheckingOut}
                className="btn btn-outline"
                style={{ width: '100%', borderRadius: '12px', padding: '0.65rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#93c5fd', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: isCheckingOut ? 0.7 : 1, cursor: isCheckingOut ? 'not-allowed' : 'pointer' }}
              >
                <CreditCard size={15} color="#1d4ed8" /> [📒 Add to Customer Debt / Khata]
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* WHOLESALE PAYMENT & DISPATCH TERMS */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={14} color="#16a34a" /> Payment & Dispatch Terms:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setWholesalePaymentTerms('DUE')}
                    style={{
                      padding: '0.45rem 0.25rem',
                      borderRadius: '8px',
                      border: wholesalePaymentTerms === 'DUE' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: wholesalePaymentTerms === 'DUE' ? '#e0f2fe' : '#ffffff',
                      color: wholesalePaymentTerms === 'DUE' ? '#0369a1' : '#475569',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🚚 Delivery (Due)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWholesalePaymentTerms('CASH')}
                    style={{
                      padding: '0.45rem 0.25rem',
                      borderRadius: '8px',
                      border: wholesalePaymentTerms === 'CASH' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: wholesalePaymentTerms === 'CASH' ? '#f0fdf4' : '#ffffff',
                      color: wholesalePaymentTerms === 'CASH' ? '#15803d' : '#475569',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    💵 Cash (Paid)
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '0.35rem', lineHeight: '1.4' }}>
                  {wholesalePaymentTerms === 'DUE' 
                    ? '✓ Invoice will appear in Territory Ledger under Pending Deliveries for rider cash collection.'
                    : '✓ Invoice marked fully settled at counter.'}
                </div>
              </div>

              <button
                onClick={() => handleWholesaleCheckout()}
                disabled={isCheckingOut}
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: '12px', padding: '0.75rem', backgroundColor: '#0284c7', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: isCheckingOut ? 0.7 : 1, cursor: isCheckingOut ? 'not-allowed' : 'pointer' }}
              >
                <CheckCircle size={16} /> 
                {isCheckingOut 
                  ? 'Generating Invoice...' 
                  : wholesalePaymentTerms === 'DUE' 
                    ? '[Generate A4 Invoice & Add to Territory Ledger]' 
                    : '[Generate Paid A4 Tax Invoice]'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <WholesaleCustomerModal
          isOpen={isCustomerModalOpen}
          customerData={customerData}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={(data) => setCustomerData(data)}
        />
      )}

      {isEditModalOpen && editingItem && (
        <EditLineDiscountTaxModal
          isOpen={isEditModalOpen}
          item={editingItem}
          onClose={() => { setIsEditModalOpen(false); setEditingItem(null); }}
          onSave={handleSaveItemUpdates}
        />
      )}

      {isSalesReturnModalOpen && (
        <SalesReturnModal
          isOpen={isSalesReturnModalOpen}
          onClose={() => setIsSalesReturnModalOpen(false)}
        />
      )}

      {isRetailReturnModalOpen && (
        <RetailSalesReturnModal
          isOpen={isRetailReturnModalOpen}
          onClose={() => setIsRetailReturnModalOpen(false)}
        />
      )}

      {completedInvoice && (
        <A4InvoicePrintModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

      {completedThermalInvoice && (
        <ThermalPrintModal
          invoice={completedThermalInvoice}
          onClose={() => setCompletedThermalInvoice(null)}
        />
      )}

      {/* POS DEBT CUSTOMER SELECTOR MODAL */}
      {isPOSDebtModalOpen && (
        <POSDebtCustomerModal
          isOpen={isPOSDebtModalOpen}
          totalAmount={finalBillAmount}
          onClose={() => setIsPOSDebtModalOpen(false)}
          onConfirmCreditSale={handleConfirmCreditSale}
        />
      )}

      {/* WHATSAPP RECEIPT MODAL */}
      {completedDebtSale && (
        <WhatsAppCreditModal
          isOpen={Boolean(completedDebtSale)}
          customer={completedDebtSale.customer}
          saleData={completedDebtSale.saleData}
          shopName={currentShop?.shopName || 'Testing Shop'}
          onClose={() => setCompletedDebtSale(null)}
        />
      )}

      {/* PRE-DEFINED DESIGNED ALERT MODAL */}
      <AppAlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        itemDetails={alertConfig.itemDetails}
        actionLabel={alertConfig.actionLabel}
        onAction={alertConfig.onAction}
        onClose={closeAlert}
      />

      {/* ON-THE-SPOT CUSTOMER REGISTRATION MODAL */}
      <CustomerFormModal
        isOpen={isCustomerFormModalOpen}
        initialQuery={customerSearchInput}
        onClose={() => setIsCustomerFormModalOpen(false)}
        onSave={(newCust) => {
          addCustomer(newCust);
          handleSelectCustomerRecord(newCust);
          setIsCustomerFormModalOpen(false);
        }}
      />

      <PatientRxDrawer />
    </div>
  );
};

export default POSPage;
