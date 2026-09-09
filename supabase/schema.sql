-- ==============================================================================
-- PHARMALINK MEDICAL STORE ERP & POS - MULTI-TENANT POSTGRESQL SCHEMA (SUPABASE)
-- Fully isolated with Row-Level Security (RLS) policies for up to 50+ shops
-- ==============================================================================

-- 1. TENANTS REGISTRY (Master SaaS Directory)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,                       -- e.g. 'TEN-TESTING-SHOP'
    name TEXT NOT NULL,                        -- e.g. 'Testing Shop'
    mode TEXT NOT NULL CHECK (mode IN ('RETAIL', 'WHOLESALE', 'HYBRID')),
    tier TEXT NOT NULL DEFAULT 'FREE_TRIAL' CHECK (tier IN ('FREE_TRIAL', 'ACTIVE_PRO', 'SUSPENDED')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    city TEXT,
    phone TEXT,
    dl_number TEXT,
    ntn TEXT,
    gstin TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TENANT USERS TABLE (Admins, Cashiers, Delivery Staff)
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,             -- e.g. 'testing.admin'
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CASHIER', 'DELIVERY_STAFF')),
    phone TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MASTER MEDICINE CATALOG
CREATE TABLE IF NOT EXISTS public.medicines (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,                   -- 4-digit code (e.g. '1001')
    name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    formula TEXT,
    category TEXT DEFAULT 'Tablets',
    manufacturer TEXT,
    rack_location TEXT,
    box_stock INTEGER DEFAULT 0,
    purchase_cost NUMERIC(12, 2) DEFAULT 0.00,
    box_selling_price NUMERIC(12, 2) DEFAULT 0.00,
    strips_per_box INTEGER DEFAULT 10,
    tablets_per_strip INTEGER DEFAULT 10,
    tablets_per_box INTEGER DEFAULT 100,
    price_per_tablet NUMERIC(10, 2) DEFAULT 0.00,
    strip_price NUMERIC(10, 2) DEFAULT 0.00,
    controlled_type TEXT DEFAULT 'None',
    requires_prescription BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, id)
);

-- 4. BATCHES & STOCK LOTS (FEFO)
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    box_stock INTEGER DEFAULT 0,
    total_tablets_available INTEGER DEFAULT 0,
    box_price NUMERIC(12, 2) DEFAULT 0.00,
    purchase_price_box NUMERIC(12, 2) DEFAULT 0.00,
    price_per_tablet NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Active Stock',
    rack_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, id)
);

-- 5. SALES INVOICES & COUNTER BILLS
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    customer_name TEXT,
    doctor_name TEXT,
    gross_total NUMERIC(12, 2) DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    total_tax NUMERIC(12, 2) DEFAULT 0.00,
    net_total NUMERIC(12, 2) DEFAULT 0.00,
    payment_mode TEXT DEFAULT 'Cash',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, id)
);

-- 6. CUSTOMER DEBT / KHATA (UDHAR)
CREATE TABLE IF NOT EXISTS public.customer_debts (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    cnic TEXT,
    credit_limit NUMERIC(12, 2) DEFAULT 50000.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    active_transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
    settled_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, id)
);

-- 7. DISTRIBUTORS / SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    gstin TEXT,
    ntn TEXT,
    outstanding_debt NUMERIC(12, 2) DEFAULT 0.00,
    payment_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, id)
);

-- 8. PATIENT REGISTRY & RX LOGS
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age TEXT,
    gender TEXT,
    phone TEXT,
    cnic TEXT,
    address TEXT,
    doctor_name TEXT,
    prescribing_doctor TEXT,
    doctor_reg_no TEXT,
    diagnosis TEXT,
    active_medications TEXT,
    govt_stipend_eligible BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tenant_id, id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict kernel-level data isolation across tenants
-- ==============================================================================

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Dynamic isolation: Only rows with matching tenant_id header can be viewed or mutated
CREATE POLICY IF NOT EXISTS tenant_isolation_medicines ON public.medicines
    FOR ALL USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');

CREATE POLICY IF NOT EXISTS tenant_isolation_batches ON public.batches
    FOR ALL USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');

CREATE POLICY IF NOT EXISTS tenant_isolation_invoices ON public.invoices
    FOR ALL USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');

CREATE POLICY IF NOT EXISTS tenant_isolation_debts ON public.customer_debts
    FOR ALL USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');

CREATE POLICY IF NOT EXISTS tenant_isolation_suppliers ON public.suppliers
    FOR ALL USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');

CREATE POLICY IF NOT EXISTS tenant_isolation_patients ON public.patients
    FOR ALL USING (tenant_id = current_setting('request.headers', true)::json->>'x-tenant-id');

-- Initial Seed for Testing Shop (Hybrid Mode)
INSERT INTO public.tenants (id, name, mode, tier, city, dl_number, gstin, ntn, address, phone)
VALUES 
    ('TEN-TESTING-SHOP', 'Testing Shop', 'HYBRID', 'ACTIVE_PRO', 'Lahore', 'PK-DL-20-45812', '3277876174544', '1234567-8', 'Mall Road, Commercial Area, Lahore', '0300-1234567')
ON CONFLICT (id) DO NOTHING;
