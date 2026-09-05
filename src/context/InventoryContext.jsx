import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MEDICINES, INITIAL_BATCHES, INITIAL_VENDOR_RETURNS } from '../data/mockData';

const InventoryContext = createContext();

const INITIAL_AUDIT_LOGS = [];
const INITIAL_PO_TAX_LOGS = [];

export const InventoryProvider = ({ children }) => {
  const [medicines, setMedicines] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_medicines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m, idx) => {
            // Auto-migrate any old MED-101 format codes to 4-digit codes
            if (!m.itemCode || m.itemCode.startsWith('MED-') || isNaN(Number(m.itemCode))) {
              const codeNum = (1001 + idx).toString();
              return { ...m, itemCode: codeNum };
            }
            return m;
          });
        }
      } catch (e) {
        console.error('Failed to parse saved medicines', e);
      }
    }
    return INITIAL_MEDICINES;
  });

  const [batches, setBatches] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_batches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved batches', e);
      }
    }
    return INITIAL_BATCHES;
  });

  const [vendorReturns, setVendorReturns] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_vendor_returns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved vendor returns', e);
      }
    }
    return INITIAL_VENDOR_RETURNS;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('pharmalink_pk_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved audit logs', e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [poTaxLogs, setPoTaxLogs] = useState(() => {
    const saved = localStorage.getItem('pharmalink_po_tax_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PO_TAX_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('pharmalink_pk_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('pharmalink_pk_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('pharmalink_pk_vendor_returns', JSON.stringify(vendorReturns));
  }, [vendorReturns]);

  useEffect(() => {
    localStorage.setItem('pharmalink_pk_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('pharmalink_po_tax_logs', JSON.stringify(poTaxLogs));
  }, [poTaxLogs]);

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

  // FIFO / FEFO Strict Stock Deduction: Prioritizes earliest expiring batches first
  const deductStock = (cartItems) => {
    if (!cartItems || cartItems.length === 0) return;

    cartItems.forEach((ci) => {
      const q = Number(ci.qty || ci.quantity || 1);
      const tabletsToDeduct = (ci.unitSelection === 'Box' || ci.unitType === 'Box')
        ? q * Number(ci.tabletsPerBox || 200)
        : (ci.unitSelection === 'Strip' || ci.unitType === 'Strip')
        ? q * Number(ci.tabletsPerStrip || 10)
        : q;

      let remainingToDeduct = tabletsToDeduct;

      setBatches((prevBatches) => {
        // Sort matching batches by earliest expiry date (FIFO/FEFO)
        const medBatches = prevBatches
          .filter((b) => b.medicineId === ci.medicineId || b.id === ci.medicineId || (ci.name && b.medicineId === ci.name))
          .sort((a, b) => new Date(a.expiryDate || '2028-01-01') - new Date(b.expiryDate || '2028-01-01'));

        return prevBatches.map((b) => {
          if (remainingToDeduct <= 0) return b;
          const isTargetBatch = b.batchNo === ci.batchNo || b.batchNumber === ci.batchNumber || b.id === medBatches[0]?.id;

          if (isTargetBatch) {
            const avail = b.totalTabletsAvailable || 0;
            const take = Math.min(avail, remainingToDeduct);
            remainingToDeduct -= take;
            return {
              ...b,
              totalTabletsAvailable: Math.max(0, avail - take),
            };
          }
          return b;
        });
      });

      // Update medicine box stock count
      setMedicines((prevMeds) =>
        prevMeds.map((m) => {
          if (m.id === ci.medicineId || m.name === ci.name || m.brandName === ci.brandName) {
            const boxesDeducted = (ci.unitSelection === 'Box' || ci.unitType === 'Box') ? q : (q / (m.tabletsPerBox || 200));
            return {
              ...m,
              boxStock: Math.max(0, Math.round(((m.boxStock || 10) - boxesDeducted) * 10) / 10),
            };
          }
          return m;
        })
      );
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
      return prevBatches.map((b) => {
        const match = returnedItems.find((ri) => ri.batchNumber === b.batchNumber || ri.batchNo === b.batchNo);
        if (match) {
          const tabletsToRestore = ri.unitSelection === 'Box' || ri.unitType === 'Box'
            ? ri.quantity * (ri.tabletsPerBox || 1)
            : ri.quantity;
          return { ...b, totalTabletsAvailable: b.totalTabletsAvailable + tabletsToRestore };
        }
        return b;
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

  return (
    <InventoryContext.Provider
      value={{
        medicines,
        setMedicines,
        batches,
        vendorReturns,
        auditLogs,
        poTaxLogs,
        inwardPOStock,
        updateMedicineDetails,
        deductStock,
        restoreStock,
        markItemAsRTV,
        recordVendorReimbursement,
        getEarliestValidBatch,
        isExpiryGreaterThan6Months,
        togglePrescriptionRequirement,
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

export default InventoryContext;
