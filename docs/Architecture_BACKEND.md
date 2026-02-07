# Reeyo: Production-Ready Multi-Service Logistics Platform Architecture

## Executive Summary

This document outlines a complete backend architecture for Reeyo, a multi-service logistics platform handling Food delivery, Mart (grocery), and Package courier services. The system is designed for scalability, cost-efficiency, and financial accuracy using AWS DynamoDB's Single-Table Design pattern.

---

## 1. System Architecture Overview

### 1.1 Core Principles

- **Monorepo Backend**: Single codebase with shared libraries, deployed as 4 independent services
- **Polyglot Services**: Each service (User, Vendor, Rider, Admin) has specialized endpoints
- **Financial Integrity**: ACID-compliant transactions using DynamoDB's TransactWriteItems
- **Dynamic Configuration**: Feature flags enable/disable services without deployment
- **Real-time Operations**: WebSocket connections for live tracking and notifications

### 1.2 Technology Stack

```
Backend Framework:    Node.js 20.x + Express.js 4.x
Database:             AWS DynamoDB (Single-Table Design)
Real-time:            Socket.io / AWS AppSync
Caching:              Redis (Geospatial for rider matching)
File Storage:         AWS S3
Authentication:       JWT + AWS Cognito
Message Queue:        AWS SQS + EventBridge
API Gateway:          AWS API Gateway
Deployment:           AWS Lambda + Docker (ECS Fargate for Socket.io)
Monitoring:           CloudWatch + X-Ray
```

---

## 2. Monorepo File Structure

```
reeyo-backend/
├── package.json                    # Root package with workspaces
├── docker-compose.yml              # Local development environment
├── .env.example
├── serverless.yml                  # AWS Lambda deployment config
│
├── apps/
│   ├── user-api/                   # Service 1: Customer-facing API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.routes.ts
│   │   │   │   ├── orders/
│   │   │   │   │   ├── orders.controller.ts
│   │   │   │   │   ├── orders.service.ts
│   │   │   │   │   └── orders.routes.ts
│   │   │   │   ├── wallet/
│   │   │   │   │   ├── wallet.controller.ts
│   │   │   │   │   ├── wallet.service.ts
│   │   │   │   │   └── wallet.routes.ts
│   │   │   │   └── ratings/
│   │   │   │       └── ratings.routes.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── routes/
│   │   │   │   └── index.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── vendor-api/                 # Service 2: Vendor management
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.routes.ts
│   │   │   │   ├── inventory/
│   │   │   │   │   ├── inventory.controller.ts
│   │   │   │   │   ├── inventory.service.ts
│   │   │   │   │   └── inventory.routes.ts
│   │   │   │   ├── orders/
│   │   │   │   │   └── vendor-orders.service.ts
│   │   │   │   ├── earnings/
│   │   │   │   │   ├── earnings.controller.ts
│   │   │   │   │   └── earnings.service.ts
│   │   │   │   └── payouts/
│   │   │   │       ├── payout.controller.ts
│   │   │   │       └── payout.service.ts
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   ├── rider-api/                  # Service 3: Rider operations
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.routes.ts
│   │   │   │   ├── delivery/
│   │   │   │   │   ├── delivery.controller.ts
│   │   │   │   │   ├── delivery.service.ts
│   │   │   │   │   └── delivery.routes.ts
│   │   │   │   ├── location/
│   │   │   │   │   ├── location.controller.ts
│   │   │   │   │   └── location.service.ts
│   │   │   │   ├── earnings/
│   │   │   │   │   ├── earnings.controller.ts
│   │   │   │   │   └── earnings.service.ts
│   │   │   │   └── availability/
│   │   │   │       ├── availability.controller.ts
│   │   │   │       └── availability.service.ts
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   └── admin-api/                  # Service 4: Administrative controls
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.routes.ts
│       │   │   ├── users/
│       │   │   │   └── user-management.service.ts
│       │   │   ├── vendors/
│       │   │   │   └── vendor-management.service.ts
│       │   │   ├── riders/
│       │   │   │   └── rider-management.service.ts
│       │   │   ├── config/
│       │   │   │   ├── feature-flags.controller.ts
│       │   │   │   ├── commission.controller.ts
│       │   │   │   └── config.service.ts
│       │   │   ├── payouts/
│       │   │   │   ├── payout-approval.controller.ts
│       │   │   │   └── payout-approval.service.ts
│       │   │   └── analytics/
│       │   │       └── analytics.service.ts
│       │   └── server.ts
│       └── package.json
│
├── libs/                           # Shared libraries
│   ├── core-db/                    # DynamoDB client & schemas
│   │   ├── client.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── vendor.model.ts
│   │   │   ├── rider.model.ts
│   │   │   ├── order.model.ts
│   │   │   ├── wallet.model.ts
│   │   │   └── transaction.model.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   ├── order.repository.ts
│   │   │   └── wallet.repository.ts
│   │   └── package.json
│   │
│   ├── wallet-engine/              # Financial transaction logic
│   │   ├── wallet.service.ts
│   │   ├── commission.calculator.ts
│   │   ├── payout.service.ts
│   │   └── package.json
│   │
│   ├── notifications/              # Multi-channel notifications
│   │   ├── push.service.ts
│   │   ├── sms.service.ts
│   │   ├── email.service.ts
│   │   └── package.json
│   │
│   ├── socket-server/              # Real-time WebSocket server
│   │   ├── socket.handler.ts
│   │   ├── events/
│   │   │   ├── order.events.ts
│   │   │   ├── location.events.ts
│   │   │   └── notification.events.ts
│   │   └── package.json
│   │
│   └── shared-utils/               # Common utilities
│       ├── logger.ts
│       ├── errors/
│       │   ├── app-error.ts
│       │   └── error-codes.ts
│       ├── validators/
│       │   └── schemas.ts
│       ├── constants/
│       │   └── index.ts
│       └── package.json
│
└── infrastructure/
    ├── terraform/                  # IaC for AWS resources
    │   ├── dynamodb.tf
    │   ├── lambda.tf
    │   ├── api-gateway.tf
    │   └── s3.tf
    └── scripts/
        ├── seed-data.ts
        └── migrate.ts
```

---

## 3. DynamoDB Single-Table Design

### 3.1 Table Schema

**Table Name**: `ReeYo-Production`

**Indexes**:
- Primary: `PK` (Partition Key), `SK` (Sort Key)
- GSI1: `GSI1PK`, `GSI1SK` (for queries by status, type, etc.)
- GSI2: `GSI2PK`, `GSI2SK` (for date-based queries)

### 3.2 Access Patterns & Key Design

```javascript
// Users
PK: "USER#<userId>"
SK: "PROFILE"
GSI1PK: "USER#<email>"
GSI1SK: "PROFILE"

// Vendors
PK: "VENDOR#<vendorId>"
SK: "PROFILE"
GSI1PK: "VENDOR#<status>#ACTIVE"
GSI1SK: "VENDOR#<createdAt>"

// Riders
PK: "RIDER#<riderId>"
SK: "PROFILE"
GSI1PK: "RIDER#<status>#AVAILABLE"
GSI1SK: "LOCATION#<geohash>"

// Orders (Polymorphic: FOOD | MART | PACKAGE)
PK: "ORDER#<orderId>"
SK: "METADATA"
GSI1PK: "USER#<userId>#ORDERS"
GSI1SK: "ORDER#<createdAt>"
GSI2PK: "VENDOR#<vendorId>#ORDERS" (for FOOD/MART)
GSI2SK: "ORDER#<status>#<createdAt>"

// Order for Package (sender-based)
PK: "ORDER#<orderId>"
SK: "METADATA"
GSI1PK: "SENDER#<senderId>#PACKAGES"
GSI1SK: "ORDER#<createdAt>"

// Wallet Balances
PK: "WALLET#<entityType>#<entityId>"  // entityType: USER | VENDOR | RIDER | ADMIN
SK: "BALANCE"

// Transactions (Immutable Ledger)
PK: "WALLET#<entityType>#<entityId>"
SK: "TXN#<timestamp>#<txnId>"
GSI1PK: "ORDER#<orderId>#TRANSACTIONS"
GSI1SK: "TXN#<timestamp>"

// Payout Requests
PK: "PAYOUT#<payoutId>"
SK: "REQUEST"
GSI1PK: "ENTITY#<entityType>#<entityId>#PAYOUTS"
GSI1SK: "PAYOUT#<status>#<requestedAt>"

// System Configuration (Feature Flags)
PK: "CONFIG#GLOBAL"
SK: "SERVICES"

// Inventory (for Vendors)
PK: "VENDOR#<vendorId>"
SK: "ITEM#<itemId>"
GSI1PK: "VENDOR#<vendorId>#CATEGORY#<category>"
GSI1SK: "ITEM#<name>"
```

### 3.3 Sample DynamoDB Items

