import React, { useState, useMemo } from 'react';
import { X, Package, Plus, Trash2, CheckCircle, Truck, Calculator, Layers, Thermometer, UserPlus, FileText } from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';

export const RetailNewPOModal = ({ isOpen, onClose }) => {
  const { currentShop } = useAuth();
  const { suppliers = [], createPurchaseOrder, addSupplier } = useSupplier();
  const { medicines = [], inwardPOStock } = useInventory();

  const [distributor, setDistributor] = useState(suppliers[0]?.name || suppliers[0]?.companyName || '');
  const [poNumber, setPoNumber] = useState(`PO-RET-${Date.now().toString().slice(-5)}`);
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');

  // Quick Add Distributor Modal/State
  const [isAddDistributorOpen, setIsAddDistributorOpen] = useState(false);
  const [newDistName, setNewDistName] = useState('');
  const [newDistCity, setNewDistCity] = useState('');
  const [newDistPhone, setNewDistPhone] = useState('');
  const [newDistNtn, setNewDistNtn] = useState('');

  // Default Tax Settings & Dynamic Tax Engine
  const activeTenantId = currentShop?.tenantId || currentShop?.shopId || 'TEN-TESTING-SHOP';
  const isSalesTaxEnabled = useMemo(() => {
    try {
      const saved = localStorage.getItem(`pharmalink_${activeTenantId}_tax_settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.enableSalesTax18 !== undefined) return Boolean(parsed.enableSalesTax18);
      }
    } catch (e) {}
    return currentShop?.taxSettings?.enableSalesTax18 !== false;
  }, [activeTenantId, currentShop?.taxSettings]);

  const initialSt = isSalesTaxEnabled ? 18 : 0;
  const [defaultStRate, setDefaultStRate] = useState(initialSt);
  const [defaultAdvRate, setDefaultAdvRate] = useState(4);
  const [defaultAwhRate, setDefaultAwhRate] = useState(0);
  const [customTaxName, setCustomTaxName] = useState('');
  const [customTaxRate, setCustomTaxRate] = useState(0);

  // Retail Items State (Clean Slate)
  const [items, setItems] = useState([
    {
      itemCode: '',
      tradeName: '',
      genericFormula: '',
      batchNo: '',
      expiryDate: '',
      inwardBoxes: '',
      stripsPerBox: '',
      tabletsPerStrip: 10,
      boxCost: '',
      boxMrp: '',
      salesTaxRate: initialSt,
      advTaxRate: 4,
      awhTaxRate: 0,
      customTaxRate: 0,
      shelfLocation: '',
    },
  ]);

  if (!isOpen) return null;

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
        stripsPerBox: '',
        tabletsPerStrip: 10,
        boxCost: '',
        boxMrp: '',
        salesTaxRate: defaultStRate,
        advTaxRate: defaultAdvRate,
        awhTaxRate: defaultAwhRate,
        customTaxRate: customTaxRate,
        shelfLocation: '',
      },
    ]);
  };

  const applyTaxPreset = (st, adv, awh, cName = '', cRate = 0) => {
    setDefaultStRate(st);
    setDefaultAdvRate(adv);
    setDefaultAwhRate(awh);
    setCustomTaxName(cName);
    setCustomTaxRate(cRate);

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        salesTaxRate: st,
        advTaxRate: adv,
        awhTaxRate: awh,
        customTaxRate: cRate,
      }))
    );
  };

  const handleItemChange = (idx, field, val) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Quick Add New Distributor
  const handleSaveNewDistributor = (e) => {
    e.preventDefault();
    if (!newDistName.trim()) {
      alert('Distributor Name is required.');
      return;
    }
    const created = addSupplier({
      companyName: newDistName.trim(),
      name: newDistName.trim(),
      city: newDistCity.trim(),
      phone: newDistPhone.trim(),
      gstin: newDistNtn.trim() || 'PK-998877-1',
    });
    setDistributor(created.companyName || created.name);
    setNewDistName('');
    setNewDistPhone('');
    setNewDistNtn('');
    setIsAddDistributorOpen(false);
    alert(`Distributor "${created.companyName || created.name}" added successfully!`);
  };

  // Line & Dynamic Total Calculations
  const calculatedItems = items.map((item) => {
    const boxes = Number(item.inwardBoxes) || 0;
    const cost = Number(item.boxCost) || 0;
    const mrp = Number(item.boxMrp) || 0;
    const grossCost = boxes * cost;

    const stRate = item.salesTaxRate !== undefined ? Number(item.salesTaxRate) : defaultStRate;
    const stAmount = grossCost * (stRate / 100);

    const advRate = item.advTaxRate !== undefined ? Number(item.advTaxRate) : defaultAdvRate;
    const advAmount = grossCost * (advRate / 100);

    const awhRate = item.awhTaxRate !== undefined ? Number(item.awhTaxRate) : defaultAwhRate;
    const awhAmount = grossCost * (awhRate / 100);

    const cRate = item.customTaxRate !== undefined ? Number(item.customTaxRate) : customTaxRate;
    const customAmount = grossCost * (cRate / 100);

    const lineNetTotal = grossCost + stAmount + advAmount + awhAmount + customAmount;
    const totalRetailValue = boxes * mrp;

    return {
      ...item,
      grossCost,
      stRate,
      stAmount,
      advRate,
      advAmount,
      awhRate,
      awhAmount,
      customRate: cRate,
      customAmount,
      lineNetTotal,
      totalRetailValue,
    };
  });

  const totalGrossPurchase = calculatedItems.reduce((sum, i) => sum + i.grossCost, 0);
  const totalSalesTax = calculatedItems.reduce((sum, i) => sum + i.stAmount, 0);
  const totalAdvTax = calculatedItems.reduce((sum, i) => sum + i.advAmount, 0);
  const totalAwhTax = calculatedItems.reduce((sum, i) => sum + i.awhAmount, 0);
  const totalCustomTax = calculatedItems.reduce((sum, i) => sum + i.customAmount, 0);
  const grandTotalPO = calculatedItems.reduce((sum, i) => sum + i.lineNetTotal, 0);
  const totalRetailValue = calculatedItems.reduce((sum, i) => sum + i.totalRetailValue, 0);
  const estMargin = totalRetailValue > 0 ? (((totalRetailValue - totalGrossPurchase) / totalRetailValue) * 100).toFixed(1) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Format items with auto-batch if blank and clean MM-YYYY expiry
    const finalizedItems = calculatedItems.map((item, idx) => {
      let formattedExp = item.expiryDate || '12-2028';
      if (formattedExp.includes('-')) {
        const parts = formattedExp.split('-');
        if (parts[0].length === 4) {
          formattedExp = `${parts[1]}/${parts[0]}`; // YYYY-MM -> MM/YYYY
        } else {
          formattedExp = `${parts[0]}/${parts[1]}`;
        }
      }

      const cleanBatch = item.batchNo && item.batchNo.trim()
        ? item.batchNo.trim()
        : `B26-LOT-${Math.floor(100 + Math.random() * 900)}`;

      return {
        ...item,
        itemCode: item.itemCode?.trim() || '',
        batchNo: cleanBatch,
        expiryDate: formattedExp,
        totalCost: item.grossCost,
        netTotal: item.lineNetTotal,
      };
    });

    const poRecord = {
      poNumber,
      poReference: poNumber,
      supplierName: distributor,
      distributor,
      invoiceNo,
      date: inwardDate,
      itemLines: finalizedItems.map((i) => `${i.tradeName || 'Medicine'} (${i.inwardBoxes} Boxes)`).join(', '),
      items: finalizedItems,
      grossCost: totalGrossPurchase,
      salesTaxRate: defaultStRate,
      totalSalesTax,
      advTaxRate: defaultAdvRate,
      totalAdvTax,
      awhTaxRate: defaultAwhRate,
      totalAwhTax,
      customTaxName: customTaxName.trim(),
      customTaxRate,
      totalCustomTax,
      totalAmount: grandTotalPO,
      totalRetailValue,
      paymentStatus: 'PAID IN FULL',
      stockStatus: 'Stock Received & Shelved',
    };

    createPurchaseOrder(poRecord);
    if (typeof inwardPOStock === 'function') {
      inwardPOStock(poRecord);
    }

    alert(`Retail Purchase Order ${poNumber} inwarded successfully! Inventory restocked, shelf stock prices synchronized, and custom taxes logged.`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
      <div className="card" style={{ width: '96vw', maxWidth: '1360px', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0', maxHeight: '94vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', backgroundColor: '#f8fafc' }}>
          <X size={20} color="#64748B" />
        </button>

        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
          <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}>
            <Truck size={20} color="#0284c7" /> Retail Pharmacy Purchase Order & Shelf Stock Inward
          </h3>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Inward stock from pharmaceutical distributors with flexible Sales Tax, Adv Tax, AWH Tax, Custom Taxes, client item codes, and optional shelf rack
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* HEADER ROW WITH DISTRIBUTOR SELECTION & QUICK-ADD */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
            <div>
              <div className="flex-between" style={{ marginBottom: '0.2rem' }}>
                <label className="subtext" style={{ fontWeight: 700, fontSize: '11px' }}>Pharma Distributor / Vendor *:</label>
                <button
                  type="button"
                  onClick={() => setIsAddDistributorOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <UserPlus size={12} /> + Add New Distributor
                </button>
              </div>
              <select
                value={distributor}
                onChange={(e) => setDistributor(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, outline: 'none', backgroundColor: '#ffffff' }}
              >
                {suppliers.length === 0 ? (
                  <option value="">-- No Suppliers Yet (Click "+ Add New" above) --</option>
                ) : (
                  suppliers.map((s, idx) => (
                    <option key={idx} value={s.name || s.companyName}>
                      {s.name || s.companyName} {s.city ? `(${s.city})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 700, fontSize: '11px', display: 'block', marginBottom: '0.2rem' }}>PO Tracking #:</label>
              <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, outline: 'none' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 700, fontSize: '11px', display: 'block', marginBottom: '0.2rem' }}>Vendor Invoice #:</label>
              <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="e.g. INV-9901" style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }} required />
            </div>

            <div>
              <label className="subtext" style={{ fontWeight: 700, fontSize: '11px', display: 'block', marginBottom: '0.2rem' }}>Inward Date:</label>
              <input type="date" value={inwardDate} onChange={(e) => setInwardDate(e.target.value)} style={{ width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }} required />
            </div>
          </div>

          {/* DYNAMIC TAX CONFIGURATOR PANEL */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '14px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '12px', fontWeight: 800, color: '#0369a1' }}>
                <Calculator size={15} color="#0284c7" /> Dynamic PO Tax Regime Configurator
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => applyTaxPreset(18, 4, 0, '', 0)}
                  style={{ fontSize: '10.5px', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #0284c7', backgroundColor: defaultStRate === 18 && defaultAdvRate === 4 ? '#0284c7' : '#ffffff', color: defaultStRate === 18 && defaultAdvRate === 4 ? '#ffffff' : '#0284c7', cursor: 'pointer' }}
                >
                  Standard 18% ST + 4% Adv
                </button>
                <button
                  type="button"
                  onClick={() => applyTaxPreset(0, 0, 2, '', 0)}
                  style={{ fontSize: '10.5px', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #0284c7', backgroundColor: defaultStRate === 0 && defaultAwhRate === 2 ? '#0284c7' : '#ffffff', color: defaultStRate === 0 && defaultAwhRate === 2 ? '#ffffff' : '#0284c7', cursor: 'pointer' }}
                >
                  AWH Only (2% AWH, 0% ST)
                </button>
                <button
                  type="button"
                  onClick={() => applyTaxPreset(0, 0, 0, '', 0)}
                  style={{ fontSize: '10.5px', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #64748b', backgroundColor: defaultStRate === 0 && defaultAdvRate === 0 && defaultAwhRate === 0 ? '#64748b' : '#ffffff', color: defaultStRate === 0 && defaultAdvRate === 0 && defaultAwhRate === 0 ? '#ffffff' : '#64748b', cursor: 'pointer' }}
                >
                  Tax Exempt (0% All)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
              <div>
                <label className="subtext" style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369a1' }}>Sales Tax Rate (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={defaultStRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDefaultStRate(val);
                    setItems((prev) => prev.map((it) => ({ ...it, salesTaxRate: val })));
                  }}
                  style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="subtext" style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369a1' }}>Advance / WHT Rate (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={defaultAdvRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDefaultAdvRate(val);
                    setItems((prev) => prev.map((it) => ({ ...it, advTaxRate: val })));
                  }}
                  style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="subtext" style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369a1' }}>AWH Tax Rate (%):</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={defaultAwhRate}
                  placeholder="e.g. 0.5, 2"
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setDefaultAwhRate(val);
                    setItems((prev) => prev.map((it) => ({ ...it, awhTaxRate: val })));
                  }}
                  style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '12px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label className="subtext" style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369a1' }}>Custom / Other Tax (Name & %):</label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. PRA / SRB"
                    value={customTaxName}
                    onChange={(e) => setCustomTaxName(e.target.value)}
                    style={{ flex: 2, padding: '0.35rem 0.4rem', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '11px' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    placeholder="%"
                    value={customTaxRate}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setCustomTaxRate(val);
                      setItems((prev) => prev.map((it) => ({ ...it, customTaxRate: val })));
                    }}
                    style={{ flex: 1, padding: '0.35rem 0.3rem', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '11px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LINE ITEMS TABLE (EXPANDED HIGH-VISIBILITY INPUT BOXES) */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div className="flex-between" style={{ backgroundColor: '#f1f5f9', padding: '0.75rem 1rem', borderBottom: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={17} color="#0284c7" /> Inward Medicine Line Items ({items.length})
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '0.45rem 0.85rem', backgroundColor: '#0284c7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}
              >
                <Plus size={14} /> + Add Medicine Item
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '12px', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ width: '28px' }}>#</th>
                    <th style={{ minWidth: '95px' }}>Item Code (Opt)</th>
                    <th style={{ minWidth: '175px' }}>Medicine Name *</th>
                    <th style={{ minWidth: '135px' }}>Formula (Opt)</th>
                    <th style={{ minWidth: '105px' }}>Batch # (Opt)</th>
                    <th style={{ minWidth: '110px' }}>Expiry (MM-YYYY) *</th>
                    <th style={{ width: '65px', textAlign: 'center' }}>Boxes</th>
                    <th style={{ width: '65px', textAlign: 'center' }}>Strips/Box</th>
                    <th style={{ width: '85px', textAlign: 'right' }}>Cost/Box</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Retail MRP</th>
                    <th style={{ minWidth: '130px', textAlign: 'right' }}>Taxes Applied</th>
                    <th style={{ width: '95px', textAlign: 'right' }}>Net Total</th>
                    <th style={{ minWidth: '105px' }}>Shelf Rack (Opt)</th>
                    <th style={{ width: '35px', textAlign: 'center' }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          placeholder="e.g. 1001"
                          value={item.itemCode || ''}
                          onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: '#f8fafc', color: '#0369a1' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Trade Name e.g. Panadol"
                          value={item.tradeName}
                          onChange={(e) => handleItemChange(idx, 'tradeName', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Optional Formula"
                          value={item.genericFormula}
                          onChange={(e) => handleItemChange(idx, 'genericFormula', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Auto Batch"
                          value={item.batchNo}
                          onChange={(e) => handleItemChange(idx, 'batchNo', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="MM-YYYY e.g. 10-2028"
                          value={item.expiryDate}
                          onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, color: '#16a34a' }}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 5"
                          value={item.inwardBoxes}
                          onChange={(e) => handleItemChange(idx, 'inwardBoxes', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.35rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'center', fontWeight: 700 }}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 20"
                          value={item.stripsPerBox}
                          onChange={(e) => handleItemChange(idx, 'stripsPerBox', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.35rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'center' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 480"
                          value={item.boxCost}
                          onChange={(e) => handleItemChange(idx, 'boxCost', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'right', fontWeight: 700 }}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 600"
                          value={item.boxMrp}
                          onChange={(e) => handleItemChange(idx, 'boxMrp', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'right', fontWeight: 800, color: '#0284c7' }}
                          required
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'flex-end', fontSize: '11px' }}>
                          {item.stAmount > 0 && (
                            <span style={{ color: '#0284c7', fontWeight: 700 }}>ST ({item.stRate}%): Rs. {item.stAmount.toFixed(1)}</span>
                          )}
                          {item.advAmount > 0 && (
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>Adv ({item.advRate}%): Rs. {item.advAmount.toFixed(1)}</span>
                          )}
                          {item.awhAmount > 0 && (
                            <span style={{ color: '#d97706', fontWeight: 700 }}>AWH ({item.awhRate}%): Rs. {item.awhAmount.toFixed(1)}</span>
                          )}
                          {item.customAmount > 0 && (
                            <span style={{ color: '#9333ea', fontWeight: 700 }}>{customTaxName || 'Tax'} ({item.customRate}%): Rs. {item.customAmount.toFixed(1)}</span>
                          )}
                          {item.stAmount === 0 && item.advAmount === 0 && item.awhAmount === 0 && item.customAmount === 0 && (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>0% (Exempt)</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '13px' }}>
                        Rs. {item.lineNetTotal.toFixed(2)}
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Optional"
                          value={item.shelfLocation}
                          onChange={(e) => handleItemChange(idx, 'shelfLocation', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '11.5px' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          disabled={items.length <= 1}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC SUMMARY BOTTOM BAR */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gross Purchase Cost</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginTop: '0.15rem' }}>
                Rs. {totalGrossPurchase.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {totalSalesTax > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>+ Sales Tax ({defaultStRate}%)</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0284c7', marginTop: '0.15rem' }}>
                  Rs. {totalSalesTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {totalAdvTax > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 800, textTransform: 'uppercase' }}>+ Adv Tax ({defaultAdvRate}%)</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#16a34a', marginTop: '0.15rem' }}>
                  Rs. {totalAdvTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {totalAwhTax > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#d97706', fontWeight: 800, textTransform: 'uppercase' }}>+ AWH Tax ({defaultAwhRate}%)</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#d97706', marginTop: '0.15rem' }}>
                  Rs. {totalAwhTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {totalCustomTax > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: '#9333ea', fontWeight: 800, textTransform: 'uppercase' }}>+ {customTaxName || 'Custom'} ({customTaxRate}%)</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#9333ea', marginTop: '0.15rem' }}>
                  Rs. {totalCustomTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '10px', color: '#065f46', fontWeight: 800, textTransform: 'uppercase' }}>Grand Net Invoice Total</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669', marginTop: '0.15rem' }}>
                Rs. {grandTotalPO.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Est Retail Margin</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0284c7', marginTop: '0.15rem' }}>
                {estMargin}% Profit
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ borderRadius: '10px', padding: '0.6rem 1.25rem', fontSize: '12px', fontWeight: 700 }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ borderRadius: '10px', padding: '0.6rem 1.75rem', fontSize: '12.5px', fontWeight: 800, backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={16} /> Confirm PO & Inward Shelf Stock
            </button>
          </div>
        </form>

        {/* QUICK ADD NEW DISTRIBUTOR SUB-MODAL */}
        {isAddDistributorOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)' }}>
              <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={18} color="#0284c7" />
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Register New Pharma Distributor</h4>
                </div>
                <button type="button" onClick={() => setIsAddDistributorOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} color="#64748b" />
                </button>
              </div>

              <form onSubmit={handleSaveNewDistributor} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Company / Distributor Name *:</label>
                  <input
                    type="text"
                    placeholder="e.g. Ferozsons Labs / Searle Pakistan"
                    value={newDistName}
                    onChange={(e) => setNewDistName(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Operating City *:</label>
                    <input
                      type="text"
                      placeholder="e.g. Islamabad / Rawalpindi"
                      value={newDistCity}
                      onChange={(e) => setNewDistCity(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Contact Phone:</label>
                    <input
                      type="text"
                      placeholder="e.g. 051-2345678"
                      value={newDistPhone}
                      onChange={(e) => setNewDistPhone(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="subtext" style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '0.15rem' }}>Distributor NTN / GSTIN (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. 0792320-1"
                    value={newDistNtn}
                    onChange={(e) => setNewDistNtn(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#0284c7', borderRadius: '10px', fontSize: '12px', fontWeight: 800, padding: '0.6rem', marginTop: '0.35rem' }}
                >
                  <CheckCircle size={14} /> Save & Select Distributor
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailNewPOModal;
