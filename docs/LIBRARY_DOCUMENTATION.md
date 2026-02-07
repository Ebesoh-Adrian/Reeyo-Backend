# 📚 Reeyo Backend - Complete Library Documentation

## 🎯 Purpose of This Document

This document explains **every file** in the shared libraries (`libs/`) folder, their purpose, how they work, and how to use them. This is the foundation that ALL APIs (User, Vendor, Rider, Admin) depend on.

---

# 📦 1. SHARED-UTILS Library (`libs/shared-utils/`)

## Purpose
Provides common utilities, constants, error handling, validation, and helper functions used across all services.

---

## 1.1 `package.json`
**What it does**: Defines dependencies for the shared-utils library.

**Key Dependencies**:
- `winston` - Professional logging
- `winston-daily-rotate-file` - Log file rotation
- `joi` - Input validation
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `uuid` - Unique ID generation

**When to modify**: When adding new utility dependencies

---

## 1.2 `logger.ts`
**What it does**: Creates a centralized logging system for the entire application.

**Key Features**:
- **Console logging** (development)
- **File logging** (production) with daily rotation
- **Structured JSON logs** with metadata
- **Specialized methods** for orders, transactions, auth events

**How to use**:
```typescript
import { logger, logOrder, logTransaction } from '../../libs/shared-utils/logger';

// Basic logging
logger.info('User logged in', { userId: '123' });
logger.error('Payment failed', { error, orderId });

// Specialized logging
logOrder('created', 'ord_123', { vendorId, amount });
logTransaction('txn_456', 50000, 'CREDIT');
```

**Why it's important**: 
- Debugging production issues
- Audit trail for financial transactions
- Performance monitoring

**⚠️ Never log**:
- Passwords
- Credit card numbers
- JWT tokens (full tokens)
- Personally identifiable information (PII) unnecessarily

---

## 1.3 `errors/app-error.ts`
**What it does**: Custom error class that provides consistent error handling across all services.

**Key Features**:
- Standard HTTP status codes
- Custom error codes for business logic
- Optional details for validation errors
- JSON serialization

**How to use**:
```typescript
import { AppError, ErrorFactory } from '../../libs/shared-utils/errors/app-error';

// Using ErrorFactory (recommended)
throw ErrorFactory.notFound('Vendor', vendorId);
throw ErrorFactory.unauthorized('Invalid credentials');
throw ErrorFactory.badRequest('Insufficient balance', { available: 1000, required: 5000 });

// Direct usage
throw new AppError('Custom error message', 400, 'CUSTOM_CODE');
```

**Why it's important**: 
- Consistent error responses across all APIs
- Makes debugging easier
- Client apps can handle errors programmatically

**⚠️ Security Note**: Never expose internal error details to clients in production

---

## 1.4 `errors/error-codes.ts`
**What it does**: Centralized registry of ALL error codes used in the platform.

**Structure**:
- `1000-1099`: Authentication & Authorization
- `2000-2099`: User errors
- `3000-3099`: Vendor errors
- `4000-4099`: Rider errors
- `5000-5099`: Order errors
- `6000-6099`: Inventory errors
- `7000-7099`: Wallet & Payment errors
- `8000-8099`: Service configuration
- `9000-9099`: Validation errors
- `10000-10099`: General errors
- `11000-11099`: External service errors

**How to use**:
```typescript
import { ErrorCodes } from '../../libs/shared-utils/errors/error-codes';

throw new AppError('Insufficient balance', 400, ErrorCodes.INSUFFICIENT_BALANCE);
```

**Why it's important**: 
- Frontend can display localized error messages
- Easy to track error patterns
- Documentation for frontend developers

---

## 1.5 `constants/index.ts`
**What it does**: Defines ALL enums and constants used throughout the platform.

**Key Exports**:
- `UserType`: USER, VENDOR, RIDER, ADMIN
- `ServiceType`: FOOD, MART, PACKAGE
- `OrderStatus`: PENDING, ACCEPTED, DELIVERED, etc.
- `PaymentMethod`: WALLET, CAMPAY, CARD, CASH
- `VendorStatus`, `RiderStatus`, `RiderAvailability`
- `PlatformConstants`: Business rules (min amounts, limits, etc.)

**How to use**:
```typescript
import { OrderStatus, PlatformConstants, ServiceType } from '../../libs/shared-utils/constants';

// Type-safe status checks
if (order.status === OrderStatus.PENDING) { }

// Access business rules
const minPayout = PlatformConstants.MIN_PAYOUT_AMOUNT; // 50000 XAF
```

