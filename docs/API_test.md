# Testing Reeyo Backend with Postman

I'll create a complete Postman testing guide with collections for all 4 systems.

---

## 1. Setup Instructions

### Step 1: Start Your Local Development Environment

```bash
# Navigate to project directory
cd reeyo-backend

# Start all services with Docker
docker-compose up -d

# Wait for services to start (about 30 seconds)
# Check if services are running
docker ps
```

Your services will be available at:
- **User API**: `http://localhost:3001`
- **Vendor API**: `http://localhost:3002`
- **Rider API**: `http://localhost:3003`
- **Admin API**: `http://localhost:3004`
- **Socket.io**: `http://localhost:3005`

### Step 2: Initialize Database with Seed Data

```bash
# Run the initialization script
node infrastructure/scripts/init-dynamodb.js

# Optional: Create test users
node infrastructure/scripts/seed-test-data.js
```

---

## 2. Postman Environment Setup
{
  "name": "Reeyo - Local Development",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost",
      "enabled": true
    },
    {
      "key": "user_api_url",
      "value": "{{base_url}}:3001",
      "enabled": true
    },
    {
      "key": "vendor_api_url",
      "value": "{{base_url}}:3002",
      "enabled": true
    },
    {
      "key": "rider_api_url",
      "value": "{{base_url}}:3003",
      "enabled": true
    },
    {
      "key": "admin_api_url",
      "value": "{{base_url}}:3004",
      "enabled": true
    },
    {
      "key": "socket_url",
      "value": "{{base_url}}:3005",
      "enabled": true
    },
    {
      "key": "user_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "vendor_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "rider_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "admin_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "vendor_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "rider_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "order_id",
      "value": "",
      "enabled": true
    }
  ]
}

### Create Postman Environment**How to Import:**
1. Open Postman
2. Click "Environments" (left sidebar)
3. Click "Import" button
4. Copy the JSON above and paste it
5. Click "Import"
6. Select "Reeyo - Local Development" as your active environment

---

## 3. Complete Postman Collections

