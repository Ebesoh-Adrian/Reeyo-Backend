# 🚀 Reeyo Delivery Platform - Complete Monorepo

**Enterprise-grade delivery platform built with TypeScript, Node.js, React, and AWS**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 📦 What's Included

This monorepo contains the **complete** Reeyo delivery platform:

### **APIs (Backend Services)**
- 🛍️ **User API** (Port 3001) - Customer mobile app backend
- 🏪 **Vendor API** (Port 3002) - Restaurant/business management  
- 🏍️ **Rider API** (Port 3003) - Delivery driver operations
- 👨‍💼 **Admin API** (Port 3005) - Platform administration

### **Frontend Applications**
- 💻 **Admin Dashboard** (Port 3000) - Next.js web interface

### **Shared Libraries**
- 🗄️ **core-db** - DynamoDB models & repositories
- 💰 **wallet-engine** - ACID financial transactions
- 📬 **notifications** - Push, SMS, Email services
- 🔌 **socket-server** (Port 3004) - Real-time WebSocket server
- 🛠️ **shared-utils** - Logger, JWT, validators

### **Infrastructure**
- 🐳 Docker configurations
- ☸️ Kubernetes manifests
- 🏗️ Terraform IaC
- 📜 Deployment scripts

---

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Customer   │    │ Restaurant  │    │   Driver    │    │    Admin    │
│  (Mobile)   │    │   (Web)     │    │  (Mobile)   │    │    (Web)    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                   │                  │
       │ HTTP/WS          │ HTTP/WS           │ HTTP/WS          │ HTTP
       │                  │                   │                  │
┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
│  User API   │    │ Vendor API  │    │  Rider API  │    │  Admin API  │
│  :3001      │    │  :3002      │    │  :3003      │    │  :3005      │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                   │                  │
       └──────────────────┴───────────────────┴──────────────────┘
                                     │
                           ┌─────────▼──────────┐
                           │  Shared Libraries  │
                           │  Socket Server     │
                           └─────────┬──────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
       ┌──────▼──────┐      ┌────────▼────────┐      ┌─────▼─────┐
       │  DynamoDB   │      │  Redis Cluster  │      │    AWS    │
       │  (NoSQL)    │      │  (Cache/Geo)    │      │  Services │
       └─────────────┘      └─────────────────┘      └───────────┘
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** (optional)
- **AWS Account** (for production)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd reeyo-platform

# Install all dependencies
npm install

# Copy environment files
cp apps/user-api/.env.example apps/user-api/.env
cp apps/vendor-api/.env.example apps/vendor-api/.env
cp apps/rider-api/.env.example apps/rider-api/.env
cp apps/admin-api/.env.example apps/admin-api/.env
cp admin-dashboard/.env.example admin-dashboard/.env

# Configure all .env files with your credentials
```

### Running Locally

**Option 1: Run all services separately**
```bash
# Terminal 1: User API
npm run dev:user

# Terminal 2: Vendor API
npm run dev:vendor

# Terminal 3: Rider API
npm run dev:rider

# Terminal 4: Admin API
npm run dev:admin

# Terminal 5: Socket Server
npm run dev:socket

# Terminal 6: Admin Dashboard
npm run dev:dashboard
```

**Option 2: Use PM2 (Recommended)**
```bash
npm run start:all
pm2 monit
```

**Option 3: Docker Compose**
```bash
docker-compose up -d
```

### Access Points

- User API: http://localhost:3001/api/v1
- Vendor API: http://localhost:3002/api/v1
- Rider API: http://localhost:3003/api/v1
- Admin API: http://localhost:3005/api/v1
- Admin Dashboard: http://localhost:3000
- Socket Server: ws://localhost:3004

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** - Initial setup guide
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture deep dive
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide
- **[SCALING.md](docs/SCALING.md)** - Scaling strategies
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Development guidelines

---

## 🏢 Project Structure

```
reeyo-platform/
├── apps/                       # Application services
│   ├── user-api/              # Customer backend
│   ├── vendor-api/            # Restaurant backend
│   ├── rider-api/             # Driver backend
│   ├── admin-api/             # Admin backend
│   └── admin-dashboard/       # Admin web UI
│
├── libs/                       # Shared libraries
│   ├── core-db/               # Database layer
│   ├── wallet-engine/         # Financial transactions
│   ├── notifications/         # Multi-channel notifications
│   ├── socket-server/         # Real-time server
│   └── shared-utils/          # Common utilities
│
├── infrastructure/             # Infrastructure as Code
│   ├── terraform/             # AWS resources
│   ├── docker/                # Docker configs
│   ├── kubernetes/            # K8s manifests
│   └── scripts/               # Automation scripts
│
├── docs/                       # Documentation
├── package.json               # Root workspace config
└── ecosystem.config.js        # PM2 configuration
```

---

## 🚀 Features

### Core Capabilities
- ✅ Real-time order tracking (WebSocket + GPS)
- ✅ Multi-party payment splitting (ACID transactions)
- ✅ Distance-based delivery pricing
- ✅ Push notifications (AWS SNS)
- ✅ SMS verification (Twilio)
- ✅ Email notifications (SendGrid)
- ✅ Document verification system
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive analytics
- ✅ Automated payouts

### Technical Highlights
- 🔒 JWT authentication with bcrypt
- 🗄️ DynamoDB with GSIs for scalability
- 💾 Redis for caching and geospatial queries
- 📊 Real-time analytics and reporting
- 🐳 Docker containerization
- ☸️ Kubernetes-ready
- 🏗️ Infrastructure as Code (Terraform)
- 📈 Horizontal scaling support

---

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Test specific service
npm run test --workspace=@reeyo/user-api

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

---

## 🚀 Deployment

### AWS Deployment (Recommended)

```bash
# Configure AWS credentials
aws configure

# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Deploy applications
npm run build:all
npm run deploy:production
```

Detailed deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📊 Monitoring

- **Logs**: Winston + CloudWatch Logs
- **Metrics**: CloudWatch Metrics
- **APM**: AWS X-Ray / DataDog
- **Alerts**: CloudWatch Alarms
- **Uptime**: Pingdom / UptimeRobot

---

## 🔐 Security

- JWT tokens with 30-day expiration
- Bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS protection
- Input validation (express-validator)
- SQL injection prevention
- XSS protection

---

## 📈 Scaling

The platform is designed to scale:

- **Horizontal Scaling**: Add more server instances
- **Database**: DynamoDB auto-scaling
- **Cache**: Redis cluster mode
- **CDN**: CloudFront for static assets
- **Load Balancer**: AWS ALB
- **Auto-scaling**: ECS with target tracking

Scaling guide: [docs/SCALING.md](docs/SCALING.md)

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 💬 Support

- 📧 Email: support@reeyo.cm
- 📖 Docs: https://docs.reeyo.cm
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Join our community]

---

## 🎯 Roadmap

- [ ] Mobile apps (React Native)
- [ ] Multi-language support
- [ ] AI-powered route optimization
- [ ] Subscription plans for vendors
- [ ] Loyalty rewards program
- [ ] Advanced analytics dashboard
- [ ] White-label solution

---

**Built with ❤️ for the delivery industry**

**Ready to launch in production!** 🚀
