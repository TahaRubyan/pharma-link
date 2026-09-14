import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_MEDICINES, INITIAL_BATCHES, INITIAL_VENDOR_RETURNS } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';
import { storageManager } from '../services/storageManager';
import { loadRetailMockData, clearRetailMockData } from '../services/mockDataManager';
import { dbSyncService } from '../services/dbSyncService';

const InventoryContext = createContext();

const INITIAL_AUDIT_LOGS = [];
const INITIAL_PO_TAX_LOGS = [];

const getInventoryStorageKey = (tenantId, type, mode) => {
  const tid = tenantId || 'TEN-TESTING-SHOP';
  if (tid === 'TEN-TESTING-SHOP') {
    return mode === 'RETAIL' ? `pharmalink_retail_${type}` : `pharmalink_pk_${type}`;
  }
  return `pharmalink_${tid}_${mode === 'RETAIL' ? 'retail' : 'wholesale'}_${type}`;
};

export const InventoryProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const activeTenantId = auth?.currentShop?.shopId || 'TEN-TESTING-SHOP';
  const isTestingShop = activeTenantId === 'TEN-TESTING-SHOP';
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  // Wholesale Medicines: strictly scoped per-tenant. Non-testing shops start blank [].
  const [wholesaleMedicines, setWholesaleMedicines] = useState(() => {
    const wsKey = getInventoryStorageKey(activeTenantId, 'medicines', 'WHOLESALE');
    const saved = storageManager.safeGetItem(wsKey, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_MEDICINES;
    }
    return [];
  });

  // Retail Medicines: strictly scoped per-tenant. Non-testing shops start blank [].
  const [retailMedicines, setRetailMedicines] = useState(() => {
    const retKey = getInventoryStorageKey(activeTenantId, 'medicines', 'RETAIL');
    const saved = storageManager.safeGetItem(retKey, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_MEDICINES;
    }
    return [];
  });

  const medicines = isRetail ? retailMedicines : wholesaleMedicines;
  const setMedicines = (updater) => {
    if (isRetail) {
      setRetailMedicines(updater);
    } else {
      setWholesaleMedicines(updater);
    }
  };

  // Wholesale Batches: strictly scoped per-tenant. Non-testing shops start blank [].
  const [wholesaleBatches, setWholesaleBatches] = useState(() => {
    const wsBatchKey = getInventoryStorageKey(activeTenantId, 'batches', 'WHOLESALE');
    const saved = storageManager.safeGetItem(wsBatchKey, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_wholesale_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_BATCHES;
    }
    return [];
  });

  // Retail Batches: strictly scoped per-tenant. Non-testing shops start blank [].
  const [retailBatches, setRetailBatches] = useState(() => {
    const retBatchKey = getInventoryStorageKey(activeTenantId, 'batches', 'RETAIL');
    const saved = storageManager.safeGetItem(retBatchKey, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (isTestingShop) {
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
      if (isCleared) return [];
      return INITIAL_BATCHES;
    }
    return [];
  });

  const batches = isRetail ? retailBatches : wholesaleBatches;
  const setBatches = (updater) => {
    if (isRetail) {
      setRetailBatches(updater);
    } else {
      setWholesaleBatches(updater);
    }
  };

  // Wholesale & Retail Vendor Returns: strictly scoped per-tenant
  const [wholesaleVendorReturns, setWholesaleVendorReturns] = useState(() => {
    const key = getInventoryStorageKey(activeTenantId, 'vendor_returns', 'WHOLESALE');
    const saved = storageManager.safeGetItem(key, null);
    if (saved && Array.isArray(saved)) return saved;
    if (isTestingShop) return INITIAL_VENDOR_RETURNS;
    return [];
  });

  const [retailVendorReturns, setRetailVendorReturns] = useState(() => {
    const key = getInventoryStorageKey(activeTenantId, 'vendor_returns', 'RETAIL');
    const saved = storageManager.safeGetItem(key, null);
    if (saved && Array.isArray(saved)) return saved;
    if (isTestingShop) return INITIAL_VENDOR_RETURNS;
    return [];
  });

  const vendorReturns = isRetail ? retailVendorReturns : wholesaleVendorReturns;
  const setVendorReturns = (updater) => {
    if (isRetail) setRetailVendorReturns(updater);
    else setWholesaleVendorReturns(updater);
  };

  const [auditLogs, setAuditLogs] = useState(() => {
    const key = getInventoryStorageKey(activeTenantId, 'audit_logs', isRetail ? 'RETAIL' : 'WHOLESALE');
    const saved = storageManager.safeGetItem(key, null);
    return (saved && Array.isArray(saved)) ? saved : INITIAL_AUDIT_LOGS;
  });

  const [poTaxLogs, setPoTaxLogs] = useState(() => {
    const key = getInventoryStorageKey(activeTenantId, 'po_tax_logs', isRetail ? 'RETAIL' : 'WHOLESALE');
    const saved = storageManager.safeGetItem(key, null);
    return (saved && Array.isArray(saved)) ? saved : INITIAL_PO_TAX_LOGS;
  });

  // Persist inventory state strictly scoped to active tenant
  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'medicines', 'WHOLESALE');
    storageManager.safeSetItem(key, wholesaleMedicines);
    if (wholesaleMedicines.length > 0) {
      dbSyncService.syncMedicinesUpstream(activeTenantId, wholesaleMedicines).catch(() => {});
    }
  }, [wholesaleMedicines, activeTenantId]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'medicines', 'RETAIL');
    storageManager.safeSetItem(key, retailMedicines);
    if (retailMedicines.length > 0) {
      dbSyncService.syncMedicinesUpstream(activeTenantId, retailMedicines).catch(() => {});
    }
  }, [retailMedicines, activeTenantId]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'batches', 'WHOLESALE');
    storageManager.safeSetItem(key, wholesaleBatches);
    if (wholesaleBatches.length > 0) {
      dbSyncService.syncBatchesUpstream(activeTenantId, wholesaleBatches).catch(() => {});
    }
  }, [wholesaleBatches, activeTenantId]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'batches', 'RETAIL');
    storageManager.safeSetItem(key, retailBatches);
    if (retailBatches.length > 0) {
      dbSyncService.syncBatchesUpstream(activeTenantId, retailBatches).catch(() => {});
    }
  }, [retailBatches, activeTenantId]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'vendor_returns', 'WHOLESALE');
    storageManager.safeSetItem(key, wholesaleVendorReturns);
  }, [wholesaleVendorReturns, activeTenantId]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'vendor_returns', 'RETAIL');
    storageManager.safeSetItem(key, retailVendorReturns);
  }, [retailVendorReturns, activeTenantId]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'audit_logs', isRetail ? 'RETAIL' : 'WHOLESALE');
    storageManager.safeSetItem(key, auditLogs);
  }, [auditLogs, activeTenantId, isRetail]);

  useEffect(() => {
    const key = getInventoryStorageKey(activeTenantId, 'po_tax_logs', isRetail ? 'RETAIL' : 'WHOLESALE');
    storageManager.safeSetItem(key, poTaxLogs);
  }, [poTaxLogs, activeTenantId, isRetail]);

  // Cloud sync from Supabase: load cloud records strictly for active tenant
  useEffect(() => {
    let isMounted = true;
    dbSyncService.fetchMedicines(activeTenantId).then((cloudMeds) => {
      if (!isMounted) return;
      if (cloudMeds && Array.isArray(cloudMeds) && cloudMeds.length > 0) {
        if (isRetail) {
          setRetailMedicines(cloudMeds);
        } else {
          setWholesaleMedicines(cloudMeds);
        }
      }
    }).catch(() => {});

    dbSyncService.fetchBatches(activeTenantId).then((cloudBatches) => {
      if (!isMounted) return;
      if (cloudBatches && Array.isArray(cloudBatches) && cloudBatches.length > 0) {
        if (isRetail) {
          setRetailBatches(cloudBatches);
        } else {
          setWholesaleBatches(cloudBatches);
        }
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [activeTenantId, isRetail]);

  const addAuditLog = (actionTitle, itemBrandName, details, type = 'INFO', performedBy = 'Store Admin') => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      actionTitle,
      itemBrandName,
      details,
      performedBy,
      timestamp: timeStr,
      type,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const parseExpiryDate = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const str = String(expiryDateStr).trim();
    let d = null;
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 2) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, 28);
        } else {
          d = new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        }
      } else if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    } else if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 2) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, 28);
        } else {
          d = new Date(Number(parts[1]), Number(parts[0]) - 1, 28);
        }
      } else if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
      }
    } else {
      d = new Date(str);
    }
    return (d && !isNaN(d.getTime())) ? d : null;
  };

  const isExpiryGreaterThan6Months = (expiryDateStr) => {
    const exp = parseExpiryDate(expiryDateStr);
    if (!exp) return false;
    const today = new Date();
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 180;
  };

  const isExpiryWithin6Months = (expiryDateStr) => {
    return !isExpiryGreaterThan6Months(expiryDateStr);
  };

  const togglePrescriptionRequirement = (medicineId) => {
    setMedicines((prevMeds) =>
      prevMeds.map((m) =>
        m.id === medicineId ? { ...m, requiresPrescription: !m.requiresPrescription } : m
      )
    );
  };

  // Inward PO Stock with Uniform Dynamic Price Updates and Tax Logging
  const inwardPOStock = (poRecord) => {
    const inwardItems = poRecord.items || [];
    let totalInwardCost = 0;

    inwardItems.forEach((item) => {
      const boxCost = Number(item.purchaseCost !== undefined ? item.purchaseCost : (item.boxCost !== undefined ? item.boxCost : (item.purchasePriceBox || 0)));
      // In Wholesale mode (or when no MRP/selling price is specified), selling rate equals cost price (no fabricated 15% markup!)
      const boxMrp = Number(item.boxMrp || item.boxSellingPrice || (isRetail ? (item.boxPrice || boxCost) : boxCost));
      const boxesCount = Number(item.inwardBoxes || item.quantity || 1);
      const stripsPerBox = Number(item.stripsPerBox || 10);
      const tabletsPerStrip = Number(item.tabletsPerStrip || 10);
      const totalTabs = boxesCount * stripsPerBox * tabletsPerStrip;
      const tabPrice = (stripsPerBox * tabletsPerStrip) > 0 ? (boxMrp / (stripsPerBox * tabletsPerStrip)) : 0;
      const stripPrice = stripsPerBox > 0 ? (boxMrp / stripsPerBox) : 0;
      const cleanShelf = item.shelfLocation?.trim() || '';

      totalInwardCost += boxCost * boxesCount;

      let matchedMedId = item.medicineId || null;
      const isShortExpiry = !isRetail && item.expiryDate && isExpiryWithin6Months(item.expiryDate);

      // 1. Update Master Medicine catalog price to new rates, increment stock, and update itemCode if provided
      setMedicines((prevMeds) => {
        const found = prevMeds.some((m) =>
          (m.name && m.name.toLowerCase() === (item.tradeName || item.name || '').toLowerCase()) ||
          (m.brandName && m.brandName.toLowerCase() === (item.tradeName || item.name || '').toLowerCase()) ||
          (item.itemCode && m.itemCode && m.itemCode.toString() === item.itemCode.toString()) ||
          m.id === item.medicineId
        );

        if (found) {
          return prevMeds.map((m) => {
            const isMatch = (m.name && m.name.toLowerCase() === (item.tradeName || item.name || '').toLowerCase()) ||
              (m.brandName && m.brandName.toLowerCase() === (item.tradeName || item.name || '').toLowerCase()) ||
              (item.itemCode && m.itemCode && m.itemCode.toString() === item.itemCode.toString()) ||
              m.id === item.medicineId;

            if (isMatch) {
              matchedMedId = m.id;
              return {
                ...m,
                itemCode: item.itemCode ? item.itemCode.toString().trim() : m.itemCode,
                boxSellingPrice: boxMrp,
                boxPrice: boxMrp,
                purchaseCost: boxCost,
                purchasePriceBox: boxCost,
                costPrice: boxCost,
                boxCost: boxCost,
                pricePerTablet: Number(tabPrice.toFixed(2)),
                stripPrice: Number(stripPrice.toFixed(2)),
                boxStock: isShortExpiry ? (m.boxStock || 0) : ((m.boxStock || 0) + boxesCount),
                expiryDate: item.expiryDate || m.expiryDate || '2028-12-31',
                rackLocation: cleanShelf || m.rackLocation || '',
              };
            }
            return m;
          });
        } else {
          // If brand-new medicine being inwarded directly
          const newMedId = `MED-${Date.now().toString().slice(-4)}`;
          matchedMedId = newMedId;
          const newMed = {
            id: newMedId,
            itemCode: item.itemCode ? item.itemCode.toString().trim() : (1000 + prevMeds.length + 1).toString(),
            name: item.tradeName || 'New Medicine',
            brandName: item.tradeName || 'New Medicine',
            formula: item.genericFormula || 'Standard Formula',
            genericFormula: item.genericFormula || 'Standard Formula',
            category: 'Tablet',
            boxSellingPrice: boxMrp,
            boxPrice: boxMrp,
            purchaseCost: boxCost,
            purchasePriceBox: boxCost,
            costPrice: boxCost,
            boxCost: boxCost,
            pricePerTablet: Number(tabPrice.toFixed(2)),
            stripPrice: Number(stripPrice.toFixed(2)),
            boxStock: isShortExpiry ? 0 : boxesCount,
            stripsPerBox,
            tabletsPerStrip,
            tabletsPerBox: stripsPerBox * tabletsPerStrip,
            expiryDate: item.expiryDate || '2028-12-31',
            rackLocation: cleanShelf,
            requiresPrescription: false,
            controlledType: 'None',
          };
          return [...prevMeds, newMed];
        }
      });

      // 2. UNIFORM PRICE SYNCHRONIZATION: Update ALL existing batches of this medicine to the new price!
      setBatches((prevBatches) => {
        const updatedPrevious = prevBatches.map((b) => {
          const isMatch = (b.medicineId && b.medicineId.toLowerCase() === (item.tradeName || item.name || '').toLowerCase()) ||
            b.medicineId === item.medicineId ||
            (matchedMedId && b.medicineId === matchedMedId);
          if (isMatch) {
            return {
              ...b,
              boxPrice: boxMrp,
              boxSellingPrice: boxMrp,
              purchasePriceBox: boxCost,
              purchaseRate: boxCost,
              purchaseCost: boxCost,
              pricePerTablet: Number(tabPrice.toFixed(2)),
            };
          }
          return b;
        });

        // 3. Create new batch for this inward shipment with the new price
        const newBatch = {
          id: `BATCH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
          batchNo: item.batchNo || `B26-${Math.floor(100 + Math.random() * 900)}`,
          batchNumber: item.batchNo || `B26-${Math.floor(100 + Math.random() * 900)}`,
          medicineId: matchedMedId || item.medicineId || item.tradeName,
          distributorName: poRecord.supplierName || 'Pharma Distributor',
          expiryDate: item.expiryDate || '2028-12-31',
          totalTabletsAvailable: isShortExpiry ? 0 : totalTabs,
          boxPrice: boxMrp,
          boxSellingPrice: boxMrp,
          purchasePriceBox: boxCost,
          purchaseRate: boxCost,
          purchaseCost: boxCost,
          pricePerTablet: Number(tabPrice.toFixed(2)),
          status: isShortExpiry ? 'Quarantined RTV' : 'Active Stock',
          rackLocation: cleanShelf,
        };

        return [newBatch, ...updatedPrevious];
      });

      if (isShortExpiry) {
        const newRtv = {
          id: `RTV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
          batchNumber: item.batchNo || `B26-RTV`,
          brandName: item.tradeName || 'Medicine',
          supplierName: poRecord.supplierName || 'Pharma Distributor',
          expiryDate: item.expiryDate || 'N/A',
          tabletsReturned: totalTabs,
          claimAmount: Math.round(boxCost * boxesCount),
          status: 'Pending Reimbursement',
          returnDate: new Date().toISOString().split('T')[0],
          loggedBy: 'Wholesale Policy (<6m Expiry)',
          reimbursementLog: [],
        };
        setVendorReturns((prev) => [newRtv, ...prev]);
        addAuditLog('Wholesale Inward Quarantined', item.tradeName, `Inward batch expiry <= 6 months (${item.expiryDate}). Blocked from active stock & moved to Vendor RTV queue.`, 'WARN', 'DRAP Compliance');
      } else {
        addAuditLog('PO Inward Stock', item.tradeName, `Inwarded ${boxesCount} Boxes (${totalTabs} Tabs) @ Rs. ${boxCost}/box (MRP Rs. ${boxMrp}) from ${poRecord.supplierName}. Previous stock updated to new price.`, 'ADD');
      }
    });

    // 4. Dynamic Taxes Logging (Sales Tax, Adv Tax, AWH Tax, Custom Tax)
    const stAmount = poRecord.totalSalesTax !== undefined ? Number(poRecord.totalSalesTax) : (totalInwardCost * (Number(poRecord.salesTaxRate) || 0) / 100);
    const advAmount = poRecord.totalAdvTax !== undefined ? Number(poRecord.totalAdvTax) : (totalInwardCost * (Number(poRecord.advTaxRate) || 0) / 100);
    const awhAmount = poRecord.totalAwhTax !== undefined ? Number(poRecord.totalAwhTax) : (totalInwardCost * (Number(poRecord.awhTaxRate) || 0) / 100);
    const customTaxRate = Number(poRecord.customTaxRate) || 0;
    const customTaxAmount = poRecord.totalCustomTax !== undefined ? Number(poRecord.totalCustomTax) : (totalInwardCost * customTaxRate / 100);
    const customTaxName = poRecord.customTaxName?.trim() || (customTaxRate > 0 ? 'Custom Tax' : null);

    const totalTaxPaid = stAmount + advAmount + awhAmount + customTaxAmount;

    const newTaxLog = {
      poNumber: poRecord.poNumber,
      supplierName: poRecord.supplierName || poRecord.distributor || 'Vendor',
      date: poRecord.date || new Date().toISOString().split('T')[0],
      totalPurchaseCost: totalInwardCost,
      salesTaxAmount: stAmount,
      salesTaxRate: poRecord.salesTaxRate !== undefined ? Number(poRecord.salesTaxRate) : 18,
      advTaxAmount: advAmount,
      advTaxRate: poRecord.advTaxRate !== undefined ? Number(poRecord.advTaxRate) : 4,
      awhTaxAmount: awhAmount,
      awhTaxRate: Number(poRecord.awhTaxRate) || 0,
      customTaxName,
      customTaxRate,
      customTaxAmount,
      totalInputTaxPaid: totalTaxPaid,
      grandTotalPO: totalInwardCost + totalTaxPaid,
      status: 'Paid to Supplier',
    };

    setPoTaxLogs((prev) => [newTaxLog, ...prev]);
  };

  // FIFO / FEFO Strict Stock Deduction: Consolidated single-pass batch update
  const deductStock = (cartItems) => {
    if (!cartItems || cartItems.length === 0) return;

    // 1. Single pass on batches
    setBatches((prevBatches) => {
      const updatedBatches = prevBatches.map((b) => ({ ...b }));

      cartItems.forEach((ci) => {
        const q = Number(ci.qty || ci.quantity || 1);
        const tabletsToDeduct = (ci.unitSelection === 'Box' || ci.unitType === 'Box')
          ? q * Number(ci.tabletsPerBox || 200)
          : (ci.unitSelection === 'Strip' || ci.unitType === 'Strip')
          ? q * Number(ci.tabletsPerStrip || 10)
          : q;

        let remainingToDeduct = tabletsToDeduct;

        // Find candidate matching batches, sorted by FEFO
        const candidateIndices = [];
        const ciMedId = String(ci.medicineId || ci.id || '').trim();
        const ciCode = String(ci.itemCode || '').trim().toLowerCase();
        const ciName = String(ci.name || ci.brandName || '').trim().toLowerCase();

        updatedBatches.forEach((b, idx) => {
          const bMedId = String(b.medicineId || b.id || '').trim();
          const bCode = String(b.itemCode || '').trim().toLowerCase();
          const bName = String(b.medicineName || b.name || '').trim().toLowerCase();

          const matchesMed =
            (ciMedId && bMedId === ciMedId) ||
            (ciCode && (bMedId.toLowerCase() === ciCode || bCode === ciCode)) ||
            (ciName && (bMedId.toLowerCase() === ciName || bName === ciName));

          if (matchesMed) candidateIndices.push(idx);
        });

        candidateIndices.sort((a, b) => {
          return new Date(updatedBatches[a].expiryDate || '2028-01-01') - new Date(updatedBatches[b].expiryDate || '2028-01-01');
        });

        // Deduct from target batch or earliest candidate
        for (const idx of candidateIndices) {
          if (remainingToDeduct <= 0) break;
          const b = updatedBatches[idx];
          const isTarget = !ci.batchNo || b.batchNo === ci.batchNo || b.batchNumber === ci.batchNumber || candidateIndices.length === 1;

          if (isTarget) {
            const avail = b.totalTabletsAvailable || 0;
            const take = Math.min(avail, remainingToDeduct);
            remainingToDeduct -= take;
            updatedBatches[idx].totalTabletsAvailable = Math.max(0, avail - take);
          }
        }
      });

      return updatedBatches;
    });

    // 2. Single pass on medicines
    setMedicines((prevMeds) => {
      // Aggregate box deductions uniquely by medicine identifier
      const medDeductions = new Map();
      cartItems.forEach((ci) => {
        const q = Number(ci.qty || ci.quantity || 1);
        const boxes = (ci.unitSelection === 'Box' || ci.unitType === 'Box')
          ? q
          : (q / Number(ci.tabletsPerBox || 200));

        const targetKey = ci.medicineId || ci.id || ci.name;
        if (targetKey) {
          medDeductions.set(targetKey, (medDeductions.get(targetKey) || 0) + boxes);
        }
      });

      return prevMeds.map((m) => {
        const deducted = medDeductions.get(m.id)
          ?? medDeductions.get(m.medicineId)
          ?? medDeductions.get(m.itemCode)
          ?? medDeductions.get(m.name)
          ?? medDeductions.get(m.brandName)
          ?? 0;

        if (deducted > 0) {
          return {
            ...m,
            boxStock: Math.max(0, Math.round(((m.boxStock || 0) - deducted) * 10) / 10),
          };
        }
        return m;
      });
    });
  };

  const getEarliestValidBatch = (medicineOrId, isWholesale = false) => {
    const med = typeof medicineOrId === 'object' && medicineOrId !== null
      ? medicineOrId
      : (medicines || []).find(
          (m) =>
            m.id === medicineOrId ||
            (m.itemCode && m.itemCode.toString() === String(medicineOrId)) ||
            m.name === medicineOrId ||
            m.brandName === medicineOrId
        );

    const medId = med?.id || (typeof medicineOrId === 'string' ? medicineOrId : '');
    const medCode = med?.itemCode ? String(med.itemCode).trim().toLowerCase() : '';
    const medName = (med?.name || med?.brandName || '').trim().toLowerCase();

    const available = batches
      .filter((b) => {
        if (b.status === 'Quarantined RTV') return false;
        if (b.totalTabletsAvailable !== undefined && Number(b.totalTabletsAvailable) <= 0) return false;

        const bMedId = String(b.medicineId || b.id || '').trim();
        const bCode = String(b.itemCode || '').trim().toLowerCase();
        const bName = String(b.medicineName || b.name || '').trim().toLowerCase();

        const matches =
          (medId && bMedId === medId) ||
          (medCode && (bMedId.toLowerCase() === medCode || bCode === medCode)) ||
          (medName && (bMedId.toLowerCase() === medName || bName === medName));

        if (!matches) return false;

        if (isWholesale && !isExpiryGreaterThan6Months(b.expiryDate)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.expiryDate || '2028-01-01') - new Date(b.expiryDate || '2028-01-01'));

    if (available.length > 0) return available[0];

    // If no existing batch has positive tablets, BUT the medicine itself has positive boxStock in the catalog:
    const catalogStock = Number(med?.boxStock || 0);
    if (catalogStock > 0) {
      const tabsPerBox = Number(med?.tabletsPerBox || (Number(med?.stripsPerBox || 10) * Number(med?.tabletsPerStrip || 10)) || 200);
      const expiry = med?.expiryDate || '2028-12-31';

      if (isWholesale && !isExpiryGreaterThan6Months(expiry)) {
        return null; // Short expiry under DRAP wholesale rule
      }

      const boxCost = Number(med?.purchaseCost !== undefined ? med.purchaseCost : (med?.purchasePriceBox !== undefined ? med.purchasePriceBox : (med?.boxCost || 0)));
      const sellingRate = Number(med?.boxSellingPrice !== undefined ? med.boxSellingPrice : (med?.boxPrice !== undefined ? med.boxPrice : (med?.price || boxCost)));

      return {
        id: `BATCH-${med?.id || 'STOCK'}-ACTIVE`,
        batchNo: med?.batchNo || `B26-${med?.itemCode || 'STOCK'}`,
        batchNumber: med?.batchNo || `B26-${med?.itemCode || 'STOCK'}`,
        medicineId: med?.id || medId,
        distributorName: med?.manufacturer || 'Authorized Distributor',
        expiryDate: expiry,
        totalTabletsAvailable: catalogStock * tabsPerBox,
        boxPrice: sellingRate,
        boxSellingPrice: sellingRate,
        purchasePriceBox: boxCost,
        purchaseRate: boxCost,
        purchaseCost: boxCost,
        pricePerTablet: Number(med?.pricePerTablet || (tabsPerBox > 0 ? (sellingRate / tabsPerBox) : 0)),
        status: 'Active Stock',
        rackLocation: med?.rackLocation || '',
      };
    }

    if (isWholesale) return null;
    const fallbackCost = Number(med?.purchaseCost || med?.purchasePriceBox || 0);
    const fallbackRate = Number(med?.boxSellingPrice || med?.boxPrice || fallbackCost);
    return {
      batchNo: 'B-9481',
      batchNumber: 'B-9481',
      expiryDate: '2028-10-31',
      boxPrice: fallbackRate,
      purchasePriceBox: fallbackCost,
      pricePerTablet: Number(med?.pricePerTablet || 0),
      totalTabletsAvailable: 1000
    };
  };

  const restoreStock = (returnedItems) => {
    if (!returnedItems || returnedItems.length === 0) return;

    setBatches((prevBatches) => {
      const updatedBatches = prevBatches.map((b) => ({ ...b }));
      returnedItems.forEach((ri) => {
        const match = updatedBatches.find((b) => b.batchNumber === ri.batchNumber || b.batchNo === ri.batchNo);
        if (match) {
          const tabletsToRestore = (ri.unitSelection === 'Box' || ri.unitType === 'Box')
            ? Number(ri.quantity || 1) * Number(ri.tabletsPerBox || 1)
            : Number(ri.quantity || 1);
          match.totalTabletsAvailable = (match.totalTabletsAvailable || 0) + tabletsToRestore;
        }
      });
      return updatedBatches;
    });

    setMedicines((prevMeds) => {
      const restorations = new Map();
      returnedItems.forEach((ri) => {
        const q = Number(ri.quantity || 1);
        const boxes = (ri.unitSelection === 'Box' || ri.unitType === 'Box') ? q : (q / Number(ri.tabletsPerBox || 200));
        const keys = [ri.medicineId, ri.id, ri.name, ri.brandName].filter(Boolean);
        keys.forEach((k) => {
          restorations.set(k, (restorations.get(k) || 0) + boxes);
        });
      });

      return prevMeds.map((m) => {
        const restored = restorations.get(m.id) || restorations.get(m.name) || restorations.get(m.brandName) || 0;
        if (restored > 0) {
          return {
            ...m,
            boxStock: Math.round(((m.boxStock || 0) + restored) * 10) / 10,
          };
        }
        return m;
      });
    });
  };

  const markItemAsRTV = (batchId, tabletsCount, reason = 'Expiry <= 6 Months', loggedBy = 'Store Admin') => {
    let targetBatch = null;
    let targetMed = null;

    setBatches((prevBatches) => {
      return prevBatches.map((b) => {
        if (b.id === batchId || b.batchNumber === batchId || b.batchNo === batchId) {
          targetBatch = b;
          targetMed = medicines.find((m) => m.id === b.medicineId);
          const newQty = Math.max(0, b.totalTabletsAvailable - Number(tabletsCount));
          return {
            ...b,
            totalTabletsAvailable: newQty,
            status: newQty === 0 ? 'Quarantined RTV' : b.status,
          };
        }
        return b;
      });
    });

    if (targetBatch) {
      const brandName = targetMed ? (targetMed.brandName || targetMed.name) : 'Medicine';
      const claimVal = (Number(tabletsCount) / (targetMed ? targetMed.tabletsPerBox : 200)) * (targetBatch.purchasePriceBox || 400);

      const newRtv = {
        id: `RTV-${Date.now().toString().slice(-6)}`,
        batchNumber: targetBatch.batchNumber || targetBatch.batchNo,
        brandName,
        supplierName: targetBatch.distributorName || 'Supplier',
        expiryDate: targetBatch.expiryDate,
        tabletsReturned: Number(tabletsCount),
        claimAmount: Math.round(claimVal),
        status: 'Pending Reimbursement',
        returnDate: new Date().toISOString().split('T')[0],
        loggedBy,
        reimbursementLog: [],
      };

      setVendorReturns((prev) => [newRtv, ...prev]);
      addAuditLog('Return to Vendor (RTV)', brandName, `Moved ${tabletsCount} Tablets (Batch ${targetBatch.batchNumber}) to RTV quarantine queue`, 'DEDUCT', loggedBy);
    }
  };

  const recordVendorReimbursement = (rtvId, amountPaid, staffName = 'Store Admin') => {
    const paid = Number(amountPaid) || 0;
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setVendorReturns((prev) =>
      prev.map((rtv) => {
        if (rtv.id === rtvId) {
          const newLogs = [...(rtv.reimbursementLog || []), { amount: paid, timestamp: timeStr, loggedBy: staffName }];
          const totalReimbursed = newLogs.reduce((sum, l) => sum + l.amount, 0);
          const isFullySettled = totalReimbursed >= rtv.claimAmount;

          addAuditLog('Vendor RTV Payment Claimed', rtv.brandName, `Received Rs. ${paid} vendor reimbursement from ${rtv.supplierName}`, 'ADD', staffName);

          return {
            ...rtv,
            status: isFullySettled ? 'Reimbursed & Settled' : 'Pending Reimbursement',
            reimbursementLog: newLogs,
          };
        }
        return rtv;
      })
    );
  };

  const updateMedicineDetails = (medicineId, updatedData) => {
    let matchedMed = null;
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medicineId || m.itemCode === medicineId) {
          matchedMed = { ...m, ...updatedData };
          return matchedMed;
        }
        return m;
      })
    );

    // If selling price was updated, synchronize all existing batches for this medicine
    if (updatedData.boxSellingPrice || updatedData.boxPrice || updatedData.price) {
      const newPrice = Number(updatedData.boxSellingPrice || updatedData.boxPrice || updatedData.price);
      setBatches((prev) =>
        prev.map((b) => {
          if (b.medicineId === medicineId || (matchedMed && b.medicineId === matchedMed.name) || (matchedMed && b.medicineId === matchedMed.itemCode)) {
            const tabRatio = (matchedMed?.tabletsPerBox || 200);
            return {
              ...b,
              boxPrice: newPrice,
              purchasePriceBox: updatedData.purchaseCost !== undefined ? Number(updatedData.purchaseCost) : b.purchasePriceBox,
              pricePerTablet: Number((newPrice / tabRatio).toFixed(2)),
            };
          }
          return b;
        })
      );
    }
  };

  const bulkImportMedicines = (importedMedicines, importedBatches) => {
    if (!Array.isArray(importedMedicines) || importedMedicines.length === 0) return;
    setMedicines((prev) => [...importedMedicines, ...prev]);
    if (Array.isArray(importedBatches) && importedBatches.length > 0) {
      setBatches((prev) => [...importedBatches, ...prev]);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        medicines,
        setMedicines,
        batches,
        setBatches,
        vendorReturns,
        auditLogs,
        poTaxLogs,
        inwardPOStock,
        updateMedicineDetails,
        bulkImportMedicines,
        deductStock,
        restoreStock,
        markItemAsRTV,
        recordVendorReimbursement,
        getEarliestValidBatch,
        isExpiryGreaterThan6Months,
        isExpiryWithin6Months,
        parseExpiryDate,
        togglePrescriptionRequirement,
        loadRetailMockData,
        clearRetailMockData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export { InventoryContext };
export default InventoryContext;