**Why it's important**: 
- Type safety (prevents typos)
- Single source of truth for business rules
- Easy to change platform-wide settings

**⚠️ Important**: Changing constants affects the entire platform

---

## 1.6 `validators/schemas.ts`
**What it does**: Joi validation schemas for all input data.

**Available Schemas**:
- `vendorRegistrationSchema` - Vendor signup validation
- `riderRegistrationSchema` - Rider signup validation
- `menuItemSchema` - Menu item validation
- `foodOrderSchema` - Food/Mart order validation
- `packageOrderSchema` - Package order validation
- `payoutRequestSchema` - Payout validation
- `locationUpdateSchema` - GPS validation

**How to use**:
```typescript
import { vendorRegistrationSchema } from '../../libs/shared-utils/validators/schemas';

// In Express route
const { error, value } = vendorRegistrationSchema.validate(req.body);
if (error) {
  throw ErrorFactory.validation('Invalid input', error.details);
}
```

**Why it's important**: 
- Prevents invalid data from entering database
- Consistent validation across all APIs
- Clear error messages for clients

**⚠️ Security**: Always validate user input before processing

---

## 1.7 `helpers/jwt.helper.ts`
**What it does**: Handles JWT token generation and verification.

**Key Methods**:
- `generateAccessToken()` - Create short-lived access token (7 days)
- `generateRefreshToken()` - Create long-lived refresh token (30 days)
- `generateTokenPair()` - Create both tokens at once
- `verifyAccessToken()` - Verify and decode access token
- `verifyRefreshToken()` - Verify and decode refresh token

**How to use**:
```typescript
import { JWTHelper } from '../../libs/shared-utils/helpers/jwt.helper';

// On login
const tokens = JWTHelper.generateTokenPair({
  userId: vendor.vendorId,
  email: vendor.email,
  userType: 'VENDOR',
});

// On protected routes
try {
  const payload = JWTHelper.verifyAccessToken(token);
  console.log(payload.userId); // Authenticated user ID
} catch (error) {
  throw ErrorFactory.unauthorized('Invalid token');
}
```

**Why it's important**: 
- Secure authentication
- Stateless (no session storage needed)
- Auto-expiration for security

**⚠️ Critical**: Never expose JWT_SECRET environment variable

---

## 1.8 `helpers/password.helper.ts`
**What it does**: Secure password hashing and verification using bcrypt.

**Key Methods**:
- `hash()` - Hash password with salt
- `compare()` - Verify password against hash
- `validateStrength()` - Check password requirements
- `generateRandom()` - Generate secure random password

**How to use**:
```typescript
import { PasswordHelper } from '../../libs/shared-utils/helpers/password.helper';

// On registration
const passwordHash = await PasswordHelper.hash(req.body.password);

// On login
const isValid = await PasswordHelper.compare(password, user.passwordHash);
if (!isValid) {
  throw ErrorFactory.unauthorized('Invalid credentials');
}

// Check password strength
const { isValid, errors } = PasswordHelper.validateStrength(password);
if (!isValid) {
  throw ErrorFactory.badRequest('Weak password', errors);
}
```

**Why it's important**: 
- Protects user passwords
- Industry-standard security
- Prevents rainbow table attacks

**⚠️ Never**:
- Store plain text passwords
- Log passwords
- Send passwords in response
- Use MD5 or SHA1 (use bcrypt only)

---

## 1.9 `payment/campay.service.ts`
**What it does**: Integration with Campay payment gateway for Cameroon mobile money (MTN, Orange).

**Key Methods**:
- `authenticate()` - Get API access token
- `collectPayment()` - Charge customer's mobile money
- `getPaymentStatus()` - Check transaction status
- `disbursePayment()` - Send money to vendor/rider
- `getOperator()` - Detect MTN/Orange from phone number
- `verifyWebhookSignature()` - Validate webhook callbacks

**How to use**:
```typescript
import { campayService } from '../../libs/shared-utils/payment/campay.service';

// Collect payment from user
const payment = await campayService.collectPayment(
  '+237670000001', // Phone number
  50000,          // Amount in XAF
  'Payment for order #123',
  'ord_123'       // Your reference
);

// Check status
const status = await campayService.getPaymentStatus(payment.reference);
if (status.status === 'SUCCESSFUL') {
  // Process order
}

// Payout to vendor/rider
await campayService.disbursePayment(
  '+237670000002',
  30000,
  'Payout for earnings',
  'pay_456'
);
```

