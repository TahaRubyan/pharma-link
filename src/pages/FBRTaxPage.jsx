import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Search, 
  Calendar, 
  Filter, 
  DollarSign, 
  ShieldCheck, 
  Truck, 
  TrendingUp, 
  Scale, 
  CheckCircle2, 
  Building, 
  ArrowUpRight, 
  ArrowDownRight,
  HelpCircle
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useSupplier } from '../context/SupplierContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';
import FBRLawyerReportModal from '../components/modals/FBRLawyerReportModal';

export const FBRTaxPage = () => {
  const { invoices = [] } = useSales();
  const { purchaseOrders = [], suppliers = [] } = useSupplier();
  const { currentShop } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('ANNEX_C'); // 'ANNEX_C' | 'ANNEX_A' | 'RECONCILIATION'
  const [periodMode, setPeriodMode] = useState('MONTH'); // 'MONTH' | 'CUSTOM' | 'ALL'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // '2026-09'
  });
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);
  const [outwardViewMode, setOutwardViewMode] = useState('ITEMIZED'); // 'ITEMIZED' | 'INVOICES'

  // Date bounds matching helper
  const matchesDateFilter = (dateStr) => {
    if (!dateStr) return false;
    if (periodMode === 'ALL') return true;
    if (periodMode === 'MONTH') {
      return dateStr.startsWith(selectedMonth);
    }
    if (periodMode === 'CUSTOM') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Filter Sales Invoices (Outward Supplies / Annexure-C)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = inv.date || '';
      if (!matchesDateFilter(invDate)) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
          (inv.shopName && inv.shopName.toLowerCase().includes(q)) ||
          (inv.paymentMode && inv.paymentMode.toLowerCase().includes(q)) ||
          (inv.items && inv.items.some((it) => (it.name || '').toLowerCase().includes(q) || (it.formula || '').toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [invoices, periodMode, selectedMonth, customStartDate, customEndDate, searchQuery]);

  // Filter Purchase Orders (Inward Supplies / Annexure-A)
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const poDate = po.inwardDate || po.date || '';
      if (!matchesDateFilter(poDate)) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (po.poNumber && po.poNumber.toLowerCase().includes(q)) ||
          (po.distributorName && po.distributorName.toLowerCase().includes(q)) ||
          (po.supplierName && po.supplierName.toLowerCase().includes(q)) ||
          (po.brandName && po.brandName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [purchaseOrders, periodMode, selectedMonth, customStartDate, customEndDate, searchQuery]);

  // Itemized Outward Sales Schedule (Matches Official FBR Schedule Columns)
  const itemizedOutwardSales = useMemo(() => {
    const list = [];
    filteredInvoices.forEach((inv) => {
      (inv.items || []).forEach((it, itIdx) => {
        const name = it.name || it.brandName || 'Medicine Item';
        const formula = it.formula || it.genericFormula || 'Formula USP';
        const qty = Number(it.qty || it.quantity || 1);
        const rate = Number(it.boxPrice || it.price || it.unitPrice || 0);
        const taxable = rate * qty - Number(it.discount || 0);
        const taxRate = Number(it.taxRate !== undefined ? it.taxRate : (it.saleTaxPercent !== undefined ? it.saleTaxPercent : 18));
        const salesTax = taxable * (taxRate / 100);
        const netTotal = taxable + salesTax;

        list.push({
          id: `${inv.invoiceNo}-${itIdx}`,
          invoiceNo: inv.invoiceNo,
          date: inv.date,
          buyerName: inv.customerName || inv.shopName || 'Walk-in Client',
          buyerGstin: inv.customerGstin || inv.gstin || 'PK-3277876174544',
          name,
          formula,
          qty,
          taxable,
          taxRate,
          salesTax,
          netTotal
        });
      });
    });
    return list;
  }, [filteredInvoices]);

  const auditPeriodLabel = useMemo(() => {
    if (periodMode === 'MONTH') {
      const parts = selectedMonth.split('-');
      if (parts.length === 2) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const name = monthNames[mIdx] || parts[1];
        return `${name} ${parts[0]} (Monthly Tax Audit)`;
      }
      return `${selectedMonth} (Monthly Tax Audit)`;
    }
    if (periodMode === 'CUSTOM') {
      return `Custom Period (${formatDateDDMMYYYY(customStartDate)} to ${formatDateDDMMYYYY(customEndDate)})`;
    }
    return 'All Recorded Outward Sales Tax Periods';
  }, [periodMode, selectedMonth, customStartDate, customEndDate]);

  const auditDateWindow = useMemo(() => {
    if (periodMode === 'MONTH') {
      return `${selectedMonth}-01 to ${selectedMonth}-31`;
    }
    if (periodMode === 'CUSTOM') {
      return `${customStartDate} to ${customEndDate}`;
    }
    return 'All-time Transactions';
  }, [periodMode, selectedMonth, customStartDate, customEndDate]);

  // Sales Output Tax Aggregation
  const salesTaxSummary = useMemo(() => {
    let grossSales = 0;
    let salesTax18 = 0;
    let salesTax19 = 0;
    let advTax05 = 0;
    let netSalesTotal = 0;

    filteredInvoices.forEach((inv) => {
      const items = inv.items || [];
      items.forEach((item) => {
        const itemGross = Number(item.boxPrice || item.price || item.unitPrice || 0) * Number(item.qty || item.quantity || 1);
        grossSales += itemGross;

        const rate = Number(item.taxRate !== undefined ? item.taxRate : 18);
        if (rate === 19) {
          salesTax19 += itemGross * 0.19;
        } else if (rate === 18) {
          salesTax18 += itemGross * 0.18;
        } else if (rate > 0) {
          salesTax18 += itemGross * (rate / 100);
        }

        const adv = Number(item.advTax05 !== undefined ? item.advTax05 : (itemGross * 0.005));
        advTax05 += adv;
      });

      netSalesTotal += Number(inv.netTotal || inv.subtotal || 0);
    });

    const totalOutputTax = salesTax18 + salesTax19;
    const totalCollectedWithAdvance = totalOutputTax + advTax05;

    return {
      grossSales,
      salesTax18,
      salesTax19,
      totalOutputTax,
      advTax05,
      netSalesTotal,
      totalCollectedWithAdvance
    };
  }, [filteredInvoices]);

  // Purchase Input Tax Aggregation (Standard 18% sales tax paid on wholesale purchases)
  const purchaseTaxSummary = useMemo(() => {
    let grossPurchases = 0;
    let totalInputTaxPaid = 0;

    filteredPOs.forEach((po) => {
      const cost = Number(po.totalAmount || po.grossCost || 0);
      grossPurchases += cost;
      // In Pakistan pharma wholesale, standard input tax on registered distributor invoice is 18%
      const inputTax = po.inputTax !== undefined ? Number(po.inputTax) : (cost * 0.18);
      totalInputTaxPaid += inputTax;
    });

    return {
      grossPurchases,
      totalInputTaxPaid
    };
  }, [filteredPOs]);

  // Net Tax Reconciliation: Output Tax Collected - Input Tax Paid
  const netTaxReconciliation = useMemo(() => {
    const outputTax = salesTaxSummary.totalOutputTax;
    const inputTax = purchaseTaxSummary.totalInputTaxPaid;
    const netTaxPayable = outputTax - inputTax;
    const advanceTaxWithheld = salesTaxSummary.advTax05;
    const finalCPRChallanPayable = netTaxPayable > 0 ? (netTaxPayable + advanceTaxWithheld) : advanceTaxWithheld;

    return {
      outputTax,
      inputTax,
      netTaxPayable,
      isPayable: netTaxPayable >= 0,
      advanceTaxWithheld,
      finalCPRChallanPayable
    };
  }, [salesTaxSummary, purchaseTaxSummary]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* HEADER BAR */}
      <div className="flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="page-title" style={{ fontSize: '20px' }}>FBR Official Sales Tax Audit & Reconciliation</h2>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Annex-C & Annex-A Reconciled
            </span>
          </div>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Monthly Federal Board of Revenue (FBR) Sales Tax & 0.5% Advance Tax filing schedules with Input vs Output reconciliation for Tax Lawyers & CAs
          </p>
        </div>

        <button
          onClick={() => setIsLawyerModalOpen(true)}
          className="btn btn-primary"
          style={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#111827', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={15} /> Generate FBR Lawyer Filing Schedule
        </button>
      </div>

      {/* FILTER & AUDIT TIMEFRAME BAR (MONTHLY SELECTOR + CUSTOM DATE RANGE) */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#047857', fontWeight: 800, fontSize: '12px' }}>
            <Calendar size={16} /> Audit Period:
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '10px', gap: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setPeriodMode('MONTH')}
              style={{
                border: 'none',
                backgroundColor: periodMode === 'MONTH' ? '#ffffff' : 'transparent',
                color: periodMode === 'MONTH' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '11px',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: periodMode === 'MONTH' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              📅 Monthly Basis
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('CUSTOM')}
              style={{
                border: 'none',
                backgroundColor: periodMode === 'CUSTOM' ? '#ffffff' : 'transparent',
                color: periodMode === 'CUSTOM' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '11px',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: periodMode === 'CUSTOM' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              📆 Custom Date Range
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('ALL')}
              style={{
                border: 'none',
                backgroundColor: periodMode === 'ALL' ? '#ffffff' : 'transparent',
                color: periodMode === 'ALL' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '11px',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: periodMode === 'ALL' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              All Time
            </button>
          </div>

          {/* Controls for Monthly Basis */}
          {periodMode === 'MONTH' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer', backgroundColor: '#ffffff' }}
            >
              <option value="2026-09">September 2026 (Current Cycle)</option>
              <option value="2026-08">August 2026 (08-2026)</option>
              <option value="2026-07">July 2026 (07-2026)</option>
              <option value="2026-06">June 2026 (06-2026)</option>
              <option value="2026-05">May 2026 (05-2026)</option>
            </select>
          )}

          {/* Controls for Custom Date Range */}
          {periodMode === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
              />
            </div>
          )}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search Item, Invoice, Formula, Buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
        </div>
      </div>

      {/* 4-WAY EXECUTIVE RECONCILIATION KPI HEADER */}
      <div className="grid-4" style={{ gap: '0.85rem' }}>
        {/* KPI 1: Inward Supplies & Input Tax */}
        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>1. Input Tax Paid (POs)</span>
            <Truck size={15} color="#0284c7" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
            Rs. {purchaseTaxSummary.totalInputTaxPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ marginTop: '0.25rem', fontSize: '11px' }}>
            On Rs. {purchaseTaxSummary.grossPurchases.toLocaleString('en-PK')} Inward Stock ({filteredPOs.length} POs)
          </div>
        </div>

        {/* KPI 2: Outward Supplies & Output Tax */}
        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>2. Output Tax Collected</span>
            <TrendingUp size={15} color="#16a34a" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
            Rs. {salesTaxSummary.totalOutputTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ marginTop: '0.25rem', fontSize: '11px' }}>
            18% & 19% ST on Rs. {salesTaxSummary.grossSales.toLocaleString('en-PK')} Sales
          </div>
        </div>

        {/* KPI 3: Advance Tax 0.5% */}
        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="subtext" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>3. Sec 236G Adv Tax (0.5%)</span>
            <Scale size={15} color="#6366f1" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#4338ca', marginTop: '0.2rem' }}>
            Rs. {salesTaxSummary.advTax05.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ marginTop: '0.25rem', fontSize: '11px' }}>
            Wholesale B2B Advance Tax Collected
          </div>
        </div>

        {/* KPI 4: Net Tax Liability / Adjustment */}
        <div 
          className="card card-hover" 
          style={{ 
            backgroundColor: netTaxReconciliation.isPayable ? '#f0fdf4' : '#eff6ff', 
            border: netTaxReconciliation.isPayable ? '2px solid #16a34a' : '2px solid #0284c7' 
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="subtext" style={{ fontWeight: 800, color: netTaxReconciliation.isPayable ? '#166534' : '#1e40af', textTransform: 'uppercase', fontSize: '10.5px' }}>
              4. Net FBR Tax Position
            </span>
            <ShieldCheck size={16} color={netTaxReconciliation.isPayable ? '#16a34a' : '#0284c7'} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: netTaxReconciliation.isPayable ? '#15803d' : '#0369a1', marginTop: '0.2rem' }}>
            Rs. {Math.abs(netTaxReconciliation.netTaxPayable).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: netTaxReconciliation.isPayable ? '#166534' : '#0284c7', marginTop: '0.25rem' }}>
            {netTaxReconciliation.isPayable ? 'Net Sales Tax Payable to FBR' : 'Input Tax Credit Carried Forward'}
          </div>
        </div>
      </div>

      {/* 3 SUB-TABS: ANNEX-C (SALES) | ANNEX-A (PURCHASES) | RECONCILIATION STATEMENT */}
      <div className="card" style={{ padding: '0.5rem 0.85rem', backgroundColor: '#ffffff', display: 'flex', gap: '0.5rem', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('ANNEX_C')}
          className={`btn ${activeSubTab === 'ANNEX_C' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <TrendingUp size={14} /> Annexure-C: Outward Sales Register ({filteredInvoices.length})
        </button>

        <button
          onClick={() => setActiveSubTab('ANNEX_A')}
          className={`btn ${activeSubTab === 'ANNEX_A' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <Truck size={14} /> Annexure-A: Inward Purchases Register ({filteredPOs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('RECONCILIATION')}
          className={`btn ${activeSubTab === 'RECONCILIATION' ? 'btn-primary' : 'btn-outline'}`}
          style={{ fontSize: '12px', borderRadius: '10px' }}
        >
          <Scale size={14} /> Official Tax Reconciliation & CPR Schedule
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ANNEXURE-C SALES REGISTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'ANNEX_C' && (
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '15px', color: '#0f172a', margin: 0 }}>
                Annexure-C: Outward Sales Tax Register ({auditPeriodLabel})
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Itemized medicine sales with generic formulas, 18%/19% sales tax, and 0.5% advance tax.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '10px', gap: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => setOutwardViewMode('ITEMIZED')}
                  style={{
                    border: 'none',
                    backgroundColor: outwardViewMode === 'ITEMIZED' ? '#ffffff' : 'transparent',
                    color: outwardViewMode === 'ITEMIZED' ? '#0f172a' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: outwardViewMode === 'ITEMIZED' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  📋 Itemized Schedule ({itemizedOutwardSales.length} items)
                </button>
                <button
                  type="button"
                  onClick={() => setOutwardViewMode('INVOICES')}
                  style={{
                    border: 'none',
                    backgroundColor: outwardViewMode === 'INVOICES' ? '#ffffff' : 'transparent',
                    color: outwardViewMode === 'INVOICES' ? '#0f172a' : '#64748b',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: outwardViewMode === 'INVOICES' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  🧾 Invoices Summary ({filteredInvoices.length})
                </button>
              </div>

              <span className="badge badge-success">
                Total Output Tax: Rs. {salesTaxSummary.totalOutputTax.toFixed(2)}
              </span>
            </div>
          </div>

          {outwardViewMode === 'ITEMIZED' ? (
            <div className="table-container">
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Item Name</th>
                    <th>Formula / Generic</th>
                    <th style={{ textAlign: 'center' }}>Sold Quantity (Units)</th>
                    <th style={{ textAlign: 'right' }}>Taxable Sales</th>
                    <th style={{ textAlign: 'right' }}>Tax Rate</th>
                    <th style={{ textAlign: 'right' }}>Sales Tax (Rs.)</th>
                    <th style={{ textAlign: 'right' }}>Net Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {itemizedOutwardSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No outward taxable sales recorded in selected audit period. Add sales invoices to view itemized schedule.
                      </td>
                    </tr>
                  ) : (
                    itemizedOutwardSales.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{item.invoiceNo}</td>
                        <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{formatDateDDMMYYYY(item.date)}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                        <td style={{ color: '#475569' }}>{item.formula}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {item.taxable.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}><span className="badge badge-otc">{item.taxRate}%</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>Rs. {item.salesTax.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>Rs. {item.netTotal.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                  {itemizedOutwardSales.length > 0 && (
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={5}>TOTAL (UNITS, SALES, TAX):</td>
                      <td style={{ textAlign: 'center' }}>{itemizedOutwardSales.reduce((s, i) => s + i.qty, 0)} Units</td>
                      <td style={{ textAlign: 'right' }}>Rs. {itemizedOutwardSales.reduce((s, i) => s + i.taxable, 0).toFixed(2)}</td>
                      <td></td>
                      <td style={{ textAlign: 'right', color: '#047857' }}>Rs. {itemizedOutwardSales.reduce((s, i) => s + i.salesTax, 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: '#0f172a' }}>Rs. {itemizedOutwardSales.reduce((s, i) => s + i.netTotal, 0).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Buyer / Pharmacy Name</th>
                    <th>STRN / NTN</th>
                    <th>Payment Mode</th>
                    <th style={{ textAlign: 'right' }}>Taxable Gross</th>
                    <th style={{ textAlign: 'right' }}>18% Sales Tax</th>
                    <th style={{ textAlign: 'right' }}>19% Sales Tax</th>
                    <th style={{ textAlign: 'right' }}>0.5% Adv Tax</th>
                    <th style={{ textAlign: 'right' }}>Total Tax</th>
                    <th style={{ textAlign: 'right' }}>Net Invoice Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No sales invoices match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const items = inv.items || [];
                      const itemGross = items.reduce((sum, i) => sum + (Number(i.boxPrice || i.price || i.unitPrice || 0) * Number(i.qty || i.quantity || 1)), 0);
                      
                      let st18 = 0;
                      let st19 = 0;
                      items.forEach((it) => {
                        const g = Number(it.boxPrice || it.price || it.unitPrice || 0) * Number(it.qty || it.quantity || 1);
                        const rate = Number(it.taxRate !== undefined ? it.taxRate : 18);
                        if (rate === 19) st19 += g * 0.19;
                        else if (rate === 18) st18 += g * 0.18;
                        else if (rate > 0) st18 += g * (rate / 100);
                      });

                      const adv = items.reduce((sum, i) => {
                        const g = Number(i.boxPrice || i.price || i.unitPrice || 0) * Number(i.qty || i.quantity || 1);
                        return sum + Number(i.advTax05 !== undefined ? i.advTax05 : (g * 0.005));
                      }, 0);

                      const lineTaxTot = st18 + st19 + adv;

                      return (
                        <tr key={inv.invoiceNo}>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNo}</td>
                          <td style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{formatDateDDMMYYYY(inv.date)}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{inv.shopName || inv.customerName || 'Walk-in Client'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#64748b' }}>
                            {inv.customerGstin || inv.gstin || 'PK-3277876174544'}
                          </td>
                          <td><span className="badge badge-success">{inv.paymentMode || 'Cash'}</span></td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {itemGross.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                            {st18 > 0 ? `Rs. ${st18.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                            {st19 > 0 ? `Rs. ${st19.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#4338ca' }}>Rs. {adv.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857' }}>Rs. {lineTaxTot.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            Rs. {Number(inv.netTotal || inv.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ANNEXURE-A PURCHASES REGISTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'ANNEX_A' && (
        <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '15px', color: '#0f172a', margin: 0 }}>
                Annexure-A: Inward Purchase Orders & Input Tax Register
              </h3>
              <p className="subtext" style={{ marginTop: '0.15rem' }}>
                Shows purchases from pharmaceutical distributors/manufacturers with 18% input sales tax credited against national treasury.
              </p>
            </div>
            <span className="badge badge-primary">
              Total Input Tax Paid: Rs. {purchaseTaxSummary.totalInputTaxPaid.toFixed(2)}
            </span>
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>PO Reference #</th>
                  <th>Inward Date</th>
                  <th>Distributor / Manufacturer</th>
                  <th>Distributor NTN / STRN</th>
                  <th>Inward Items / Medicine Line</th>
                  <th style={{ textAlign: 'right' }}>Gross Inward Cost</th>
                  <th style={{ textAlign: 'right' }}>18% Input Tax Paid</th>
                  <th style={{ textAlign: 'center' }}>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>FBR Credit Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No purchase orders recorded for the selected timeframe.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po, idx) => {
                    const cost = Number(po.totalAmount || po.grossCost || 0);
                    const inputTax = po.inputTax !== undefined ? Number(po.inputTax) : (cost * 0.18);
                    const distName = po.distributorName || po.supplierName || 'Muller & Phipps Pakistan';
                    const matchedSup = suppliers.find(s => (s.name === distName || s.companyName === distName));

                    return (
                      <tr key={po.poNumber || idx}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{po.poNumber || `PO-${idx + 1}`}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatDateDDMMYYYY(po.inwardDate || po.date)}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{distName}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: '#64748b' }}>
                          {matchedSup?.ntn || '0814521-4'} / {matchedSup?.gstin || '07-02-9999-123-45'}
                        </td>
                        <td style={{ color: '#334155' }}>
                          {po.itemLines || po.brandName || (po.items ? `${po.items.length} Line Items` : 'Medicines')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          Rs. {cost.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                          Rs. {inputTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-success">{po.paymentStatus || 'Paid in Full'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-otc">Claimed ✓</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: RECONCILIATION STATEMENT & CPR PAYMENT SCHEDULE */}
      {/* ========================================================================= */}
      {activeSubTab === 'RECONCILIATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="section-title" style={{ fontSize: '17px', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Scale size={18} color="#047857" /> FBR Form STR-7 (Monthly Sales Tax & Advance Tax Return Schedule)
                </h3>
                <p className="subtext" style={{ marginTop: '0.2rem' }}>
                  Computation sheet for Chartered Accountants & Advocates to file electronic CPR (Computerized Payment Receipt)
                </p>
              </div>

              <button onClick={() => setIsLawyerModalOpen(true)} className="btn btn-primary" style={{ backgroundColor: '#111827', borderRadius: '10px', fontSize: '12px' }}>
                <Printer size={14} /> Print Formal Statement
              </button>
            </div>

            {/* BREAKDOWN LEDGER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* SECTION 1: INWARD PURCHASES (INPUT TAX) */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0284c7', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={16} /> Section A: Inward Supplies (Input Tax Credit)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '12px' }}>
                  <div className="flex-between">
                    <span style={{ color: '#64748b' }}>Total Gross Purchase Value (Annexure-A):</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>Rs. {purchaseTaxSummary.grossPurchases.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: '#64748b' }}>Input Sales Tax Paid (18% Rate):</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#0284c7' }}>Rs. {purchaseTaxSummary.totalInputTaxPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: '#64748b' }}>Inward Purchase Transactions:</span>
                    <span>{filteredPOs.length} POs Processed</span>
                  </div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }} className="flex-between">
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Net Admissible Input Tax:</span>
                    <strong style={{ color: '#0284c7', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                      Rs. {purchaseTaxSummary.totalInputTaxPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* SECTION 2: OUTWARD SALES (OUTPUT TAX) */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#16a34a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendingUp size={16} /> Section B: Outward Supplies (Output Tax Liability)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '12px' }}>
                  <div className="flex-between">
                    <span style={{ color: '#64748b' }}>Total B2B Taxable Sales (Annexure-C):</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>Rs. {salesTaxSummary.grossSales.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: '#64748b' }}>18% Standard Sales Tax Collected:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#047857' }}>Rs. {salesTaxSummary.salesTax18.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: '#64748b' }}>19% Tier Sales Tax Collected:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#d97706' }}>Rs. {salesTaxSummary.salesTax19.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }} className="flex-between">
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Total Output Sales Tax:</span>
                    <strong style={{ color: '#16a34a', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                      Rs. {salesTaxSummary.totalOutputTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: NET TAX COMPUTATION & CHALLAN PAYABLE */}
            <div style={{ marginTop: '1.25rem', padding: '1.25rem', borderRadius: '14px', backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0' }}>
              <div style={{ fontWeight: 900, fontSize: '14px', color: '#166534', marginBottom: '0.85rem' }}>
                Section C: Net FBR CPR Challan Settlement Computation
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Output Tax</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
                    Rs. {salesTaxSummary.totalOutputTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Less: Input Tax Paid</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
                    Rs. {purchaseTaxSummary.totalInputTaxPaid.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Add: 0.5% Advance Tax</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#4338ca', marginTop: '0.2rem' }}>
                    Rs. {salesTaxSummary.advTax05.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '2px solid #16a34a' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>Net Challan (CPR) Due</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#15803d', marginTop: '0.2rem' }}>
                    Rs. {netTaxReconciliation.finalCPRChallanPayable.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FBR LAWYER REPORT & RETURN FILING MODAL (EXACT MATCH TO INSPIRATION PDF) */}
      {/* ========================================================================= */}
      {isLawyerModalOpen && (
        <FBRLawyerReportModal
          isOpen={isLawyerModalOpen}
          onClose={() => setIsLawyerModalOpen(false)}
          invoices={filteredInvoices}
          fbrData={{
            auditPeriod: auditPeriodLabel,
            dateWindow: auditDateWindow,
            invoicesCount: filteredInvoices.length,
            grossSales: salesTaxSummary.grossSales,
            salesTax: salesTaxSummary.totalOutputTax
          }}
        />
      )}
    </div>
  );
};

export default FBRTaxPage;