```javascript
// User Profile
{
  "PK": "USER#usr_abc123",
  "SK": "PROFILE",
  "GSI1PK": "USER#john@example.com",
  "GSI1SK": "PROFILE",
  "entityType": "USER",
  "userId": "usr_abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+237670000000",
  "addresses": [
    {
      "id": "addr_1",
      "label": "Home",
      "coordinates": { "lat": 4.0511, "lng": 9.7679 },
      "fullAddress": "Bonanjo, Douala, Cameroon"
    }
  ],
  "createdAt": "2025-01-06T10:00:00Z",
  "status": "ACTIVE"
}

// Vendor Profile
{
  "PK": "VENDOR#vnd_xyz789",
  "SK": "PROFILE",
  "GSI1PK": "VENDOR#ACTIVE",
  "GSI1SK": "VENDOR#2025-01-01T00:00:00Z",
  "entityType": "VENDOR",
  "vendorId": "vnd_xyz789",
  "businessName": "Douala Fresh Mart",
  "serviceType": "MART",
  "location": {
    "coordinates": { "lat": 4.0483, "lng": 9.7053 },
    "address": "Akwa, Douala"
  },
  "commissionRate": 10,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}

// Food Order
{
  "PK": "ORDER#ord_food_001",
  "SK": "METADATA",
  "GSI1PK": "USER#usr_abc123#ORDERS",
  "GSI1SK": "ORDER#2025-01-06T11:30:00Z",
  "GSI2PK": "VENDOR#vnd_rst456#ORDERS",
  "GSI2SK": "ORDER#PENDING#2025-01-06T11:30:00Z",
  "orderId": "ord_food_001",
  "orderType": "FOOD",
  "userId": "usr_abc123",
  "vendorId": "vnd_rst456",
  "riderId": null,
  "status": "PENDING",
  "items": [
    {
      "itemId": "itm_burger",
      "name": "Cheeseburger",
      "quantity": 2,
      "price": 5000
    }
  ],
  "pricing": {
    "subtotal": 10000,
    "deliveryFee": 1500,
    "total": 11500
  },
  "locations": {
    "pickup": { "lat": 4.0483, "lng": 9.7053 },
    "dropoff": { "lat": 4.0511, "lng": 9.7679 }
  },
  "createdAt": "2025-01-06T11:30:00Z",
  "updatedAt": "2025-01-06T11:30:00Z"
}

// Package Order
{
  "PK": "ORDER#ord_pkg_002",
  "SK": "METADATA",
  "GSI1PK": "SENDER#usr_abc123#PACKAGES",
  "GSI1SK": "ORDER#2025-01-06T14:00:00Z",
  "orderId": "ord_pkg_002",
  "orderType": "PACKAGE",
  "senderId": "usr_abc123",
  "recipientId": "usr_def456",
  "riderId": "rdr_ghi789",
  "status": "IN_TRANSIT",
  "packageDetails": {
    "category": "DOCUMENT",
    "weight": 0.5,
    "description": "Legal documents",
    "isFragile": false
  },
  "pricing": {
    "baseFee": 2000,
    "distanceFee": 1000,
    "total": 3000
  },
  "locations": {
    "pickup": { "lat": 4.0511, "lng": 9.7679 },
    "dropoff": { "lat": 4.0600, "lng": 9.7100 }
  },
  "createdAt": "2025-01-06T14:00:00Z"
}

// Wallet Balance
{
  "PK": "WALLET#VENDOR#vnd_xyz789",
  "SK": "BALANCE",
  "entityType": "VENDOR",
  "entityId": "vnd_xyz789",
  "availableBalance": 150000,
  "pendingBalance": 25000,
  "totalEarned": 500000,
  "updatedAt": "2025-01-06T15:00:00Z"
}

// Transaction Record
{
  "PK": "WALLET#VENDOR#vnd_xyz789",
  "SK": "TXN#2025-01-06T15:30:00Z#txn_abc123",
  "GSI1PK": "ORDER#ord_food_001#TRANSACTIONS",
  "GSI1SK": "TXN#2025-01-06T15:30:00Z",
  "transactionId": "txn_abc123",
  "type": "CREDIT",
  "category": "ORDER_PAYMENT",
  "amount": 9200,
  "orderId": "ord_food_001",
  "description": "Payment for Order #ord_food_001 (after 20% commission)",
  "balanceBefore": 140800,
  "balanceAfter": 150000,
  "createdAt": "2025-01-06T15:30:00Z"
}

// Payout Request
{
  "PK": "PAYOUT#pay_req_001",
  "SK": "REQUEST",
  "GSI1PK": "ENTITY#VENDOR#vnd_xyz789#PAYOUTS",
  "GSI1SK": "PAYOUT#PENDING#2025-01-06T16:00:00Z",
  "payoutId": "pay_req_001",
  "entityType": "VENDOR",
  "entityId": "vnd_xyz789",
  "amount": 100000,
  "status": "PENDING",
  "bankDetails": {
    "accountName": "Douala Fresh Mart",
    "accountNumber": "1234567890",
    "bankName": "Afriland First Bank"
  },
  "requestedAt": "2025-01-06T16:00:00Z",
  "processedAt": null,
  "processedBy": null
}

// Feature Flags
{
  "PK": "CONFIG#GLOBAL",
  "SK": "SERVICES",
  "services": {
    "food": {
      "enabled": true,
      "commissionRate": 15,
      "minOrderAmount": 2000
    },
    "mart": {
      "enabled": true,
      "commissionRate": 10,
      "minOrderAmount": 5000
    },
    "packages": {
      "enabled": false,
      "baseFee": 2000,
      "feePerKm": 500
    }
  },
  "updatedAt": "2025-01-06T09:00:00Z",
  "updatedBy": "admin_001"
}
```

---

## 4. Wallet & Commission Engine

### 4.1 Financial Architecture

The Reeyo platform uses a **Technical Transit Wallet** (Escrow) system to ensure secure, atomic financial transactions.

**Key Principles**:
- All payments are held in escrow until order completion
- ACID compliance using DynamoDB `TransactWriteItems`
- Immutable transaction ledger for audit trails
- Separate balances: Available vs Pending

### 4.2 Transaction Flow

```
User Payment ($100)
        ↓
[Transit Wallet] (Escrow)
        ↓
   Order Completed
        ↓
    [Split Logic]
        ↓
    ┌───────┴───────┬──────────┐
    ↓               ↓          ↓
Admin Cut      Vendor      Rider Fee
($15)          ($80)       ($5)
```

### 4.3 Commission Calculator### 4.4 Wallet Service with ACID Transactions---
// libs/wallet-engine/commission.calculator.js

/**
 * Commission Calculator for Reeyo Platform
 * Handles financial splits for Food, Mart, and Package orders
 */

class CommissionCalculator {
  constructor(config) {
    // Default commission rates (can be overridden by feature flags)
    this.config = config || {
      food: { commissionRate: 15, deliveryFee: 1500 },
      mart: { commissionRate: 10, deliveryFee: 2000 },
      packages: { baseFee: 2000, feePerKm: 500 }
    };
  }

  /**
   * Calculate financial split for completed orders
   * @param {Object} order - Order object with type, pricing, and distance
   * @returns {Object} Split breakdown
   */
  calculateSplit(order) {
    const { orderType, pricing, distance } = order;

    switch (orderType) {
      case 'FOOD':
      case 'MART':
        return this._calculateRestaurantMartSplit(orderType, pricing);
      case 'PACKAGE':
        return this._calculatePackageSplit(pricing, distance);
      default:
        throw new Error(`Unsupported order type: ${orderType}`);
    }
  }

  /**
   * Calculate split for Food/Mart orders
   * Formula: 
   * - Admin Cut = subtotal × commission rate
   * - Rider Fee = fixed delivery fee
   * - Vendor Share = subtotal - admin cut
   */
  _calculateRestaurantMartSplit(orderType, pricing) {
    const { subtotal, deliveryFee, total } = pricing;
    const serviceType = orderType.toLowerCase();
    const commissionRate = this.config[serviceType].commissionRate;

    // Calculate commission on subtotal (not including delivery)
    const adminCut = Math.round((subtotal * commissionRate) / 100);
    const vendorShare = subtotal - adminCut;
    const riderFee = deliveryFee;

    // Validation: Ensure splits add up correctly
    const calculatedTotal = vendorShare + adminCut + riderFee;
    if (calculatedTotal !== total) {
      throw new Error('Split calculation mismatch');
    }

    return {
      total,
      adminCut,
      vendorShare,
      riderFee,
      breakdown: {
        subtotal,
        commissionRate: `${commissionRate}%`,
        deliveryFee
      }
    };
  }

  /**
   * Calculate split for Package orders
   * Formula:
   * - Admin Cut = 20% of total
   * - Rider Fee = 80% of total
   * - No vendor involved
   */
  _calculatePackageSplit(pricing, distance) {
    const { total } = pricing;
    
    // For packages: Platform takes 20%, Rider gets 80%
    const adminCut = Math.round(total * 0.20);
    const riderFee = total - adminCut;

    return {
      total,
      adminCut,
      vendorShare: 0, // No vendor for packages
      riderFee,
      breakdown: {
        distance: `${distance} km`,
        platformFee: '20%',
        riderShare: '80%'
      }
    };
  }

  /**
   * Calculate distance-based pricing for packages
   * @param {number} distanceKm - Distance in kilometers
   * @returns {Object} Pricing breakdown
   */
  calculatePackagePricing(distanceKm, packageDetails) {
    const { baseFee, feePerKm } = this.config.packages;
    const distanceFee = Math.round(distanceKm * feePerKm);
    
    // Add surcharge for fragile items
    const fragileSurcharge = packageDetails.isFragile ? 1000 : 0;
    
    const total = baseFee + distanceFee + fragileSurcharge;

    return {
      baseFee,
      distanceFee,
      fragileSurcharge,
      total,
      distance: distanceKm
    };
  }

  /**
   * Validate minimum payout threshold
   * @param {number} amount - Withdrawal amount
   * @param {string} entityType - VENDOR or RIDER
   * @returns {Object} Validation result
   */
  validateWithdrawal(amount, entityType) {
    const minThresholds = {
      VENDOR: 50000,  // 50,000 XAF minimum
      RIDER: 20000    // 20,000 XAF minimum
    };

    const minThreshold = minThresholds[entityType] || 50000;
    const isValid = amount >= minThreshold;

    return {
      isValid,
      minThreshold,
      message: isValid 
        ? 'Withdrawal amount is valid' 
        : `Minimum withdrawal is ${minThreshold} XAF`
    };
  }
}

module.exports = CommissionCalculator;

// Example usage:
/*
const calculator = new CommissionCalculator();

// Food order split
const foodOrder = {
  orderType: 'FOOD',
  pricing: { subtotal: 10000, deliveryFee: 1500, total: 11500 }
};
const split = calculator.calculateSplit(foodOrder);
console.log(split);
// Output:
// {
//   total: 11500,
//   adminCut: 1500,      // 15% of 10,000
//   vendorShare: 8500,   // 10,000 - 1,500
//   riderFee: 1500
// }

// Package pricing
const pricing = calculator.calculatePackagePricing(5.2, { isFragile: true });
console.log(pricing);
// Output:
// {
//   baseFee: 2000,
//   distanceFee: 2600,   // 5.2 km × 500
//   fragileSurcharge: 1000,
//   total: 5600
// }
*/


## 4.4 // libs/wallet-engine/wallet.service.js

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const CommissionCalculator = require('./commission.calculator');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ReeYo-Production';

class WalletService {
  constructor() {
    this.calculator = new CommissionCalculator();
  }

