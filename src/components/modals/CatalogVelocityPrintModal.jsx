import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Printer, BarChart3, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth, formatDateDDMMYYYY } from '../../context/AuthContext';

export const CatalogVelocityPrintModal = ({ isOpen, onClose, items = [] }) => {
  const { currentShop } = useAuth();
  const [mountReady, setMountReady] = useState(false);
  const mountElRef = useRef(null);

  useEffect(() => {
    const el = document.getElementById('a4-print-mount');
    if (el) {
      mountElRef.current = el;
      setMountReady(true);
    }
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-a4');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('printing-a4');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-a4');
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const storeName = currentShop?.shopName || 'Testing Shop';
  const ownerNtn = currentShop?.ntn || '4442705-7';
  const ownerStrn = currentShop?.gstin || currentShop?.strn || '3277876174544';
  const storeAddress = currentShop?.address || 'Jalal Pur Jattan, Gujrat';
  const storePhone = currentShop?.phone || '053-3724601, 053-3724602';
  const drugLicense = currentShop?.dlNumber || currentShop?.form20 || currentShop?.form21 || '09-342-0139-045748D';

  // Summary Metrics
  const totalCatalogItems = items.length;
  const totalSoldUnits = items.reduce((sum, it) => sum + (Number(it.totalTabsSold) || 0), 0);
  const totalRevenueGenerated = items.reduce((sum, it) => sum + (Number(it.totalRevenue) || 0), 0);
  const totalRemainingStock = items.reduce((sum, it) => sum + (Number(it.boxStock) || 0), 0);

  // A4 pagination: 16 items per page
  const ITEMS_PER_PAGE = 16;
  const pageChunks = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pageChunks.push(items.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pageChunks.length === 0) pageChunks.push([]);

  const renderA4Pages = (isPrint = false) => (
    <div
      id={isPrint ? 'printable-a4-catalog-velocity' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isPrint ? '0' : '2rem',
      }}
    >
      {pageChunks.map((chunk, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pageChunks.length - 1;

        return (
          <div
            key={pageIdx}
            className="a4-page-container"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #111827',
              padding: '1.25rem',
              minHeight: '1020px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: '#000000',
              fontSize: '10.5px',
              lineHeight: 1.35,
              boxSizing: 'border-box',
              pageBreakAfter: isPrint && !isLastPage ? 'always' : 'auto',
            }}
          >
            {/* TOP HEADER */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #000000',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.65rem',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '17px',
                      fontWeight: 900,
                      color: '#000000',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {storeName}
                  </h2>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, marginTop: '0.15rem' }}>
                    Owner N.T.N.: <strong>{ownerNtn}</strong> • STRN/GSTN: <strong>{ownerStrn}</strong>
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    Address: {storeAddress} • Tel: {storePhone}
                  </div>
                  <div style={{ fontSize: '10px' }}>
                    Drug License Form 20/21: <strong>{drugLicense}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h1
                    style={{
                      fontSize: '16.5px',
                      fontWeight: 900,
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      color: '#0284c7',
                    }}
                  >
                    CATALOG VELOCITY & STOCK AGGREGATES
                  </h1>
                  <div style={{ fontSize: '10px', marginTop: '0.2rem' }}>
                    Report Date: {formatDateDDMMYYYY(new Date())}, {new Date().toLocaleTimeString()}
                  </div>
                  <div
                    style={{
                      border: '1px solid #000000',
                      padding: '0.15rem 0.65rem',
                      fontWeight: 800,
                      fontSize: '10.5px',
                      marginTop: '0.35rem',
                      display: 'inline-block',
                    }}
                  >
                    Page {pageIdx + 1} of {pageChunks.length}
                  </div>
                </div>
              </div>

              {/* SUMMARY STATS (PAGE 1 ONLY) */}
              {isFirstPage && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    border: '1px solid #000000',
                    backgroundColor: '#f8fafc',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.65rem',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                      Catalog Medicines
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                      {totalCatalogItems} Products
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                      Total Units Sold
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#0284c7' }}>
                      {totalSoldUnits.toLocaleString()} Units / Packs
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                      Total Revenue Generated
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a' }}>
                      PKR {totalRevenueGenerated.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                      Remaining Warehouse Stock
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                      {totalRemainingStock.toLocaleString()} Boxes
                    </div>
                  </div>
                </div>
              )}

              {/* VELOCITY TABLE */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000000',
                  fontSize: '9.5px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.25rem', textAlign: 'center', width: '28px' }}>Sr.</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.45rem', textAlign: 'left' }}>Medicine Name & Generic Formula</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.35rem', textAlign: 'center', width: '75px' }}>Category</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.35rem', textAlign: 'left', width: '85px' }}>Shelf Location</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.35rem', textAlign: 'center', width: '65px' }}>Total Sold Units</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.35rem', textAlign: 'right', width: '80px' }}>Total Revenue</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.35rem', textAlign: 'center', width: '65px' }}>Remaining Stock</th>
                    <th style={{ border: '1px solid #000000', padding: '0.35rem 0.35rem', textAlign: 'center', width: '70px' }}>Velocity</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', border: '1px solid #000000' }}>
                        No catalog velocity records available.
                      </td>
                    </tr>
                  ) : (
                    chunk.map((item, idx) => {
                      const isFast = item.totalTabsSold >= 30;
                      const isModerate = item.totalTabsSold > 0 && item.totalTabsSold < 30;
                      const velocityLabel = isFast ? 'Fast Moving' : isModerate ? 'Moderate' : 'Slow / Dead';

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.25rem', textAlign: 'center', fontWeight: 700 }}>
                            {pageIdx * ITEMS_PER_PAGE + idx + 1}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.45rem' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.tradeName}</div>
                            <div style={{ fontSize: '8.5px', color: '#64748b' }}>{item.genericFormula}</div>
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.35rem', textAlign: 'center' }}>
                            {item.category}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.35rem', fontWeight: 600 }}>
                            {item.rackLocation}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.35rem', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>
                            {item.totalTabsSold} Units
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.35rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#16a34a' }}>
                            PKR {Number(item.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.35rem', textAlign: 'center', fontWeight: 700 }}>
                            {item.boxStock} Boxes
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.3rem 0.35rem', textAlign: 'center', fontWeight: 700, fontSize: '9px' }}>
                            {velocityLabel}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER & SIGN-OFF */}
            <div style={{ marginTop: '1.25rem' }}>
              {isLastPage && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1.5rem',
                    marginBottom: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #cbd5e1',
                    fontSize: '9.5px',
                    color: '#475569',
                  }}
                >
                  <div>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '150px', height: '24px' }}></div>
                    <div style={{ marginTop: '0.3rem', fontWeight: 700, color: '#0f172a' }}>Inventory Analyst</div>
                    <div>Stock velocity & turnover logged</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '150px', height: '24px', margin: '0 auto' }}></div>
                    <div style={{ marginTop: '0.3rem', fontWeight: 700, color: '#0f172a' }}>Warehouse Incharge</div>
                    <div>Physical shelf balance matched</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', width: '150px', height: '24px', marginLeft: 'auto' }}></div>
                    <div style={{ marginTop: '0.3rem', fontWeight: 700, color: '#0f172a' }}>Managing Pharmacist / Admin</div>
                    <div>Procurement approval & sign-off</div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #000000',
                  paddingTop: '0.4rem',
                  fontSize: '9px',
                  color: '#64748b',
                }}
              >
                <div>
                  Generated via <strong>PharmaLink Multi-Tenant ERP & POS</strong> • Catalog Velocity & Consumption Intelligence
                </div>
                <div>
                  Page <strong>{pageIdx + 1}</strong> of <strong>{pageChunks.length}</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 1. ISOLATED A4 PRINT PORTAL */}
      {mountReady && mountElRef.current && ReactDOM.createPortal(
        renderA4Pages(true),
        mountElRef.current
      )}

      {/* 2. ON-SCREEN MODAL PREVIEW */}
      <div
        className="a4-no-print"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          fontFamily: 'var(--font-sans)',
          padding: '1rem',
        }}
      >
        <div
          className="card"
          style={{
            width: '95vw',
            maxWidth: '960px',
            maxHeight: '92vh',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* HEADER BAR */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="#0284c7" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Catalog Velocity & Stock Aggregates (A4 Print / PDF Preview)
                </h3>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {items.length} Products • {totalSoldUnits} Units Sold • {pageChunks.length} A4 Page(s)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-primary"
                style={{
                  fontSize: '12px',
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  backgroundColor: '#0284c7',
                }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE PREVIEW CONTENT */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
            <div style={{ maxWidth: '840px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              {renderA4Pages(false)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CatalogVelocityPrintModal;
