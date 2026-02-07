# 🚀 Getting Started with Reeyo Platform

This guide will help you set up the complete Reeyo delivery platform on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Recommended Tools
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Postman** for API testing ([Download](https://www.postman.com/))
- **VS Code** as IDE ([Download](https://code.visualstudio.com/))
  - Extension: ESLint
  - Extension: Prettier
  - Extension: TypeScript and JavaScript Language Features

### Cloud Accounts (for production)
- **AWS Account** ([Sign up](https://aws.amazon.com/))
- **Twilio Account** for SMS ([Sign up](https://www.twilio.com/))
- **SendGrid Account** for Email ([Sign up](https://sendgrid.com/))

---

## 📥 Installation

### Step 1: Clone Repository

```bash
git clone <your-repository-url>
cd reeyo-platform
```

### Step 2: Install Dependencies

```bash
# Install all dependencies for monorepo
npm install

# This will install dependencies for:
# - Root workspace
# - All apps (user-api, vendor-api, rider-api, admin-api, admin-dashboard)
# - All libs (core-db, wallet-engine, notifications, etc.)
```

**Expected output:**
```
added 1250 packages in 45s
```

### Step 3: Configure Environment Variables

Each service needs its own `.env` file:

#### User API
```bash
cd apps/user-api
cp .env.example .env
nano .env  # or use your preferred editor
```

**Required variables:**
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=reeyo-dev
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SENDGRID_API_KEY=your-sendgrid-key
```

Repeat for:
- `apps/vendor-api/.env` (PORT=3002)
- `apps/rider-api/.env` (PORT=3003)
- `apps/admin-api/.env` (PORT=3005)
- `apps/admin-dashboard/.env`

---

## 🚀 Running the Platform

### Option 1: Run All Services (Recommended for Development)

Open 6 terminals and run:

```bash
# Terminal 1: User API
cd apps/user-api
npm run dev

# Terminal 2: Vendor API
cd apps/vendor-api
npm run dev

# Terminal 3: Rider API
cd apps/rider-api
npm run dev

# Terminal 4: Admin API
cd apps/admin-api
npm run dev

# Terminal 5: Socket Server
cd libs/socket-server
npm run dev

# Terminal 6: Admin Dashboard
cd apps/admin-dashboard
npm run dev
```

### Option 2: Use PM2 Process Manager (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
npm run start:all

# Monitor services
pm2 monit

# View logs
pm2 logs

# Stop all services
npm run stop:all
```

### Option 3: Docker Compose (Easiest)

```bash
docker-compose up -d
```

---

## ✅ Verify Installation

### Check Services Health

```bash
# User API
curl http://localhost:3001/api/v1/health

# Vendor API
curl http://localhost:3002/api/v1/health

# Rider API
curl http://localhost:3003/api/v1/health

# Admin API
curl http://localhost:3005/api/v1/health

# Admin Dashboard
open http://localhost:3000
```

**Expected responses:**
```json
{
  "success": true,
  "message": "Reeyo [Service] API is running",
  "timestamp": "2026-01-16T10:00:00.000Z"
}
```

---

## 🧪 Test the APIs

### 1. Register a User

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
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+237670000001",
    "password": "Test123!@#"
  }'
```

**Save the token from response!**

### 3. Get Profile

```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Access Admin Dashboard

1. Navigate to http://localhost:3000
2. Login with default credentials:
   - **Email**: admin@reeyo.cm
   - **Password**: (from your admin-api .env: SUPER_ADMIN_PASSWORD)

---

## 🗄️ Database Setup

### Local DynamoDB (for development)

```bash
# Install DynamoDB Local
npm install -g dynamodb-local

# Start DynamoDB Local
dynamodb-local

# Create tables
cd infrastructure/scripts
npm run setup:db
```

### AWS DynamoDB (for production)

See [AWS_SETUP.md](AWS_SETUP.md) for complete guide.

---

## 🔧 Development Workflow

### 1. Create a New Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

Edit files in your preferred IDE (VS Code recommended).

### 3. Test Locally

```bash
# Run tests
npm run test:all

# Run linter
npm run lint:all

# Format code
npm run format
```

### 4. Commit & Push

```bash
git add .
git commit -m "feat: add new feature"
git push origin feature/my-new-feature
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001

# Kill process
kill -9 $(lsof -ti:3001)
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build:all
```

---

## 📚 Next Steps

- **[API Documentation](API_DOCUMENTATION.md)** - Learn about all endpoints
- **[Architecture](ARCHITECTURE.md)** - Understand system design
- **[Deployment](DEPLOYMENT.md)** - Deploy to production
- **[Testing](TESTING.md)** - Write and run tests

---

## 💬 Need Help?

- **Slack**: [Join our workspace]
- **Email**: support@reeyo.cm
- **GitHub Issues**: [Report a bug]

---

**Congratulations! Your Reeyo platform is running!** 🎉
