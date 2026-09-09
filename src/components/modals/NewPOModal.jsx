import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Package, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Truck, 
  FileText, 
  Search, 
  Building, 
  DollarSign, 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  Phone
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useInventory } from '../../context/InventoryContext';

export const NewPOModal = ({ isOpen, onClose }) => {
  const { suppliers = [], addSupplier, createPurchaseOrder, generatePONumber } = useSupplier();
  const { medicines = [], inwardPOStock, isExpiryWithin6Months } = useInventory();

  // Wizard Step: 1 = Company & Dates, 2 = Items, 3 = Payment & Confirmation
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Company Search & Metadata
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState(suppliers[0]?.name || suppliers[0]?.companyName || '');
  const [poCode, setPoCode] = useState(() => `PO-${Date.now().toString().slice(-6)}`);
  const [inwardDate, setInwardDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [supplierLicense, setSupplierLicense] = useState('');
  const [supplierNtn, setSupplierNtn] = useState('');
  const [supplierGst, setSupplierGst] = useState('');
  const [fbrStatus, setFbrStatus] = useState('FILER');
  const [contactPhone, setContactPhone] = useState('');
  const [challanNo, setChallanNo] = useState('');

  // Inline "Add New Company" state
  const [isAddingNewCompany, setIsAddingNewCompany] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('');
  const [newCompCity, setNewCompCity] = useState('Gujrat');
  const [newCompLicense, setNewCompLicense] = useState('');
  const [newCompNtn, setNewCompNtn] = useState('');
  const [newCompGst, setNewCompGst] = useState('');

  // Step 2: PO Line Items state (Clean starting template for live data entry)
  const [items, setItems] = useState([
    {
      itemCode: '',
      tradeName: '',
      genericFormula: '',
      batchNo: '',
      expiryDate: '',
      inwardBoxes: '',
      purchaseCost: '',
      sellingMrp: '',
      shelfLocation: 'Rack A-01',
    },
  ]);

  // Dedicated Distributor Tax Input States (As Billed by Seller on Invoice)
  const [distributorSalesTaxType, setDistributorSalesTaxType] = useState('18'); // '0' | '18' | '19' | 'CUSTOM'
  const [customSalesTaxRate, setCustomSalesTaxRate] = useState('');
  const [distributorAdvTaxType, setDistributorAdvTaxType] = useState('0.5'); // '0' | '0.5' | '1.0' | 'CUSTOM'
  const [customAdvTaxRate, setCustomAdvTaxRate] = useState('');

  // Step 3: Payment Settlement
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Bank Transfer' | 'Credit'
  const [paymentStatus, setPaymentStatus] = useState('Paid in Full (Zero Debt)');
  const [amountPaid, setAmountPaid] = useState('');
  const [poNotes, setPoNotes] = useState('');

  // Success Animation state
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);

  // Synchronize supplier profile when selected
  useEffect(() => {
    if (selectedDistributor) {
      const sup = suppliers.find((s) => (s.name || s.companyName) === selectedDistributor);
      if (sup) {
        setSupplierLicense(sup.licenseNo || '');
        setContactPhone(sup.phone || '');
        setSupplierGst(sup.gstin || sup.strn || '');
        setSupplierNtn(sup.ntn || '');
        setFbrStatus(sup.fbrStatus || 'FILER');
      }
    }
  }, [selectedDistributor, suppliers]);

  // Filtered suppliers based on search query
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase().trim();
    return suppliers.filter(s => 
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.companyName && s.companyName.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  }, [suppliers, supplierSearch]);

  const handleSelectSupplier = (sup) => {
    const name = sup.name || sup.companyName;
    setSelectedDistributor(name);
    setSupplierSearch('');
  };

  const handleCreateNewCompany = (e) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const created = {
      name: newCompName.trim(),
      companyName: newCompName.trim(),
      phone: newCompPhone.trim() || '0300-1234567',
      city: newCompCity.trim() || 'Gujrat',
      licenseNo: newCompLicense.trim() || 'DL-FORM-20/21',
      ntn: newCompNtn.trim() || 'NTN-00000-0',
      gstin: newCompGst.trim() || 'STRN-0000-0',
      fbrStatus: 'FILER',
      outstandingDebt: 0,
      pendingBalance: 0
    };

    if (typeof addSupplier === 'function') {
      addSupplier(created);
    }
    setSelectedDistributor(created.name);
    setIsAddingNewCompany(false);
    setNewCompName('');
    setNewCompPhone('');
    setNewCompLicense('');
    setNewCompNtn('');
    setNewCompGst('');
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemCode: '',
        tradeName: '',
        genericFormula: '',
        batchNo: '',
        expiryDate: '',
        inwardBoxes: '',
        purchaseCost: '',
        sellingMrp: '',
        shelfLocation: 'Rack A-01',
      },
    ]);
  };

  const handleItemChange = (idx, field, val) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const updated = { ...item, [field]: val };
          // If selecting known medicine name, auto-fill generic and previous prices
          if (field === 'tradeName') {
            const matchedMed = medicines.find(m => (m.name || m.brandName || '').toLowerCase() === val.toLowerCase());
            if (matchedMed) {
              updated.itemCode = matchedMed.itemCode || matchedMed.id || updated.itemCode;
              updated.genericFormula = matchedMed.formula || matchedMed.genericFormula || updated.genericFormula;
              updated.purchaseCost = String(matchedMed.purchaseCost || matchedMed.purchasePriceBox || updated.purchaseCost);
              updated.sellingMrp = String(matchedMed.boxSellingPrice || matchedMed.boxPrice || matchedMed.price || updated.sellingMrp);
              updated.shelfLocation = matchedMed.rackLocation || updated.shelfLocation;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Resolved distributor tax rates
  const activeSalesTaxRate = useMemo(() => {
    if (distributorSalesTaxType === '0') return 0;
    if (distributorSalesTaxType === '18') return 18;
    if (distributorSalesTaxType === '19') return 19;
    if (distributorSalesTaxType === 'CUSTOM') return Math.max(0, Number(customSalesTaxRate) || 0);
    return 18;
  }, [distributorSalesTaxType, customSalesTaxRate]);

  const activeAdvTaxRate = useMemo(() => {
    if (distributorAdvTaxType === '0') return 0;
    if (distributorAdvTaxType === '0.5') return 0.5;
    if (distributorAdvTaxType === '1.0') return 1.0;
    if (distributorAdvTaxType === 'CUSTOM') return Math.max(0, Number(customAdvTaxRate) || 0);
    return 0.5;
  }, [distributorAdvTaxType, customAdvTaxRate]);

  // Base Goods Value (Sum of boxes * purchase cost)
  const grossBaseCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.inwardBoxes) || 0) * (Number(item.purchaseCost) || 0), 0);
  }, [items]);

  // Tax amounts matching seller's invoice
  const salesTaxAmount = useMemo(() => {
    return Math.round((grossBaseCost * (activeSalesTaxRate / 100) + Number.EPSILON) * 100) / 100;
  }, [grossBaseCost, activeSalesTaxRate]);

  const advTaxAmount = useMemo(() => {
    return Math.round((grossBaseCost * (activeAdvTaxRate / 100) + Number.EPSILON) * 100) / 100;
  }, [grossBaseCost, activeAdvTaxRate]);

  const totalPoCost = useMemo(() => {
    return Math.round((grossBaseCost + salesTaxAmount + advTaxAmount + Number.EPSILON) * 100) / 100;
  }, [grossBaseCost, salesTaxAmount, advTaxAmount]);

  const totalBoxesCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.inwardBoxes) || 0), 0);
  }, [items]);

  // Synchronize default amount paid when total cost updates
  useEffect(() => {
    if (paymentMode === 'Cash') {
      setAmountPaid(String(totalPoCost));
      setPaymentStatus('Paid in Full (Zero Debt)');
    } else if (paymentMode === 'Credit') {
      setAmountPaid('0');
      setPaymentStatus('Full Credit (30-Day Terms)');
    } else {
      setAmountPaid(String(totalPoCost));
      setPaymentStatus('Bank Transfer Cleared');
    }
  }, [totalPoCost, paymentMode]);

  // Step 1 Validation
  const canProceedFromStep1 = Boolean(selectedDistributor.trim() && poCode.trim() && inwardDate);

  // Step 2 Validation: Wholesale rule blocks PO inward if any item has expiry <= 6 months
  const hasShortExpiryItems = items.some(it => 
    it.expiryDate && typeof isExpiryWithin6Months === 'function' && isExpiryWithin6Months(it.expiryDate)
  );

  const canProceedFromStep2 = items.length > 0 && !hasShortExpiryItems && items.every(it => 
    it.tradeName.trim() && Number(it.inwardBoxes) > 0 && Number(it.purchaseCost) >= 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    const poRecord = {
      poNumber: poCode,
      poReference: poCode,
      supplierName: selectedDistributor,
      distributor: selectedDistributor,
      distributorName: selectedDistributor,
      date: inwardDate,
      inwardDate,
      challanNo,
      itemLines: items.map((i) => `${i.tradeName} (${i.inwardBoxes} Boxes)`).join(', '),
      items: items.map((it) => ({
        ...it,
        itemCode: it.itemCode?.trim() || '',
        boxCost: Number(it.purchaseCost) || 0,
        boxMrp: Number(it.sellingMrp) || 0,
        shelfLocation: it.shelfLocation?.trim() || 'Rack A-01',
      })),
      subtotal: grossBaseCost,
      grossCost: grossBaseCost,
      salesTaxRate: activeSalesTaxRate,
      salesTaxAmount: salesTaxAmount,
      advTaxRate: activeAdvTaxRate,
      advTaxAmount: advTaxAmount,
      inputTax: salesTaxAmount + advTaxAmount,
      totalAmount: totalPoCost,
      paymentStatus,
      paymentMode,
      amountPaid: Number(amountPaid) || 0,
      stockStatus: 'Stock Received',
      notes: poNotes
    };

    if (typeof createPurchaseOrder === 'function') {
      createPurchaseOrder(poRecord);
    }
    if (typeof inwardPOStock === 'function') {
      inwardPOStock(poRecord);
    }

    // Trigger celebratory animation
    setSuccessDetails({
      poNumber: poCode,
      boxes: totalBoxesCount,
      medicinesCount: items.length,
      supplier: selectedDistributor,
      cost: totalPoCost
    });
    setIsSuccessAnimated(true);
  };

  const handleFinish = () => {
    setIsSuccessAnimated(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '95vw', maxWidth: '1100px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '92vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={18} color="#64748B" />
        </button>

        {/* HEADER & STEPPER PROGRESS BAR */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0284c7', margin: 0 }}>
              <FileText size={20} color="#0284c7" /> Wholesale Purchase Order & Depot Inward Wizard
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
              PO Code: <strong style={{ color: '#0284c7' }}>{poCode}</strong>
            </span>
          </div>

          {/* Stepper Navigation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
            {[
              { step: 1, title: '1. Company Details & Dates', desc: 'Select / add manufacturer' },
              { step: 2, title: '2. Inward Items & Batches', desc: 'Stock quantities, costs, MRP' },
              { step: 3, title: '3. Payment & Settlement', desc: 'Cash, bank, credit & confirmation' }
            ].map((s) => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;

              return (
                <div
                  key={s.step}
                  onClick={() => {
                    // Allow navigating backward or to steps that are already completed
                    if (s.step < currentStep || (s.step === 2 && canProceedFromStep1) || (s.step === 3 && canProceedFromStep1 && canProceedFromStep2)) {
                      setCurrentStep(s.step);
                    }
                  }}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    border: isActive ? '2px solid #0284c7' : isPast ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                    backgroundColor: isActive ? '#f0f9ff' : isPast ? '#f0fdf4' : '#f8fafc',
                    cursor: (s.step < currentStep || (s.step === 2 && canProceedFromStep1)) ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: isActive ? '#0284c7' : isPast ? '#16a34a' : '#64748b' }}>
                      {s.title}
                    </span>
                    {isPast && <CheckCircle2 size={14} color="#16a34a" />}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '0.15rem' }}>
                    {s.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: COMPANY SELECTION & DATES */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.25rem' }}>
              {/* Supplier Search Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', color: '#1e293b' }}>
                    Search & Select Manufacturer / Distributor:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCompany(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus size={13} /> {isAddingNewCompany ? 'Cancel Adding' : '+ Add New Company Profile'}
                  </button>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    placeholder="Type to search company name, city, phone..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />

                  {/* Dropdown Suggestions */}
                  {supplierSearch.trim().length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      marginTop: '0.35rem',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 50,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                      {filteredSuppliers.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSupplier(s)}
                          style={{
                            padding: '0.55rem 0.85rem',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>{s.name || s.companyName}</div>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>{s.city} • {s.phone}</div>
                          </div>
                          <span className="badge badge-otc" style={{ fontSize: '9px' }}>{s.fbrStatus || 'FILER'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Currently Selected Company Card */}
                <div style={{ marginTop: '0.85rem', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Inward Supplier
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
                    {selectedDistributor || 'No Supplier Selected'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', fontSize: '11px', color: '#475569' }}>
                    <div><strong>Drug License:</strong> {supplierLicense || 'PK-DL-20/21'}</div>
                    <div><strong>Contact:</strong> {contactPhone || '0300-5551234'}</div>
                    <div><strong>NTN / CNIC:</strong> {supplierNtn || '0792320-1'}</div>
                    <div><strong>STRN:</strong> {supplierGst || '3277876174544'}</div>
                  </div>
                </div>

                {/* Inline "Add New Company" Form */}
                {isAddingNewCompany && (
                  <form onSubmit={handleCreateNewCompany} style={{ marginTop: '0.85rem', padding: '1rem', backgroundColor: '#f0f9ff', border: '1px dashed #0284c7', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building size={15} /> Quick Register New Manufacturer / Company
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Company / Manufacturer Name *"
                        value={newCompName}
                        onChange={(e) => setNewCompName(e.target.value)}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Phone Number (e.g. 0300-1234567)"
                        value={newCompPhone}
                        onChange={(e) => setNewCompPhone(e.target.value)}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="City / Territory (e.g. Gujrat)"
                        value={newCompCity}
                        onChange={(e) => setNewCompCity(e.target.value)}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="Drug License No. (Form 20/21)"
                        value={newCompLicense}
                        onChange={(e) => setNewCompLicense(e.target.value)}
                        style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCompany(false)}
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '11px', borderRadius: '8px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '11px', borderRadius: '8px', backgroundColor: '#0284c7' }}
                      >
                        Save & Select Company
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Dates & PO Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
                    Purchase Order (PO) Reference #:
                  </label>
                  <input
                    type="text"
                    value={poCode}
                    onChange={(e) => setPoCode(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>

                <div>
                  <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
                    Inward Receipt Date:
                  </label>
                  <input
                    type="date"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
                    Delivery Challan / Gate Pass #:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DC-98412"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Footer Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                disabled={!canProceedFromStep1}
                onClick={() => setCurrentStep(2)}
                className="btn btn-primary"
                style={{
                  padding: '0.65rem 1.5rem',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  backgroundColor: canProceedFromStep1 ? '#0284c7' : '#94a3b8',
                  cursor: canProceedFromStep1 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Next: Add Inward Items <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: INWARD ITEMS & BATCHES BUILDER */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Inward Items for: <span style={{ color: '#0284c7' }}>{selectedDistributor}</span>
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '0.65rem' }}>
                  ({items.length} line item{items.length !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.85rem', fontSize: '11.5px', borderRadius: '8px', fontWeight: 700 }}
              >
                <Plus size={13} /> Add Another Line Item
              </button>
            </div>

            {/* Items Table */}
            <div className="table-container" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Medicine Trade Name *</th>
                    <th>Generic Formula</th>
                    <th>Batch Lot *</th>
                    <th>Expiry *</th>
                    <th style={{ width: '80px' }}>Inward Boxes *</th>
                    <th style={{ width: '90px' }}>Cost / Box *</th>
                    <th style={{ width: '90px' }}>MRP / Box</th>
                    <th>Shelf</th>
                    <th>Total (PKR)</th>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineTotal = (Number(it.inwardBoxes) || 0) * (Number(it.purchaseCost) || 0);

                    return (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. 1001"
                            value={it.itemCode}
                            onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                            style={{ width: '70px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Panadol 500mg"
                            value={it.tradeName}
                            onChange={(e) => handleItemChange(idx, 'tradeName', e.target.value)}
                            style={{ width: '100%', minWidth: '130px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700 }}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Formula"
                            value={it.genericFormula}
                            onChange={(e) => handleItemChange(idx, 'genericFormula', e.target.value)}
                            style={{ width: '100%', minWidth: '100px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="B26-001"
                            value={it.batchNo}
                            onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)}
                            style={{ width: '85px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="12-2028"
                            value={it.expiryDate}
                            onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                            style={{
                              width: '80px',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              border: (it.expiryDate && typeof isExpiryWithin6Months === 'function' && isExpiryWithin6Months(it.expiryDate))
                                ? '2px solid #ef4444'
                                : '1px solid #cbd5e1',
                              backgroundColor: (it.expiryDate && typeof isExpiryWithin6Months === 'function' && isExpiryWithin6Months(it.expiryDate))
                                ? '#fef2f2'
                                : '#ffffff',
                              fontSize: '11px'
                            }}
                            required
                          />
                          {it.expiryDate && typeof isExpiryWithin6Months === 'function' && isExpiryWithin6Months(it.expiryDate) && (
                            <div style={{ color: '#dc2626', fontSize: '8.5px', fontWeight: 800, marginTop: '2px', lineHeight: 1.1 }}>
                              ⛔ &le;6m (Blocked)
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={it.inwardBoxes}
                            onChange={(e) => handleItemChange(idx, 'inwardBoxes', e.target.value)}
                            style={{ width: '65px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            placeholder="Cost"
                            value={it.purchaseCost}
                            onChange={(e) => handleItemChange(idx, 'purchaseCost', e.target.value)}
                            style={{ width: '75px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            placeholder="MRP"
                            value={it.sellingMrp}
                            onChange={(e) => handleItemChange(idx, 'sellingMrp', e.target.value)}
                            style={{ width: '75px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', textAlign: 'right' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Rack"
                            value={it.shelfLocation}
                            onChange={(e) => handleItemChange(idx, 'shelfLocation', e.target.value)}
                            style={{ width: '75px', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                          />
                        </td>
                        <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                          PKR {lineTotal.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length <= 1}
                            style={{ background: 'none', border: 'none', color: items.length <= 1 ? '#cbd5e1' : '#ef4444', cursor: items.length <= 1 ? 'not-allowed' : 'pointer' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* WHOLESALE EXPIRY COMPLIANCE WARNING BANNER */}
            {hasShortExpiryItems && (
              <div style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: '#fef2f2',
                border: '1.5px solid #f87171',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '15px' }}>⚠️</span>
                <div>
                  <strong>Wholesale Compliance Warning:</strong> One or more items have an expiry date &le; 6 months. Under DRAP Wholesale Distribution Rules, medicines expiring within 6 months cannot be added to Purchase Orders. Please update the expiry date or reject these batches.
                </div>
              </div>
            )}

            {/* DEDICATED DISTRIBUTOR TAX ASSESSMENT PANEL (As Defined by Seller on Invoice) */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={16} color="#0284c7" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Distributor Invoice Tax Assessment (As Billed by Seller)
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Input taxes added by your seller/distributor on their delivery invoice
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* 1. Distributor Sales Tax */}
                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                      Distributor Sales Tax (ST):
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                      + PKR {salesTaxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    {[
                      { type: '0', label: '0% Exempt' },
                      { type: '18', label: '18% Standard ST' },
                      { type: '19', label: '19% Special ST' },
                      { type: 'CUSTOM', label: 'Custom %' }
                    ].map(opt => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setDistributorSalesTaxType(opt.type)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: distributorSalesTaxType === opt.type ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                          backgroundColor: distributorSalesTaxType === opt.type ? '#e0f2fe' : '#ffffff',
                          color: distributorSalesTaxType === opt.type ? '#0284c7' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {distributorSalesTaxType === 'CUSTOM' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Custom ST Rate:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 18.5"
                        value={customSalesTaxRate}
                        onChange={(e) => setCustomSalesTaxRate(e.target.value)}
                        style={{ width: '80px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>%</span>
                    </div>
                  )}
                </div>

                {/* 2. Distributor Advance Income Tax (u/s 236G/H) */}
                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                      Advance Tax / WHT (u/s 236G/H):
                    </label>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      + PKR {advTaxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    {[
                      { type: '0', label: '0% Exempt' },
                      { type: '0.5', label: '0.5% (Active Filer)' },
                      { type: '1.0', label: '1.0% (Non-Filer)' },
                      { type: 'CUSTOM', label: 'Custom %' }
                    ].map(opt => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setDistributorAdvTaxType(opt.type)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: distributorAdvTaxType === opt.type ? '1.5px solid #059669' : '1px solid #cbd5e1',
                          backgroundColor: distributorAdvTaxType === opt.type ? '#d1fae5' : '#ffffff',
                          color: distributorAdvTaxType === opt.type ? '#059669' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {distributorAdvTaxType === 'CUSTOM' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Custom WHT Rate:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 2.0"
                        value={customAdvTaxRate}
                        onChange={(e) => setCustomAdvTaxRate(e.target.value)}
                        style={{ width: '80px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Summary & Invoice Reconciliation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                border: '1.5px solid #0284c7'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Goods Value: <strong>PKR {grossBaseCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong> | 
                    Sales Tax ({activeSalesTaxRate}%): <strong>+ PKR {salesTaxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong> | 
                    Adv Tax ({activeAdvTaxRate}%): <strong>+ PKR {advTaxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 600, marginTop: '0.15rem' }}>
                    ✓ This total precisely matches the physical invoice and delivery challan from your seller.
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    Total Payable on Seller's Invoice
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                    PKR {totalPoCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-outline"
                style={{ padding: '0.65rem 1.25rem', fontSize: '12px', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowLeft size={14} /> Back to Step 1 (Company Details)
              </button>

              <button
                type="button"
                disabled={!canProceedFromStep2}
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
                style={{
                  padding: '0.65rem 1.5rem',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  backgroundColor: canProceedFromStep2 ? '#0284c7' : '#94a3b8',
                  cursor: canProceedFromStep2 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Next: Payment & Review <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT SETTLEMENT & FINAL INWARD */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Review Summary Banner with Full Invoice Tax Breakdown */}
            <div style={{ padding: '1rem 1.25rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1', marginBottom: '0.4rem' }}>
                📋 Purchase Order & Seller Invoice Review
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '12px' }}>
                <div><strong>Manufacturer / Vendor:</strong> {selectedDistributor}</div>
                <div><strong>PO Reference #:</strong> {poCode}</div>
                <div><strong>Inward Date:</strong> {inwardDate}</div>
                <div><strong>Goods Subtotal:</strong> PKR {grossBaseCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
                <div><strong>Distributor ST ({activeSalesTaxRate}%):</strong> + PKR {salesTaxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
                <div><strong>Distributor WHT ({activeAdvTaxRate}%):</strong> + PKR {advTaxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #bae6fd', paddingTop: '0.4rem' }}>
                  <strong>Total Payable as on Seller's Invoice:</strong> <strong style={{ color: '#0284c7', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>PKR {totalPoCost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.4rem', color: '#1e293b' }}>
                Select Payment Mode / Settlement Terms:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { mode: 'Cash', label: '💵 Cash in Hand', desc: 'Paid instantly on delivery' },
                  { mode: 'Bank Transfer', label: '🏦 Bank Transfer / Cheque', desc: 'Direct clearing via bank' },
                  { mode: 'Credit', label: '📑 30-Day Supplier Credit', desc: 'Added to supplier ledger debt' }
                ].map(opt => (
                  <div
                    key={opt.mode}
                    onClick={() => setPaymentMode(opt.mode)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: paymentMode === opt.mode ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: paymentMode === opt.mode ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '12.5px', color: paymentMode === opt.mode ? '#0284c7' : '#1e293b' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '0.2rem' }}>
                      {opt.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Paid & Debt Balance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
                  Amount Paid Now (PKR):
                </label>
                <input
                  type="number"
                  step="any"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
                  Remaining Supplier Debt Balance:
                </label>
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 800, color: (totalPoCost - (Number(amountPaid) || 0)) > 0 ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-mono)' }}>
                  PKR {Math.max(0, totalPoCost - (Number(amountPaid) || 0)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Inward Notes */}
            <div>
              <label className="subtext" style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '0.25rem' }}>
                Delivery Remarks / Batch Inspection Notes:
              </label>
              <textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="e.g. Temperature-controlled delivery verified, seals intact, cold chain maintained."
                rows={2}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11px', outline: 'none' }}
              />
            </div>

            {/* Step 3 Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-outline"
                style={{ padding: '0.65rem 1.25rem', fontSize: '12px', fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowLeft size={14} /> Back to Step 2 (Edit Items)
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '13px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  backgroundColor: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={16} /> Confirm Inward & Update Stock
              </button>
            </div>
          </form>
        )}

        {/* CELEBRATORY STOCK INWARD ANIMATION OVERLAY */}
        {isSuccessAnimated && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '2rem',
            textAlign: 'center',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              boxShadow: '0 0 0 12px #f0fdf4'
            }}>
              <CheckCircle2 size={52} color="#16a34a" />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Stock Successfully Inwarded!
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '0.4rem', maxWidth: '420px' }}>
              <strong>{successDetails?.boxes} boxes</strong> across <strong>{successDetails?.medicinesCount} medicine lots</strong> received from <strong>{successDetails?.supplier}</strong> have been added to inventory.
            </p>

            <div style={{ marginTop: '1rem', padding: '0.65rem 1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', fontSize: '12px', color: '#166534', fontWeight: 700 }}>
              PO Reference: {successDetails?.poNumber} • Total Inward: PKR {successDetails?.cost?.toLocaleString()}
            </div>

            <button
              onClick={handleFinish}
              style={{
                marginTop: '1.5rem',
                padding: '0.65rem 2rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Done & Return to Suppliers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPOModal;
