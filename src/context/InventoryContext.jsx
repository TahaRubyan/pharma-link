import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MEDICINES, INITIAL_BATCHES, INITIAL_VENDOR_RETURNS } from '../data/mockData';
import { AuthContext, useAuth } from './AuthContext';
import { storageManager } from '../services/storageManager';
import { loadRetailMockData, clearRetailMockData } from '../services/mockDataManager';

const InventoryContext = createContext();

const INITIAL_AUDIT_LOGS = [];
const INITIAL_PO_TAX_LOGS = [];

export const InventoryProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const isRetail = auth?.currentShop?.mode === 'RETAIL';

  // Wholesale Medicines: Pre-stocked with master catalog
  const [wholesaleMedicines, setWholesaleMedicines] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_medicines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m, idx) => {
            if (!m.itemCode || m.itemCode.startsWith('MED-') || isNaN(Number(m.itemCode))) {
              const codeNum = (1001 + idx).toString();
              return { ...m, itemCode: codeNum };
            }
            return m;
          });
        }
      } catch (e) {
        console.error('Failed to parse saved wholesale medicines', e);
      }
    }
    return INITIAL_MEDICINES;
  });

  // Retail Medicines: Pre-stocked with sample data for testing unless explicitly cleared by user
  const [retailMedicines, setRetailMedicines] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_medicines') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved retail medicines', e);
      }
    }
    return INITIAL_MEDICINES;
  });

  const medicines = isRetail ? retailMedicines : wholesaleMedicines;
  const setMedicines = (updater) => {
    if (isRetail) {
      setRetailMedicines(updater);
    } else {
      setWholesaleMedicines(updater);
    }
  };

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_pk_medicines', wholesaleMedicines);
  }, [wholesaleMedicines]);

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_retail_medicines', retailMedicines);
  }, [retailMedicines]);

  // Wholesale Batches
  const [wholesaleBatches, setWholesaleBatches] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_batches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved wholesale batches', e);
      }
    }
    return INITIAL_BATCHES;
  });

  // Retail Batches: Pre-stocked with sample batches for testing unless explicitly cleared by user
  const [retailBatches, setRetailBatches] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_batches') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_BATCHES;
  });

  const batches = isRetail ? retailBatches : wholesaleBatches;
  const setBatches = (updater) => {
    if (isRetail) {
      setRetailBatches(updater);
    } else {
      setWholesaleBatches(updater);
    }
  };

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_pk_batches', wholesaleBatches);
  }, [wholesaleBatches]);

  useEffect(() => {
    storageManager.safeSetItem('pharmalink_retail_batches', retailBatches);
  }, [retailBatches]);

  // Wholesale & Retail Vendor Returns
  const [wholesaleVendorReturns, setWholesaleVendorReturns] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_vendor_returns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_VENDOR_RETURNS;
  });

  const [retailVendorReturns, setRetailVendorReturns] = useState(() => {
    const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('pharmalink_retail_cleared') === 'true';
    if (isCleared) return [];

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pharmalink_retail_vendor_returns') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_VENDOR_RETURNS;
  });

  const vendorReturns = isRetail ? retailVendorReturns : wholesaleVendorReturns;
  const setVendorReturns = (updater) => {
    if (isRetail) setRetailVendorReturns(updater);
    else setWholesaleVendorReturns(updater);
  };

  useEffect(() => {
    localStorage.setItem('pharmalink_pk_vendor_returns', JSON.stringify(wholesaleVendorReturns));
  }, [wholesaleVendorReturns]);

  useEffect(() => {
    localStorage.setItem('pharmalink_retail_vendor_returns', JSON.stringify(retailVendorReturns));
  }, [retailVendorReturns]);

  const [auditLogs, setAuditLogs] = useState(() => {
    const key = isRetail ? 'pharmalink_retail_audit_logs' : 'pharmalink_pk_audit_logs';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    const key = isRetail ? 'pharmalink_retail_audit_logs' : 'pharmalink_pk_audit_logs';
    localStorage.setItem(key, JSON.stringify(auditLogs));
  }, [auditLogs, isRetail]);

  const [poTaxLogs, setPoTaxLogs] = useState(() => {
    const key = isRetail ? 'pharmalink_retail_po_tax_logs' : 'pharmalink_po_tax_logs';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PO_TAX_LOGS;
  });

  useEffect(() => {
    const key = isRetail ? 'pharmalink_retail_po_tax_logs' : 'pharmalink_po_tax_logs';
    localStorage.setItem(key, JSON.stringify(poTaxLogs));
  }, [poTaxLogs, isRetail]);

  const addAuditLog = (actionTitle, itemBrandName, details, type = 'INFO', performedBy = 'Dr. Idrees') => {
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

  const isExpiryGreaterThan6Months = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const exp = new Date(expiryDateStr);
    const today = new Date();
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diffDays > 180;
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
      const boxCost = Number(item.boxCost || item.purchasePriceBox || 400);
      const boxMrp = Number(item.boxMrp || item.boxSellingPrice || item.boxPrice || 500);
      const boxesCount = Number(item.inwardBoxes || item.quantity || 1);
      const stripsPerBox = Number(item.stripsPerBox || 10);
      const tabletsPerStrip = Number(item.tabletsPerStrip || 10);
      const totalTabs = boxesCount * stripsPerBox * tabletsPerStrip;
      const tabPrice = boxMrp / (stripsPerBox * tabletsPerStrip);
      const stripPrice = boxMrp / stripsPerBox;
      const cleanShelf = item.shelfLocation?.trim() || '';

      totalInwardCost += boxCost * boxesCount;

      let matchedMedId = item.medicineId || null;

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
                pricePerTablet: Number(tabPrice.toFixed(2)),
                stripPrice: Number(stripPrice.toFixed(2)),
                boxStock: (m.boxStock || 0) + boxesCount,
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
            pricePerTablet: Number(tabPrice.toFixed(2)),
            stripPrice: Number(stripPrice.toFixed(2)),
            boxStock: boxesCount,
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
              purchasePriceBox: boxCost,
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
          totalTabletsAvailable: totalTabs,
          boxPrice: boxMrp,
          purchasePriceBox: boxCost,
          pricePerTablet: Number(tabPrice.toFixed(2)),
          status: 'Active Stock',
          rackLocation: cleanShelf,
        };

        return [newBatch, ...updatedPrevious];
      });

      addAuditLog('PO Inward Stock', item.tradeName, `Inwarded ${boxesCount} Boxes (${totalTabs} Tabs) @ Rs. ${boxCost}/box (MRP Rs. ${boxMrp}) from ${poRecord.supplierName}. Previous stock updated to new price.`, 'ADD');
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
        updatedBatches.forEach((b, idx) => {
          const matchesMed = b.medicineId === ci.medicineId || b.id === ci.medicineId || (ci.name && b.medicineId === ci.name);
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
      // Aggregate box deductions by medicine identifier
      const deductions = new Map();
      cartItems.forEach((ci) => {
        const q = Number(ci.qty || ci.quantity || 1);
        const boxes = (ci.unitSelection === 'Box' || ci.unitType === 'Box')
          ? q
          : (q / Number(ci.tabletsPerBox || 200));

        const keys = [ci.medicineId, ci.id, ci.name, ci.brandName].filter(Boolean);
        keys.forEach((k) => {
          deductions.set(k, (deductions.get(k) || 0) + boxes);
        });
      });

      return prevMeds.map((m) => {
        const deducted = deductions.get(m.id) || deductions.get(m.name) || deductions.get(m.brandName) || 0;
        if (deducted > 0) {
          return {
            ...m,
            boxStock: Math.max(0, Math.round(((m.boxStock || 10) - deducted) * 10) / 10),
          };
        }
        return m;
      });
    });
  };

  const getEarliestValidBatch = (medicineId) => {
    const available = batches
      .filter((b) => {
        if ((b.medicineId !== medicineId && b.id !== medicineId) || (b.totalTabletsAvailable !== undefined && b.totalTabletsAvailable <= 0) || b.status === 'Quarantined RTV') return false;
        return true;
      })
      .sort((a, b) => new Date(a.expiryDate || '2028-01-01') - new Date(b.expiryDate || '2028-01-01'));
    if (available.length > 0) return available[0];
    return {
      batchNo: 'B-9481',
      batchNumber: 'B-9481',
      expiryDate: '2028-10-31',
      boxPrice: 600,
      pricePerTablet: 3.0,
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

  const markItemAsRTV = (batchId, tabletsCount, reason = 'Expiry <= 6 Months', loggedBy = 'Dr. Idrees') => {
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

  const recordVendorReimbursement = (rtvId, amountPaid, staffName = 'Dr. Idrees') => {
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
