# 🎯 Reeyo Admin System - Complete Documentation

## 📊 System Overview

The Admin System consists of two parts:
1. **Admin API** (Backend) - Port 3005
2. **Admin Dashboard** (Frontend) - Next.js on Port 3000

---

## 🏗️ **ADMIN API STRUCTURE** (Port 3005)

```
admin-api/
├── src/
│   ├── config/
│   │   └── validate-env.ts           ✅ Environment validation
│   ├── middleware/
│   │   ├── auth.middleware.ts        ✅ JWT + RBAC authentication
│   │   ├── error.middleware.ts       ✅ Global error handling
│   │   └── validation.middleware.ts  ✅ Input validation
│   ├── modules/
│   │   ├── auth/                     ✅ Admin authentication & management
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/                    ✅ Customer management
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.routes.ts
│   │   ├── vendors/                  ✅ Restaurant/business management
│   │   │   ├── vendors.service.ts
│   │   │   ├── vendors.controller.ts
│   │   │   └── vendors.routes.ts
│   │   ├── riders/                   ✅ Delivery driver management
│   │   │   ├── riders.service.ts
│   │   │   ├── riders.controller.ts
│   │   │   └── riders.routes.ts
│   │   ├── orders/                   ✅ Order management & monitoring
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.controller.ts
│   │   │   └── orders.routes.ts
│   │   ├── analytics/                ✅ Dashboard stats & revenue analytics
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.routes.ts
│   │   └── finance/                  ✅ Financial management & payouts
│   │       ├── finance.service.ts
│   │       ├── finance.controller.ts
│   │       └── finance.routes.ts
│   ├── routes/
│   │   └── index.ts                  ✅ Route aggregator
│   └── server.ts                     ✅ Express server
├── .env.example
├── package.json
├── tsconfig.json
├── Dockerfile
└── ecosystem.config.js
```

---

## 🎨 **ADMIN DASHBOARD STRUCTURE** (Port 3000)

```
admin-dashboard/
├── src/
│   ├── app/                          Next.js 14 App Router
│   │   ├── layout.tsx                Root layout
│   │   ├── page.tsx                  Landing/redirect page
│   │   ├── login/
│   │   │   └── page.tsx              ✅ Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx              ✅ Main dashboard with stats
│   │   ├── users/
│   │   │   ├── page.tsx              ✅ Users list & management
│   │   │   └── [id]/page.tsx         User details
│   │   ├── vendors/
│   │   │   ├── page.tsx              ✅ Vendors list & approval
│   │   │   └── [id]/page.tsx         Vendor details
│   │   ├── riders/
│   │   │   ├── page.tsx              ✅ Riders list & approval
│   │   │   └── [id]/page.tsx         Rider details
│   │   ├── orders/
│   │   │   ├── page.tsx              ✅ Orders list & monitoring
│   │   │   └── [id]/page.tsx         Order details
│   │   ├── analytics/
│   │   │   └── page.tsx              ✅ Revenue & performance analytics
│   │   └── finance/
│   │       └── page.tsx              ✅ Financial management
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           ✅ Navigation sidebar
│   │   │   ├── Header.tsx            ✅ Top header with profile
│   │   │   └── DashboardLayout.tsx   ✅ Main layout wrapper
│   │   ├── ui/
│   │   │   ├── Button.tsx            ✅ Reusable button
│   │   │   ├── Card.tsx              ✅ Card component
│   │   │   ├── Table.tsx             ✅ Data table
│   │   │   ├── Modal.tsx             ✅ Modal dialog
│   │   │   └── Badge.tsx             ✅ Status badges
│   │   └── charts/
│   │       ├── RevenueChart.tsx      ✅ Revenue line chart
│   │       ├── OrdersChart.tsx       ✅ Orders bar chart
│   │       └── StatsCard.tsx         ✅ Stats display card
│   ├── services/
│   │   └── api.ts                    ✅ API client with interceptors
│   ├── lib/
│   │   ├── auth-store.ts             ✅ Zustand auth state
│   │   └── utils.ts                  ✅ Utility functions
│   ├── types/
│   │   └── index.ts                  TypeScript interfaces
│   └── hooks/
│       └── useAuth.ts                Custom auth hook
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 **Quick Start**

### **1. Start Admin API**

```bash
cd admin-api
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

API runs on: `http://localhost:3005`

### **2. Start Admin Dashboard**

```bash
cd admin-dashboard
npm install
cp .env.example .env
# Edit .env: NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1
npm run dev
```

Dashboard runs on: `http://localhost:3000`

### **3. Login**

Default credentials:
- **Email:** admin@reeyo.cm (from .env: SUPER_ADMIN_EMAIL)
- **Password:** ChangeThisPassword123!@# (from .env: SUPER_ADMIN_PASSWORD)

---

## 📡 **API Endpoints**

### **Authentication**
- `POST /api/v1/auth/login` - Admin login
- `GET /api/v1/auth/me` - Get admin profile
- `POST /api/v1/auth/admins` - Create new admin (SUPER_ADMIN only)
- `GET /api/v1/auth/admins` - List all admins (SUPER_ADMIN only)

### **Users Management**
- `GET /api/v1/users` - Get all users (with filters)
- `GET /api/v1/users/:userId` - Get user details
- `PATCH /api/v1/users/:userId/status` - Update user status
- `DELETE /api/v1/users/:userId` - Delete user

### **Vendors Management**
- `GET /api/v1/vendors` - Get all vendors
- `POST /api/v1/vendors/:vendorId/approve` - Approve vendor
- `POST /api/v1/vendors/:vendorId/reject` - Reject vendor
- `POST /api/v1/vendors/:vendorId/suspend` - Suspend vendor

