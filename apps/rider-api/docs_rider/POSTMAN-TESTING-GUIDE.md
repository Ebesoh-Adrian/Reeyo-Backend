# 🧪 Postman Testing Guide - Reeyo Rider API

## 📥 **Import the Collection**

1. Open Postman
2. Click **Import** button
3. Select `Reeyo-Rider-API.postman_collection.json`
4. Collection will be imported with all endpoints

---

## 🔧 **Setup Environment Variables**

### **Create a New Environment**

1. Click **Environments** in Postman
2. Click **+** to create new environment
3. Name it: `Reeyo Rider - Local`
4. Add these variables:

```
base_url: http://localhost:3003/api/v1
token: (leave empty - will be auto-filled)
rider_id: (leave empty - will be auto-filled)
order_id: (leave empty - manually set when testing)
payout_id: (leave empty - manually set when testing)
```

5. Click **Save**
6. Select this environment from dropdown

---

## 🚀 **Complete Testing Workflow**

### **Phase 1: Authentication & Setup**

#### **Step 1: Register a Rider**

```http
POST {{base_url}}/auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Rider",
  "phone": "+237670000001",
  "email": "john.rider@reeyo.cm",
  "password": "Rider123!@#",
  "vehicleType": "MOTORCYCLE",
  "vehicleDetails": {
    "plateNumber": "LT-1234-ABC",
    "brand": "Honda",
    "model": "CBR 150",
    "color": "Red"
  },
  "documents": {
    "idCardUrl": "https://s3.amazonaws.com/reeyo/documents/id-123.jpg",
    "drivingLicenseUrl": "https://s3.amazonaws.com/reeyo/documents/license-123.jpg",
    "vehicleRegistrationUrl": "https://s3.amazonaws.com/reeyo/documents/vehicle-123.jpg"
  },
  "bankDetails": {
    "accountName": "John Rider",
    "accountNumber": "1234567890",
    "bankName": "Afriland First Bank"
  },
  "emergencyContact": {
    "name": "Jane Rider",
    "phone": "+237670000002",
    "relationship": "Sister"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Rider registered successfully. Please verify your phone.",
  "data": {
    "rider": {
      "riderId": "rider_xxx",
      "firstName": "John",
      "lastName": "Rider",
      "phone": "+237670000001",
      "email": "john.rider@reeyo.cm",
      "verificationStatus": "PENDING",
      "approvalStatus": "PENDING",
      "status": "INACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

✅ **Auto-saved:** `token` and `rider_id` are automatically saved to environment

---

#### **Step 2: Verify Phone (Optional - Skip in Testing)**

In production, you'll receive SMS OTP. For testing, you can skip this or use a test OTP.

```http
POST {{base_url}}/auth/verify-phone
Authorization: Bearer {{token}}
```

**Request Body:**
```json
{
  "otp": "123456"
}
```

---

#### **Step 3: Login**

If you already registered, login to get a fresh token:

```http
POST {{base_url}}/auth/login
```

**Request Body:**
```json
{
  "phone": "+237670000001",
  "password": "Rider123!@#"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "rider": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

✅ **Token auto-saved to environment**

---

#### **Step 4: Get Profile**

Verify you're authenticated:

```http
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "riderId": "rider_xxx",
    "firstName": "John",
    "lastName": "Rider",
    "phone": "+237670000001",
    "email": "john.rider@reeyo.cm",
    "vehicleType": "MOTORCYCLE",
    "verificationStatus": "PENDING",
    "approvalStatus": "PENDING",
    "status": "INACTIVE",
    "isOnline": false,
    "rating": 0,
    "totalDeliveries": 0
  }
}
```

---

### **Phase 2: Availability Management**

#### **Step 5: Go Online**

Before accepting orders, rider must go online:

```http
PATCH {{base_url}}/availability/status
Authorization: Bearer {{token}}
```

**Request Body:**
```json
{
  "isOnline": true
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "You are now online",
  "data": {
    "riderId": "rider_xxx",
    "isOnline": true,
    "status": "online"
  }
}
```

---

#### **Step 6: Update Location**

Send GPS coordinates to track rider location:

```http
POST {{base_url}}/availability/location
Authorization: Bearer {{token}}
```

**Request Body:**
```json
{
  "latitude": 4.0511,
  "longitude": 9.7679
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Location updated"
}
```

💡 **Note:** In production, mobile app sends location every 30 seconds

---

#### **Step 7: Check Availability Status**

```http
GET {{base_url}}/availability/status
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "riderId": "rider_xxx",
    "isOnline": true,
    "status": "online",
    "currentLocation": {
      "latitude": 4.0511,
      "longitude": 9.7679,
      "timestamp": "2025-01-13T10:30:00.000Z"
    },
    "verificationStatus": "VERIFIED",
    "approvalStatus": "APPROVED",
    "accountStatus": "ACTIVE"
  }
}
```

---

### **Phase 3: Order Management**

#### **Step 8: View Available Orders**

```http
GET {{base_url}}/orders/available?latitude=4.0511&longitude=9.7679
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "order_123",
      "vendorName": "Fast Food Restaurant",
      "pickupLocation": {
        "address": "Bonanjo, Douala",
        "coordinates": {"lat": 4.0511, "lng": 9.7679}
      },
      "deliveryLocation": {
        "address": "Akwa, Douala",
        "coordinates": {"lat": 4.0600, "lng": 9.7800}
      },
      "deliveryFee": 1500,
      "distance": 3.2,
      "estimatedTime": 20,
      "status": "READY_FOR_PICKUP"
    }
  ]
}
```

📝 **Manually set order_id:** Copy an `orderId` and save it to environment variable

---

#### **Step 9: Accept Order**

```http
POST {{base_url}}/orders/{{order_id}}/accept
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "data": {
    "orderId": "order_123",
    "riderId": "rider_xxx",
    "riderName": "John Rider",
    "status": "RIDER_ASSIGNED",
    "riderAssignedAt": "2025-01-13T10:35:00.000Z"
  }
}
```

---

#### **Step 10: Arrive at Pickup**

When rider reaches vendor location:

```http
POST {{base_url}}/orders/{{order_id}}/arrive-pickup
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Arrival at pickup confirmed",
  "data": {
    "orderId": "order_123",
    "status": "RIDER_AT_PICKUP",
    "arrivedAtPickupAt": "2025-01-13T10:40:00.000Z"
  }
}
```

---

#### **Step 11: Confirm Pickup**

After collecting order from vendor:

```http
POST {{base_url}}/orders/{{order_id}}/confirm-pickup
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Pickup confirmed",
  "data": {
    "orderId": "order_123",
    "status": "IN_TRANSIT",
    "pickedUpAt": "2025-01-13T10:42:00.000Z"
  }
}
```

---

#### **Step 12: Arrive at Delivery**

When rider reaches customer location:

```http
POST {{base_url}}/orders/{{order_id}}/arrive-delivery
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Arrival at delivery confirmed",
  "data": {
    "orderId": "order_123",
    "status": "RIDER_AT_DELIVERY",
    "arrivedAtDeliveryAt": "2025-01-13T10:55:00.000Z"
  }
}
```

---

#### **Step 13: Complete Delivery**

Hand over order to customer (with optional verification code):

```http
POST {{base_url}}/orders/{{order_id}}/complete
Authorization: Bearer {{token}}
```

**Request Body:**
```json
{
  "verificationCode": "1234"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Delivery completed successfully",
  "data": {
    "orderId": "order_123",
    "status": "DELIVERED",
    "deliveredAt": "2025-01-13T10:57:00.000Z",
    "deliveryFee": 1500
  }
}
```

💰 **Wallet automatically credited with delivery fee**

---

#### **Step 14: View Active Orders**

```http
GET {{base_url}}/orders/active
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "order_124",
      "status": "IN_TRANSIT",
      "vendorName": "Pizza Palace",
      "deliveryFee": 2000
    }
  ]
}
```

---

#### **Step 15: View Order History**

```http
GET {{base_url}}/orders/history?page=1&limit=20
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOrders": 45,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### **Phase 4: Earnings & Analytics**

#### **Step 16: View Earnings Summary**

```http
GET {{base_url}}/earnings/summary
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "currentBalance": 15000,
    "totalEarnings": 125000,
    "weeklyEarnings": 15000,
    "monthlyEarnings": 45000,
    "totalDeliveries": 85
  }
}
```

---

#### **Step 17: View Transaction History**

```http
GET {{base_url}}/earnings/transactions?page=1&limit=20
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transactionId": "txn_xxx",
        "type": "CREDIT",
        "amount": 1500,
        "description": "Delivery fee for order #123",
        "timestamp": "2025-01-13T10:57:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