### Collection 1: User API (Customer App)
{
  "info": {
    "name": "Reeyo - User API",
    "description": "Customer-facing endpoints for the Reeyo platform",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('user_token', response.data.token);",
                  "    pm.environment.set('user_id', response.data.user.userId);",
                  "    console.log('User registered and token saved');",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"phone\": \"+237670000001\",\n  \"password\": \"Password123!\"\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/auth/register",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "auth", "register"]
            }
          }
        },
        {
          "name": "Login User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('user_token', response.data.token);",
                  "    pm.environment.set('user_id', response.data.user.userId);",
                  "    console.log('User logged in and token saved');",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"Password123!\"\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/auth/login",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Configuration",
      "item": [
        {
          "name": "Get App Config",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/config",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "config"]
            },
            "description": "Gets available services (Food, Mart, Packages) based on admin configuration"
          }
        },
        {
          "name": "Check Service Availability",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/config/service/food",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "config", "service", "food"]
            },
            "description": "Check if specific service (food/mart/packages) is available"
          }
        }
      ]
    },
    {
      "name": "Vendors",
      "item": [
        {
          "name": "Search Vendors",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/vendors?serviceType=FOOD&lat=4.0511&lng=9.7679",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "vendors"],
              "query": [
                {
                  "key": "serviceType",
                  "value": "FOOD"
                },
                {
                  "key": "lat",
                  "value": "4.0511"
                },
                {
                  "key": "lng",
                  "value": "9.7679"
                }
              ]
            }
          }
        },
        {
          "name": "Get Vendor Details",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/vendors/{{vendor_id}}",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "vendors", "{{vendor_id}}"]
            }
          }
        },
        {
          "name": "Get Vendor Menu",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/vendors/{{vendor_id}}/menu",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "vendors", "{{vendor_id}}", "menu"]
            }
          }
        }
      ]
    },
    {
      "name": "Orders",
      "item": [
        {
          "name": "Create Food Order",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('order_id', response.data.orderId);",
                  "    console.log('Order created:', response.data.orderId);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"orderType\": \"FOOD\",\n  \"vendorId\": \"{{vendor_id}}\",\n  \"items\": [\n    {\n      \"itemId\": \"itm_burger_001\",\n      \"name\": \"Cheeseburger\",\n      \"quantity\": 2,\n      \"price\": 5000,\n      \"notes\": \"No onions please\"\n    },\n    {\n      \"itemId\": \"itm_fries_001\",\n      \"name\": \"French Fries\",\n      \"quantity\": 1,\n      \"price\": 2000\n    }\n  ],\n  \"deliveryAddress\": {\n    \"addressId\": \"addr_home\",\n    \"label\": \"Home\",\n    \"fullAddress\": \"Bonanjo, Douala, Cameroon\",\n    \"coordinates\": {\n      \"lat\": 4.0511,\n      \"lng\": 9.7679\n    },\n    \"instructions\": \"Ring the doorbell twice\"\n  },\n  \"paymentMethod\": \"WALLET\"\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/orders",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "orders"]
            }
          }
        },
        {
          "name": "Create Package Order",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('order_id', response.data.orderId);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"orderType\": \"PACKAGE\",\n  \"packageDetails\": {\n    \"category\": \"DOCUMENT\",\n    \"weight\": 0.5,\n    \"description\": \"Legal documents\",\n    \"isFragile\": false\n  },\n  \"pickupAddress\": {\n    \"fullAddress\": \"Bonanjo, Douala\",\n    \"coordinates\": { \"lat\": 4.0511, \"lng\": 9.7679 },\n    \"contactName\": \"John Doe\",\n    \"contactPhone\": \"+237670000001\"\n  },\n  \"deliveryAddress\": {\n    \"fullAddress\": \"Akwa, Douala\",\n    \"coordinates\": { \"lat\": 4.0600, \"lng\": 9.7100 },\n    \"contactName\": \"Jane Smith\",\n    \"contactPhone\": \"+237670000002\"\n  },\n  \"paymentMethod\": \"WALLET\"\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/orders",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "orders"]
            }
          }
        },
        {
          "name": "Get Order Details",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/orders/{{order_id}}",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "orders", "{{order_id}}"]
            }
          }
        },
        {
          "name": "Get My Orders",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/orders?status=ACTIVE&limit=20",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "orders"],
              "query": [
                {
                  "key": "status",
                  "value": "ACTIVE"
                },
                {
                  "key": "limit",
                  "value": "20"
                }
              ]
            }
          }
        },
        {
          "name": "Cancel Order",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Changed my mind\"\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/orders/{{order_id}}/cancel",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "orders", "{{order_id}}", "cancel"]
            }
          }
        }
      ]
    },
    {
      "name": "Wallet",
      "item": [
        {
          "name": "Get Wallet Balance",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/wallet/balance",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "wallet", "balance"]
            }
          }
        },
        {
          "name": "Get Transaction History",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{user_api_url}}/api/v1/wallet/transactions?limit=50",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "wallet", "transactions"],
              "query": [
                {
                  "key": "limit",
                  "value": "50"
                }
              ]
            }
          }
        },
        {
          "name": "Add Funds",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"amount\": 50000,\n  \"paymentMethod\": \"CARD\",\n  \"paymentToken\": \"tok_visa_12345\"\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/wallet/add-funds",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "wallet", "add-funds"]
            }
          }
        }
      ]
    },
    {
      "name": "Ratings",
      "item": [
        {
          "name": "Rate Order",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{user_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"orderId\": \"{{order_id}}\",\n  \"vendorRating\": {\n    \"rating\": 5,\n    \"review\": \"Excellent food quality and packaging!\"\n  },\n  \"riderRating\": {\n    \"rating\": 4,\n    \"review\": \"Fast delivery, but could be more polite\"\n  }\n}"
            },
            "url": {
              "raw": "{{user_api_url}}/api/v1/ratings",
              "host": ["{{user_api_url}}"],
              "path": ["api", "v1", "ratings"]
            }
          }
        }
      ]
    }
  ]
}
### Collection 2: Vendor API
{
  "info": {
    "name": "Reeyo - Vendor API",
    "description": "Vendor management endpoints for restaurants and stores",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register Vendor",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('vendor_token', response.data.token);",
                  "    pm.environment.set('vendor_id', response.data.vendor.vendorId);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"businessName\": \"Douala Fresh Restaurant\",\n  \"ownerName\": \"Pierre Kamdem\",\n  \"email\": \"pierre@freshrestaurant.cm\",\n  \"phone\": \"+237670000010\",\n  \"password\": \"VendorPass123!\",\n  \"serviceType\": \"FOOD\",\n  \"location\": {\n    \"address\": \"Akwa, Douala\",\n    \"coordinates\": {\n      \"lat\": 4.0483,\n      \"lng\": 9.7053\n    }\n  },\n  \"bankDetails\": {\n    \"accountName\": \"Fresh Restaurant SARL\",\n    \"accountNumber\": \"1234567890\",\n    \"bankName\": \"Afriland First Bank\"\n  }\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/auth/register",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "auth", "register"]
            }
          }
        },
        {
          "name": "Login Vendor",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('vendor_token', response.data.token);",
                  "    pm.environment.set('vendor_id', response.data.vendor.vendorId);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"pierre@freshrestaurant.cm\",\n  \"password\": \"VendorPass123!\"\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/auth/login",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Inventory Management",
      "item": [
        {
          "name": "Add Menu Item",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Cheeseburger Deluxe\",\n  \"description\": \"Juicy beef patty with cheese, lettuce, tomato\",\n  \"category\": \"BURGERS\",\n  \"price\": 5000,\n  \"preparationTime\": 15,\n  \"available\": true,\n  \"images\": [\n    \"https://example.com/burger.jpg\"\n  ],\n  \"tags\": [\"beef\", \"cheese\", \"popular\"]\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/inventory/items",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "inventory", "items"]
            }
          }
        },
        {
          "name": "Get All Menu Items",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/inventory/items",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "inventory", "items"]
            }
          }
        },
        {
          "name": "Update Menu Item",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"price\": 5500,\n  \"available\": true\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/inventory/items/:itemId",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "inventory", "items", ":itemId"],
              "variable": [
                {
                  "key": "itemId",
                  "value": "itm_burger_001"
                }
              ]
            }
          }
        },
        {
          "name": "Toggle Item Availability",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"available\": false\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/inventory/items/:itemId/availability",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "inventory", "items", ":itemId", "availability"],
              "variable": [
                {
                  "key": "itemId",
                  "value": "itm_burger_001"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Order Management",
      "item": [
        {
          "name": "Get Pending Orders",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/orders?status=PENDING",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "orders"],
              "query": [
                {
                  "key": "status",
                  "value": "PENDING"
                }
              ]
            }
          }
        },
        {
          "name": "Accept Order",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"preparationTime\": 20\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/orders/{{order_id}}/accept",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "orders", "{{order_id}}", "accept"]
            }
          }
        },
        {
          "name": "Reject Order",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Out of ingredients\"\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/orders/{{order_id}}/reject",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "orders", "{{order_id}}", "reject"]
            }
          }
        },
        {
          "name": "Mark Order Ready",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/orders/{{order_id}}/ready",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "orders", "{{order_id}}", "ready"]
            }
          }
        },
        {
          "name": "Get Order History",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/orders?startDate=2025-01-01&endDate=2025-01-31",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "orders"],
              "query": [
                {
                  "key": "startDate",
                  "value": "2025-01-01"
                },
                {
                  "key": "endDate",
                  "value": "2025-01-31"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Earnings & Wallet",
      "item": [
        {
          "name": "Get Earnings Summary",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/earnings/summary",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "earnings", "summary"]
            }
          }
        },
        {
          "name": "Get Wallet Balance",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/wallet/balance",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "wallet", "balance"]
            }
          }
        },
        {
          "name": "Request Payout",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"amount\": 100000,\n  \"bankDetails\": {\n    \"accountName\": \"Fresh Restaurant SARL\",\n    \"accountNumber\": \"1234567890\",\n    \"bankName\": \"Afriland First Bank\"\n  }\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/wallet/payout",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "wallet", "payout"]
            }
          }
        },
        {
          "name": "Get Payout History",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/wallet/payouts",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "wallet", "payouts"]
            }
          }
        }
      ]
    },
    {
      "name": "Settings",
      "item": [
        {
          "name": "Update Business Hours",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"businessHours\": {\n    \"monday\": { \"open\": \"08:00\", \"close\": \"22:00\" },\n    \"tuesday\": { \"open\": \"08:00\", \"close\": \"22:00\" },\n    \"wednesday\": { \"open\": \"08:00\", \"close\": \"22:00\" },\n    \"thursday\": { \"open\": \"08:00\", \"close\": \"22:00\" },\n    \"friday\": { \"open\": \"08:00\", \"close\": \"23:00\" },\n    \"saturday\": { \"open\": \"09:00\", \"close\": \"23:00\" },\n    \"sunday\": { \"open\": \"10:00\", \"close\": \"21:00\" }\n  }\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/settings/hours",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "settings", "hours"]
            }
          }
        },
        {
          "name": "Toggle Online Status",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{vendor_token}}"
                }
              ]
            },
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"isOnline\": true\n}"
            },
            "url": {
              "raw": "{{vendor_api_url}}/api/v1/settings/online-status",
              "host": ["{{vendor_api_url}}"],
              "path": ["api", "v1", "settings", "online-status"]
            }
          }
        }
      ]
    }
  ]
}
### Collection 3: Rider API
{
  "info": {
    "name": "Reeyo - Rider API",
    "description": "Delivery rider endpoints for order fulfillment",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register Rider",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('rider_token', response.data.token);",
                  "    pm.environment.set('rider_id', response.data.rider.riderId);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Emmanuel Nkeng\",\n  \"email\": \"emmanuel.rider@example.cm\",\n  \"phone\": \"+237670000020\",\n  \"password\": \"RiderPass123!\",\n  \"vehicleType\": \"MOTORCYCLE\",\n  \"vehicleDetails\": {\n    \"make\": \"Yamaha\",\n    \"model\": \"YBR 125\",\n    \"plateNumber\": \"DLA-1234-AB\",\n    \"color\": \"Black\"\n  },\n  \"bankDetails\": {\n    \"accountName\": \"Emmanuel Nkeng\",\n    \"accountNumber\": \"9876543210\",\n    \"bankName\": \"UBA Cameroun\"\n  },\n  \"documents\": {\n    \"nationalId\": \"doc_id_001\",\n    \"driverLicense\": \"doc_license_001\"\n  }\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/auth/register",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "auth", "register"]
            }
          }
        },
        {
          "name": "Login Rider",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('rider_token', response.data.token);",
                  "    pm.environment.set('rider_id', response.data.rider.riderId);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"emmanuel.rider@example.cm\",\n  \"password\": \"RiderPass123!\"\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/auth/login",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Availability",
      "item": [
        {
          "name": "Go Online",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"available\": true,\n  \"location\": {\n    \"lat\": 4.0511,\n    \"lng\": 9.7679\n  }\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/availability/online",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "availability", "online"]
            }
          }
        },
        {
          "name": "Go Offline",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"available\": false\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/availability/offline",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "availability", "offline"]
            }
          }
        },
        {
          "name": "Update Location",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"lat\": 4.0520,\n  \"lng\": 9.7685\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/location/update",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "location", "update"]
            },
            "description": "Update rider's current location (called every 5 seconds when online)"
          }
        }
      ]
    },
    {
      "name": "Delivery Requests",
      "item": [
        {
          "name": "Get Available Deliveries",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/available",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "available"]
            },
            "description": "Get delivery requests near rider's current location"
          }
        },
        {
          "name": "Accept Delivery",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"estimatedArrivalTime\": 10\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/{{order_id}}/accept",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "{{order_id}}", "accept"]
            }
          }
        },
        {
          "name": "Reject Delivery",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Too far from current location\"\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/{{order_id}}/reject",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "{{order_id}}", "reject"]
            }
          }
        }
      ]
    },
    {
      "name": "Active Deliveries",
      "item": [
        {
          "name": "Get Active Deliveries",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/active",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "active"]
            }
          }
        },
        {
          "name": "Arrive at Pickup",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/{{order_id}}/arrive-pickup",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "{{order_id}}", "arrive-pickup"]
            }
          }
        },
        {
          "name": "Pickup Complete",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"pickupPhoto\": \"https://s3.amazonaws.com/photos/pickup_123.jpg\",\n  \"notes\": \"Package collected successfully\"\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/{{order_id}}/pickup-complete",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "{{order_id}}", "pickup-complete"]
            }
          }
        },
        {
          "name": "Arrive at Dropoff",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/{{order_id}}/arrive-dropoff",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "{{order_id}}", "arrive-dropoff"]
            }
          }
        },
        {
          "name": "Complete Delivery",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"deliveryPhoto\": \"https://s3.amazonaws.com/photos/delivery_123.jpg\",\n  \"verificationCode\": \"1234\",\n  \"notes\": \"Delivered to customer\"\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/{{order_id}}/complete",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "{{order_id}}", "complete"]
            }
          }
        }
      ]
    },
    {
      "name": "Earnings & Wallet",
      "item": [
        {
          "name": "Get Earnings Summary",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/earnings/summary?period=week",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "earnings", "summary"],
              "query": [
                {
                  "key": "period",
                  "value": "week"
                }
              ]
            }
          }
        },
        {
          "name": "Get Wallet Balance",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/wallet/balance",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "wallet", "balance"]
            }
          }
        },
        {
          "name": "Request Payout",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"amount\": 50000,\n  \"bankDetails\": {\n    \"accountName\": \"Emmanuel Nkeng\",\n    \"accountNumber\": \"9876543210\",\n    \"bankName\": \"UBA Cameroun\"\n  }\n}"
            },
            "url": {
              "raw": "{{rider_api_url}}/api/v1/wallet/payout",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "wallet", "payout"]
            }
          }
        },
        {
          "name": "Get Delivery History",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{rider_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{rider_api_url}}/api/v1/deliveries/history?limit=50",
              "host": ["{{rider_api_url}}"],
              "path": ["api", "v1", "deliveries", "history"],
              "query": [
                {
                  "key": "limit",
                  "value": "50"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
### Collection 4: Admin API---
{
  "info": {
    "name": "Reeyo - Admin API",
    "description": "Administrative endpoints for platform management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Admin Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('admin_token', response.data.token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@reeyo.cm\",\n  \"password\": \"AdminSecure123!\",\n  \"otp\": \"123456\"\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/auth/login",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Feature Flags & Configuration",
      "item": [
        {
          "name": "Get System Configuration",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/config",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "config"]
            }
          }
        },
        {
          "name": "Enable Mart Service",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"serviceName\": \"mart\",\n  \"enabled\": true\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/config/toggle-service",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "config", "toggle-service"]
            },
            "description": "Enable Mart service without redeploying code"
          }
        },
        {
          "name": "Enable Package Service",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"serviceName\": \"packages\",\n  \"enabled\": true\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/config/toggle-service",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "config", "toggle-service"]
            }
          }
        },
        {
          "name": "Update Commission Rate",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"serviceName\": \"food\",\n  \"commissionRate\": 18\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/config/commission-rate",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "config", "commission-rate"]
            },
            "description": "Update commission rate for a service (e.g., from 15% to 18%)"
          }
        },
        {
          "name": "Update Full Configuration",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"food\": {\n    \"enabled\": true,\n    \"commissionRate\": 15,\n    \"minOrderAmount\": 2000,\n    \"deliveryFee\": 1500\n  },\n  \"mart\": {\n    \"enabled\": true,\n    \"commissionRate\": 10,\n    \"minOrderAmount\": 5000,\n    \"deliveryFee\": 2000\n  },\n  \"packages\": {\n    \"enabled\": true,\n    \"baseFee\": 2000,\n    \"feePerKm\": 500,\n    \"maxWeight\": 50\n  }\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/config",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "config"]
            }
          }
        }
      ]
    },
    {
      "name": "User Management",
      "item": [
        {
          "name": "Get All Users",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/users?page=1&limit=50",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "users"],
              "query": [
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "limit",
                  "value": "50"
                }
              ]
            }
          }
        },
        {
          "name": "Get User Details",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/users/{{user_id}}",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "users", "{{user_id}}"]
            }
          }
        },
        {
          "name": "Suspend User",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Fraudulent activity detected\"\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/users/{{user_id}}/suspend",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "users", "{{user_id}}", "suspend"]
            }
          }
        }
      ]
    },
    {
      "name": "Vendor Management",
      "item": [
        {
          "name": "Get Pending Vendor Applications",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/vendors?status=PENDING",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "vendors"],
              "query": [
                {
                  "key": "status",
                  "value": "PENDING"
                }
              ]
            }
          }
        },
        {
          "name": "Approve Vendor",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/vendors/{{vendor_id}}/approve",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "vendors", "{{vendor_id}}", "approve"]
            }
          }
        },
        {
          "name": "Reject Vendor",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Incomplete documentation\"\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/vendors/{{vendor_id}}/reject",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "vendors", "{{vendor_id}}", "reject"]
            }
          }
        },
        {
          "name": "Get All Vendors",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/vendors",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "vendors"]
            }
          }
        }
      ]
    },
    {
      "name": "Rider Management",
      "item": [
        {
          "name": "Get Pending Rider Applications",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/riders?status=PENDING",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "riders"],
              "query": [
                {
                  "key": "status",
                  "value": "PENDING"
                }
              ]
            }
          }
        },
        {
          "name": "Approve Rider",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/riders/{{rider_id}}/approve",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "riders", "{{rider_id}}", "approve"]
            }
          }
        },
        {
          "name": "Get Online Riders",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/riders/online",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "riders", "online"]
            }
          }
        }
      ]
    },
    {
      "name": "Payout Management",
      "item": [
        {
          "name": "Get Pending Payouts",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/payouts?status=PENDING",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "payouts"],
              "query": [
                {
                  "key": "status",
                  "value": "PENDING"
                }
              ]
            }
          }
        },
        {
          "name": "Approve Payout",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"transactionReference\": \"BANK_TXN_12345\",\n  \"notes\": \"Payment processed via bank transfer\"\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/payouts/:payoutId/approve",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "payouts", ":payoutId", "approve"],
              "variable": [
                {
                  "key": "payoutId",
                  "value": "pay_req_001"
                }
              ]
            }
          }
        },
        {
          "name": "Reject Payout",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"reason\": \"Bank details do not match account name\"\n}"
            },
            "url": {
              "raw": "{{admin_api_url}}/api/v1/payouts/:payoutId/reject",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "payouts", ":payoutId", "reject"],
              "variable": [
                {
                  "key": "payoutId",
                  "value": "pay_req_001"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Analytics & Reports",
      "item": [
        {
          "name": "Get Dashboard Stats",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/analytics/dashboard",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "analytics", "dashboard"]
            }
          }
        },
        {
          "name": "Get Revenue Report",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/analytics/revenue?startDate=2025-01-01&endDate=2025-01-31",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "analytics", "revenue"],
              "query": [
                {
                  "key": "startDate",
                  "value": "2025-01-01"
                },
                {
                  "key": "endDate",
                  "value": "2025-01-31"
                }
              ]
            }
          }
        },
        {
          "name": "Get Order Analytics",
          "request": {
            "auth": {
              "type": "bearer",
              "bearer": [
                {
                  "key": "token",
                  "value": "{{admin_token}}"
                }
              ]
            },
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{admin_api_url}}/api/v1/analytics/orders?period=month",
              "host": ["{{admin_api_url}}"],
              "path": ["api", "v1", "analytics", "orders"],
              "query": [
                {
                  "key": "period",
                  "value": "month"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
## 4. Testing Workflow Guide

### **Complete Testing Sequence (Copy-Paste Ready)**

```bash
# Step 1: Start the backend
cd reeyo-backend
docker-compose up -d

# Step 2: Wait for services to be ready (30 seconds)
sleep 30

# Step 3: Initialize database
node infrastructure/scripts/init-dynamodb.js

# Step 4: Check if all services are running
curl http://localhost:3001/health  # User API
curl http://localhost:3002/health  # Vendor API
curl http://localhost:3003/health  # Rider API
curl http://localhost:3004/health  # Admin API
```

### **Recommended Testing Order in Postman**

1. **Admin API First** → Set up configuration
   - Login as Admin
   - Enable Food service
   - Set commission rates

2. **Vendor API** → Register a restaurant
   - Register Vendor
   - Login Vendor
   - Add menu items
   - Go online

3. **Rider API** → Register a delivery rider
   - Register Rider
   - Login Rider
   - Go online
   - Update location

4. **User API** → Place orders
   - Register User
   - Login User
   - Get app config (see enabled services)
   - Search vendors
   - Create food order

5. **Complete Flow** → Test full order lifecycle
   - User creates order
   - Vendor accepts order
   - Rider accepts delivery
   - Rider completes delivery
   - Check wallet balances (all parties)
   - Vendor requests payout
   - Admin approves payout

---

## 5. Quick Test Script (Automated)

Create a file `test-flow.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost"
USER_API="$BASE_URL:3001/api/v1"
VENDOR_API="$BASE_URL:3002/api/v1"
RIDER_API="$BASE_URL:3003/api/v1"
ADMIN_API="$BASE_URL:3004/api/v1"

echo "🧪 Testing Reeyo Backend..."

# Test health endpoints
echo "1. Checking service health..."
curl -s $USER_API/health || echo "❌ User API not responding"
curl -s $VENDOR_API/health || echo "❌ Vendor API not responding"
curl -s $RIDER_API/health || echo "❌ Rider API not responding"
curl -s $ADMIN_API/health || echo "❌ Admin API not responding"

# Register and login user
echo "2. Registering user..."
USER_RESPONSE=$(curl -s -X POST $USER_API/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+237670000001",
    "password": "Test123!"
  }')

USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.data.token')
echo "✅ User token: $USER_TOKEN"

# Get app config
echo "3. Getting app configuration..."
curl -s $USER_API/config | jq '.data.services'

echo "✅ All tests completed!"
```

Run it:
```bash
chmod +x test-flow.sh
./test-flow.sh
```

---

## 6. Postman Tips

### Auto-Save Tokens
All collections include **Test Scripts** that automatically save tokens to environment variables. You don't need to copy-paste tokens manually!

### Testing Real-Time Features
For WebSocket testing (rider location updates), use:
- **Socket.io Client**: A browser extension or standalone tool
- **Postman's WebSocket feature** (if available in your version)

### Example WebSocket Connection:
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3005/rider', {
  auth: {
    token: 'YOUR_RIDER_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to socket server');
  
  // Send location update
  socket.emit('location_update', {
    lat: 4.0511,
    lng: 9.7679,
    orderId: 'ord_food_001'
  });
});

socket.on('delivery_request', (data) => {
  console.log('New delivery request:', data);
});
```

---

## Summary

You now have:

✅ **4 Complete Postman Collections** - One for each API (User, Vendor, Rider, Admin)  
✅ **Environment Configuration** - Pre-configured variables for local development  
✅ **Auto-Token Management** - Tokens are saved automatically after login  
✅ **Testing Workflow Guide** - Step-by-step order for testing  
✅ **Automated Test Script** - Quick health check script  

**Next Steps:**
1. Import the Postman environment and collections
2. Start your backend with `docker-compose up -d`
3. Follow the testing order: Admin → Vendor → Rider → User
4. Test the complete order flow from creation to delivery

All tokens are automatically saved to environment variables after successful authentication, so you can seamlessly test across different endpoints without manual token management!