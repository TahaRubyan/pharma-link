import { supabase, isSupabaseConfigured } from './supabaseClient';
import { storageManager } from './storageManager';

/**
 * Database Synchronization Layer
 * Bridges Supabase Postgres with local offline-first storage.
 * Ensures instant UI responsiveness and background cloud synchronization.
 */

export const dbSyncService = {
  // -------------------------------------------------------------
  // 1. MEDICINES & BATCHES
  // -------------------------------------------------------------
  async fetchMedicines(tenantId = 'TEN-TESTING-SHOP') {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        console.warn('[dbSync] fetchMedicines error:', error.message);
        return null;
      }
      if (data && data.length > 0) {
        // Map database snake_case to app camelCase
        return data.map((m) => ({
          id: m.id.startsWith(`${tenantId}_`) ? m.id.slice(tenantId.length + 1) : m.id,
          tenantId: m.tenant_id,
          itemCode: m.item_code,
          barcode: m.barcode,
          name: m.name,
          brandName: m.brand_name || m.name,
          formula: m.generic_formula,
          genericFormula: m.generic_formula,
          category: m.category,
          rackLocation: m.rack_location,
          boxStock: m.box_stock,
          looseUnitsStock: m.loose_units_stock,
          tabletsPerBox: m.tablets_per_box,
          stripsPerBox: m.strips_per_box,
          boxSellingPrice: Number(m.box_price || 0),
          boxPrice: Number(m.box_price || 0),
          price: Number(m.box_price || 0),
          stripPrice: Number(m.strip_price || 0),
          pricePerTablet: Number(m.price_per_tablet || 0),
          requiresPrescription: m.requires_prescription,
          controlledType: m.controlled_type,
        }));
      }
      return [];
    } catch (err) {
      console.warn('[dbSync] fetchMedicines network exception:', err.message);
      return null;
    }
  },

  async syncMedicinesUpstream(tenantId, medicines = []) {
    if (!isSupabaseConfigured || !supabase || !medicines.length) return;
    try {
      const rows = medicines.map((m) => {
        const rawId = m.id || `MED-${m.itemCode || Math.floor(1000 + Math.random() * 9000)}`;
        const scopedId = rawId.startsWith(`${tenantId}_`) ? rawId : `${tenantId}_${rawId}`;
        return {
          id: scopedId,
          tenant_id: tenantId,
          item_code: m.itemCode || '',
          barcode: m.barcode || '',
          name: m.name || m.brandName,
          brand_name: m.brandName || m.name,
          generic_formula: m.genericFormula || m.formula || '',
          category: m.category || 'General',
          rack_location: m.rackLocation || 'Rack A-01',
          box_stock: Number(m.boxStock || 0),
          loose_units_stock: Number(m.looseUnitsStock || 0),
          tablets_per_box: Number(m.tabletsPerBox || 100),
          strips_per_box: Number(m.stripsPerBox || 10),
          box_price: Number(m.boxSellingPrice || m.boxPrice || m.price || 0),
          strip_price: Number(m.stripPrice || 0),
          price_per_tablet: Number(m.pricePerTablet || 0),
          requires_prescription: Boolean(m.requiresPrescription),
          controlled_type: m.controlledType || 'OTC',
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('medicines')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('[dbSync] syncMedicinesUpstream error:', error.message);
      }
    } catch (err) {
      console.warn('[dbSync] syncMedicinesUpstream exception:', err.message);
    }
  },

  async fetchBatches(tenantId = 'TEN-TESTING-SHOP') {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        console.warn('[dbSync] fetchBatches error:', error.message);
        return null;
      }
      if (data && data.length > 0) {
        return data.map((b) => ({
          id: b.id.startsWith(`${tenantId}_`) ? b.id.slice(tenantId.length + 1) : b.id,
          tenantId: b.tenant_id,
          medicineId: b.medicine_id ? (b.medicine_id.startsWith(`${tenantId}_`) ? b.medicine_id.slice(tenantId.length + 1) : b.medicine_id) : '',
          batchNo: b.batch_no,
          batchNumber: b.batch_no,
          expiryDate: b.expiry_date,
          boxStock: Number(b.box_stock || 0),
          totalTabletsAvailable: Number(b.total_tablets_available || 0),
          boxPrice: Number(b.box_price || 0),
          purchasePriceBox: Number(b.purchase_price_box || 0),
          pricePerTablet: Number(b.price_per_tablet || 0),
          status: b.status || 'Active Stock',
          rackLocation: b.rack_location || '',
        }));
      }
      return [];
    } catch (err) {
      console.warn('[dbSync] fetchBatches network exception:', err.message);
      return null;
    }
  },

  async syncBatchesUpstream(tenantId, batches = []) {
    if (!isSupabaseConfigured || !supabase || !batches.length) return;
    try {
      const rows = batches.map((b) => {
        const rawId = b.id || b.batchNo || b.batchNumber || String(Math.floor(1000 + Math.random() * 9000));
        const scopedId = rawId.startsWith(`${tenantId}_`) ? rawId : `${tenantId}_${rawId}`;
        const rawMedId = b.medicineId || '';
        const scopedMedId = rawMedId.startsWith(`${tenantId}_`) ? rawMedId : (rawMedId ? `${tenantId}_${rawMedId}` : '');
        
        let validExpiry = b.expiryDate || '2028-12-31';
        if (validExpiry.includes('-') && validExpiry.split('-')[0].length === 2) {
          const parts = validExpiry.split('-');
          validExpiry = `${parts[1]}-${parts[0]}-01`;
        }

        return {
          id: scopedId,
          tenant_id: tenantId,
          medicine_id: scopedMedId,
          batch_no: b.batchNo || b.batchNumber || 'BN-101',
          expiry_date: validExpiry,
          box_stock: Number(b.boxStock || 0),
          total_tablets_available: Number(b.totalTabletsAvailable || b.totalTablets || 0),
          box_price: Number(b.boxPrice || 0),
          purchase_price_box: Number(b.purchasePriceBox || 0),
          price_per_tablet: Number(b.pricePerTablet || 0),
          status: b.status || 'Active Stock',
          rack_location: b.rackLocation || '',
          created_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('batches')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('[dbSync] syncBatchesUpstream error:', error.message);
      }
    } catch (err) {
      console.warn('[dbSync] syncBatchesUpstream exception:', err.message);
    }
  },

  // -------------------------------------------------------------
  // 2. INVOICES & SALES
  // -------------------------------------------------------------
  async fetchInvoices(tenantId = 'TEN-TESTING-SHOP') {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[dbSync] fetchInvoices error:', error.message);
        return null;
      }
      if (data && data.length > 0) {
        return data.map((inv) => ({
          invoiceNo: inv.invoice_no,
          tenantId: inv.tenant_id,
          date: inv.date,
          time: inv.time,
          saleType: inv.sale_type,
          customerName: inv.customer_name,
          shopName: inv.shop_name,
          customerPhone: inv.customer_phone,
          customerAddress: inv.customer_address,
          customerNtn: inv.customer_ntn,
          customerStrn: inv.customer_strn,
          doctorName: inv.doctor_name,
          cashierName: inv.cashier_name,
          subtotal: Number(inv.subtotal || 0),
          grossTotal: Number(inv.gross_total || 0),
          discountPercent: Number(inv.discount_percent || 0),
          discount: Number(inv.discount || 0),
          totalSalesTax18: Number(inv.total_sales_tax18 || 0),
          totalSalesTax19: Number(inv.total_sales_tax19 || 0),
          totalOtherSalesTax: Number(inv.total_other_sales_tax || 0),
          totalSalesTaxAll: Number(inv.total_sales_tax_all || 0),
          totalAdvTax05: Number(inv.total_adv_tax05 || 0),
          totalTax: Number(inv.total_tax || 0),
          netTotal: Number(inv.net_total || 0),
          cashTendered: Number(inv.cash_tendered || 0),
          changeDue: Number(inv.change_due || 0),
          paymentMode: inv.payment_mode,
          paymentStatus: inv.payment_status,
          region: inv.region || '',
          deliveryMan: inv.delivery_man || '',
          customerShopName: inv.customer_shop_name || '',
          remainingDebt: Number(inv.remaining_debt !== undefined ? inv.remaining_debt : 0),
          paymentLogs: inv.payment_logs || [],
          items: inv.items || [],
        }));
      }
      return [];
    } catch (err) {
      console.warn('[dbSync] fetchInvoices exception:', err.message);
      return null;
    }
  },

  async saveInvoice(tenantId, invoice) {
    if (!isSupabaseConfigured || !supabase || !invoice) return;
    try {
      const row = {
        invoice_no: invoice.invoiceNo,
        tenant_id: tenantId,
        date: invoice.date,
        time: invoice.time || '',
        sale_type: invoice.saleType || 'Wholesale Commercial',
        customer_name: invoice.customerName || 'Walk-in Customer',
        shop_name: invoice.shopName || 'Testing Shop',
        customer_phone: invoice.customerPhone || '',
        customer_address: invoice.customerAddress || '',
        customer_ntn: invoice.customerNtn || '',
        customer_strn: invoice.customerStrn || '',
        doctor_name: invoice.doctorName || '',
        cashier_name: invoice.cashierName || '',
        subtotal: Number(invoice.subtotal || invoice.grossTotal || 0),
        gross_total: Number(invoice.grossTotal || invoice.subtotal || 0),
        discount_percent: Number(invoice.discountPercent || 0),
        discount: Number(invoice.discount || 0),
        total_sales_tax18: Number(invoice.totalSalesTax18 || 0),
        total_sales_tax19: Number(invoice.totalSalesTax19 || 0),
        total_other_sales_tax: Number(invoice.totalOtherSalesTax || 0),
        total_sales_tax_all: Number(invoice.totalSalesTaxAll || 0),
        total_adv_tax05: Number(invoice.totalAdvTax05 || 0),
        total_tax: Number(invoice.totalTax || 0),
        net_total: Number(invoice.netTotal || 0),
        cash_tendered: Number(invoice.cashTendered || 0),
        change_due: Number(invoice.changeDue || 0),
        payment_mode: invoice.paymentMode || 'Cash',
        payment_status: invoice.paymentStatus || 'PAID',
        region: invoice.region || '',
        delivery_man: invoice.deliveryMan || '',
        customer_shop_name: invoice.customerShopName || '',
        remaining_debt: Number(invoice.remainingDebt !== undefined ? invoice.remainingDebt : (invoice.paymentStatus === 'PAID' ? 0 : invoice.netTotal || 0)),
        payment_logs: invoice.paymentLogs || [],
        items: invoice.items || [],
      };

      const { error } = await supabase.from('invoices').upsert(row, { onConflict: 'invoice_no' });
      if (error) {
        console.warn('[dbSync] saveInvoice error:', error.message);
      }
    } catch (err) {
      console.warn('[dbSync] saveInvoice exception:', err.message);
    }
  },

  // -------------------------------------------------------------
  // 3. PURCHASE ORDERS & SUPPLIERS
  // -------------------------------------------------------------
  async fetchSuppliers(tenantId = 'TEN-TESTING-SHOP') {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('suppliers').select('*').eq('tenant_id', tenantId);
      if (error) return null;
      if (data && data.length > 0) {
        return data.map((s) => ({
          id: s.id.startsWith(`${tenantId}_`) ? s.id.slice(tenantId.length + 1) : s.id,
          name: s.name,
          companyName: s.name,
          contactPerson: s.contact_person,
          phone: s.phone,
          ntn: s.ntn,
          strn: s.strn,
          drugLicense: s.drug_license,
          city: s.city,
          paymentTerms: s.payment_terms,
        }));
      }
      return [];
    } catch (e) {
      return null;
    }
  },

  async saveSupplier(tenantId, supplier) {
    if (!isSupabaseConfigured || !supabase || !supplier) return;
    try {
      const rawId = supplier.id || `SUP-${Date.now()}`;
      const scopedId = rawId.startsWith(`${tenantId}_`) ? rawId : `${tenantId}_${rawId}`;
      const row = {
        id: scopedId,
        tenant_id: tenantId,
        name: supplier.name || supplier.companyName || 'Supplier',
        contact_person: supplier.contactPerson || supplier.contact || '',
        phone: supplier.phone || '',
        ntn: supplier.ntn || '',
        strn: supplier.strn || '',
        drug_license: supplier.drugLicense || '',
        city: supplier.city || '',
        payment_terms: supplier.paymentTerms || '30 Days Credit',
      };
      await supabase.from('suppliers').upsert(row, { onConflict: 'id' });
    } catch (e) {
      console.warn('[dbSync] saveSupplier error:', e.message);
    }
  },

  async fetchPurchaseOrders(tenantId = 'TEN-TESTING-SHOP') {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId);
      if (error) return null;
      if (data && data.length > 0) {
        return data.map((p) => ({
          id: p.po_number,
          poNumber: p.po_number,
          poReference: p.po_number,
          supplierId: p.supplier_id,
          supplierName: p.supplier_name,
          distributor: p.supplier_name,
          distributorName: p.supplier_name,
          orderDate: p.order_date,
          date: p.order_date,
          inwardDate: p.order_date,
          deliveryDate: p.delivery_date,
          paymentMethod: p.payment_method,
          paymentStatus: p.payment_status,
          grossCost: Number(p.gross_cost || 0),
          inputTax: Number(p.input_tax || 0),
          totalAmount: Number(p.total_amount || 0),
          items: p.items || [],
        }));
      }
      return [];
    } catch (e) {
      return null;
    }
  },

  async savePurchaseOrder(tenantId, po) {
    if (!isSupabaseConfigured || !supabase || !po) return;
    try {
      const row = {
        po_number: po.poNumber || po.id,
        tenant_id: tenantId,
        supplier_id: po.supplierId || null,
        supplier_name: po.supplierName || po.distributorName || po.distributor || '',
        order_date: po.inwardDate || po.date || po.orderDate || new Date().toISOString().split('T')[0],
        delivery_date: po.deliveryDate || '',
        payment_method: po.paymentMethod || po.paymentMode || 'Bank IBFT',
        payment_status: po.paymentStatus || 'PAID',
        gross_cost: Number(po.grossCost || po.totalCost || po.totalAmount || 0),
        input_tax: Number(po.inputTax || 0),
        total_amount: Number(po.totalAmount || po.totalCost || po.grossCost || 0),
        items: po.items || [],
      };
      await supabase.from('purchase_orders').upsert(row, { onConflict: 'po_number' });
    } catch (e) {
      console.warn('[dbSync] savePurchaseOrder error:', e.message);
    }
  },

  // -------------------------------------------------------------
  // 4. STAFF ACCOUNTS
  // -------------------------------------------------------------
  async fetchStaffAccounts(tenantId = null) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      let query = supabase.from('staff_accounts').select('*');
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      const { data, error } = await query;

      if (error) return null;
      if (data && data.length > 0) {
        return data.map((s) => ({
          id: s.id,
          tenantId: s.tenant_id,
          name: s.name,
          username: s.username,
          password: s.password,
          role: s.role,
          status: s.status,
          storeMode: s.store_mode,
          mustChangePassword: Boolean(s.must_change_password),
        }));
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async saveStaffAccount(staff) {
    if (!isSupabaseConfigured || !supabase || !staff) return;
    try {
      const row = {
        id: staff.id || `STAFF-${Date.now()}`,
        tenant_id: staff.tenantId || 'TEN-TESTING-SHOP',
        name: staff.name,
        username: staff.username,
        password: staff.password,
        role: staff.role || 'Cashier',
        status: staff.status || 'Active',
        store_mode: staff.storeMode || 'HYBRID',
        must_change_password: Boolean(staff.mustChangePassword),
      };
      const { error } = await supabase.from('staff_accounts').upsert(row, { onConflict: 'id' });
      if (error) {
        console.warn('[dbSync] saveStaffAccount supabase error:', error.message);
      }
    } catch (e) {
      console.warn('[dbSync] saveStaffAccount error:', e.message);
    }
  },

  // -------------------------------------------------------------
  // 5. TENANT REGISTRATION & MULTI-TENANT MANAGEMENT
  // -------------------------------------------------------------
  async fetchTenants() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from('tenants').select('*');
      if (error) {
        console.warn('[dbSync] fetchTenants error:', error.message);
        return null;
      }
      if (data && data.length > 0) {
        return data.map((t) => ({
          tenantId: t.tenant_id,
          shopName: t.shop_name,
          ownerName: t.owner_name,
          phone: t.phone,
          city: t.city,
          address: t.address,
          ntn: t.ntn,
          gstin: t.gstin,
          dlNumber: t.dl_number,
          form20: t.form20,
          form21: t.form21,
          subscribedSystemScope: t.mode === 'RETAIL' ? 'RETAIL_ONLY' : (t.mode === 'WHOLESALE' ? 'WHOLESALE_ONLY' : 'HYBRID_BOTH'),
          subscriptionStatus: t.subscription_status || 'Active',
          createdDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : '28-08-2026',
        }));
      }
      return null;
    } catch (e) {
      console.warn('[dbSync] fetchTenants exception:', e.message);
      return null;
    }
  },

  async findTenantById(tenantId) {
    if (!isSupabaseConfigured || !supabase || !tenantId) return null;
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(1);
      if (error || !data || data.length === 0) return null;
      const t = data[0];
      return {
        tenantId: t.tenant_id,
        shopName: t.shop_name,
        description: t.description || '',
        ownerName: t.owner_name,
        phone: t.phone,
        city: t.city,
        address: t.address,
        ntn: t.ntn,
        gstin: t.gstin,
        dlNumber: t.dl_number,
        form20: t.form20,
        form21: t.form21,
        mode: t.mode,
        subscribedSystemScope: t.mode === 'RETAIL' ? 'RETAIL_ONLY' : (t.mode === 'WHOLESALE' ? 'WHOLESALE_ONLY' : 'HYBRID_BOTH'),
        subscriptionStatus: t.subscription_status || 'Active',
        setupFeePaid: Number(t.setup_fee_paid || 0),
        monthlyFee: Number(t.monthly_fee || 0),
        createdDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : '28-08-2026',
      };
    } catch (e) {
      console.warn('[dbSync] findTenantById warning:', e.message);
      return null;
    }
  },

  async saveTenant(tenant) {
    if (!isSupabaseConfigured || !supabase || !tenant) return;
    try {
      const row = {
        tenant_id: tenant.tenantId || tenant.shopId,
        shop_name: tenant.shopName,
        description: tenant.description || '',
        owner_name: tenant.ownerName || '',
        phone: tenant.phone || '',
        city: tenant.city || 'Islamabad',
        address: tenant.address || `${tenant.city || 'Islamabad'}, Pakistan`,
        ntn: tenant.ntn || '',
        gstin: tenant.gstin || '',
        dl_number: tenant.dlNumber || `${tenant.form20 || ''} & ${tenant.form21 || ''}`,
        form20: tenant.form20 || null,
        form21: tenant.form21 || null,
        mode: tenant.subscribedSystemScope === 'RETAIL_ONLY' ? 'RETAIL' : (tenant.subscribedSystemScope === 'WHOLESALE_ONLY' ? 'WHOLESALE' : 'HYBRID'),
        setup_fee_paid: Number(tenant.setupFeePaid || 0),
        monthly_fee: Number(tenant.monthlyFee || 0),
        subscription_status: tenant.subscriptionStatus || 'Active',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('tenants').upsert(row, { onConflict: 'tenant_id' });
      if (error) {
        console.warn('[dbSync] saveTenant supabase error:', error.message);
      }
    } catch (e) {
      console.warn('[dbSync] saveTenant error:', e.message);
    }
  },

  async deleteTenant(tenantId) {
    if (!isSupabaseConfigured || !supabase || !tenantId) return { success: true };
    try {
      // 1. Cascade delete associated staff accounts
      await supabase.from('staff_accounts').delete().eq('tenant_id', tenantId);
      // 2. Cascade delete tenant operations
      await supabase.from('invoices').delete().eq('tenant_id', tenantId);
      await supabase.from('batches').delete().eq('tenant_id', tenantId);
      await supabase.from('medicines').delete().eq('tenant_id', tenantId);
      await supabase.from('purchase_orders').delete().eq('tenant_id', tenantId);
      await supabase.from('suppliers').delete().eq('tenant_id', tenantId);
      await supabase.from('customer_debt_logs').delete().eq('tenant_id', tenantId);
      await supabase.from('customers').delete().eq('tenant_id', tenantId);
      // 3. Delete tenant row itself
      const { error } = await supabase.from('tenants').delete().eq('tenant_id', tenantId);
      if (error) {
        console.warn('[dbSync] deleteTenant error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.warn('[dbSync] deleteTenant exception:', err.message);
      return { success: false, error: err.message };
    }
  },

  async findStaffOrTenantUser(identifier) {
    if (!isSupabaseConfigured || !supabase || !identifier) return null;
    const clean = String(identifier).trim().toLowerCase().replace(/\s+/g, '');
    try {
      // 1. Check staff_accounts in Supabase
      const { data: staffData } = await supabase
        .from('staff_accounts')
        .select('*')
        .ilike('username', clean)
        .limit(1);

      if (staffData && staffData.length > 0) {
        const s = staffData[0];
        return {
          type: 'staff',
          record: {
            id: s.id,
            tenantId: s.tenant_id,
            name: s.name,
            username: s.username,
            password: s.password,
            role: s.role,
            status: s.status,
            storeMode: s.store_mode,
            mustChangePassword: Boolean(s.must_change_password),
          }
        };
      }

      // 2. Check tenants table by tenant_id or shop_name
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .or(`tenant_id.ilike.${clean},shop_name.ilike.%${clean}%`)
        .limit(1);

      if (tenantData && tenantData.length > 0) {
        const t = tenantData[0];
        return {
          type: 'tenant',
          record: {
            tenantId: t.tenant_id,
            shopName: t.shop_name,
            ownerName: t.owner_name,
            subscribedSystemScope: t.mode === 'RETAIL' ? 'RETAIL_ONLY' : (t.mode === 'WHOLESALE' ? 'WHOLESALE_ONLY' : 'HYBRID_BOTH'),
          }
        };
      }
      return null;
    } catch (e) {
      console.warn('[dbSync] findStaffOrTenantUser warning:', e.message);
      return null;
    }
  },

  // -------------------------------------------------------------
  // 5. FACTORY RESET ALL OPERATIONAL SYSTEM DATA (DEMO CLEAN SLATE)
  // -------------------------------------------------------------
  async factoryResetSystemData() {
    try {
      if (isSupabaseConfigured && supabase) {
        // Clear operational data in Supabase cloud tables
        await supabase.from('invoices').delete().neq('id', 'KEEP_NONE');
        await supabase.from('batches').delete().neq('id', 'KEEP_NONE');
        await supabase.from('medicines').delete().neq('id', 'KEEP_NONE');
        await supabase.from('purchase_orders').delete().neq('id', 'KEEP_NONE');
        await supabase.from('suppliers').delete().neq('id', 'KEEP_NONE');
        await supabase.from('customer_debt_logs').delete().neq('id', 'KEEP_NONE');
        await supabase.from('customers').delete().neq('id', 'KEEP_NONE');
        await supabase.from('patients').delete().neq('id', 'KEEP_NONE');
      }

      // Reset local storage keys across Wholesale and Retail
      const keysToClear = [
        'pharmalink_medicines',
        'pharmalink_pk_medicines',
        'pharmalink_batches',
        'pharmalink_pk_batches',
        'pharmalink_invoices',
        'pharmalink_pk_invoices',
        'pharmalink_suppliers',
        'pharmalink_pk_suppliers',
        'pharmalink_purchase_orders',
        'pharmalink_pk_purchase_orders',
        'pharmalink_vendor_returns',
        'pharmalink_pk_vendor_returns',
        'pharmalink_pk_returns',
        'pharmalink_customers',
        'pharmalink_debt_customers',
        'pharmalink_patients',
        'pharmalink_pk_patients',
        'pharmalink_retail_medicines',
        'pharmalink_retail_batches',
        'pharmalink_retail_invoices',
        'pharmalink_retail_debt_customers',
        'pharmalink_retail_suppliers',
        'pharmalink_retail_purchase_orders',
        'pharmalink_retail_patients',
        'pharmalink_retail_vendor_returns',
        'pharmalink_cart',
        'pharmalink_hold_carts',
        'pharmalink_last_invoice',
        'pharmalink_last_sale'
      ];
      keysToClear.forEach((k) => {
        try {
          localStorage.removeItem(k);
          localStorage.setItem(k, JSON.stringify([]));
        } catch (e) {}
      });

      localStorage.setItem('pharmalink_retail_cleared', 'true');
      localStorage.setItem('pharmalink_wholesale_cleared', 'true');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pharmalink_data_factory_reset'));
      }
      return { success: true };
    } catch (err) {
      console.error('[dbSync] factoryResetSystemData error:', err);
      return { success: false, error: err.message };
    }
  },
};