  /**
   * Process order completion and distribute funds atomically
   * This is the CRITICAL financial operation - uses TransactWriteItems for ACID compliance
   * 
   * @param {Object} order - Completed order object
   * @returns {Object} Transaction results
   */
  async processOrderCompletion(order) {
    const { orderId, orderType, userId, vendorId, riderId, pricing } = order;
    const timestamp = new Date().toISOString();

    // Calculate financial split
    const split = this.calculator.calculateSplit(order);
    const { adminCut, vendorShare, riderFee } = split;

    // Generate unique transaction IDs
    const adminTxnId = `txn_${uuidv4()}`;
    const vendorTxnId = vendorId ? `txn_${uuidv4()}` : null;
    const riderTxnId = `txn_${uuidv4()}`;

    try {
      // Fetch current balances (for audit trail)
      const [adminBalance, vendorBalance, riderBalance] = await Promise.all([
        this._getBalance('ADMIN', 'platform'),
        vendorId ? this._getBalance('VENDOR', vendorId) : Promise.resolve({ availableBalance: 0 }),
        this._getBalance('RIDER', riderId)
      ]);

      // Build atomic transaction items
      const transactItems = [
        // 1. Credit Admin wallet
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { PK: 'WALLET#ADMIN#platform', SK: 'BALANCE' },
            UpdateExpression: 'ADD availableBalance :adminCut, totalEarned :adminCut SET updatedAt = :timestamp',
            ExpressionAttributeValues: {
              ':adminCut': adminCut,
              ':timestamp': timestamp
            }
          }
        },
        // 2. Add Admin transaction record
        {
          Put: {
            TableName: TABLE_NAME,
            Item: {
              PK: 'WALLET#ADMIN#platform',
              SK: `TXN#${timestamp}#${adminTxnId}`,
              GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
              GSI1SK: `TXN#${timestamp}`,
              transactionId: adminTxnId,
              type: 'CREDIT',
              category: 'ORDER_COMMISSION',
              amount: adminCut,
              orderId,
              orderType,
              description: `Commission from Order #${orderId}`,
              balanceBefore: adminBalance.availableBalance,
              balanceAfter: adminBalance.availableBalance + adminCut,
              createdAt: timestamp
            }
          }
        },
        // 3. Credit Rider wallet
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { PK: `WALLET#RIDER#${riderId}`, SK: 'BALANCE' },
            UpdateExpression: 'ADD availableBalance :riderFee, totalEarned :riderFee SET updatedAt = :timestamp',
            ExpressionAttributeValues: {
              ':riderFee': riderFee,
              ':timestamp': timestamp
            }
          }
        },
        // 4. Add Rider transaction record
        {
          Put: {
            TableName: TABLE_NAME,
            Item: {
              PK: `WALLET#RIDER#${riderId}`,
              SK: `TXN#${timestamp}#${riderTxnId}`,
              GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
              GSI1SK: `TXN#${timestamp}`,
              transactionId: riderTxnId,
              type: 'CREDIT',
              category: 'DELIVERY_FEE',
              amount: riderFee,
              orderId,
              orderType,
              description: `Delivery fee for Order #${orderId}`,
              balanceBefore: riderBalance.availableBalance,
              balanceAfter: riderBalance.availableBalance + riderFee,
              createdAt: timestamp
            }
          }
        }
      ];

      // Add vendor transactions only if vendor exists (not for PACKAGE orders)
      if (vendorId && vendorShare > 0) {
        transactItems.push(
          // 5. Credit Vendor wallet
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `WALLET#VENDOR#${vendorId}`, SK: 'BALANCE' },
              UpdateExpression: 'ADD availableBalance :vendorShare, totalEarned :vendorShare SET updatedAt = :timestamp',
              ExpressionAttributeValues: {
                ':vendorShare': vendorShare,
                ':timestamp': timestamp
              }
            }
          },
          // 6. Add Vendor transaction record
          {
            Put: {
              TableName: TABLE_NAME,
              Item: {
                PK: `WALLET#VENDOR#${vendorId}`,
                SK: `TXN#${timestamp}#${vendorTxnId}`,
                GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
                GSI1SK: `TXN#${timestamp}`,
                transactionId: vendorTxnId,
                type: 'CREDIT',
                category: 'ORDER_PAYMENT',
                amount: vendorShare,
                orderId,
                orderType,
                description: `Payment for Order #${orderId} (after commission)`,
                balanceBefore: vendorBalance.availableBalance,
                balanceAfter: vendorBalance.availableBalance + vendorShare,
                createdAt: timestamp
              }
            }
          }
        );
      }

      // 7. Update order status to FUNDS_DISTRIBUTED
      transactItems.push({
        Update: {
          TableName: TABLE_NAME,
          Key: { PK: `ORDER#${orderId}`, SK: 'METADATA' },
          UpdateExpression: 'SET #status = :status, fundsDistributedAt = :timestamp, updatedAt = :timestamp',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'FUNDS_DISTRIBUTED',
            ':timestamp': timestamp
          }
        }
      });

      // Execute ALL operations atomically - either all succeed or all fail
      await docClient.send(new TransactWriteCommand({
        TransactItems: transactItems
      }));

      return {
        success: true,
        orderId,
        transactions: {
          admin: { txnId: adminTxnId, amount: adminCut },
          vendor: vendorTxnId ? { txnId: vendorTxnId, amount: vendorShare } : null,
          rider: { txnId: riderTxnId, amount: riderFee }
        },
        split
      };

    } catch (error) {
      console.error('Transaction failed:', error);
      
      // Check for specific DynamoDB errors
      if (error.name === 'TransactionCanceledException') {
        throw new Error('Transaction conflict - order may have been processed already');
      }
      
      throw new Error(`Failed to process order completion: ${error.message}`);
    }
  }

  /**
   * Get current wallet balance
   * @param {string} entityType - ADMIN | VENDOR | RIDER | USER
   * @param {string} entityId - Entity identifier
   * @returns {Object} Balance information
   */
  async _getBalance(entityType, entityId) {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `WALLET#${entityType}#${entityId}`,
        SK: 'BALANCE'
      }
    }));

    return result.Item || { availableBalance: 0, pendingBalance: 0, totalEarned: 0 };
  }

  /**
   * Get wallet balance (public method)
   */
  async getBalance(entityType, entityId) {
    return this._getBalance(entityType, entityId);
  }

  /**
   * Create payout request
   * @param {Object} payoutData - Payout request details
   * @returns {Object} Created payout request
   */
  async createPayoutRequest(payoutData) {
    const { entityType, entityId, amount, bankDetails } = payoutData;
    const timestamp = new Date().toISOString();
    const payoutId = `pay_${uuidv4()}`;

    // Get current balance
    const balance = await this._getBalance(entityType, entityId);

    // Validate withdrawal amount
    const validation = this.calculator.validateWithdrawal(amount, entityType);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // Check sufficient balance
    if (balance.availableBalance < amount) {
      throw new Error(`Insufficient balance. Available: ${balance.availableBalance}, Requested: ${amount}`);
    }

    try {
      // Atomically: Create payout request + Move funds to pending
      await docClient.send(new TransactWriteCommand({
        TransactItems: [
          // 1. Create payout request
          {
            Put: {
              TableName: TABLE_NAME,
              Item: {
                PK: `PAYOUT#${payoutId}`,
                SK: 'REQUEST',
                GSI1PK: `ENTITY#${entityType}#${entityId}#PAYOUTS`,
                GSI1SK: `PAYOUT#PENDING#${timestamp}`,
                payoutId,
                entityType,
                entityId,
                amount,
                status: 'PENDING',
                bankDetails,
                requestedAt: timestamp,
                processedAt: null,
                processedBy: null
              }
            }
          },
          // 2. Move funds from available to pending
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `WALLET#${entityType}#${entityId}`, SK: 'BALANCE' },
              UpdateExpression: 'ADD availableBalance :negative, pendingBalance :positive SET updatedAt = :timestamp',
              ExpressionAttributeValues: {
                ':negative': -amount,
                ':positive': amount,
                ':timestamp': timestamp
              },
              ConditionExpression: 'availableBalance >= :amount'
            }
          }
        ]
      }));

      return { payoutId, status: 'PENDING', amount, requestedAt: timestamp };

    } catch (error) {
      if (error.name === 'TransactionCanceledException') {
        throw new Error('Insufficient balance for withdrawal');
      }
      throw error;
    }
  }

  /**
   * Approve payout request (Admin only)
   * @param {string} payoutId - Payout request ID
   * @param {string} adminId - Admin who approved
   * @returns {Object} Updated payout status
   */
  async approvePayoutRequest(payoutId, adminId) {
    const timestamp = new Date().toISOString();

    // Get payout details
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PAYOUT#${payoutId}`, SK: 'REQUEST' }
    }));

    const payout = result.Item;
    if (!payout) throw new Error('Payout request not found');
    if (payout.status !== 'PENDING') throw new Error('Payout already processed');

    const { entityType, entityId, amount } = payout;

    try {
      // Atomically: Update payout status + Deduct from pending balance
      await docClient.send(new TransactWriteCommand({
        TransactItems: [
          // 1. Update payout status
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `PAYOUT#${payoutId}`, SK: 'REQUEST' },
              UpdateExpression: 'SET #status = :approved, processedAt = :timestamp, processedBy = :adminId',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':approved': 'APPROVED',
                ':timestamp': timestamp,
                ':adminId': adminId
              }
            }
          },
          // 2. Deduct from pending balance
          {
            Update: {
              TableName: TABLE_NAME,
              Key: { PK: `WALLET#${entityType}#${entityId}`, SK: 'BALANCE' },
              UpdateExpression: 'ADD pendingBalance :negative SET updatedAt = :timestamp',
              ExpressionAttributeValues: {
                ':negative': -amount,
                ':timestamp': timestamp
              }
            }
          }
        ]
      }));

      return { payoutId, status: 'APPROVED', processedAt: timestamp };

    } catch (error) {
      console.error('Payout approval failed:', error);
      throw new Error(`Failed to approve payout: ${error.message}`);
    }
  }

  /**
   * Get transaction history
   * @param {string} entityType - Wallet owner type
   * @param {string} entityId - Wallet owner ID
   * @param {Object} options - Query options (limit, lastKey)
   * @returns {Object} Transaction list
   */
  async getTransactionHistory(entityType, entityId, options = {}) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `WALLET#${entityType}#${entityId}`,
        ':sk': 'TXN#'
      },
      ScanIndexForward: false, // Most recent first
      Limit: options.limit || 50
    };

    if (options.lastKey) {
      params.ExclusiveStartKey = options.lastKey;
    }

    const result = await docClient.send(new QueryCommand(params));

    return {
      transactions: result.Items || [],
      lastKey: result.LastEvaluatedKey
    };
  }
}

module.exports = WalletService;

// Example usage:
/*
const walletService = new WalletService();

// Process completed order
const order = {
  orderId: 'ord_food_001',
  orderType: 'FOOD',
  userId: 'usr_abc123',
  vendorId: 'vnd_rst456',
  riderId: 'rdr_xyz789',
  pricing: { subtotal: 10000, deliveryFee: 1500, total: 11500 },
  distance: 3.5
};

const result = await walletService.processOrderCompletion(order);
console.log('Funds distributed:', result);

// Create payout request
const payout = await walletService.createPayoutRequest({
  entityType: 'VENDOR',
  entityId: 'vnd_rst456',
  amount: 100000,
  bankDetails: {
    accountName: 'Restaurant ABC',
    accountNumber: '1234567890',
    bankName: 'Bank XYZ'
  }
});
*/

