# 🏪 Reeyo Vendor API

Complete backend API for restaurant/business management in the Reeyo delivery platform.

## 🚀 Features

### Authentication & Security
- ✅ JWT-based authentication
- ✅ Phone number verification (SMS OTP)
- ✅ Email verification
- ✅ Document verification for approval
- ✅ Password reset flow
- ✅ Account security (rate limiting, bcrypt)

### Menu Management
- ✅ Create/update/delete menu items
- ✅ Categories management
- ✅ Image uploads (AWS S3)
- ✅ Availability toggle
- ✅ Inventory tracking
- ✅ Bulk operations

### Order Management
- ✅ Real-time order notifications
- ✅ Accept/reject orders
- ✅ Order preparation tracking
- ✅ Order history with filters
- ✅ Order statistics
- ✅ WebSocket integration

### Business Operations
- ✅ Business hours management
- ✅ Online/offline toggle
- ✅ Location management
- ✅ Profile updates
- ✅ Document uploads

### Financial Management
- ✅ Earnings tracking (daily/weekly/monthly)
- ✅ Transaction history
- ✅ Payout requests
- ✅ Commission calculations
- ✅ Revenue analytics

### Analytics
- ✅ Performance metrics
- ✅ Popular items
- ✅ Order trends
- ✅ Customer insights
- ✅ Revenue reports

## 📦 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔗 API Endpoints

### Authentication
- POST   `/api/v1/auth/register` - Register vendor
- POST   `/api/v1/auth/login` - Login
- POST   `/api/v1/auth/verify-phone` - Verify phone
- POST   `/api/v1/auth/verify-email` - Verify email
- POST   `/api/v1/auth/forgot-password` - Reset password
- GET    `/api/v1/auth/me` - Get profile
- PUT    `/api/v1/auth/password` - Change password

### Menu Management
- GET    `/api/v1/menu` - Get all menu items
- POST   `/api/v1/menu` - Create menu item
- GET    `/api/v1/menu/:itemId` - Get item details
- PUT    `/api/v1/menu/:itemId` - Update item
- DELETE `/api/v1/menu/:itemId` - Delete item
- PATCH  `/api/v1/menu/:itemId/availability` - Toggle availability
- POST   `/api/v1/menu/bulk` - Bulk operations

### Inventory
- GET    `/api/v1/inventory` - Get inventory
- PUT    `/api/v1/inventory/:itemId` - Update stock
- POST   `/api/v1/inventory/bulk-update` - Bulk update

### Orders
- GET    `/api/v1/orders` - Get all orders
- GET    `/api/v1/orders/:orderId` - Get order details
- POST   `/api/v1/orders/:orderId/accept` - Accept order
- POST   `/api/v1/orders/:orderId/reject` - Reject order
- POST   `/api/v1/orders/:orderId/preparing` - Mark preparing
- POST   `/api/v1/orders/:orderId/ready` - Mark ready
- GET    `/api/v1/orders/stats` - Order statistics

### Earnings
- GET    `/api/v1/earnings` - Get earnings overview
- GET    `/api/v1/earnings/transactions` - Transaction history
- GET    `/api/v1/earnings/daily` - Daily earnings
- GET    `/api/v1/earnings/weekly` - Weekly earnings
- GET    `/api/v1/earnings/monthly` - Monthly earnings

### Payouts
- GET    `/api/v1/payouts` - Get all payouts
- POST   `/api/v1/payouts/request` - Request payout
- GET    `/api/v1/payouts/:payoutId` - Payout details

### Analytics
- GET    `/api/v1/analytics/overview` - Business overview
- GET    `/api/v1/analytics/popular-items` - Top selling items
- GET    `/api/v1/analytics/revenue` - Revenue trends
- GET    `/api/v1/analytics/customers` - Customer insights

### Profile
- GET    `/api/v1/profile` - Get business profile
- PUT    `/api/v1/profile` - Update profile
- PATCH  `/api/v1/profile/hours` - Update business hours
- PATCH  `/api/v1/profile/status` - Toggle online status
- POST   `/api/v1/profile/documents` - Upload documents

## 🗄️ Database Schema

### Vendors Table (DynamoDB)
```json
{
  "vendorId": "vendor_uuid",
  "businessName": "Great Restaurant",
  "ownerName": "John Doe",
  "phone": "+237670000001",
  "email": "vendor@example.com",
  "password": "hashed_password",
  "isPhoneVerified": true,
  "isEmailVerified": true,
  "approvalStatus": "PENDING|APPROVED|REJECTED",
  "approvalNotes": "...",
  "businessType": "RESTAURANT|GROCERY|PHARMACY",
  "cuisine": ["Italian", "Pizza"],
  "address": {
    "street": "123 Main St",
    "city": "Yaoundé",
    "region": "Centre",
    "country": "CM"
  },
  "location": {
    "latitude": 3.8480,
    "longitude": 11.5021
  },
  "businessHours": {
    "monday": { "open": "09:00", "close": "22:00" },
    "tuesday": { "open": "09:00", "close": "22:00" }
  },
  "isOnline": true,
  "documents": {
    "businessLicense": "s3://...",
    "taxId": "s3://...",
    "ownerIdCard": "s3://..."
  },
  "bankDetails": {
    "accountName": "Great Restaurant",
    "accountNumber": "1234567890",
    "bankName": "Afriland First Bank",
    "mobileMoneyNumber": "+237670000001"
  },
  "rating": 4.5,
  "totalOrders": 150,
  "totalEarnings": 1500000,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### Menu Items (Nested in Vendor)
```json
{
  "itemId": "item_uuid",
  "name": "Pizza Margherita",
  "description": "Classic Italian pizza",
  "category": "Pizza",
  "price": 5000,
  "images": ["s3://...", "s3://..."],
  "isAvailable": true,
  "preparationTime": 20,
  "inventory": {
    "tracked": true,
    "quantity": 50,
    "unit": "servings"
  },
  "tags": ["vegetarian", "popular"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

## 🔐 Security

- JWT tokens (30-day expiration)
- Bcrypt password hashing (12 rounds)
- Phone verification (SMS OTP)
- Rate limiting (100 requests/15 minutes)
- Input validation (express-validator)
- CORS protection
- Helmet.js security headers
- Document verification for approval

## 📊 Business Logic

### Commission Calculation
- Platform takes 15% commission on subtotal
- Commission = Subtotal × 0.15
- Vendor receives = Subtotal - Commission

### Payout Logic
- Minimum payout: 5,000 XAF
- Requested → Pending → Processing → Completed
- Automatic deduction from vendor wallet

### Order Flow
1. Customer places order
2. Vendor receives notification (WebSocket)
3. Vendor accepts/rejects order
4. If accepted: Mark as preparing
5. When ready: Mark as ready for pickup
6. Rider picks up
7. Order delivered
8. Payment settlement

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production (PM2)
```bash
npm run build
pm2 start ecosystem.config.js
```

### Docker
```bash
docker build -t reeyo-vendor-api .
docker run -p 3002:3002 reeyo-vendor-api
```

### AWS ECS
See deployment documentation in `/docs`

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Business Logic](docs/BUSINESS_LOGIC.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Support

- Email: vendor-support@reeyo.cm
- Phone: +237 XXX XXX XXX
- Documentation: https://docs.reeyo.cm/vendor
