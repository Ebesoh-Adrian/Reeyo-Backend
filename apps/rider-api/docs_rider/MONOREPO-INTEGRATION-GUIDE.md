# 🏗️ Monorepo Integration Guide - Reeyo Rider API

## 📁 **Monorepo Structure**

```
reeyo-backend/
├── apps/
│   ├── vendor-api/          ✅ Complete (Restaurant/Business API)
│   ├── rider-api/           ✅ Complete (Delivery Driver API)
│   └── user-api/            ⏳ TODO (Customer API)
│
├── libs/                    ✅ Shared Libraries (100% Complete)
│   ├── shared-utils/        ✅ Logger, validators, JWT, passwords
│   ├── core-db/             ✅ DynamoDB models & repositories
│   ├── wallet-engine/       ✅ ACID transactions, payouts
│   ├── notifications/       ✅ Push, SMS, Email
│   └── socket-server/       ✅ Real-time WebSocket server
│
├── package.json             ✅ Root workspace configuration
├── tsconfig.json            ✅ Root TypeScript config
└── README.md                ✅ Project documentation
```

---

## 🔗 **How Rider API Integrates with Monorepo**

### **1. Shared Library Dependencies**

The Rider API imports from shared libraries using relative paths:

```typescript
// Import from core-db
import { RiderRepository } from '../../../../../libs/core-db/repositories/rider.repository';
import { OrderRepository } from '../../../../../libs/core-db/repositories/order.repository';
import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';

// Import from wallet-engine
import { WalletService } from '../../../../../libs/wallet-engine/wallet.service';
import { PayoutService } from '../../../../../libs/wallet-engine/payout.service';

// Import from notifications
import { SMSService } from '../../../../../libs/notifications/sms.service';
import { PushNotificationService } from '../../../../../libs/notifications/push.service';

// Import from shared-utils
import { logger } from '../../../../../libs/shared-utils/logger';
import { hashPassword, comparePassword } from '../../../../../libs/shared-utils/password.helper';
import { generateToken, verifyToken } from '../../../../../libs/shared-utils/jwt.helper';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
```

---

## 📦 **Root package.json Configuration**

Your root `package.json` should use **npm workspaces**:

```json
{
  "name": "reeyo-backend",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "libs/*"
  ],
  "scripts": {
    "dev:vendor": "npm run dev --workspace=apps/vendor-api",
    "dev:rider": "npm run dev --workspace=apps/rider-api",
    "dev:user": "npm run dev --workspace=apps/user-api",
    "dev:socket": "npm run dev --workspace=libs/socket-server",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"**/*.{ts,json,md}\""
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3"
  }
}
```

---

## 🚀 **Installation Steps**

### **Step 1: Install All Dependencies**

From the **root directory**:

```bash
cd reeyo-backend

# Install all dependencies for all workspaces
npm install
```

This will install:
- Root dependencies
- All shared library dependencies
- All API dependencies

---

### **Step 2: Build Shared Libraries (if needed)**

```bash
# Build all libraries
npm run build --workspace=libs/shared-utils
npm run build --workspace=libs/core-db
npm run build --workspace=libs/wallet-engine
npm run build --workspace=libs/notifications
npm run build --workspace=libs/socket-server
```

---

### **Step 3: Configure Environment**

Each API has its own `.env` file:

```bash
# Vendor API
cp apps/vendor-api/.env.example apps/vendor-api/.env
code apps/vendor-api/.env

# Rider API
cp apps/rider-api/.env.example apps/rider-api/.env
code apps/rider-api/.env

# User API (when ready)
cp apps/user-api/.env.example apps/user-api/.env
code apps/user-api/.env
```

---

### **Step 4: Start Services**

You can run each service independently:

```bash
# Terminal 1: Vendor API (port 3002)
npm run dev:vendor

# Terminal 2: Rider API (port 3003)
npm run dev:rider

# Terminal 3: User API (port 3001)
npm run dev:user

# Terminal 4: Socket Server (port 3004)
npm run dev:socket
```

Or use **PM2** to run all services:

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

---

## 🔄 **Root ecosystem.config.js (PM2)**

Create at root level:

```javascript
module.exports = {
  apps: [
    {
      name: 'vendor-api',
      cwd: './apps/vendor-api',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      }
    },
    {
      name: 'rider-api',
      cwd: './apps/rider-api',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3003
      }
    },
    {
      name: 'user-api',
      cwd: './apps/user-api',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    },
    {
      name: 'socket-server',
      cwd: './libs/socket-server',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development',
        PORT: 3004
      }
    }
  ]
};
```

---

## 🔗 **API Communication**

### **How APIs Interact:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├─────────────────────────────────────────────────────────────┤
│  Vendor App  │  Rider App   │  Customer App  │  Admin Panel│
└──────┬───────┴──────┬───────┴──────┬─────────┴──────┬──────┘
       │              │              │                 │
       │              │              │                 │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼─────┐  ┌───────▼──────┐
│  Vendor API │ │ Rider API  │ │ User API │  │  Admin API   │
│  Port 3002  │ │ Port 3003  │ │Port 3001 │  │  Port 3005   │
└──────┬──────┘ └─────┬──────┘ └────┬─────┘  └───────┬──────┘
       │              │              │                 │
       └──────────────┴──────────────┴─────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Socket Server    │
                    │   (Real-time)      │
                    │    Port 3004       │
                    └─────────┬──────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