## 5. Service Toggling with Feature Flags

### 5.1 Feature Flag Implementation### 5.2 Frontend Integration Example---
// apps/admin-api/src/modules/config/config.service.js

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const NodeCache = require('node-cache');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ReeYo-Production';

// In-memory cache (TTL: 5 minutes)
const configCache = new NodeCache({ stdTTL: 300 });

class ConfigService {
  /**
   * Get global system configuration
   * Uses caching to minimize DynamoDB reads
   * @returns {Object} System configuration
   */
  async getConfig() {
    // Check cache first
    const cached = configCache.get('global_config');
    if (cached) return cached;

    // Fetch from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: 'CONFIG#GLOBAL', SK: 'SERVICES' }
    }));

    const config = result.Item || this._getDefaultConfig();
    
    // Cache for 5 minutes
    configCache.set('global_config', config);
    
    return config;
  }

  /**
   * Update service configuration
   * @param {Object} updates - Configuration updates
   * @param {string} adminId - Admin making the change
   * @returns {Object} Updated configuration
   */
  async updateConfig(updates, adminId) {
    const timestamp = new Date().toISOString();
    const currentConfig = await this.getConfig();

    // Merge updates with current config
    const updatedServices = {
      ...currentConfig.services,
      ...updates
    };

    // Validate configuration
    this._validateConfig(updatedServices);

    const newConfig = {
      PK: 'CONFIG#GLOBAL',
      SK: 'SERVICES',
      services: updatedServices,
      updatedAt: timestamp,
      updatedBy: adminId
    };

    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newConfig
    }));

    // Clear cache to force refresh
    configCache.del('global_config');

    return newConfig;
  }

  /**
   * Toggle service on/off
   * @param {string} serviceName - 'food' | 'mart' | 'packages'
   * @param {boolean} enabled - Enable or disable
   * @param {string} adminId - Admin making the change
   * @returns {Object} Updated configuration
   */
  async toggleService(serviceName, enabled, adminId) {
    const config = await this.getConfig();
    
    if (!config.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found`);
    }

    // Update only the specific service
    const updates = {
      [serviceName]: {
        ...config.services[serviceName],
        enabled
      }
    };

    return this.updateConfig(updates, adminId);
  }

  /**
   * Update commission rates
   * @param {string} serviceName - Service to update
   * @param {number} newRate - New commission rate (percentage)
   * @param {string} adminId - Admin making the change
   * @returns {Object} Updated configuration
   */
  async updateCommissionRate(serviceName, newRate, adminId) {
    if (newRate < 0 || newRate > 100) {
      throw new Error('Commission rate must be between 0 and 100');
    }

    const config = await this.getConfig();
    const updates = {
      [serviceName]: {
        ...config.services[serviceName],
        commissionRate: newRate
      }
    };

    return this.updateConfig(updates, adminId);
  }

  /**
   * Check if a specific service is enabled
   * @param {string} serviceName - Service name
   * @returns {boolean} Service status
   */
  async isServiceEnabled(serviceName) {
    const config = await this.getConfig();
    return config.services[serviceName]?.enabled || false;
  }

  /**
   * Get service-specific configuration
   * @param {string} serviceName - Service name
   * @returns {Object} Service configuration
   */
  async getServiceConfig(serviceName) {
    const config = await this.getConfig();
    return config.services[serviceName] || null;
  }

  /**
   * Validate configuration structure
   * @private
   */
  _validateConfig(services) {
    const requiredServices = ['food', 'mart', 'packages'];
    
    requiredServices.forEach(service => {
      if (!services[service]) {
        throw new Error(`Missing required service: ${service}`);
      }
      
      if (typeof services[service].enabled !== 'boolean') {
        throw new Error(`Service ${service} must have 'enabled' boolean field`);
      }
    });

    // Validate commission rates for food and mart
    if (services.food.commissionRate < 0 || services.food.commissionRate > 100) {
      throw new Error('Invalid commission rate for food service');
    }
    if (services.mart.commissionRate < 0 || services.mart.commissionRate > 100) {
      throw new Error('Invalid commission rate for mart service');
    }
  }

  /**
   * Get default configuration
   * @private
   */
  _getDefaultConfig() {
    return {
      PK: 'CONFIG#GLOBAL',
      SK: 'SERVICES',
      services: {
        food: {
          enabled: true,
          commissionRate: 15,
          minOrderAmount: 2000,
          deliveryFee: 1500
        },
        mart: {
          enabled: false,
          commissionRate: 10,
          minOrderAmount: 5000,
          deliveryFee: 2000
        },
        packages: {
          enabled: false,
          baseFee: 2000,
          feePerKm: 500,
          maxWeight: 50 // kg
        }
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
}

module.exports = ConfigService;

// Example usage:
/*
const configService = new ConfigService();

// Get current configuration
const config = await configService.getConfig();
console.log('Current services:', config.services);

// Enable Mart service
await configService.toggleService('mart', true, 'admin_001');

// Update commission rate
await configService.updateCommissionRate('food', 18, 'admin_001');

// Check if service is enabled
const isMartEnabled = await configService.isServiceEnabled('mart');
console.log('Is Mart enabled?', isMartEnabled);
*/

## 5.2 // apps/user-api/src/modules/config/config.controller.js

const ConfigService = require('../../../../../libs/shared-utils/config.service');
const configService = new ConfigService();

/**
 * Get app configuration for User frontend
 * This endpoint is called when the User app launches
 * Returns only the services that are enabled
 */
exports.getAppConfig = async (req, res, next) => {
  try {
    const config = await configService.getConfig();
    
    // Filter to only show enabled services
    const enabledServices = Object.entries(config.services)
      .filter(([_, serviceConfig]) => serviceConfig.enabled)
      .reduce((acc, [serviceName, serviceConfig]) => {
        acc[serviceName] = {
          enabled: true,
          minOrderAmount: serviceConfig.minOrderAmount,
          deliveryFee: serviceConfig.deliveryFee,
          // Don't expose commission rates to users
        };
        return acc;
      }, {});

    res.json({
      success: true,
      data: {
        services: enabledServices,
        version: process.env.APP_VERSION || '1.0.0',
        maintenanceMode: false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if specific service is available
 */
exports.checkServiceAvailability = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    
    const isEnabled = await configService.isServiceEnabled(serviceName);
    const serviceConfig = await configService.getServiceConfig(serviceName);

    if (!isEnabled) {
      return res.status(503).json({
        success: false,
        message: `${serviceName} service is currently unavailable`,
        comingSoon: true
      });
    }

    res.json({
      success: true,
      data: {
        serviceName,
        enabled: true,
        config: {
          minOrderAmount: serviceConfig.minOrderAmount,
          deliveryFee: serviceConfig.deliveryFee
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// apps/user-api/src/modules/config/config.routes.js

const express = require('express');
const router = express.Router();
const configController = require('./config.controller');

/**
 * @route   GET /api/v1/config
 * @desc    Get app configuration (called on app launch)
 * @access  Public
 */
router.get('/', configController.getAppConfig);

/**
 * @route   GET /api/v1/config/service/:serviceName
 * @desc    Check if specific service is available
 * @access  Public
 */
router.get('/service/:serviceName', configController.checkServiceAvailability);

module.exports = router;

// Example Frontend Integration (React Native / Flutter):
/*

// When User App launches:
async function loadAppConfig() {
  try {
    const response = await fetch('https://api.reeyo.com/user/config');
    const { data } = await response.json();
    
    // Update app state
    setAvailableServices(data.services);
    
    // Example: Show/hide "Mart" button based on config
    if (data.services.mart) {
      // Show Mart section
      setShowMart(true);
    } else {
      // Hide Mart or show "Coming Soon"
      setShowMart(false);
    }
    
    // Example: Food service config
    if (data.services.food) {
      setMinFoodOrderAmount(data.services.food.minOrderAmount);
      setFoodDeliveryFee(data.services.food.deliveryFee);
    }
    
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// Before allowing user to place a Package order:
async function checkPackageService() {
  const response = await fetch('https://api.reeyo.com/user/config/service/packages');
  const result = await response.json();
  
  if (!result.success) {
    // Show "Coming Soon" dialog
    Alert.alert('Coming Soon', 'Package delivery will be available soon!');
    return false;
  }
  
  return true;
}

*/

// Example Admin Panel UI Flow:
/*

Admin Dashboard -> Services Tab:

┌─────────────────────────────────────────┐
│ Service Management                      │
├─────────────────────────────────────────┤
│                                         │
│ Food Delivery          [✓] Enabled     │
│ Commission Rate:        15%             │
│ Min Order:             2000 XAF         │
│ Delivery Fee:          1500 XAF         │
│                                         │
│ Mart (Grocery)         [✓] Enabled     │
│ Commission Rate:        10%             │
│ Min Order:             5000 XAF         │
│                                         │
│ Package Courier        [ ] Disabled     │
│ Base Fee:              2000 XAF         │
│ Per KM Fee:             500 XAF         │
│ [Enable Service]                        │
│                                         │
└─────────────────────────────────────────┘

When Admin clicks "Enable Service":
- Updates DynamoDB CONFIG#GLOBAL
- Cache is cleared
- User apps fetch new config on next launch
- Package delivery becomes available instantly
*/



## 6. Interaction Flow Diagrams

### 6.1 Order Lifecycle Flow

```
USER APP                 USER API              VENDOR API            RIDER API           SOCKET.IO
   |                        |                      |                     |                   |
   |--1. Create Order------>|                      |                     |                   |
   |                        |--2. Validate-------->|                     |                   |
   |                        |    Service Enabled   |                     |                   |
   |                        |<-----200 OK----------|                     |                   |
   |                        |                      |                     |                   |
   |                        |--3. Save to DynamoDB |                     |                   |
   |                        |    (ORDER#xxx)       |                     |                   |
   |                        |                      |                     |                   |
   |<---201 Order Created---|                      |                     |                   |
   |                        |                      |                     |                   |
   |                        |--4. Emit "new_order" event---------------->|                   |
   |                        |                      |                     |                   |
   |                        |                      |<--5. Push Notify----|                   |
   |                        |                      |    to Vendor        |                   |
   |                        |                      |                     |                   |
VENDOR APP                  |                      |                     |                   |
   |                        |                      |                     |                   |
   |--6. Accept Order-------|                      |                     |                   |
   |                        |                      |--7. Update Status-->|                   |
   |                        |                      |    (ACCEPTED)       |                   |
   |                        |                      |                     |                   |
   |                        |--8. Find Nearby------|-------------------->|                   |
   |                        |    Riders (Redis     |                     |                   |
   |                        |    GEOSEARCH)        |                     |                   |
   |                        |                      |                     |                   |
   |                        |--9. Emit "delivery_request"--------------->|------------------>|
   |                        |    to matched riders |                     |                   |
   |                        |                      |                     |                   |
RIDER APP                   |                      |                     |                   |
   |                        |                      |                     |                   |
   |--10. Accept Delivery---|                      |                     |                   |
   |                        |                      |                     |--11. Assign------>|
   |                        |                      |                     |     Rider         |
   |                        |                      |                     |                   |
   |--12. Start Location----|                      |                     |                   |
   |     Tracking           |                      |                     |                   |
   |------------------------|-------------------------------------------->|------------------>|
   |  (Every 5 sec)         |                      |                     |   "location_      |
   |                        |                      |                     |    update"        |
   |                        |                      |                     |                   |
   |                        |<--13. Broadcast location to User App--------|<------------------|
   |                        |                      |                     |                   |
USER APP                    |                      |                     |                   |
   | [Map updates in        |                      |                     |                   |
   |  real-time]            |                      |                     |                   |
   |                        |                      |                     |                   |
RIDER APP                   |                      |                     |                   |
   |--14. Arrive Vendor-----|                      |                     |                   |
   |                        |                      |--15. Notify-------->|                   |
   |                        |                      |    Vendor           |                   |
   |                        |                      |                     |                   |
   |--16. Pick Up Item------|                      |                     |                   |
   |                        |                      |                     |--17. Update------>|
   |                        |                      |                     |    (IN_TRANSIT)   |
   |                        |                      |                     |                   |
   |--18. Arrive User-------|                      |                     |                   |
   |                        |<--19. Notify User---|                     |                   |
   |                        |                      |                     |                   |
   |--20. Deliver Item------|                      |                     |                   |
   |                        |                      |                     |--21. Complete---->|
   |                        |                      |                     |    (DELIVERED)    |
   |                        |                      |                     |                   |
   |                        |--22. Process Payment Split (TransactWriteItems)---------------|
   |                        |    • Admin Cut: 15% |                     |                   |
   |                        |    • Vendor: 80%    |                     |                   |
   |                        |    • Rider: 5%      |                     |                   |
   |                        |                      |                     |                   |
   |<---Order Complete------|                      |                     |                   |
   |                        |                      |                     |                   |
   |--23. Rate Order--------|                      |                     |                   |
   |    (Vendor + Rider)    |                      |                     |                   |
```

### 6.2 Withdrawal Lifecycle Flow

```
VENDOR APP           VENDOR API           ADMIN API           WALLET SERVICE       DYNAMODB
    |                    |                    |                     |                  |
    |--1. Request------->|                    |                     |                  |
    |   Withdrawal       |                    |                     |                  |
    |   (100,000 XAF)    |                    |                     |                  |
    |                    |                    |                     |                  |
    |                    |--2. Validate-------|-------------------->|                  |
    |                    |   • Min threshold  |                     |                  |
    |                    |   • Balance check  |                     |                  |
    |                    |                    |                     |                  |
    |                    |                    |                     |--3. Transaction--|
    |                    |                    |                     |   (Atomic):      |
    |                    |                    |                     |   - Create       |
    |                    |                    |                     |     PAYOUT#xxx   |
    |                    |                    |                     |   - Move funds   |
    |                    |                    |                     |     Available→   |
    |                    |                    |                     |     Pending      |
    |                    |                    |                     |<-----------------|
    |                    |                    |                     |                  |
    |<--Created----------|                    |                     |                  |
    |   Status: PENDING  |                    |                     |                  |
    |                    |                    |                     |                  |
    |                    |                    |                     |                  |
ADMIN APP                |                    |                     |                  |
    |                    |                    |                     |                  |
    |--------------------|-4. List Pending--->|                     |                  |
    |                    |   Payouts          |                     |                  |
    |                    |                    |                     |                  |
    |                    |                    |<--5. Query GSI1-----|----------------->|
    |                    |                    |   (STATUS=PENDING)  |                  |
    |                    |                    |                     |                  |
    |<-------------------|----Payout List-----|                     |                  |
    |                    |                    |                     |                  |
    |                    |                    |                     |                  |
    |--6. Approve--------|                    |                     |                  |
    |   Payout           |------------------->|                     |                  |
    |                    |                    |                     |                  |
    |                    |                    |--7. Verify Admin--->|                  |
    |                    |                    |   Permissions       |                  |
    |                    |                    |                     |                  |
    |                    |                    |                     |--8. Transaction--|
    |                    |                    |                     |   (Atomic):      |
    |                    |                    |                     |   - Update       |
    |                    |                    |                     |     PAYOUT       |
    |                    |                    |                     |     status       |
    |                    |                    |                     |   - Deduct       |
    |                    |                    |                     |     Pending      |
    |                    |                    |                     |     Balance      |
    |                    |                    |                     |<-----------------|
    |                    |                    |                     |                  |
    |                    |                    |<--Approved----------|                  |
    |<-------------------|--------------------|                     |                  |
    |                    |                    |                     |                  |
    |                    |                    |--9. Trigger---------|                  |
    |                    |                    |   External Payment  |                  |
    |                    |                    |   (Bank Transfer)   |                  |
    |                    |                    |                     |                  |
VENDOR APP               |                    |                     |                  |
    |                    |                    |                     |                  |
    |<--Push Notify------|                    |                     |                  |
    |   "Payout          |                    |                     |                  |
    |    Approved"       |                    |                     |                  |
```

---

## 7. Real-Time & Logistics Implementation

### 7.1 Socket.io Server Setup### 7.2 Redis Geospatial Rider Matching---
// libs/socket-server/socket.handler.js

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

class SocketHandler {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    // Namespaces for different user types
    this.userNamespace = this.io.of('/user');
    this.vendorNamespace = this.io.of('/vendor');
    this.riderNamespace = this.io.of('/rider');

    this.initializeNamespaces();
  }

  /**
   * Initialize authentication middleware for all namespaces
   */
  initializeNamespaces() {
    // User namespace
    this.userNamespace.use(this.authenticateSocket('USER'));
    this.userNamespace.on('connection', (socket) => this.handleUserConnection(socket));

    // Vendor namespace
    this.vendorNamespace.use(this.authenticateSocket('VENDOR'));
    this.vendorNamespace.on('connection', (socket) => this.handleVendorConnection(socket));

    // Rider namespace
    this.riderNamespace.use(this.authenticateSocket('RIDER'));
    this.riderNamespace.on('connection', (socket) => this.handleRiderConnection(socket));
  }

  /**
   * Authentication middleware for Socket.io
   */
  authenticateSocket(userType) {
    return async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.userType !== userType) {
          return next(new Error('Invalid user type'));
        }

        socket.userId = decoded.userId;
        socket.userType = userType;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    };
  }

  /**
   * Handle User (Customer) connections
   */
  handleUserConnection(socket) {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Subscribe to active orders
    socket.on('subscribe_order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${userId} subscribed to order ${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  }

  /**
   * Handle Vendor connections
   */
  handleVendorConnection(socket) {
    const vendorId = socket.userId;
    console.log(`Vendor connected: ${vendorId}`);

    socket.join(`vendor:${vendorId}`);

    // Listen for vendor accepting orders
    socket.on('accept_order', async (data) => {
      const { orderId } = data;
      
      // Broadcast to user
      this.userNamespace.to(`order:${orderId}`).emit('order_accepted', {
        orderId,
        vendorId,
        timestamp: new Date().toISOString()
      });

      console.log(`Vendor ${vendorId} accepted order ${orderId}`);
    });

    socket.on('order_ready', async (data) => {
      const { orderId, riderId } = data;
      
      // Notify rider that order is ready for pickup
      this.riderNamespace.to(`rider:${riderId}`).emit('order_ready_for_pickup', {
        orderId,
        vendorId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`Vendor disconnected: ${vendorId}`);
    });
  }

  /**
   * Handle Rider connections
   */
  handleRiderConnection(socket) {
    const riderId = socket.userId;
    console.log(`Rider connected: ${riderId}`);

    socket.join(`rider:${riderId}`);

    // Handle rider location updates
    socket.on('location_update', async (data) => {
      const { lat, lng, orderId } = data;

      try {
        // Store in Redis with geospatial index
        await redis.geoadd('riders:online', lng, lat, riderId);
        
        // Store last location
        await redis.setex(
          `rider:${riderId}:location`,
          300, // 5 minutes TTL
          JSON.stringify({ lat, lng, timestamp: Date.now() })
        );

        // Broadcast to user tracking this order
        if (orderId) {
          this.userNamespace.to(`order:${orderId}`).emit('rider_location_update', {
            riderId,
            location: { lat, lng },
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('Failed to update rider location:', error);
      }
    });

    // Handle rider availability status
    socket.on('set_availability', async (data) => {
      const { available } = data;

      try {
        await redis.hset(`rider:${riderId}:status`, {
          available: available ? '1' : '0',
          updatedAt: Date.now()
        });

        console.log(`Rider ${riderId} availability: ${available}`);
      } catch (error) {
        console.error('Failed to update rider availability:', error);
      }
    });

    // Handle rider accepting delivery
    socket.on('accept_delivery', async (data) => {
      const { orderId } = data;

      // Notify user
      this.userNamespace.to(`order:${orderId}`).emit('rider_assigned', {
        riderId,
        timestamp: new Date().toISOString()
      });

      // Join order room for location updates
      socket.join(`order:${orderId}`);
    });

    // Handle delivery completion
    socket.on('complete_delivery', async (data) => {
      const { orderId } = data;

      // Notify user
      this.userNamespace.to(`order:${orderId}`).emit('order_delivered', {
        orderId,
        riderId,
        timestamp: new Date().toISOString()
      });

      // Leave order room
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', async () => {
      console.log(`Rider disconnected: ${riderId}`);
      
      // Remove from online riders
      try {
        await redis.zrem('riders:online', riderId);
      } catch (error) {
        console.error('Failed to remove rider from online list:', error);
      }
    });
  }

  /**
   * Emit order notification to vendors
   * Called by Order API when new order is created
   */
  emitNewOrderToVendor(vendorId, orderData) {
    this.vendorNamespace.to(`vendor:${vendorId}`).emit('new_order', orderData);
  }

  /**
   * Find nearby riders using Redis Geospatial
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusKm - Search radius in kilometers
   * @returns {Array} List of nearby rider IDs
   */
  async findNearbyRiders(lat, lng, radiusKm = 5) {
    try {
      // Use Redis GEORADIUS to find riders within radius
      const nearbyRiders = await redis.georadius(
        'riders:online',
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC' // Closest first
      );

      // Filter only available riders
      const availableRiders = [];
      for (const [riderId, distance] of nearbyRiders) {
        const status = await redis.hget(`rider:${riderId}:status`, 'available');
        if (status === '1') {
          availableRiders.push({ riderId, distance: parseFloat(distance) });
        }
      }

      return availableRiders;
    } catch (error) {
      console.error('Failed to find nearby riders:', error);
      return [];
    }
  }

  /**
   * Broadcast delivery request to nearby riders
   * @param {Object} orderData - Order information
   * @param {Array} riderIds - List of rider IDs to notify
   */
  broadcastDeliveryRequest(orderData, riderIds) {
    riderIds.forEach(({ riderId }) => {
      this.riderNamespace.to(`rider:${riderId}`).emit('delivery_request', {
        orderId: orderData.orderId,
        pickupLocation: orderData.pickupLocation,
        dropoffLocation: orderData.dropoffLocation,
        deliveryFee: orderData.deliveryFee,
        distance: orderData.distance,
        orderType: orderData.orderType
      });
    });
  }

  /**
   * Get IO instance for external use
   */
  getIO() {
    return this.io;
  }
}

module.exports = SocketHandler;

// Usage in Express server:
/*
const express = require('express');
const http = require('http');
const SocketHandler = require('./libs/socket-server/socket.handler');

const app = express();
const server = http.createServer(app);
const socketHandler = new SocketHandler(server);

// Make socket handler available to routes
app.set('socketHandler', socketHandler);

// In Order API endpoint:
app.post('/api/orders', async (req, res) => {
  const order = await createOrder(req.body);
  
  // Notify vendor
  const socketHandler = req.app.get('socketHandler');
  socketHandler.emitNewOrderToVendor(order.vendorId, order);
  
  // Find nearby riders
  const nearbyRiders = await socketHandler.findNearbyRiders(
    order.pickupLocation.lat,
    order.pickupLocation.lng
  );
  
  res.json(order);
});

server.listen(3000);
*/

## 7.2 // libs/shared-utils/rider-matching.service.js

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

class RiderMatchingService {
  /**
   * Find best rider for an order
   * Uses Redis Geospatial index for fast proximity search
   * 
   * @param {Object} order - Order details
   * @returns {Object} Matched rider or null
   */
  async findBestRider(order) {
    const { orderType, pickupLocation, dropoffLocation } = order;

    // Determine search location based on order type
    const searchLocation = orderType === 'PACKAGE' 
      ? pickupLocation  // For packages, find riders near sender
      : pickupLocation; // For food/mart, find riders near restaurant/store

    const { lat, lng } = searchLocation;

    // Step 1: Find riders within 5km radius
    const nearbyRiders = await this.findNearbyRiders(lat, lng, 5);

    if (nearbyRiders.length === 0) {
      console.log('No riders available nearby');
      return null;
    }

    // Step 2: Filter and rank riders
    const rankedRiders = await this.rankRiders(nearbyRiders, order);

    if (rankedRiders.length === 0) {
      return null;
    }

    // Step 3: Return best match
    return rankedRiders[0];
  }

  /**
   * Find riders within radius using Redis GEORADIUS
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radiusKm - Search radius
   * @returns {Array} Nearby riders with distances
   */
  async findNearbyRiders(lat, lng, radiusKm) {
    try {
      const results = await redis.georadius(
        'riders:online',
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'WITHCOORD',
        'ASC' // Closest first
      );

      return results.map(([riderId, distance, [longitude, latitude]]) => ({
        riderId,
        distance: parseFloat(distance),
        location: { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      }));
    } catch (error) {
      console.error('Redis GEORADIUS error:', error);
      return [];
    }
  }

  /**
   * Rank riders based on multiple factors
   * @param {Array} riders - List of nearby riders
   * @param {Object} order - Order details
   * @returns {Array} Ranked riders
   */
  async rankRiders(riders, order) {
    const rankedRiders = [];

    for (const rider of riders) {
      // Check rider availability
      const isAvailable = await this.isRiderAvailable(rider.riderId);
      if (!isAvailable) continue;

      // Get rider stats
      const stats = await this.getRiderStats(rider.riderId);

      // Calculate score
      const score = this.calculateRiderScore({
        distance: rider.distance,
        completionRate: stats.completionRate,
        rating: stats.rating,
        activeDeliveries: stats.activeDeliveries
      });

      rankedRiders.push({
        ...rider,
        score,
        stats
      });
    }

    // Sort by score (highest first)
    rankedRiders.sort((a, b) => b.score - a.score);

    return rankedRiders;
  }

  /**
   * Check if rider is available
   * @param {string} riderId - Rider ID
   * @returns {boolean} Availability status
   */
  async isRiderAvailable(riderId) {
    try {
      const status = await redis.hget(`rider:${riderId}:status`, 'available');
      return status === '1';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get rider statistics
   * @param {string} riderId - Rider ID
   * @returns {Object} Rider stats
   */
  async getRiderStats(riderId) {
    try {
      const stats = await redis.hgetall(`rider:${riderId}:stats`);
      return {
        completionRate: parseFloat(stats.completionRate || 95),
        rating: parseFloat(stats.rating || 4.5),
        totalDeliveries: parseInt(stats.totalDeliveries || 0),
        activeDeliveries: parseInt(stats.activeDeliveries || 0)
      };
    } catch (error) {
      return {
        completionRate: 95,
        rating: 4.5,
        totalDeliveries: 0,
        activeDeliveries: 0
      };
    }
  }

  /**
   * Calculate rider score
   * Higher score = better match
   * 
   * Factors:
   * - Distance (closer is better)
   * - Completion rate (higher is better)
   * - Rating (higher is better)
   * - Active deliveries (fewer is better)
   * 
   * @param {Object} factors - Scoring factors
   * @returns {number} Score (0-100)
   */
  calculateRiderScore(factors) {
    const { distance, completionRate, rating, activeDeliveries } = factors;

    // Distance score (max 40 points)
    // 0km = 40 points, 5km = 0 points
    const distanceScore = Math.max(0, 40 - (distance * 8));

    // Completion rate score (max 25 points)
    const completionScore = (completionRate / 100) * 25;

    // Rating score (max 25 points)
    const ratingScore = (rating / 5) * 25;

    // Active deliveries penalty (max -10 points)
    const activeDeliveriesPenalty = Math.min(10, activeDeliveries * 5);

    const totalScore = distanceScore + completionScore + ratingScore - activeDeliveriesPenalty;

    return Math.max(0, Math.min(100, totalScore));
  }

  /**
   * Update rider location
   * Called by Socket.io when rider sends location update
   * 
   * @param {string} riderId - Rider ID
   * @param {Object} location - {lat, lng}
   */
  async updateRiderLocation(riderId, location) {
    const { lat, lng } = location;

    try {
      // Add to geospatial index
      await redis.geoadd('riders:online', lng, lat, riderId);

      // Store detailed location with timestamp
      await redis.setex(
        `rider:${riderId}:location`,
        300, // 5 minutes TTL
        JSON.stringify({
          lat,
          lng,
          timestamp: Date.now()
        })
      );

      return true;
    } catch (error) {
      console.error('Failed to update rider location:', error);
      return false;
    }
  }

  /**
   * Update rider availability
   * @param {string} riderId - Rider ID
   * @param {boolean} available - Availability status
   */
  async updateRiderAvailability(riderId, available) {
    try {
      await redis.hset(`rider:${riderId}:status`, {
        available: available ? '1' : '0',
        updatedAt: Date.now()
      });

      if (!available) {
        // Remove from online riders geospatial index
        await redis.zrem('riders:online', riderId);
      }

      return true;
    } catch (error) {
      console.error('Failed to update rider availability:', error);
      return false;
    }
  }

  /**
   * Increment active deliveries count
   * @param {string} riderId - Rider ID
   */
  async incrementActiveDeliveries(riderId) {
    try {
      await redis.hincrby(`rider:${riderId}:stats`, 'activeDeliveries', 1);
    } catch (error) {
      console.error('Failed to increment active deliveries:', error);
    }
  }

  /**
   * Decrement active deliveries count
   * @param {string} riderId - Rider ID
   */
  async decrementActiveDeliveries(riderId) {
    try {
      await redis.hincrby(`rider:${riderId}:stats`, 'activeDeliveries', -1);
    } catch (error) {
      console.error('Failed to decrement active deliveries:', error);
    }
  }

  /**
   * Get distance between two coordinates (Haversine formula)
   * @param {Object} coord1 - {lat, lng}
   * @param {Object} coord2 - {lat, lng}
   * @returns {number} Distance in kilometers
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km

    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);

    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   * @private
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = RiderMatchingService;

// Example usage:
/*
const RiderMatchingService = require('./rider-matching.service');
const matchingService = new RiderMatchingService();

// When order is accepted by vendor:
const order = {
  orderId: 'ord_food_001',
  orderType: 'FOOD',
  pickupLocation: { lat: 4.0483, lng: 9.7053 }, // Restaurant location
  dropoffLocation: { lat: 4.0511, lng: 9.7679 }  // User location
};

const bestRider = await matchingService.findBestRider(order);

if (bestRider) {
  console.log('Best rider found:', bestRider.riderId);
  console.log('Distance:', bestRider.distance, 'km');
  console.log('Score:', bestRider.score);
  console.log('Rating:', bestRider.stats.rating);
  
  // Assign rider to order
  await assignRiderToOrder(order.orderId, bestRider.riderId);
  
  // Increment active deliveries
  await matchingService.incrementActiveDeliveries(bestRider.riderId);
} else {
  console.log('No riders available');
  // Implement fallback: notify user of delay or cancel order
}
*/ 

## 8. Frontend-to-Backend Connectivity

### 8.1 API Gateway Routing Strategy

```javascript
// AWS API Gateway Configuration (using Serverless Framework)

service: reeyo-api-gateway

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1

functions:
  # User API
  userApi:
    handler: apps/user-api/src/server.handler
    events:
      - http:
          path: /user/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: USER
      DYNAMODB_TABLE: ${self:custom.tableName}

  # Vendor API
  vendorApi:
    handler: apps/vendor-api/src/server.handler
    events:
      - http:
          path: /vendor/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: VENDOR
      DYNAMODB_TABLE: ${self:custom.tableName}

  # Rider API
  riderApi:
    handler: apps/rider-api/src/server.handler
    events:
      - http:
          path: /rider/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: RIDER
      DYNAMODB_TABLE: ${self:custom.tableName}

  # Admin API
  adminApi:
    handler: apps/admin-api/src/server.handler
    events:
      - http:
          path: /admin/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: ADMIN
      DYNAMODB_TABLE: ${self:custom.tableName}

custom:
  tableName: ReeYo-Production
```

### 8.2 Frontend Environment Configuration

**User App (.env)**
```env
# User Frontend Repository
API_BASE_URL=https://api.reeyo.com/user
SOCKET_URL=https://socket.reeyo.com
GOOGLE_MAPS_API_KEY=your_key_here
STRIPE_PUBLIC_KEY=your_key_here
```

**Vendor App (.env)**
```env
# Vendor Frontend Repository
API_BASE_URL=https://api.reeyo.com/vendor
SOCKET_URL=https://socket.reeyo.com
GOOGLE_MAPS_API_KEY=your_key_here
```

**Rider App (.env)**
```env
# Rider Frontend Repository
API_BASE_URL=https://api.reeyo.com/rider
SOCKET_URL=https://socket.reeyo.com
GOOGLE_MAPS_API_KEY=your_key_here
LOCATION_UPDATE_INTERVAL=5000  # 5 seconds
```

### 8.3 Shared API Client Example

```javascript
// Shared API Client (can be published as npm package)
// @reeyo/api-client

class ReeYoApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // Orders
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders?${query}`);
  }

  // Wallet
  async getWalletBalance() {
    return this.request('/wallet/balance');
  }

  async requestPayout(amount, bankDetails) {
    return this.request('/wallet/payout', {
      method: 'POST',
      body: JSON.stringify({ amount, bankDetails })
    });
  }
}

// Usage in User Frontend:
const client = new ReeYoApiClient({
  baseUrl: process.env.API_BASE_URL
});

client.setToken(userToken);
const orders = await client.getOrders({ status: 'ACTIVE' });
```

---

## 9. Deployment Roadmap (Zero-Cost Start)

### Phase 1: Local Development (Cost: $0)

```bash
# Docker Compose for local development
docker-compose up -d

# Services:
# - DynamoDB Local
# - Redis
# - All 4 Node.js APIs
# - Socket.io server
```

### Phase 2: AWS Free Tier Deployment (Cost: $0/month for first year)

**Infrastructure Setup:**

1. **DynamoDB**: 25 GB storage + 25 RCU/WCU (Free Tier)
2. **Lambda**: 1M requests/month (Free Tier)
3. **API Gateway**: 1M requests/month (Free Tier)
4. **S3**: 5 GB storage (Free Tier)
5. **CloudFront**: 50 GB data transfer (Free Tier)

**Deployment Steps:**

```bash
# Install Serverless Framework
npm install -g serverless

# Configure AWS credentials
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# Deploy all services
cd reeyo-backend
serverless deploy

# Output:
# User API:   https://xxx.execute-api.us-east-1.amazonaws.com/user
# Vendor API: https://xxx.execute-api.us-east-1.amazonaws.com/vendor
# Rider API:  https://xxx.execute-api.us-east-1.amazonaws.com/rider
# Admin API:  https://xxx.execute-api.us-east-1.amazonaws.com/admin
```

### Phase 3: Socket.io Server Deployment

Since Lambda doesn't support WebSockets well for Socket.io, deploy Socket.io on **ECS Fargate** (still cost-effective):

```yaml
# docker-compose.yml for ECS
version: '3.8'
services:
  socket-server:
    build: ./libs/socket-server
    ports:
      - "3001:3001"
    environment:
      - REDIS_HOST=redis-cluster.xxxxx.ng.0001.use1.cache.amazonaws.com
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 512M
```

**Estimated Monthly Cost (after free tier):**
- ECS Fargate (0.25 vCPU, 512MB): ~$7/month
- ElastiCache Redis (t2.micro): ~$13/month
- **Total: ~$20/month**

### Phase 4: Production Scale (1000+ concurrent users)

**Upgrade Path:**

1. **DynamoDB**: Enable Auto Scaling (pay per request)
2. **Lambda**: Auto-scales automatically
3. **Redis**: Upgrade to cluster mode
4. **CDN**: Use CloudFront for static assets
5. **Monitoring**: CloudWatch + X-Ray

**Estimated Cost at 10,000 orders/day:**
- DynamoDB: ~$50/month
- Lambda: ~$30/month
- ECS/Redis: ~$50/month
- S3/CloudFront: ~$20/month
- **Total: ~$150/month**

---

## 10. Complete Project Setup Commands---

#!/bin/bash
# setup-reeyo.sh - Complete project initialization script

set -e

echo "🚀 Initializing Reeyo Backend Monorepo..."

# Create root directory
mkdir -p reeyo-backend
cd reeyo-backend

# Initialize root package.json with workspaces
cat > package.json << 'EOF'
{
  "name": "reeyo-backend",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "libs/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:user\" \"npm run dev:vendor\" \"npm run dev:rider\" \"npm run dev:admin\"",
    "dev:user": "npm run dev --workspace=apps/user-api",
    "dev:vendor": "npm run dev --workspace=apps/vendor-api",
    "dev:rider": "npm run dev --workspace=apps/rider-api",
    "dev:admin": "npm run dev --workspace=apps/admin-api",
    "test": "jest",
    "lint": "eslint . --ext .js",
    "deploy": "serverless deploy"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2"
  }
}
EOF

# Create directory structure
echo "📁 Creating directory structure..."

mkdir -p apps/{user-api,vendor-api,rider-api,admin-api}/src/{modules,middleware,routes}
mkdir -p libs/{core-db,wallet-engine,notifications,socket-server,shared-utils}
mkdir -p infrastructure/{terraform,scripts}

# Create apps package.json files
for app in user-api vendor-api rider-api admin-api; do
  cat > apps/$app/package.json << EOF
{
  "name": "@reeyo/$app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "@reeyo/core-db": "*",
    "@reeyo/wallet-engine": "*",
    "@reeyo/notifications": "*",
    "@reeyo/shared-utils": "*",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1"
  }
}
EOF
done

# Create libs package.json files
cat > libs/core-db/package.json << 'EOF'
{
  "name": "@reeyo/core-db",
  "version": "1.0.0",
  "main": "client.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.490.0",
    "@aws-sdk/lib-dynamodb": "^3.490.0"
  }
}
EOF

