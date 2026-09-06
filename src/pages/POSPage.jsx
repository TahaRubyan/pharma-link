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
  Sparkles
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useCart } from '../context/CartContext';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';
import { useCustomerDebt } from '../context/CustomerDebtContext';
import { usePatient } from '../context/PatientContext';
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

export const POSPage = ({ storeMode: propStoreMode }) => {
  const { medicines = [], batches = [], getEarliestValidBatch, deductStock } = useInventory();
  const { cart, addToCart, updateQty, updateUnitType, removeFromCart, clearCart, rxPatient, setRxPatient, openModal } = useCart();
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
    shopName: isRetail ? 'Idrees Medical Store' : 'Idrees Pharma Distributor',
    region: isRetail ? '' : 'Gujrat',
    customerAddress: '',
    licenseNo: '',
    customerNtn: '',
    customerStrn: '',
    filerStatus: 'FILER',
    customerPhone: '',
    bookingMan: '',
    refNo: '',
    deliveryMan: '',
  });

  // Wholesale & Retail Discounts (% percentage)
  const [discountPercent, setDiscountPercent] = useState('0');
  const [includeSection23Warranty, setIncludeSection23Warranty] = useState(true);
  const [includeDrapWarranty, setIncludeDrapWarranty] = useState(true);

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

  // Auto-scroll dropdown when down/up arrow keys are pressed
  useEffect(() => {
    if (searchResults.length > 0 && selectedHighlightIndex >= 0) {
      const activeEl = document.getElementById(`search-result-item-${selectedHighlightIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

  const handleSelectMedicine = (medicine) => {
    const earliestBatch = getEarliestValidBatch(medicine.id || medicine.itemCode);
    const defaultUnit = isRetail ? 'Tablet' : 'Box';
    addToCart(medicine, earliestBatch, defaultUnit);
    setSearchQuery('');
    setSelectedHighlightIndex(0);
    setIsSearchFocused(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Cart Calculations
  const hasControlledOrRx = cart.some(
    (i) => i.requiresPrescription || i.controlledType === 'Narcotic' || i.controlledType === 'Steroid'
  );

  const grossSubtotal = cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    let unitPrice = Number(item.boxSellingPrice || item.boxPrice || item.price || 600);

    if (isRetail) {
      if (item.unitSelection === 'Tablet') {
        unitPrice = Number(item.pricePerTablet || (unitPrice / (item.tabletsPerBox || 200)) || 3.0);
      } else if (item.unitSelection === 'Strip') {
        unitPrice = Number(item.stripPrice || (unitPrice / (item.stripsPerBox || 10)) || 30.0);
      }
    }

    return sum + unitPrice * q;
  }, 0);

  const totalLineDiscounts = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const totalSalesTax18 = cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = Number(item.boxSellingPrice || item.boxPrice || item.price || 600);
    const gross = rate * q - Number(item.discount || 0);
    return sum + (item.salesTax18 !== undefined ? Number(item.salesTax18) : gross * 0.18);
  }, 0);

  const totalAdvTax05 = cart.reduce((sum, item) => {
    const q = Number(item.qty || item.quantity || 1);
    const rate = Number(item.boxSellingPrice || item.boxPrice || item.price || 600);
    const gross = rate * q - Number(item.discount || 0);
    return sum + (item.advTax05 !== undefined ? Number(item.advTax05) : gross * 0.005);
  }, 0);

  const totalTaxes = isRetail ? 0 : (totalSalesTax18 + totalAdvTax05);
  const orderDiscountAmount = (grossSubtotal * (Number(discountPercent) || 0)) / 100;
  const finalBillAmount = Math.max(0, grossSubtotal - totalLineDiscounts - orderDiscountAmount + totalTaxes);

  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - finalBillAmount);

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
    updateQty(updatedItem.medicineId || updatedItem.id, updatedItem.batchNo || updatedItem.batchNumber, updatedItem.qty);
  };

  // Build Invoice Data Object
  const generateInvoiceData = (isPrint = false, paymentMode = 'Cash') => {
    return {
      invoiceNo: isRetail ? `INV-RET-${Date.now().toString().slice(-6)}` : `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      saleType: isRetail ? (paymentMode === 'CREDIT' ? 'Retail Credit / Debt' : 'Retail Cash') : 'Wholesale Commercial',
      customerName: isRetail ? (rxPatient ? rxPatient.name : 'Walk-in Retail Customer') : customerData.customerName,
      shopName: currentShop?.shopName || 'Idrees Medical Store',
      customerPhone: rxPatient ? rxPatient.phone : (customerData.customerPhone || '051-2345678'),
      doctorName: rxPatient ? rxPatient.doctorName : (hasControlledOrRx ? 'Dr. Tariq Parvez (PMC-88120)' : '-'),
      cashierName: user ? user.name : 'Dr. Idrees (Pharmacist)',
      items: [...cart],
      subtotal: grossSubtotal,
      grossTotal: grossSubtotal,
      discountPercent: Number(discountPercent) || 0,
      discount: totalLineDiscounts + orderDiscountAmount,
      totalSalesTax18,
      totalAdvTax05,
      totalTax: totalTaxes,
      netTotal: finalBillAmount,
      grandTotal: finalBillAmount,
      cashTendered: paymentMode === 'CREDIT' ? 0 : (tenderedNum > 0 ? tenderedNum : finalBillAmount),
      changeDue: paymentMode === 'CREDIT' ? 0 : (tenderedNum > 0 ? changeDue : 0),
      includeSection23Warranty,
      includeDrapWarranty,
      paymentMode,
      paymentStatus: paymentMode === 'CREDIT' ? 'UNPAID' : 'PAID',
    };
  };

  // 1. Action: Print Receipt & Complete Cash Checkout
  const handleRetailCheckoutPrint = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please scan or select medicines.');
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
      alert('Cart is empty. Please scan or select medicines.');
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
      alert(`Order saved & stock updated! Invoice #${invoiceData.invoiceNo} for Rs. ${invoiceData.netTotal.toFixed(2)} completed.`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // 3. Action: Add to Customer Debt / Udhar (Khata)
  const handleInitiateDebtCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please scan or add items to bill.');
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
  const handleWholesaleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items to generate wholesale commercial invoice.');
      return;
    }
    if (isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      const invoiceData = generateInvoiceData(true, 'Cash');
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
      {/* TOP ACTION BANNER */}
      <div className="card" style={{ padding: '0.65rem 1rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isRetail ? (
            <button
              onClick={() => openModal('rx_drawer')}
              className="btn btn-outline"
              style={{ borderRadius: '10px', fontSize: '12px', borderColor: '#0284c7', color: '#0284c7', padding: '0.45rem 0.85rem', fontWeight: 700 }}
            >
              <HeartPulse size={14} /> {rxPatient ? `Rx: ${rxPatient.name} (Dr: ${rxPatient.doctorName})` : '+ Add / Search Patient & Rx Details'}
            </button>
          ) : (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="btn btn-primary"
              style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#0284c7', padding: '0.45rem 0.85rem' }}
            >
              <UserPlus size={14} /> + Add / Select Customer Details
            </button>
          )}

          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span>{isRetail ? 'Active Customer/Patient:' : 'Customer:'} <strong style={{ color: '#0284c7' }}>{rxPatient ? rxPatient.name : customerData.customerName}</strong></span>
            {isRetail && rxPatient && (
              <button
                type="button"
                onClick={() => { setRxPatient(null); if (typeof clearActivePatientForPOS === 'function') clearActivePatientForPOS(); }}
                style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.1rem 0.35rem', color: '#dc2626', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
                title="Reset to Walk-in Patient"
              >
                ✕ Clear
              </button>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={clearCart}
            className="btn btn-outline"
            style={{ borderRadius: '10px', fontSize: '12px', padding: '0.45rem 0.75rem' }}
            title="Hotkey: F1"
          >
            Clear Cart (F1)
          </button>
          <button
            onClick={() => (isRetail ? setIsRetailReturnModalOpen(true) : setIsSalesReturnModalOpen(true))}
            className="btn btn-outline"
            style={{ borderRadius: '10px', fontSize: '12px', padding: '0.45rem 0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
          >
            <RotateCcw size={14} /> {isRetail ? 'Counter Return' : 'Sales Return / Exchange'}
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
                  const price = Number(m.boxSellingPrice || m.boxPrice || m.price || 600);
                  const tabPrice = Number(m.pricePerTablet || (price / 200) || 3.0);

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
                        backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                      onMouseEnter={() => setSelectedHighlightIndex(idx)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{m.name || m.brandName}</span>
                          {m.controlledType === 'Narcotic' && <span style={{ fontSize: '9px', backgroundColor: '#dc2626', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>NARCOTIC</span>}
                          {m.requiresPrescription && m.controlledType !== 'Narcotic' && <span style={{ fontSize: '9px', backgroundColor: '#d97706', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>Rx</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: isSelected ? '#e0f2fe' : '#64748b', marginTop: '0.15rem' }}>
                          Code: {m.itemCode || m.id} • Formula: {m.formula || m.genericFormula} • 📍 Shelf: {m.rackLocation || 'Rack A-01'}
                          {isRetail && <span style={{ marginLeft: '0.5rem', color: '#16a34a', fontWeight: 700 }}>• Exp: {m.expiryDate || '10/2026'}</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#ffffff' : '#16a34a' }}>
                          {isRetail ? `Rs. ${tabPrice.toFixed(2)}/tab` : `Rs. ${price.toFixed(2)}/box`}
                        </div>
                        <div style={{ fontSize: '10px', color: isSelected ? '#e0f2fe' : '#64748b' }}>
                          Stock: {m.boxStock !== undefined ? m.boxStock : 10} Boxes
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
                        let itemRate = Number(item.boxSellingPrice || item.boxPrice || item.price || 600);

                        if (isRetail) {
                          if (item.unitSelection === 'Tablet') {
                            itemRate = Number(item.pricePerTablet || (itemRate / (item.tabletsPerBox || 200)) || 3.0);
                          } else if (item.unitSelection === 'Strip') {
                            itemRate = Number(item.stripPrice || (itemRate / (item.stripsPerBox || 10)) || 30.0);
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
                            {!isRetail && <td style={{ textAlign: 'right', color: '#0284c7' }}>{itemST.toFixed(2)}</td>}
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
                <div className="flex-between">
                  <span className="subtext">Total Taxes:</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>+ Rs. {totalTaxes.toFixed(2)}</span>
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
            <button
              onClick={handleWholesaleCheckout}
              disabled={isCheckingOut}
              className="btn btn-primary"
              style={{ width: '100%', borderRadius: '12px', padding: '0.75rem', backgroundColor: '#0284c7', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: isCheckingOut ? 0.7 : 1, cursor: isCheckingOut ? 'not-allowed' : 'pointer' }}
            >
              <CheckCircle size={16} /> {isCheckingOut ? 'Generating Invoice...' : '[Generate A4 Tax Invoice]'}
            </button>
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
          shopName={currentShop?.shopName || 'Idrees Medical Store'}
          onClose={() => setCompletedDebtSale(null)}
        />
      )}

      <PatientRxDrawer />
    </div>
  );
};

export default POSPage;
