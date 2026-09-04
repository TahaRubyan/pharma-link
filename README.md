# PharmaLink ERP & POS — Multi-Tenant Pharmacy & Wholesale Management System

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.21-purple.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-80%2F80%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Commercial-amber.svg)]()

**PharmaLink ERP & POS** is a high-performance, offline-first, multi-tenant enterprise resource planning and point-of-sale platform specifically architected for modern retail pharmacies, clinic dispensaries, and wholesale pharmaceutical distributors.

Built with a zero-dependency React architecture and vanilla CSS custom properties, PharmaLink delivers sub-15ms search and transaction speeds, regulatory compliance (DRAP & FBR tax schedules), FEFO batch management, and a clean-slate deployment architecture.

---

## 🏗️ Architecture & Core Modules

### 1. Point of Sale (POS) & Smart Counter
- **Unit Dispensing Math**: Seamlessly converts packaging hierarchies (Boxes -> Strips -> Loose Tablets) with accurate decimal price derivation.
- **FEFO Batch Allocation**: Automatically prioritizes the earliest expiring batch on cart addition to minimize stock expiration loss.
- **Omni-Search Bar**: Instant lookup across Brand Names, Generic Formulations, Barcodes, and 4-Digit Item Codes in under 15ms.
- **Customer & Patient Rx**: Full patient drawer for Schedule-H and Narcotic tracking (Prescribing Doctor, PMC Reg #, Patient CNIC).
- **Thermal (80mm) & A4 Tax Invoicing**: Hotkey-triggered (F9/F10) preview and print formatting with Form 20/21 compliance warranties.

### 2. Customer Khata (Credit & Debt Management)
- **Unlimited Credit Tracking**: Dynamic khata ledger where customers can make continuous purchases on credit without artificial credit limits.
- **WhatsApp Integration**: Instant one-click WhatsApp billing statement generation with customized bill breakdowns.
- **Full Settlement & PDF Cycle Archiving**: Full debt clearance archives prior invoice history and resets the ledger for subsequent billing cycles.

### 3. Supplier Management & Retail Inward POs
- **Regulatory Tax Engine**: Automatically calculates **18% Sales Tax** and **4% Advance Tax** (Sections 236H/236G) on inward distributor shipments.
- **Instant Distributor Onboarding**: Quick-add distributor modal inside purchase orders with NTN, GSTIN, and Drug License tracking.
- **RTV (Return to Vendor) Debit Notes**: Quarantine expired or near-expiry batches (<= 6 months) and create printed debit notes that credit distributor accounts.

### 4. Controlled Substances Register
- **Regulatory Compliance**: DRAP Form 6 compliance register for Schedule-H, Narcotic, and Steroid drugs.
- **Dynamic Ledger Grouping**: Chronologically groups sales by calendar date with printable inspection logs.

### 5. Multi-Tenant SaaS Master Command Center
- **Tenant Management**: Provision and configure separate retail or wholesale pharmacy tenants.
- **Subscription Lifecycle**: Track setup fees, recurring monthly subscription dues, and account states (Active, Due Soon, Overdue).
- **Tenant Inspection Mode**: Super Admin read-only inspection context to diagnose tenant states safely.

---

## 🔒 Security & Clean Slate Design

- **Role-Based Access Control (RBAC)**: Strict permission boundaries distinguishing Master Admin, Retail Admin, Wholesale Admin, and Cashier roles.
- **Credential-Only Authentication**: No hardcoded master bypass buttons in user-facing layouts; all roles authenticate through the credential verification engine.
- **Clean Slate Architecture**: Zero pre-seeded demo records; all initial catalogs, batches, customer registers, and invoices start completely clean.
- **Zero Sensitive File Leakage**: .gitignore strictly protects .env, agent logs, node dependencies, build outputs, and local session artifacts from repository tracking.
- **Client Cache Isolation**: Built-in cache eviction ensures clean initial loads without stale local storage contamination.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation
```bash
# Clone repository
git clone https://github.com/TahaRubyan/Multi-Tenant-Medical-Store.git
cd Multi-Tenant-Medical-Store

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will run on `http://localhost:5173`.

---

## 🧪 Testing & Quality Assurance

PharmaLink features a comprehensive 10-dimension automated verification suite:

```bash
# Run all 80 automated test suites
npm test

# Run individual testing dimensions
npm run test:unit          # Pricing math, FEFO, tax engines
npm run test:integration   # Cross-context POS, PO, Khata workflows
npm run test:e2e           # End-to-end customer & admin journeys
npm run test:interface     # DOM layout, sidebar collapse, modal lifecycles
npm run test:cross-browser # CSS3 standards, storage fallbacks, Intl math
npm run test:responsive    # Mobile, tablet, desktop viewports
npm run test:visual        # WCAG AA contrast & design token consistency
npm run test:perf          # Search latency (<15ms) & cart computation (<5ms)
npm run test:usability     # Counter checkout efficiency & field guidance
npm run test:a11y          # WCAG 2.1 AA accessibility standards
```

**Test Verification Status**: 80 / 80 Passed (100% pass rate).

---

## 📦 Production Build & Vercel Deployment

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Vercel Deployment
The repository includes a production-ready `vercel.json` with SPA routing rewrites and strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`):

```bash
vercel --prod
```

---

## 🔑 Default Credentials for Testing

| Role | Username | Password | Mode / Target |
| :--- | :--- | :--- | :--- |
| **Master SaaS Admin** | `master admin` | `admin123` | Platform Command Center |
| **Retail Admin** | `retail admin` | `admin123` | Retail Pharmacy Store Context |
| **Wholesale Admin** | `wholesale admin` | `admin123` | Wholesale Depot Context |

---

## 📄 License & Distribution

Proprietary enterprise software developed for white-label and commercial multi-tenant distribution.