cat > libs/wallet-engine/package.json << 'EOF'
{
  "name": "@reeyo/wallet-engine",
  "version": "1.0.0",
  "main": "wallet.service.js",
  "dependencies": {
    "@reeyo/core-db": "*",
    "uuid": "^9.0.1"
  }
}
EOF

cat > libs/notifications/package.json << 'EOF'
{
  "name": "@reeyo/notifications",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-sns": "^3.490.0",
    "twilio": "^4.19.0",
    "nodemailer": "^6.9.7"
  }
}
EOF

cat > libs/socket-server/package.json << 'EOF'
{
  "name": "@reeyo/socket-server",
  "version": "1.0.0",
  "main": "socket.handler.js",
  "dependencies": {
    "socket.io": "^4.6.0",
    "jsonwebtoken": "^9.0.2",
    "ioredis": "^5.3.2"
  }
}
EOF

cat > libs/shared-utils/package.json << 'EOF'
{
  "name": "@reeyo/shared-utils",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0"
  }
}
EOF

# Create environment files
echo "🔐 Creating environment files..."

cat > .env.example << 'EOF'
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
DYNAMODB_TABLE=ReeYo-Production

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=7d

# Service Ports
USER_API_PORT=3001
VENDOR_API_PORT=3002
RIDER_API_PORT=3003
ADMIN_API_PORT=3004
SOCKET_PORT=3005