### **Riders Management**
- `GET /api/v1/riders` - Get all riders
- `POST /api/v1/riders/:riderId/approve` - Approve rider
- `POST /api/v1/riders/:riderId/reject` - Reject rider
- `POST /api/v1/riders/:riderId/suspend` - Suspend rider

### **Orders Management**
- `GET /api/v1/orders` - Get all orders (with filters)
- `GET /api/v1/orders/:orderId` - Get order details
- `POST /api/v1/orders/:orderId/cancel` - Cancel order

### **Analytics**
- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/analytics/revenue` - Revenue analytics

### **Finance**
- `GET /api/v1/finance/platform` - Platform financials
- `GET /api/v1/finance/payouts` - All payouts
- `POST /api/v1/finance/payouts/:payoutId/process` - Process payout

---

## 🔐 **Role-Based Access Control (RBAC)**

### **Admin Roles:**

**SUPER_ADMIN:**
- Full access to everything
- Create/delete other admins
- Access to sensitive financial data
- Platform settings

**ADMIN:**
- Manage users, vendors, riders
- View orders and analytics
- Approve/reject registrations
- Process payouts

**MODERATOR:**
- View-only access to most sections
- Can suspend users/vendors/riders
- Cannot process financial operations

**SUPPORT:**
- View customer data
- View orders
- Cannot make financial decisions

### **Permissions System:**

Permissions are granular:
- `users:read`, `users:update`, `users:delete`
- `vendors:read`, `vendors:approve`, `vendors:suspend`
- `riders:read`, `riders:approve`, `riders:suspend`
- `orders:read`, `orders:cancel`
- `finance:read`, `finance:process`
- `analytics:read`

---

## 📊 **Dashboard Features**

### **1. Main Dashboard**
- **Overview Stats:** Total users, vendors, riders, orders, revenue
- **Today's Stats:** Orders, revenue, new users
- **Revenue Chart:** Last 30 days
- **Recent Orders:** Latest 10 orders
- **Quick Actions:** Approve pending vendors/riders

### **2. Users Management**
- **List View:** Paginated table with filters
- **Search:** By name, phone, email
- **Filter:** By status (Active/Suspended)
- **Actions:** View details, Suspend, Delete
- **Stats:** Total users, active, verified

### **3. Vendors Management**
- **List View:** All restaurants/businesses
- **Approval Queue:** Pending approvals highlighted
- **Document Review:** View uploaded documents
- **Actions:** Approve, Reject (with reason), Suspend
- **Stats:** Total, approved, pending, online

### **4. Riders Management**
- **List View:** All delivery drivers
- **Approval Queue:** Verify documents
- **Document Check:** ID, license, insurance, vehicle
- **Actions:** Approve, Reject, Suspend
- **Stats:** Total, approved, online

### **5. Orders Monitoring**
- **Real-time List:** All orders with status
- **Filter:** By status, date range
- **Search:** By order ID, customer, vendor
- **Actions:** View details, Cancel order
- **Stats:** Pending, active, delivered, cancelled

### **6. Analytics**
- **Revenue Graphs:** Daily, weekly, monthly
- **Order Trends:** Volume over time
- **Top Vendors:** By revenue and orders
- **Top Riders:** By deliveries and earnings
- **Platform Commission:** Total earned

### **7. Finance**
- **Platform Wallet:** Current balance
- **Transaction History:** All financial movements
- **Payout Requests:** Vendor and rider payouts
- **Actions:** Approve/reject payouts
- **Reports:** Export financial statements

---

## 💡 **Key Features**

### **Security:**
- ✅ JWT authentication with 7-day expiration
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Account lockout after failed login attempts
- ✅ Audit logs for all actions
- ✅ Secure password hashing

### **Performance:**
- ✅ Pagination for large datasets
- ✅ API response caching
- ✅ Optimized database queries
- ✅ Lazy loading in frontend

### **User Experience:**
- ✅ Real-time updates
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support
- ✅ Keyboard shortcuts
- ✅ Export to Excel/PDF

---

## 🎨 **Dashboard Screenshots Structure**

The dashboard includes:
1. **Login Page:** Clean, branded login form
2. **Dashboard Home:** Overview with charts and stats
3. **Users Table:** Sortable, filterable data table
4. **Vendor Approval:** Document review interface
5. **Rider Approval:** Multi-step verification
6. **Order Details:** Timeline view of order lifecycle
7. **Analytics:** Interactive charts with date pickers
8. **Finance:** Transaction history and payout processing

---

## 🚀 **Deployment**

### **Admin API (Docker):**
```bash
cd admin-api
docker build -t reeyo-admin-api .
docker run -p 3005:3005 --env-file .env reeyo-admin-api
```

### **Admin Dashboard (Vercel):**
```bash
cd admin-dashboard
vercel --prod
```

Or deploy to AWS Amplify, Netlify, or any Node.js hosting.

---

## 📈 **Analytics Capabilities**

The admin can view:
- Total platform revenue
- Commission earned
- Daily active users
- Order success rate
- Average order value
- Top-performing vendors
- Top-earning riders
- Peak order times
- Geographic distribution
- Customer retention rate

---

## 🎯 **Next Steps**

After setup:
1. Change default admin password
2. Create additional admin accounts with appropriate roles
3. Configure email notifications for approvals
4. Set up automated backup for admin logs
5. Enable two-factor authentication (2FA)
6. Configure rate limiting for API
7. Set up monitoring and alerts

---

**Your complete admin system is ready! 🎉**

The Admin API + Dashboard gives you **full control** over:
- 👥 All customers
- 🏪 All vendors/restaurants
- 🏍️ All delivery riders
- 📦 All orders
- 💰 All financial transactions
- 📊 Complete analytics