**Why it's important**: 
- Only viable payment method in Cameroon
- Handles MTN and Orange Money
- Automatic operator detection

**⚠️ Important**:
- Always verify webhook signatures
- Handle pending statuses (user needs to approve on phone)
- Store transaction references for reconciliation
- Test with Campay sandbox first

---

# 📦 2. CORE-DB Library (`libs/core-db/`)

## Purpose
Provides database access layer with type-safe models and repositories for DynamoDB.

---

## 2.1 `client.ts`
**What it does**: DynamoDB client wrapper that simplifies database operations.

**Key Features**:
- Type-safe CRUD operations
- Query and scan with pagination
- Batch operations
- **ACID transactions** (TransactWriteItems)
- Automatic error handling

**How to use**:
```typescript
import { dynamoDB } from '../../libs/core-db/client';

// Simple get
const user = await dynamoDB.get<UserModel>({
  PK: 'USER#123',
  SK: 'PROFILE',
});

// Query with filter
const { items, lastKey } = await dynamoDB.query(
  'PK = :pk',
  { ':pk': 'VENDOR#ACTIVE' },
  { indexName: 'GSI1', limit: 20 }
);

// ACID transaction (all or nothing)
await dynamoDB.transactWrite([
  { operation: 'Put', item: newOrder },
  { operation: 'Update', key: walletKey, updateExpression: '...' },
]);
```

**Why it's important**: 
- Prevents direct DynamoDB API complexity
- Ensures consistent data access patterns
- ACID transactions protect financial integrity

**⚠️ Critical**: Always use transactions for financial operations

---

## 2.2 Models (`models/*.ts`)

### What they do
Define TypeScript interfaces for all database entities.

### Available Models:
1. **`user.model.ts`** - Customer data structure
2. **`vendor.model.ts`** - Restaurant/store data
3. **`rider.model.ts`** - Delivery driver data
4. **`order.model.ts`** - Order structure (Food/Mart/Package)
5. **`wallet.model.ts`** - Financial data (balances, transactions, payouts)
6. **`inventory.model.ts`** - Menu items
7. **`rating.model.ts`** - Reviews and ratings
8. **`config.model.ts`** - System configuration

**Why important**: 
- Type safety prevents bugs
- Auto-completion in IDE
- Self-documenting code
- Ensures consistent data structure

---

## 2.3 Repositories (`repositories/*.ts`)

### What they do
Data access layer that handles all database operations for specific entities.

---

### `base.repository.ts`
**Purpose**: Parent class with common CRUD operations.

**Methods**:
- `create()` - Insert new record
- `findByKey()` - Get by primary key
- `update()` - Modify existing record
- `delete()` - Remove record
- `queryWithPagination()` - Query with cursor-based pagination
- `exists()` - Check if record exists

**Why it's abstract**: All repositories inherit from this to avoid code duplication.

---

### `vendor.repository.ts`
**Purpose**: All database operations for vendors.

**Key Methods**:
- `createVendor()` - Register new vendor
- `findById()` - Get vendor by ID
- `findByEmail()` - Login lookup
- `updateStatus()` - Approve/reject/suspend
- `toggleOnlineStatus()` - Go online/offline
- `findByStatus()` - Get pending approvals
- `findNearby()` - Geospatial search
- `updateRating()` - Update after review
- `incrementOrderCount()` - Track statistics

**When to use**:
- Vendor registration/login
- Admin approval workflow
- Customer vendor search
- Analytics

---

### `user.repository.ts`
**Purpose**: All database operations for customers.

**Key Methods**:
- `createUser()` - User registration
- `findById()`, `findByEmail()` - Authentication
- `updateProfile()` - Profile management
- `addAddress()`, `updateAddress()`, `deleteAddress()` - Address book
- `verifyEmail()`, `verifyPhone()` - Verification
- `suspend()`, `reactivate()` - Account management
- `addDeviceToken()`, `removeDeviceToken()` - Push notifications

**When to use**:
- User registration/login
- Profile updates
- Address management
- Push notification setup

---

### `rider.repository.ts`
**Purpose**: All database operations for delivery riders.

**Key Methods**:
- `createRider()` - Rider registration
- `findById()`, `findByEmail()` - Authentication
- `updateStatus()` - Approval workflow
- `updateAvailability()` - Online/offline/busy status
- `updateLocation()` - Real-time GPS tracking
- `findAvailable()` - Get online riders for order assignment
- `incrementActiveDeliveries()`, `decrementActiveDeliveries()` - Track workload
- `updateCompletionRate()` - Performance metrics
- `updateRating()` - Review system

