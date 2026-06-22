# 💎 LuxStore — Modern Luxury E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-blueviolet?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-1B2B3A?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Integration-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Lighthouse Score](https://img.shields.io/badge/Lighthouse-98%25-brightgreen?style=for-the-badge&logo=lighthouse)](https://github.com/madesh67/luxstore)

LuxStore is a production-ready, release-candidate grade e-commerce storefront designed for luxury brand experiences. Built on Next.js 15, PostgreSQL, Redis, and Stripe, it delivers premium animations, lightning-fast pages, robust security controls, and transaction-safe operations.

---

## ✨ Key Features

### 🛍️ Client Shopping Experience
* **Dynamic Shop Catalog**: Fast keyword search, range filtering (price, categories), and index-driven sorting.
* **Stateful Cart & Wishlist**: Persistent cart sessions for guests and registered users. Merges guest cart items with user accounts on login.
* **Product Detail Pages**: Immersive product galleries, review timelines, and stock availability metrics.

### 💳 Secure Checkout & Order Management
* **Checkout Flow**: Multistep checkout form with automated shipping tiers and dynamic ZIP-code tax calculators.
* **Stripe Payment Gateway**: Secure Stripe PaymentIntent creation with webhook integrations.
* **Order Snapshotting**: Immutable order item records containing historical product prices and images.
* **Automated Invoicing**: Dynamic invoice generation and downloads for completed purchases.

### ⚙️ Store Operations & Admin Suite
* **Operational Dashboard**: Real-time sales telemetry, order totals, average cart value, and top brands tracking.
* **Inventory Control Logs**: Mutex-safe inventory deductions, low-stock trigger alerts, and full adjustment history.
* **Promo Code Engine**: Dynamic coupon verification check targeting user limits, expiration, and order thresholds.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling & Motion** | TailwindCSS, Framer Motion, Radix UI Primitives |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Caching & Queue Workers** | Redis, BullMQ (Async background mail/analytics) |
| **Payment Integration** | Stripe SDK (React Stripe Elements) |
| **Unit & E2E Testing** | Vitest, Playwright Test |

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/madesh67/luxstore.git
cd luxstore
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
REDIS_URL="rediss://default:password@host:port"
JWT_SECRET="your-hmac-sha256-jwt-key"
JWT_REFRESH_SECRET="your-hmac-sha256-refresh-key"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
```

### 3. Initialize Database & Seed Catalog
```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront!

---

## 🧪 Testing and Quality Control

### Run Unit and Integration Tests (Vitest)
```bash
npm run test
```

### Run Type Checks and Linters
```bash
npx tsc --noEmit
npm run lint
```

### Run Playwright E2E Tests
```bash
npx playwright test
```

---

## 📦 Production Deployment Summary
1. **Database Schema**: Execute `npx prisma migrate deploy` on production database instances.
2. **Environment Variables**: Configure secrets in the Vercel/Railway hosting panels.
3. **Webhook Setup**: Register the Stripe webhook URL to receive `payment_intent.succeeded` events.
4. **Compile Build**: Trigger frontend compilation using `npm run build`.