┌──────▼──────┐     ┌─────────▼────────┐   ┌────────▼────────┐
│  DynamoDB   │     │  Redis (Cache &  │   │   S3 (Files)    │
│  (Database) │     │  Geospatial)     │   │   (Documents)   │
└─────────────┘     └──────────────────┘   └─────────────────┘
```

### **Real-time Order Flow:**

1. **Customer** places order → User API
2. User API creates order in DynamoDB → status: `PENDING`
3. **Vendor** receives order → Vendor API
4. Vendor accepts → status: `ACCEPTED` → Socket.io notifies Customer
5. Vendor prepares → status: `PREPARING`
6. Vendor marks ready → status: `READY_FOR_PICKUP` → Socket.io notifies Riders
7. **Rider** (online) sees available order → Rider API
8. Rider accepts → status: `RIDER_ASSIGNED` → Socket.io notifies Vendor & Customer
9. Rider arrives at vendor → status: `RIDER_AT_PICKUP`
10. Rider picks up → status: `IN_TRANSIT` → Socket.io notifies Customer
11. Rider arrives at customer → status: `RIDER_AT_DELIVERY`
12. Rider completes → status: `DELIVERED` → WalletEngine processes payments

---

## 💰 **Wallet Flow Example**

When a rider completes a delivery:

```typescript
// In Rider API - orders.service.ts
await this.walletService.processOrderCompletion(order);

// This triggers in WalletEngine:
// 1. Debit Customer wallet
// 2. Credit Vendor wallet (minus platform commission)
// 3. Credit Rider wallet (delivery fee)
// 4. Credit Platform wallet (commissions)
// All in ONE ACID transaction!
```

---

## 🗄️ **Shared Database Access**

All APIs access the **same DynamoDB tables**:

```typescript
// Table names use prefix from environment
DYNAMODB_TABLE_PREFIX=reeyo-prod

// Actual tables:
reeyo-prod-users
reeyo-prod-vendors
reeyo-prod-riders
reeyo-prod-orders
reeyo-prod-wallets
```

Each API uses appropriate repositories:
- **Vendor API**: VendorRepository, OrderRepository, WalletRepository
- **Rider API**: RiderRepository, OrderRepository, WalletRepository
- **User API**: UserRepository, OrderRepository, WalletRepository

---

## 🔐 **Authentication Between Services**

### **Each API has its own JWT tokens:**

```typescript
// Vendor token
{
  userId: "vendor_123",
  role: "VENDOR"
}

// Rider token
{
  userId: "rider_456",
  role: "RIDER"
}

// User token
{
  userId: "user_789",
  role: "USER"
}
```

### **Middleware prevents cross-access:**

```typescript
// In Vendor API
authenticateVendor → checks role === "VENDOR"

// In Rider API
authenticateRider → checks role === "RIDER"

// In User API
authenticateUser → checks role === "USER"
```

---

## 📡 **Socket.io Integration**

All APIs connect to the **same Socket.io server**:

```typescript
// Environment variable in all APIs
SOCKET_SERVER_URL=http://localhost:3004

// Usage in services
import io from 'socket.io-client';
const socket = io(process.env.SOCKET_SERVER_URL);

// Emit events
socket.emit('order_accepted', { orderId, vendorId });
socket.emit('rider_location_update', { riderId, lat, lng });
```

---

## 🧪 **Testing the Entire System**

### **Step 1: Start All Services**

```bash
# Terminal 1: DynamoDB Local
docker-compose up dynamodb

# Terminal 2: Redis
docker-compose up redis

# Terminal 3: Socket Server
npm run dev:socket

# Terminal 4: Vendor API
npm run dev:vendor

# Terminal 5: Rider API
npm run dev:rider

# Terminal 6: User API
npm run dev:user
```

### **Step 2: Full Order Flow Test**

1. **Create Vendor** (Vendor API)
2. **Add Menu Items** (Vendor API)
3. **Register Customer** (User API)
4. **Register Rider** (Rider API)
5. **Rider goes online** (Rider API)
6. **Customer places order** (User API)
7. **Vendor accepts order** (Vendor API)
8. **Rider accepts delivery** (Rider API)
9. **Rider completes delivery** (Rider API)
10. **Check wallets** (all APIs)

---

## 🚨 **Common Issues & Solutions**

### **Issue: Module not found error**

```bash
# Reinstall all dependencies
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
npm install
```

### **Issue: TypeScript errors**

```bash
# Rebuild all TypeScript
npm run build --workspaces
```

### **Issue: Port already in use**

```bash
# Check running processes
lsof -i :3001  # User API
lsof -i :3002  # Vendor API
lsof -i :3003  # Rider API
lsof -i :3004  # Socket Server

# Kill process
kill -9 <PID>
```

### **Issue: DynamoDB connection failed**

```bash
# Check DynamoDB Local is running
docker ps | grep dynamodb

# Check endpoint in .env
DYNAMODB_ENDPOINT=http://localhost:8000
```

---

## 📊 **Monorepo Benefits**

✅ **Code Sharing** - Shared libraries reduce duplication
✅ **Consistent** - Same utilities, validators, error handling
✅ **Type Safety** - TypeScript across all services
✅ **Single Build** - Build all services at once
✅ **Atomic Changes** - Update shared code once, affects all
✅ **Easy Testing** - Test entire system locally
✅ **Version Control** - One repo, one history

---

## 🎯 **Development Workflow**

### **Adding New Feature:**

1. Update shared library if needed (`libs/`)
2. Update API service (`apps/rider-api/src/modules/`)
3. Test locally
4. Commit all changes together
5. Deploy all affected services

### **Bug Fix:**

1. Identify service with bug
2. Fix in that service
3. If fix requires shared lib change, update lib too
4. Test affected services
5. Deploy

---

## 📚 **Further Reading**

- **LIBRARY_DOCUMENTATION.md** - Detailed library docs
- **SECURITY_GUIDE.md** - Security best practices
- **AWS-DEPLOYMENT-GUIDE.md** - Production deployment
- **POSTMAN-TESTING-GUIDE.md** - API testing guide

---

**Your monorepo is production-ready! 🚀**