#### **Step 18: View Daily Earnings**

```http
GET {{base_url}}/earnings/daily?days=30
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-13",
      "earnings": 5500,
      "deliveries": 4
    },
    {
      "date": "2025-01-12",
      "earnings": 7200,
      "deliveries": 6
    }
  ]
}
```

---

#### **Step 19: View Weekly Earnings**

```http
GET {{base_url}}/earnings/weekly?weeks=12
Authorization: Bearer {{token}}
```

---

#### **Step 20: View Monthly Earnings**

```http
GET {{base_url}}/earnings/monthly?months=12
Authorization: Bearer {{token}}
```

---

### **Phase 5: Payouts**

#### **Step 21: Check Available Balance**

```http
GET {{base_url}}/payouts/balance
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "availableBalance": 15000,
    "minimumPayout": 5000,
    "canRequestPayout": true
  }
}
```

---

#### **Step 22: Request Payout**

```http
POST {{base_url}}/payouts/request
Authorization: Bearer {{token}}
```

**Request Body:**
```json
{
  "amount": 10000
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Payout requested successfully",
  "data": {
    "payoutId": "payout_xxx",
    "amount": 10000,
    "processingFee": 200,
    "netAmount": 9800,
    "status": "PENDING",
    "bankDetails": {
      "accountName": "John Rider",
      "accountNumber": "1234567890",
      "bankName": "Afriland First Bank"
    }
  }
}
```

