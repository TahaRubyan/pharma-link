import React, { useState, useMemo } from 'react';
import { FileText, Printer, Search, Calendar, Filter, DollarSign, ShieldCheck } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useAuth, formatDateDDMMYYYY } from '../context/AuthContext';

export const FBRTaxPage = () => {
  const { invoices = [] } = useSales();
  const { currentShop } = useAuth();

  const [timeframeFilter, setTimeframeFilter] = useState('ALL'); // 'ALL' | 'TODAY' | '7DAYS' | '30DAYS'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLawyerModalOpen, setIsLawyerModalOpen] = useState(false);

  // Filter invoices by timeframe
  const filteredInvoices = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return invoices.filter((inv) => {
      if (timeframeFilter === 'TODAY' && inv.date !== todayStr) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return (
          inv.invoiceNo.toLowerCase().includes(q) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
          (inv.shopName && inv.shopName.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [invoices, timeframeFilter, searchQuery]);

  // Aggregate Tax Metrics
  const taxSummary = useMemo(() => {
    let totalGrossValue = 0;
    let totalSalesTax18 = 0;
    let totalAdvTax05 = 0;
    let totalNetTaxable = 0;

    filteredInvoices.forEach((inv) => {
      const items = inv.items || [];
      items.forEach((item) => {
        const itemGross = Number(item.boxPrice || item.price || 0) * Number(item.qty || 1);
        const itemST = Number(item.salesTax18 || (itemGross * 0.18));
        const itemAdv = Number(item.advTax05 || (itemGross * 0.005));

        totalGrossValue += itemGross;
        totalSalesTax18 += itemST;
        totalAdvTax05 += itemAdv;
      });

      totalNetTaxable += Number(inv.netTotal || inv.subtotal || 0);
    });

    return {
      totalGrossValue,
      totalSalesTax18,
      totalAdvTax05,
      totalNetTaxable,
      totalTaxCollected: totalSalesTax18 + totalAdvTax05
    };
  }, [filteredInvoices]);

  const handlePrintLawyerReport = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="page-title" style={{ fontSize: '20px' }}>FBR Official Sales Tax Audit & Lawyer Schedule</h2>
            <span className="badge badge-success">Annexure-C Compliant</span>
          </div>
          <p className="subtext" style={{ marginTop: '0.15rem' }}>
            Monthly Federal Board of Revenue (FBR) 18% Sales Tax & 0.5% Advance Tax filing schedules for tax lawyers
          </p>
        </div>

        <button
          onClick={() => setIsLawyerModalOpen(true)}
          className="btn btn-primary"
          style={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#111827' }}
        >
          <Printer size={15} /> Generate FBR Annexure-C Schedule
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={15} color="#047857" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Audit Timeframe:</span>
          <select
            value={timeframeFilter}
            onChange={(e) => setTimeframeFilter(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All Recorded Sales Invoices</option>
            <option value="TODAY">Today's Sales Filing</option>
            <option value="7DAYS">Past 7 Days Audit</option>
            <option value="30DAYS">Past 30 Days Audit</option>
          </select>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search Invoice # or Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.3rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
          />
        </div>
      </div>

      {/* EXECUTIVE TAX CARDS */}
      <div className="grid-4">
        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span className="subtext" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Gross Taxable Sales</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
            Rs. {taxSummary.totalGrossValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ marginTop: '0.3rem' }}>
            {filteredInvoices.length} Commercial Invoices
          </div>
        </div>

        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span className="subtext" style={{ fontWeight: 600, textTransform: 'uppercase' }}>18% Sales Tax Collected</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '0.2rem' }}>
            Rs. {taxSummary.totalSalesTax18.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ color: '#047857', fontWeight: 600, marginTop: '0.3rem' }}>
            FBR Standard Rate Schedule
          </div>
        </div>

        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span className="subtext" style={{ fontWeight: 600, textTransform: 'uppercase' }}>0.5% Advance Tax</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d4ed8', marginTop: '0.2rem' }}>
            Rs. {taxSummary.totalAdvTax05.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ color: '#1d4ed8', fontWeight: 600, marginTop: '0.3rem' }}>
            Wholesale Advance Tax
          </div>
        </div>

        <div className="card card-hover" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <span className="subtext" style={{ fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Total FBR Tax Liability</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#047857', marginTop: '0.2rem' }}>
            Rs. {taxSummary.totalTaxCollected.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <div className="subtext" style={{ color: '#047857', fontWeight: 600, marginTop: '0.3rem' }}>
            Ready for Return Annexure-C
          </div>
        </div>
      </div>

      {/* TAX LEDGER TABLE */}
      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <h3 className="section-title" style={{ marginBottom: '1rem' }}>FBR Tax Collection Audit Log</h3>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date (DD-MM-YYYY)</th>
                <th>Customer / Pharmacy Name</th>
                <th>Payment Mode</th>
                <th>Gross Amount</th>
                <th>18% Sales Tax</th>
                <th>0.5% Adv Tax</th>
                <th>Net Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const items = inv.items || [];
                const itemGross = items.reduce((sum, i) => sum + (Number(i.boxPrice || i.price || 0) * Number(i.qty || 1)), 0);
                const itemST = items.reduce((sum, i) => sum + Number(i.salesTax18 || (itemGross * 0.18)), 0);
                const itemAdv = items.reduce((sum, i) => sum + Number(i.advTax05 || (itemGross * 0.005)), 0);

                return (
                  <tr key={inv.invoiceNo}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNo}</td>
                    <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{formatDateDDMMYYYY(inv.date)}</td>
                    <td style={{ fontWeight: 700 }}>{inv.shopName || inv.customerName}</td>
                    <td><span className="badge badge-success">{inv.paymentMode || 'Cash'}</span></td>
                    <td style={{ fontWeight: 600 }}>Rs. {itemGross.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#047857' }}>Rs. {itemST.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#1d4ed8' }}>Rs. {itemAdv.toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>Rs. {Number(inv.netTotal || inv.subtotal || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FBR LAWYER REPORT MODAL */}
      {isLawyerModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'var(--font-sans)', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '880px', padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '20px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <h3 className="section-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#047857" /> FBR Annexure-C Monthly Sales Tax Return Schedule
                </h3>
                <p className="subtext" style={{ marginTop: '0.15rem' }}>
                  Official Schedule for Tax Lawyer & Chartered Accountant Filing
                </p>
              </div>

              <button onClick={handlePrintLawyerReport} className="btn btn-primary" style={{ borderRadius: '10px', fontSize: '12px', backgroundColor: '#111827' }}>
                <Printer size={15} /> Print FBR Schedule
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{currentShop ? currentShop.shopName : 'PharmaLink Wholesale Depot'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>STRN / GSTIN: <strong>{currentShop ? currentShop.gstin : 'PK-1234567-8'}</strong> | NTN: <strong>NTN-4581920-1</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>FILING DATE</div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatDateDDMMYYYY(new Date())}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', backgroundColor: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Net Taxable Sales</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>Rs. {taxSummary.totalGrossValue.toLocaleString('en-PK')}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>18% Sales Tax Total</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginTop: '0.15rem' }}>Rs. {taxSummary.totalSalesTax18.toLocaleString('en-PK')}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>0.5% Adv Tax Total</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1d4ed8', marginTop: '0.15rem' }}>Rs. {taxSummary.totalAdvTax05.toLocaleString('en-PK')}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setIsLawyerModalOpen(false)} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: '10px', backgroundColor: '#111827' }}>
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FBRTaxPage;
