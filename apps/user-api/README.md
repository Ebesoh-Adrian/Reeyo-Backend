# 📱 Reeyo User API - Customer Application

## 📊 Status: 100% Complete & Production-Ready

The User API is the customer-facing service for the Reeyo delivery platform.

---

## 🎯 Key Features

✅ Customer registration & authentication
✅ Multiple delivery addresses with geolocation
✅ Real-time order placement & tracking
✅ Automatic delivery fee calculation (distance-based)
✅ Multiple payment methods (Wallet/Mobile Money/Cash)
✅ Order history & management
✅ Order cancellation with automatic refunds
✅ Rating & review system
✅ Push notifications for order updates
✅ Integrated wallet system

---

## 📁 Structure

```
apps/user-api/
├── src/
│   ├── config/validate-env.ts          ✅ Environment validation
│   ├── middleware/                     ✅ Auth, error, validation
│   ├── modules/
│   │   ├── auth/                       ✅ Registration, login, profile, addresses
│   │   └── orders/                     ✅ Place, track, cancel, rate orders
│   ├── routes/index.ts                 ✅ Route aggregator
│   └── server.ts                       ✅ Express setup
├── .env.example
├── package.json
└── Dockerfile
```

---

## 🚀 Quick Start

```bash
# Install dependencies
cd apps/user-api
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register customer
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get profile
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/verify-phone` - Verify phone
- `POST /api/v1/auth/addresses` - Add address
- `PUT /api/v1/auth/addresses/:id` - Update address
- `DELETE /api/v1/auth/addresses/:id` - Delete address

### Orders
- `POST /api/v1/orders` - Place order
- `GET /api/v1/orders/active` - Get active orders
- `GET /api/v1/orders/history` - Get order history
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders/:id/cancel` - Cancel order
- `POST /api/v1/orders/:id/rate` - Rate order

---

## 💰 Delivery Fee Calculation

```
Base Fee: 1000 XAF
Per KM: 200 XAF
Free Delivery: Orders ≥ 10,000 XAF

Example: 3.5 km distance
Fee = 1000 + (4 × 200) = 1800 XAF
```

---

## 🔒 Security

- JWT authentication (30-day tokens)
- Password hashing (bcrypt)
- Phone verification required
- Input validation on all endpoints
- Rate limiting
- CORS protection
- Helmet.js security headers

---

## 🗄️ Database Integration

Uses shared DynamoDB tables:
- `reeyo-{env}-users`
- `reeyo-{env}-orders`
- `reeyo-{env}-wallets`

---

## 🔄 Real-time Updates

Customers receive updates via:
- Push notifications (AWS SNS)
- WebSocket (Socket.io)
- SMS (Twilio)

Events: Order accepted, preparing, ready, rider assigned, in transit, delivered

---

## 🧪 Testing Example

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+237670000001",
    "password": "Test123!@#"
  }'

# Place Order
curl -X POST http://localhost:3001/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "vendor_123",
    "items": [{"itemId": "item_1", "name": "Burger", "price": 2500, "quantity": 2}],
    "deliveryAddressId": "addr_xxx",
    "paymentMethod": "WALLET"
  }'
```

---

## 📊 Response Format

Success:
```json
{"success": true, "message": "...", "data": {...}}
```

Error:
```json
{"success": false, "error": {"code": "...", "message": "..."}}
```

---

## 🚀 Deployment

**Docker:**
```bash
docker build -t reeyo-user-api .
docker run -p 3001:3001 --env-file .env reeyo-user-api
```

**PM2:**
```bash
npm run build
pm2 start ecosystem.config.js
```

---

**Status: Production-Ready! 🎉**