# External Services
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@reeyo.com

# Google Maps API
GOOGLE_MAPS_API_KEY=your_key

# Payment Gateway
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_secret
EOF

# Create Docker Compose for local development
echo "🐳 Creating Docker Compose configuration..."

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: reeyo-dynamodb
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    volumes:
      - dynamodb-data:/home/dynamodblocal/data

  redis:
    image: redis:7-alpine
    container_name: reeyo-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  user-api:
    build:
      context: .
      dockerfile: apps/user-api/Dockerfile
    container_name: reeyo-user-api
    ports:
      - "3001:3001"
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
      - REDIS_HOST=redis
    depends_on:
      - dynamodb-local
      - redis
    volumes:
      - ./apps/user-api:/app
      - ./libs:/libs

  vendor-api:
    build:
      context: .
      dockerfile: apps/vendor-api/Dockerfile
    container_name: reeyo-vendor-api
    ports:
      - "3002:3002"
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
      - REDIS_HOST=redis
    depends_on:
      - dynamodb-local
      - redis

  rider-api:
    build:
      context: .
      dockerfile: apps/rider-api/Dockerfile
    container_name: reeyo-rider-api
    ports:
      - "3003:3003"
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
      - REDIS_HOST=redis
    depends_on:
      - dynamodb-local
      - redis

  admin-api:
    build:
      context: .
      dockerfile: apps/admin-api/Dockerfile
    container_name: reeyo-admin-api
    ports:
      - "3004:3004"
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
      - REDIS_HOST=redis
    depends_on:
      - dynamodb-local
      - redis

  socket-server:
    build:
      context: .
      dockerfile: libs/socket-server/Dockerfile
    container_name: reeyo-socket
    ports:
      - "3005:3005"
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

