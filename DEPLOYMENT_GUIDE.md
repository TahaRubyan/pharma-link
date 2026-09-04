# 🚀 Vercel Free-Tier Deployment Guide for PharmaLink ERP & POS

This application is **100% cloud-ready for Vercel's Free Hobby Tier** ($0/month forever).

---

## ⚡ Why This System Runs 100% Free on Vercel
1. **Serverless Architecture**: Built as a high-performance React + Vite Single Page Application (SPA).
2. **Zero Server / Database Hosting Costs**: Uses browser-persistent `localStorage` state management with automatic seed data and migration logic.
3. **Optimized Asset Bundles**: Pre-split vendor chunks (`vendor-react`, `vendor-icons`, `index`) ensure instant loading across Vercel's global Edge CDN within the 100GB/month free bandwidth limit.
4. **Pre-Configured `vercel.json`**: Handles SPA route rewrites (`/(.*) -> /index.html`) and HTTP caching headers automatically.

---

## Option 1: Deploy via GitHub (Recommended — Automatic Updates)

### Step 1: Initialize Git and Push to GitHub
Open your terminal in `D:\Code\Medical Store white label` and run:
```bash
git init
git add .
git commit -m "feat: complete PharmaLink ERP & POS with 10-layer test suite and Vercel config"
```

Create a new repository on [GitHub](https://github.com/new) (e.g. `pharmalink-medical-store`), then link and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/pharmalink-medical-store.git
git branch -M main
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in (Free Hobby Account).
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your GitHub repository (`pharmalink-medical-store`).
4. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**.
6. Within ~30 seconds, your site will be live at:
   `https://pharmalink-medical-store.vercel.app` (or custom name).

---

## Option 2: Instant Deploy via Vercel CLI (No GitHub Required)

If you prefer to deploy directly from your local terminal without pushing to GitHub:

### Step 1: Run Vercel CLI
```bash
npx vercel
```
1. Follow the terminal prompts:
   - *Set up and deploy?* ➔ Press `y` (Enter)
   - *Which scope?* ➔ Select your personal free account
   - *Link to existing project?* ➔ Press `n`
   - *Project name?* ➔ `idrees-medical-store` (or your choice)
   - *In which directory is code located?* ➔ `./`
   - *Auto-detected Project Settings (Vite)?* ➔ Press `y` (Enter)

### Step 2: Deploy to Production
```bash
npx vercel --prod
```
Your production URL will be displayed in the terminal and live instantly.

---

## 🔑 Default Login Credentials for Demo & Testing

Once deployed on Vercel, use any of these credentials to access the system:

| Role | Username | Password | Default Mode | Scope / Features |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `master admin` | `admin123` | Master Control | Full cross-tenant access to both Retail & Wholesale systems |
| **Retail Admin** | `retail admin` | `admin123` | **Retail Counter POS** | **Idrees Medical Store**: POS billing, loose tablets, Narcotics register, Customer Khata, Inward POs |
| **Wholesale Admin** | `wholesale admin` | `admin123` | **Wholesale B2B ERP** | **Idrees Pharma Distributor**: B2B bulk orders, 18% ST, 0.5% Adv Tax, DRAP Sec 23 warranties, territory ledgers |

---

## 🛠️ Verification & Health Check
- **Run all 80 tests locally before deploying**: `npm test`
- **Build production bundle**: `npm run build`
- **Preview production build locally**: `npm run preview`