**When to use**:
- Rider registration/approval
- Order assignment algorithm
- Real-time tracking
- Performance monitoring

---

### `order.repository.ts`
**Purpose**: All database operations for orders (Food/Mart/Package).

**Key Methods**:
- `createOrder()` - Place new order
- `findById()` - Get order details
- `updateStatus()` - Track order lifecycle
- `assignRider()` - Assign delivery driver
- `findByUser()`, `findByVendor()`, `findByRider()` - Query orders
- `findActiveOrdersByRider()` - Rider's current deliveries
- `updatePricing()` - Set final amounts after completion
- `addRating()` - Customer reviews
- `updateCancellationReason()`, `updateRejectionReason()` - Track failures
- `setVerificationCode()` - Delivery confirmation
- `addPhotos()` - Proof of delivery

**When to use**:
- Order placement flow
- Status tracking
- Financial calculations
- Order history/reports

---

### `wallet.repository.ts`
**Purpose**: All financial operations (balances, transactions, payouts).

**Key Methods**:
- `getBalance()`, `createWallet()`, `getOrCreateWallet()` - Wallet management
- `addTransaction()` - Record financial events
- `getTransactions()` - Transaction history
- `getOrderTransactions()` - Audit trail for specific order
- `createPayoutRequest()` - Vendor/rider withdrawal
- `updatePayoutStatus()` - Admin approval/rejection
- `getPayoutRequests()` - Entity's payout history
- `getPendingPayouts()` - Admin approval queue

**When to use**:
- Order payment processing
- Wallet top-up
- Payout requests
- Financial reporting
- Audit trails

**⚠️ Critical**: This repository handles money - always use with WalletService for ACID transactions

---

# 📦 3. WALLET-ENGINE Library (`libs/wallet-engine/`)

## Purpose
Handles ALL financial calculations and ensures atomic money movements.

---

## 3.1 `commission.calculator.ts`
**What it does**: Calculates how money is split between admin, vendor, and rider.

**Key Methods**:
- `calculateSplit()` - Split order total into commissions
- `calculatePackagePricing()` - Distance-based pricing for packages
- `validateWithdrawal()` - Check minimum payout threshold

**How it works**:

**Food/Mart Orders**:
```
Total: 50,000 XAF
├── Vendor Share: 42,500 XAF (subtotal - commission)
├── Admin Cut: 7,500 XAF (15% commission)
└── Rider Fee: 2,000 XAF (delivery fee)
```

**Package Orders**:
```
Total: 10,000 XAF
├── Admin Cut: 2,000 XAF (20% platform fee)
└── Rider Fee: 8,000 XAF (80% to rider)
```

**Why it's separate**: Business rules change, this centralizes all calculations.

---

## 3.2 `wallet.service.ts`
**What it does**: Executes financial transactions with ACID guarantees.

**Key Methods**:
- `getBalance()` - Check wallet balance
- `processOrderCompletion()` - Distribute funds after delivery
- `deductFromUser()` - Charge customer
- `addFunds()` - Wallet top-up

**How `processOrderCompletion()` works** (CRITICAL):
```typescript
// This is an ATOMIC transaction - all succeed or all fail
await walletService.processOrderCompletion(order);

// What happens inside (in ONE database transaction):
// 1. Credit Admin wallet + create admin transaction
// 2. Credit Rider wallet + create rider transaction  
// 3. Credit Vendor wallet + create vendor transaction (if applicable)
// 4. Update order status to FUNDS_DISTRIBUTED
//
// If ANY step fails, EVERYTHING rolls back (no partial payments)
```

**Why it's important**: 
- Money never gets lost
- No partial payments
- Audit trail for every cent

**⚠️ Critical**: ALWAYS use this service for money operations, never update wallets directly

---

## 3.3 `payout.service.ts`
**What it does**: Handles vendor/rider withdrawal requests.

**Key Methods**:
- `createPayoutRequest()` - Request withdrawal
- `approvePayout()` - Admin approves (moves pending → withdrawn)
- `rejectPayout()` - Admin rejects (returns pending → available)

**Workflow**:
```
1. Vendor has 100,000 XAF available
2. Requests payout of 80,000 XAF
   → Available: 20,000 XAF, Pending: 80,000 XAF
3. Admin approves
   → Pending: 0 XAF (money sent to bank)
4. Or admin rejects
   → Available: 100,000 XAF (money returned)
```