volumes:
  dynamodb-data:
  redis-data:
EOF

# Create Serverless configuration
echo "☁️ Creating Serverless configuration..."

cat > serverless.yml << 'EOF'
service: reeyo-backend

provider:
  name: aws
  runtime: nodejs20.x
  region: ${opt:region, 'us-east-1'}
  stage: ${opt:stage, 'dev'}
  memorySize: 512
  timeout: 30
  environment:
    DYNAMODB_TABLE: ${self:custom.tableName}
    AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
            - dynamodb:BatchGetItem
            - dynamodb:BatchWriteItem
            - dynamodb:TransactWriteItems
          Resource:
            - !GetAtt ReeYoTable.Arn
            - !Join ['/', [!GetAtt ReeYoTable.Arn, 'index', '*']]

functions:
  userApi:
    handler: apps/user-api/src/server.handler
    events:
      - http:
          path: /user/{proxy+}
          method: ANY
          cors: true

  vendorApi:
    handler: apps/vendor-api/src/server.handler
    events:
      - http:
          path: /vendor/{proxy+}
          method: ANY
          cors: true

  riderApi:
    handler: apps/rider-api/src/server.handler
    events:
      - http:
          path: /rider/{proxy+}
          method: ANY
          cors: true

  adminApi:
    handler: apps/admin-api/src/server.handler
    events:
      - http:
          path: /admin/{proxy+}
          method: ANY
          cors: true

