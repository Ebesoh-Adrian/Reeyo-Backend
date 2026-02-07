# 🚀 COMPLETE INSTALLATION GUIDE - Reeyo Platform

## 📋 Table of Contents
1. [Prerequisites Installation](#prerequisites)
2. [Monorepo Setup](#monorepo-setup)
3. [Individual API Setup](#api-setup)
4. [Database Setup](#database-setup)
5. [Verification](#verification)

---

## 1️⃣ PREREQUISITES INSTALLATION

### **A. Install Node.js 20+**

**macOS:**
```bash
# Using Homebrew
brew install node@20

# Or download from https://nodejs.org/
```

**Ubuntu/Debian Linux:**
```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

**Windows:**
```bash
# Download installer from https://nodejs.org/
# Run installer and follow prompts
# Verify in Command Prompt or PowerShell
node --version
npm --version
```

### **B. Install Git**

**macOS:**
```bash
brew install git
```

**Ubuntu/Debian:**
```bash
sudo apt-get install git
```

**Windows:**
```bash
# Download from https://git-scm.com/download/win
# Run installer
```

### **C. Install Docker (Optional but Recommended)**

**macOS:**
```bash
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
# Install and start Docker Desktop
```

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

**Windows:**
```bash
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
# Run installer and restart
```

### **D. Install PM2 (Process Manager)**

```bash
npm install -g pm2

# Verify
pm2 --version
```

### **E. Install AWS CLI (For Production Deployment)**

**macOS:**
```bash
brew install awscli
```

**Ubuntu/Debian:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
```bash
# Download from https://aws.amazon.com/cli/
# Run MSI installer
```

**Configure AWS:**
```bash
aws configure
# Enter your AWS credentials when prompted
```

---

## 2️⃣ MONOREPO SETUP

### **Step 1: Extract the Archive**

```bash
# Navigate to your projects folder
cd ~/projects  # or wherever you want

# Extract the downloaded file
tar -xzf reeyo-platform-complete.tar.gz

# Navigate into the project
cd reeyo-monorepo

# Verify structure
ls -la
```

**You should see:**
```
apps/
libs/
docs/
infrastructure/
package.json
ecosystem.config.js
docker-compose.yml
README.md
```

### **Step 2: Install Root Dependencies**

```bash
# Install all dependencies for the entire monorepo
npm install

# This will:
# 1. Install root dependencies
# 2. Install dependencies for all apps (user-api, vendor-api, rider-api, admin-api, admin-dashboard)
# 3. Install dependencies for all libs (core-db, wallet-engine, etc.)
```

**Expected output:**
```
npm WARN deprecated ...
added 1250 packages, and audited 1251 packages in 45s

150 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**If you see errors:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules

# Reinstall
npm install
```

---

## 3️⃣ INDIVIDUAL API SETUP

### **A. USER API (Customer Backend)**

```bash
cd apps/user-api

# Dependencies are already installed by root npm install
# But you can verify with:
npm list

# Expected key dependencies:
# ├── express@4.18.2
# ├── typescript@5.3.3
# ├── aws-sdk@2.1498.0
# ├── bcrypt@5.1.1
# ├── jsonwebtoken@9.0.2
# ├── express-validator@7.0.1
# └── dotenv@16.3.1
```

**Create Environment File:**
```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

**Configure `.env`:**
```env
# Server Configuration
NODE_ENV=development
PORT=3001
API_VERSION=v1

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-please
JWT_EXPIRES_IN=30d

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# DynamoDB Configuration
DYNAMODB_ENDPOINT=http://localhost:8000  # For local development
DYNAMODB_TABLE_PREFIX=reeyo-dev

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@reeyo.cm

# AWS SNS (Push Notifications)
AWS_SNS_PLATFORM_APPLICATION_ARN_IOS=arn:aws:sns:...
AWS_SNS_PLATFORM_APPLICATION_ARN_ANDROID=arn:aws:sns:...

# Socket Server
SOCKET_SERVER_URL=http://localhost:3004

# Business Configuration
BASE_DELIVERY_FEE=1000
PER_KM_FEE=200
FREE_DELIVERY_THRESHOLD=10000
COMMISSION_RATE=0.15

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Build TypeScript:**
```bash
npm run build

# This compiles TypeScript to JavaScript in the dist/ folder
```

**Run Development Server:**
```bash
npm run dev

# You should see:
# 🚀 Reeyo User API started
# 📍 Server: http://localhost:3001
# 🏥 Health: http://localhost:3001/api/v1/health
```

---

### **B. VENDOR API (Restaurant Backend)**

```bash
cd ../vendor-api

# Copy environment file
cp .env.example .env
nano .env
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=3002  # Different port!
API_VERSION=v1

# Copy all other variables from User API .env
# JWT_SECRET should be the SAME across all APIs
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-please
# ... (same as User API for shared configs)
```

**Build and Run:**
```bash
npm run build
npm run dev

# Should start on port 3002
```

---

### **C. RIDER API (Driver Backend)**

```bash
cd ../rider-api

# Copy and configure
cp .env.example .env
nano .env
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=3003  # Different port!
API_VERSION=v1

# Same shared configs as above
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-please
# ...
```

**Build and Run:**
```bash
npm run build
npm run dev

# Should start on port 3003
```

---

### **D. ADMIN API (Platform Management)**

```bash
cd ../admin-api

# Copy and configure
cp .env.example .env
nano .env
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=3005  # Different port!
API_VERSION=v1

# Shared configs
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-please

# Admin-specific
SUPER_ADMIN_EMAIL=admin@reeyo.cm
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!@#
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000

# ... (rest same as other APIs)
```

**Build and Run:**
```bash
npm run build
npm run dev

# Should start on port 3005
```

---

### **E. ADMIN DASHBOARD (Next.js Frontend)**

```bash
cd ../admin-dashboard

# Copy environment
cp .env.example .env
nano .env
```

**Configure `.env`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1

# For production:
# NEXT_PUBLIC_API_URL=https://api.reeyo.cm/api/v1
```

**Install and Run:**
```bash
# Dependencies already installed by root npm install
npm run dev

# Should start on port 3000
# Navigate to: http://localhost:3000
```

---

### **F. SOCKET SERVER (Real-time WebSocket)**

```bash
cd ../../libs/socket-server

# Copy environment
cp .env.example .env
nano .env
```

**Configure `.env`:**
```env
NODE_ENV=development
PORT=3004
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Build and Run:**
```bash
npm run build
npm run dev

# Should start on port 3004
```

---

## 4️⃣ DATABASE SETUP

### **A. Local DynamoDB (Development)**

**Install DynamoDB Local:**
```bash
# Download DynamoDB Local
mkdir ~/dynamodb-local
cd ~/dynamodb-local
curl -O https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Start DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
```

**Create Tables:**
```bash
cd ~/projects/reeyo-monorepo/infrastructure/scripts

# Run table creation script
node create-tables.js
```

**create-tables.js:**
```javascript
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
});

const dynamodb = new AWS.DynamoDB();

const tables = [
  {
    TableName: 'reeyo-dev-users',
    KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'phone', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'phone-index',
        KeySchema: [{ AttributeName: 'phone', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'email-index',
        KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  // ... More tables (vendors, riders, orders, wallets, transactions)
];

async function createTables() {
  for (const table of tables) {
    try {
      await dynamodb.createTable(table).promise();
      console.log(`✅ Created table: ${table.TableName}`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`⚠️  Table exists: ${table.TableName}`);
      } else {
        console.error(`❌ Error creating ${table.TableName}:`, error);
      }
    }
  }
}

createTables();
```

### **B. Redis (Caching & Geospatial)**

**Install Redis:**

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
```bash
# Download from https://github.com/microsoftarchive/redis/releases
# Or use Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

**Test Redis:**
```bash
redis-cli ping
# Should return: PONG
```

---

## 5️⃣ VERIFICATION

### **A. Check All Services**

Open 6 terminals and run:

**Terminal 1: User API**
```bash
cd ~/projects/reeyo-monorepo/apps/user-api
npm run dev
```

**Terminal 2: Vendor API**
```bash
cd ~/projects/reeyo-monorepo/apps/vendor-api
npm run dev
```

**Terminal 3: Rider API**
```bash
cd ~/projects/reeyo-monorepo/apps/rider-api
npm run dev
```

**Terminal 4: Admin API**
```bash
cd ~/projects/reeyo-monorepo/apps/admin-api
npm run dev
```

**Terminal 5: Socket Server**
```bash
cd ~/projects/reeyo-monorepo/libs/socket-server
npm run dev
```

**Terminal 6: Admin Dashboard**
```bash
cd ~/projects/reeyo-monorepo/apps/admin-dashboard
npm run dev
```

### **B. Test Health Endpoints**

```bash
# User API
curl http://localhost:3001/api/v1/health

# Vendor API
curl http://localhost:3002/api/v1/health

# Rider API
curl http://localhost:3003/api/v1/health

# Admin API
curl http://localhost:3005/api/v1/health

# All should return:
# {"success":true,"message":"Reeyo [Service] API is running","timestamp":"..."}
```

### **C. Test User Registration**

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+237670000001",
    "email": "john@example.com",
    "password": "Test123!@#"
  }'

# Should return user data and JWT token
```

### **D. Access Admin Dashboard**

```bash
# Open browser
open http://localhost:3000

# Or navigate manually to:
http://localhost:3000

# Login with:
# Email: admin@reeyo.cm
# Password: (your SUPER_ADMIN_PASSWORD from .env)
```

---

## 🐳 ALTERNATIVE: DOCKER INSTALLATION

### **Single Command Setup:**

```bash
cd ~/projects/reeyo-monorepo

# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**This automatically:**
- ✅ Builds all Docker images
- ✅ Starts all APIs
- ✅ Starts Admin Dashboard
- ✅ Starts Redis
- ✅ Configures networking
- ✅ Sets up health checks

---

## 🔧 TROUBLESHOOTING

### **Port Already in Use**

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)

# Or kill all Node processes
pkill -9 node
```

### **Dependencies Not Installing**

```bash
# Clear npm cache
npm cache clean --force

# Delete everything and reinstall
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
npm install
```

### **TypeScript Build Errors**

```bash
# Rebuild all
npm run build:all

# Or rebuild specific service
cd apps/user-api
rm -rf dist
npm run build
```

### **Database Connection Errors**

```bash
# Check DynamoDB Local is running
curl http://localhost:8000

# Restart DynamoDB Local
cd ~/dynamodb-local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000

# Check Redis
redis-cli ping
# Should return: PONG
```

---

## 📦 COMPLETE DEPENDENCY LIST

### **Root Dependencies:**
```json
{
  "@types/node": "^20.10.5",
  "typescript": "^5.3.3",
  "eslint": "^8.56.0",
  "prettier": "^3.1.1"
}
```

### **Each API Service:**
```json
{
  "express": "^4.18.2",
  "express-validator": "^7.0.1",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "compression": "^1.7.4",
  "dotenv": "^16.3.1",
  "aws-sdk": "^2.1498.0",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "uuid": "^9.0.1",
  "winston": "^3.11.0"
}
```

### **Admin Dashboard:**
```json
{
  "next": "14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.5",
  "@tanstack/react-query": "^5.17.19",
  "recharts": "^2.10.3",
  "lucide-react": "^0.309.0",
  "zustand": "^4.4.7",
  "tailwindcss": "^3.3.0"
}
```

---

## ✅ INSTALLATION COMPLETE!

Your Reeyo Platform is now fully installed and running!

**Next Steps:**
1. ✅ Read ARCHITECTURE.md for system design
2. ✅ Read API_DOCUMENTATION.md for API details
3. ✅ Test all endpoints with Postman
4. ✅ Start building mobile apps
5. ✅ Deploy to production (see DEPLOYMENT.md)

**Support:**
- 📚 Documentation: /docs folder
- 🐛 Issues: Create GitHub issues
- 💬 Community: Join Discord

**Happy Building! 🚀**