**Why separate pending balance**: Prevents vendors from using money twice while payout is processing.

---

# 📦 4. NOTIFICATIONS Library (`libs/notifications/`)

## Purpose
Multi-channel notification system (Push, SMS, Email).

---

## 4.1 `push.service.ts`
**What it does**: Sends push notifications via AWS SNS.

**Methods**:
- `sendToDevice()` - Send to specific device
- `sendToTopic()` - Broadcast to all users of a type
- `sendOrderNotification()` - Predefined order notifications

**Supports**: iOS (APNS) and Android (FCM/GCM)

---

## 4.2 `sms.service.ts`
**What it does**: Sends SMS via Twilio.

**Methods**:
- `sendSMS()` - Generic SMS
- `sendOTP()` - Verification codes
- `sendOrderNotification()` - Order updates via SMS

**Use cases**: 
- 2FA/OTP
- Order updates for users without smartphone
- Critical alerts

---

## 4.3 `email.service.ts`
**What it does**: Sends emails via SendGrid or SMTP.

**Methods**:
- `sendEmail()` - Generic email
- `sendWelcomeEmail()` - Registration confirmation
- `sendOrderConfirmation()` - Order receipt
- `sendPayoutNotification()` - Payout status

**Use cases**:
- Receipts/invoices
- Account confirmations
- Marketing campaigns

---

# 📦 5. SOCKET-SERVER Library (`libs/socket-server/`)

## Purpose
Real-time WebSocket communication for live tracking and instant updates.

---

## 5.1 `socket.handler.ts`
**What it does**: Main Socket.io server with separate namespaces.

**Namespaces**:
- `/user` - Customer connections
- `/vendor` - Restaurant connections
- `/rider` - Driver connections

**Why separate namespaces**: Security - users can only access their namespace.

---

## 5.2 Event Handlers

### `handlers/user.handler.ts`
- Subscribe to order updates
- Receive real-time rider location
- Get notifications

### `handlers/vendor.handler.ts`
- Receive new orders
- Accept/reject orders
- Mark order ready

### `handlers/rider.handler.ts`
- Send location updates every 5 seconds
- Accept delivery requests
- Update delivery status
- Geolocation stored in Redis

---

## 5.3 Event Emitters

### `events/order.events.ts`
Broadcast order status changes to all relevant parties.

### `events/location.events.ts`
- Store rider location in Redis geospatial index
- Find nearby riders using GEORADIUS command
- Stream location to users tracking order

### `events/notification.events.ts`
Send real-time notifications without page refresh.

---

# 🔒 Files That Must Be Protected (NEVER COMMIT)

## Critical Files (Add to .gitignore):

1. **`.env`** - Contains ALL secrets
   - JWT_SECRET
   - Database credentials
   - API keys (Campay, Twilio, SendGrid, AWS)
   - Payment gateway credentials

2. **`node_modules/`** - Dependencies (regenerate with npm install)

3. **`dist/`** - Compiled code (regenerate with npm run build)

4. **`logs/`** - May contain sensitive data

5. **Any file with "secret", "key", "password" in name**

## Already Protected in .gitignore:
✅ All `.env*` files
✅ `node_modules/`
✅ `dist/` and `build/`
✅ `logs/`
✅ `*.key`, `*.pem`, `*.cert`

---

# 🎯 Summary: What Each Library Does

| Library | Purpose | Used By |
|---------|---------|---------|
| **shared-utils** | Common utilities, validation, errors | ALL services |
| **core-db** | Database access with type safety | ALL services |
| **wallet-engine** | Financial calculations + ACID transactions | Order processing, Payouts |
| **notifications** | Push, SMS, Email | Order updates, Alerts |
| **socket-server** | Real-time tracking and updates | Live features |

---

# 🚨 Critical Reminders

1. **Never update wallets directly** - Always use WalletService
2. **Always validate input** - Use Joi schemas
3. **Never log sensitive data** - Passwords, tokens, card numbers
4. **Use transactions for money** - ACID compliance is mandatory
5. **Protect .env files** - Add to .gitignore immediately
6. **Use relative imports** - No absolute paths
7. **Handle errors properly** - Use AppError for consistency
8. **Test financial flows** - Money bugs are critical

---

**You now have enterprise-grade libraries with:**
✅ Type safety
✅ Security best practices
✅ ACID financial transactions
✅ Comprehensive error handling
✅ Production-ready logging
✅ Real-time capabilities
✅ Payment integration
✅ Complete documentation