resources:
  Resources:
    ReeYoTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.tableName}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
          - AttributeName: GSI1PK
            AttributeType: S
          - AttributeName: GSI1SK
            AttributeType: S
          - AttributeName: GSI2PK
            AttributeType: S
          - AttributeName: GSI2SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: GSI1PK
                KeyType: HASH
              - AttributeName: GSI1SK
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
          - IndexName: GSI2
            KeySchema:
              - AttributeName: GSI2PK
                KeyType: HASH
              - AttributeName: GSI2SK
                KeyType: RANGE
            Projection:
              ProjectionType: ALL
        StreamSpecification:
          StreamViewType: NEW_AND_OLD_IMAGES

custom:
  tableName: ReeYo-${self:provider.stage}

plugins:
  - serverless-offline
EOF

# Create basic Dockerfile templates
echo "🐋 Creating Dockerfile templates..."

for app in user-api vendor-api rider-api admin-api; do
  cat > apps/$app/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF
done

# Create database initialization script
echo "💾 Creating database initialization script..."

cat > infrastructure/scripts/init-dynamodb.js << 'EOF'
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ReeYo-Development';

async function initializeData() {
  console.log('🌱 Seeding initial data...');

  // Create default system configuration
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: 'CONFIG#GLOBAL',
      SK: 'SERVICES',
      services: {
        food: {
          enabled: true,
          commissionRate: 15,
          minOrderAmount: 2000,
          deliveryFee: 1500
        },
        mart: {
          enabled: false,
          commissionRate: 10,
          minOrderAmount: 5000,
          deliveryFee: 2000
        },
        packages: {
          enabled: false,
          baseFee: 2000,
          feePerKm: 500,
          maxWeight: 50
        }
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }
  }));

  // Create admin wallet
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: 'WALLET#ADMIN#platform',
      SK: 'BALANCE',
      entityType: 'ADMIN',
      entityId: 'platform',
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      updatedAt: new Date().toISOString()
    }
  }));

  console.log('✅ Initial data seeded successfully');
}

initializeData().catch(console.error);
EOF

# Create README
echo "📖 Creating README..."

cat > README.md << 'EOF'
# Reeyo Backend - Multi-Service Logistics Platform

Complete backend architecture for Food, Mart, and Package delivery services.

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start services with Docker:
```bash
docker-compose up -d
```

4. Initialize database:
```bash
node infrastructure/scripts/init-dynamodb.js
```

5. Start development servers:
```bash
npm run dev
```

### API Endpoints

- User API: http://localhost:3001
- Vendor API: http://localhost:3002
- Rider API: http://localhost:3003
- Admin API: http://localhost:3004
- Socket.io: http://localhost:3005

### Deploy to AWS

```bash
serverless deploy --stage production
```

## Architecture

- **Monorepo**: Shared libraries across all services
- **DynamoDB**: Single-table design for scalability
- **Redis**: Geospatial indexing for rider matching
- **Socket.io**: Real-time tracking and notifications
- **Lambda**: Serverless deployment for cost efficiency

## Documentation

See `/docs` folder for detailed documentation on:
- API Endpoints
- Database Schema
- Wallet Logic
- Real-time Features

## License

Proprietary - Reeyo Platform
EOF

echo "✅ Project structure created successfully!"
echo ""
echo "Next steps:"
echo "1. cd reeyo-backend"
echo "2. npm install"
echo "3. cp .env.example .env (and fill in your values)"
echo "4. docker-compose up -d"
echo "5. npm run dev"
echo ""
echo "🚀 Happy coding!"
EOF

chmod +x setup-reeyo.sh
echo "Script saved as setup-reeyo.sh"

## 11. Security Best Practices

### 11.1 Authentication & Authorization

```javascript
// libs/shared-utils/auth.middleware.js

const jwt = require('jsonwebtoken');

class AuthMiddleware {
  /**
   * Verify JWT token
   */
  static verifyToken(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication token required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  /**
   * Check user type
   */
  static requireUserType(...allowedTypes) {
    return (req, res, next) => {
      if (!allowedTypes.includes(req.user.userType)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      next();
    };
  }

  /**
   * Verify resource ownership
   */
  static verifyOwnership(resourceIdParam) {
    return (req, res, next) => {
      const resourceId = req.params[resourceIdParam];
      
      if (req.user.userType === 'ADMIN') {
        return next(); // Admins can access all resources
      }

      if (req.user.userId !== resourceId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      next();
    };
  }
}

module.exports = AuthMiddleware;
```

### 11.2 Rate Limiting

```javascript
// libs/shared-utils/rate-limiter.js

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_HOST);

class RateLimiter {
  /**
   * Rate limit by user ID
   * Default: 100 requests per minute
   */
  static async limitByUser(userId, maxRequests = 100, windowSeconds = 60) {
    const key = `rate_limit:${userId}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current)
    };
  }

  /**
   * Express middleware
   */
  static middleware(maxRequests = 100, windowSeconds = 60) {
    return async (req, res, next) => {
      const userId = req.user?.userId || req.ip;
      const result = await RateLimiter.limitByUser(userId, maxRequests, windowSeconds);
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later'
        });
      }
      
      next();
    };
  }
}

module.exports = RateLimiter;
```

---

## 12. Testing Strategy

### 12.1 Unit Tests Example

```javascript
// libs/wallet-engine/__tests__/commission.calculator.test.js

const CommissionCalculator = require('../commission.calculator');

describe('CommissionCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new CommissionCalculator();
  });

  describe('Food Order Split', () => {
    it('should calculate correct split for food order', () => {
      const order = {
        orderType: 'FOOD',
        pricing: { subtotal: 10000, deliveryFee: 1500, total: 11500 }
      };

      const split = calculator.calculateSplit(order);

      expect(split.adminCut).toBe(1500); // 15% of 10,000
      expect(split.vendorShare).toBe(8500); // 10,000 - 1,500
      expect(split.riderFee).toBe(1500);
      expect(split.total).toBe(11500);
    });
  });

  describe('Package Order Split', () => {
    it('should calculate correct split for package order', () => {
      const order = {
        orderType: 'PACKAGE',
        pricing: { total: 5000 },
        distance: 5
      };

      const split = calculator.calculateSplit(order);

      expect(split.adminCut).toBe(1000); // 20% of 5,000
      expect(split.riderFee).toBe(4000); // 80% of 5,000
      expect(split.vendorShare).toBe(0); // No vendor
    });
  });

  describe('Withdrawal Validation', () => {
    it('should reject withdrawal below minimum threshold', () => {
      const validation = calculator.validateWithdrawal(30000, 'VENDOR');
      
      expect(validation.isValid).toBe(false);
      expect(validation.minThreshold).toBe(50000);
    });

    it('should accept withdrawal above minimum threshold', () => {
      const validation = calculator.validateWithdrawal(60000, 'VENDOR');
      
      expect(validation.isValid).toBe(true);
    });
  });
});
```

### 12.2 Integration Tests

```javascript
// apps/user-api/__tests__/order.integration.test.js

const request = require('supertest');
const app = require('../src/server');

describe('Order API Integration Tests', () => {
  let userToken;
  let orderId;

  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    userToken = response.body.token;
  });

  describe('POST /orders', () => {
    it('should create a food order', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderType: 'FOOD',
          vendorId: 'vnd_test_001',
          items: [
            { itemId: 'itm_1', quantity: 2, price: 5000 }
          ],
          deliveryAddress: {
            lat: 4.0511,
            lng: 9.7679,
            address: 'Bonanjo, Douala'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderId).toBeDefined();
      
      orderId = response.body.data.orderId;
    });
  });

  describe('GET /orders/:orderId', () => {
    it('should retrieve order details', async () => {
      const response = await request(app)
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orderId).toBe(orderId);
      expect(response.body.data.status).toBe('PENDING');
    });
  });
});
```

---

## 13. Monitoring & Observability

### 13.1 CloudWatch Metrics

```javascript
// libs/shared-utils/metrics.js

const { CloudWatch } = require('@aws-sdk/client-cloudwatch');
const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION });

class MetricsService {
  static async recordOrderCreated(orderType) {
    await cloudwatch.putMetricData({
      Namespace: 'Reeyo/Orders',
      MetricData: [{
        MetricName: 'OrdersCreated',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{ Name: 'OrderType', Value: orderType }]
      }]
    });
  }

  static async recordWalletTransaction(amount, transactionType) {
    await cloudwatch.putMetricData({
      Namespace: 'Reeyo/Wallet',
      MetricData: [{
        MetricName: 'TransactionAmount',
        Value: amount,
        Unit: 'None',
        Dimensions: [{ Name: 'Type', Value: transactionType }]
      }]
    });
  }

  static async recordApiLatency(endpoint, duration) {
    await cloudwatch.putMetricData({
      Namespace: 'Reeyo/API',
      MetricData: [{
        MetricName: 'Latency',
        Value: duration,
        Unit: 'Milliseconds',
        Dimensions: [{ Name: 'Endpoint', Value: endpoint }]
      }]
    });
  }
}

module.exports = MetricsService;
```

### 13.2 Structured Logging

```javascript
// libs/shared-utils/logger.js

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: process.env.SERVICE_NAME || 'reeyo-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Log order events
logger.logOrder = (action, orderId, metadata = {}) => {
  logger.info('Order event', {
    action,
    orderId,
    ...metadata
  });
};

// Log wallet transactions
logger.logTransaction = (transactionId, amount, type) => {
  logger.info('Wallet transaction', {
    transactionId,
    amount,
    type
  });
};

module.exports = logger;
```

---

## Summary

This complete architecture provides:

✅ **Scalable Foundation**: Single-table DynamoDB design + Lambda + API Gateway  
✅ **Financial Integrity**: ACID transactions with `TransactWriteItems`  
✅ **Real-time Features**: Socket.io + Redis Geospatial for live tracking  
✅ **Dynamic Configuration**: Feature flags for service toggling without deployment  
✅ **Cost Efficiency**: $0 start with AWS Free Tier, scales to ~$150/month at 10k orders/day  
✅ **Modular Codebase**: Monorepo with shared libraries, easy to maintain  
✅ **Production-Ready**: Security, testing, monitoring, and deployment pipelines included

**Key Differentiators:**
- **Multi-logistics support** (Food, Mart, Packages) from day one
- **Escrow wallet system** with atomic financial splits
- **Intelligent rider matching** using geospatial algorithms
- **Zero-downtime service activation** via feature flags

The architecture is designed to start small (MVP with just Food delivery) and scale infinitely as you add Mart and Package services by simply flipping switches in the Admin Panel.