---

#### **Step 23: View Payout History**

```http
GET {{base_url}}/payouts?page=1&limit=20
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "payouts": [...],
    "pagination": {...}
  }
}
```

---

## 🔍 **Error Testing**

### **Test Invalid Authentication**

```http
GET {{base_url}}/auth/me
Authorization: Bearer invalid_token
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Invalid token"
  }
}
```

---

### **Test Validation Errors**

```http
POST {{base_url}}/auth/register
```

**Body with missing fields:**
```json
{
  "firstName": "John"
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "lastName",
        "message": "Last name is required"
      },
      {
        "field": "phone",
        "message": "Phone number is required"
      }
    ]
  }
}
```

---

## 📊 **Performance Testing**

Use Postman's **Collection Runner** to run all requests sequentially:

1. Click on collection
2. Click **Run**
3. Select environment
4. Set iterations (e.g., 10)
5. Click **Run Reeyo Rider API**

Monitor response times and success rates.

---

## 🎯 **Testing Checklist**

- [ ] Register new rider
- [ ] Login successfully
- [ ] Verify authentication
- [ ] Toggle online/offline
- [ ] Update location
- [ ] View available orders
- [ ] Accept order
- [ ] Complete order lifecycle (7 stages)
- [ ] View earnings summary
- [ ] View transaction history
- [ ] Request payout
- [ ] Test error responses
- [ ] Test validation errors
- [ ] Test rate limiting (if implemented)

---

## 🚨 **Common Issues**

### **Issue: 401 Unauthorized**
- ✅ Verify token is in environment
- ✅ Check token hasn't expired (7 days default)
- ✅ Re-login to get fresh token

### **Issue: 403 Forbidden**
- ✅ Rider must be VERIFIED
- ✅ Rider must be APPROVED
- ✅ Rider status must be ACTIVE

### **Issue: 404 Not Found**
- ✅ Check order_id is correct
- ✅ Verify you own this order

### **Issue: 400 Bad Request**
- ✅ Check request body format
- ✅ Verify all required fields present
- ✅ Check data types (numbers, booleans)

---

## 📝 **Notes**

- All timestamps are in ISO 8601 format (UTC)
- Phone numbers must be in Cameroon format: `+237XXXXXXXXX`
- Amounts are in XAF (Central African Franc)
- Coordinates use decimal degrees format

**Happy Testing! 🚀**
