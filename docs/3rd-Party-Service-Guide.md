# 🔌 Third-Party Services Guide - Complete Setup

## Overview
This document lists **ALL** third-party services used in the Reeyo backend, their purpose, setup instructions, and cost estimates.

---

# 📋 Complete Service List

| Service | Purpose | Required? | Cost |
|---------|---------|-----------|------|
| **AWS DynamoDB** | Database | ✅ Yes | ~$25/month |
| **AWS S3** | File storage | ✅ Yes | ~$5/month |
| **AWS SNS** | Push notifications | ✅ Yes | ~$2/month |
| **AWS Lambda** | API hosting | ✅ Yes | ~$0-20/month |
| **AWS API Gateway** | API routing | ✅ Yes | ~$3/month |
| **Redis/ElastiCache** | Caching + geospatial | ✅ Yes | ~$13/month |
| **Campay** | Mobile money payments | ✅ Yes | Transaction fees |
| **Twilio** | SMS notifications | ⚠️ Optional | Pay per SMS |
| **SendGrid** | Email service | ⚠️ Optional | Free tier available |
| **Sentry** | Error tracking | ⚠️ Optional | Free tier available |

**Total Estimated Monthly Cost**: $50-100 (for 1000+ orders/month)

---

# 1. 🟧 AWS Services

## 1.1 AWS Account Setup

### Step 1: Create AWS Account
```
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email, password, and account name
4. Add payment method (required)
5. Choose "Basic Support - Free"
```

### Step 2: Create IAM User (Security Best Practice)
```bash
# Never use root account for daily operations

1. AWS Console → IAM → Users → Add User
2. Username: reeyo-backend-user
3. Access type: 
   ✅ Programmatic access (for APIs)
   ✅ AWS Management Console access (for you)
4. Attach policies:
   - AmazonDynamoDBFullAccess
   - AmazonS3FullAccess
   - AmazonSNSFullAccess
   - AWSLambdaFullAccess
   - AmazonAPIGatewayAdministrator
5. Save Access Key ID and Secret Access Key
```

### Step 3: Configure AWS CLI
```bash
# Install AWS CLI
# macOS
brew install awscli

# Windows
choco install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure
aws configure

# Enter when prompted:
AWS Access Key ID: AKIA...
AWS Secret Access Key: ...
Default region: us-east-1
Default output format: json
```

---

## 1.2 DynamoDB Setup

### Purpose
Primary database for all data (users, vendors, orders, wallets, etc.)

### Why DynamoDB?
- **Serverless** - No server management
- **Auto-scaling** - Handles traffic spikes
- **Pay-per-request** - Only pay for what you use
- **Fast** - Single-digit millisecond latency
- **Global** - Can replicate across regions

### Create Table (Development)
```bash
# Create local DynamoDB table (for development)
aws dynamodb create-table \
    --table-name ReeYo-Development \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"GSI1\",
                \"KeySchema\": [
                    {\"AttributeName\":\"GSI1PK\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"GSI1SK\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            },
            {
                \"IndexName\": \"GSI2\",
                \"KeySchema\": [
                    {\"AttributeName\":\"GSI2PK\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"GSI2SK\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]" \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000 \
    --region us-east-1
```

### Create Production Table
```bash
# Same command but remove --endpoint-url flag
# Use AWS Console for easier setup:

1. AWS Console → DynamoDB → Create Table
2. Table name: ReeYo-Production
3. Partition key: PK (String)
4. Sort key: SK (String)
5. Table settings: Customize settings
6. Capacity mode: On-demand
7. Encryption: AWS owned key
8. Create 2 Global Secondary Indexes (GSI1, GSI2)
```

### Environment Variables
```env
AWS_REGION=us-east-1
DYNAMODB_TABLE=ReeYo-Production
# For local development
DYNAMODB_ENDPOINT=http://localhost:8000
```

### Cost Estimate
- **Free Tier**: 25 GB storage + 25 RCU/WCU
- **Production**: ~$0.25 per million read/write requests
- **Estimate**: $25-50/month for 10,000 orders/month

---

## 1.3 AWS S3 Setup

### Purpose
Store uploaded files (vendor logos, menu images, delivery photos, documents)

### Create Bucket
```bash
# Via CLI
aws s3 mb s3://reeyo-uploads-production --region us-east-1

# Set bucket policy for public read (images only)
aws s3api put-bucket-policy --bucket reeyo-uploads-production --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::reeyo-uploads-production/public/*"
    }
  ]
}'

# Enable CORS
aws s3api put-bucket-cors --bucket reeyo-uploads-production --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://reeyo.cm", "https://app.reeyo.cm"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}'
```

### Or via AWS Console
```
1. S3 → Create bucket
2. Bucket name: reeyo-uploads-production
3. Region: us-east-1
4. Block all public access: OFF (for public images)
5. Versioning: Enable (recommended)
6. Encryption: Enable (AWS-KMS)
7. Create bucket
8. Permissions → Bucket Policy → Add policy above
9. Permissions → CORS → Add CORS config above
```

### Folder Structure
```
reeyo-uploads-production/
├── vendors/
│   ├── logos/
│   ├── covers/
│   └── documents/
├── menu-items/
├── delivery-photos/
│   ├── pickup/
│   └── dropoff/
└── users/
    └── profiles/
```

### Environment Variables
```env
S3_BUCKET_NAME=reeyo-uploads-production
S3_REGION=us-east-1
```

### Cost Estimate
- **Free Tier**: 5 GB storage + 20,000 GET/2,000 PUT requests
- **Production**: $0.023 per GB/month
- **Estimate**: $5-10/month for 100 GB

---

## 1.4 AWS SNS (Push Notifications)

### Purpose
Send push notifications to mobile apps (iOS and Android)

### Setup Steps

#### Step 1: Create Platform Application (iOS)
```
1. AWS Console → SNS → Mobile → Push notifications
2. Create platform application
3. Platform: Apple iOS (APNS)
4. Application name: ReeYo-iOS-Production
5. Upload P12 certificate (from Apple Developer)
6. Save ARN (Amazon Resource Name)
```

#### Step 2: Create Platform Application (Android)
```
1. AWS Console → SNS → Mobile → Push notifications
2. Create platform application
3. Platform: Google Firebase Cloud Messaging (FCM)
4. Application name: ReeYo-Android-Production
5. API key: (from Firebase Console)
6. Save ARN
```

#### Step 3: Get Firebase Credentials
```
1. Go to https://console.firebase.google.com
2. Create project: ReeYo
3. Add Android app
4. Download google-services.json
5. Project settings → Cloud Messaging → Server key
6. Copy server key to AWS SNS
```

### Environment Variables
```env
SNS_PLATFORM_APPLICATION_ARN=arn:aws:sns:us-east-1:xxxxxxxxxxxx:app/GCM/ReeYo
SNS_REGION=us-east-1
```

### Cost Estimate
- **Free Tier**: 1 million requests/month
- **Production**: $0.50 per million notifications
- **Estimate**: $2-5/month

---

## 1.5 AWS Lambda (Optional - Serverless Hosting)

### Purpose
Host API endpoints without managing servers

### Setup via Serverless Framework
```bash
# Install Serverless Framework
npm install -g serverless

# Deploy
cd reeyo-backend
serverless deploy --stage production
```

### Cost Estimate
- **Free Tier**: 1 million requests + 400,000 GB-seconds/month
- **Production**: $0.20 per million requests
- **Estimate**: $0-20/month for 100,000 requests/month

---

## 1.6 Redis/ElastiCache

### Purpose
- **Caching**: Fast data access
- **Geospatial**: Find nearby riders using GEORADIUS
- **Session storage**: Store active connections
- **Rate limiting**: Track API usage

### Setup ElastiCache (Production)
```
1. AWS Console → ElastiCache → Redis
2. Create cluster
3. Name: reeyo-redis-production
4. Node type: cache.t3.micro (smallest)
5. Number of replicas: 0 (for development)
6. VPC: Default
7. Security group: Allow port 6379 from Lambda
8. Create
```

### Setup Redis Locally (Development)
```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# macOS
brew install redis
redis-server

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

### Environment Variables
```env
REDIS_HOST=reeyo-redis-production.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local
```

### Cost Estimate
- **Production**: cache.t3.micro = $13/month
- **With replica**: $26/month

---

# 2. 📱 Campay (Mobile Money Payment)

## Purpose
Process payments via MTN Mobile Money and Orange Money in Cameroon

## Why Campay?
- **Only viable option in Cameroon** for mobile money
- Supports MTN and Orange
- API-based integration
- Automatic operator detection

## Setup Steps

### Step 1: Create Account
```
1. Go to https://campay.net
2. Click "Sign Up"
3. Business registration required:
   - Company name
   - Tax ID
   - Business documents
4. Wait for approval (2-5 business days)
```

### Step 2: Get API Credentials
```
1. Login to Campay dashboard
2. Settings → API Credentials
3. Copy:
   - Username
   - Password
   - App Key
4. Test in sandbox first
```

### Step 3: Configure Webhooks
```
1. Campay Dashboard → Webhooks
2. Add webhook URL: https://api.reeyo.cm/webhooks/campay
3. Select events:
   - Payment successful
   - Payment failed
   - Disbursement completed
```

### Environment Variables
```env
CAMPAY_BASE_URL=https://api.campay.net/v1
CAMPAY_USERNAME=your_campay_username
CAMPAY_PASSWORD=your_campay_password
CAMPAY_APP_KEY=your_campay_app_key
```

### Testing (Sandbox)
```env
# Use sandbox for testing
CAMPAY_BASE_URL=https://demo.campay.net/v1
CAMPAY_USERNAME=sandbox_user
CAMPAY_PASSWORD=sandbox_pass
CAMPAY_APP_KEY=sandbox_key
```

### Test Phone Numbers (Sandbox)
```
MTN: +237670000001
Orange: +237690000001
```

### Cost Structure
```
Transaction fees:
- MTN: 1.5% + 50 XAF per transaction
- Orange: 1.5% + 50 XAF per transaction
- Disbursement: 1% + 50 XAF

Example:
- Customer pays 10,000 XAF
- Campay fee: (10,000 × 1.5%) + 50 = 200 XAF
- You receive: 9,800 XAF
```

### NPM Package
Already included in dependencies:
```json
{
  "dependencies": {
    "axios": "^1.13.2"  // For HTTP requests to Campay API
  }
}
```

---

# 3. 📨 Twilio (SMS Service)

## Purpose
Send SMS notifications (OTP, order updates, alerts)

## Setup Steps

### Step 1: Create Account
```
1. Go to https://www.twilio.com/try-twilio
2. Sign up (free trial gives $15 credit)
3. Verify your email and phone
```

### Step 2: Get Phone Number
```
1. Twilio Console → Phone Numbers → Buy a number
2. Select Cameroon (+237) number
3. Enable SMS capability
4. Cost: ~$1/month per number
```

### Step 3: Get Credentials
```
1. Twilio Console → Account → API Keys & Tokens
2. Copy:
   - Account SID
   - Auth Token
3. Never commit these to git!
```

### Environment Variables
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+237670000000
```

### NPM Package
```bash
npm install twilio
```

### Cost Estimate
- **Phone number**: $1/month
- **SMS**: $0.0075 per message to Cameroon
- **Example**: 1,000 SMS/month = $7.50

### Already Included in Code
✅ Service implemented in `libs/notifications/sms.service.ts`

### Testing
```typescript
import { smsService } from './libs/notifications';

// Test SMS
await smsService.sendSMS('+237670000001', 'Test message from Reeyo');

// Send OTP
await smsService.sendOTP('+237670000001', '123456');
```

---

# 4. 📧 SendGrid (Email Service)

## Purpose
Send transactional emails (welcome, receipts, notifications)

## Setup Steps

### Step 1: Create Account
```
1. Go to https://sendgrid.com/free/
2. Sign up (free tier: 100 emails/day)
3. Verify email
```

### Step 2: Create API Key
```
1. SendGrid Dashboard → Settings → API Keys
2. Create API Key
3. Name: Reeyo Backend
4. Permissions: Full Access
5. Copy API key (shown only once!)
```

### Step 3: Verify Domain (Optional but Recommended)
```
1. Settings → Sender Authentication → Domain Authentication
2. Enter your domain: reeyo.cm
3. Add DNS records as instructed
4. Verify (takes 24-48 hours)
```

### Step 4: Create Sender Identity
```
1. Settings → Sender Authentication → Single Sender Verification
2. Email: noreply@reeyo.cm
3. Name: Reeyo Platform
4. Verify email
```

### Environment Variables
```env
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@reeyo.cm

# Or use custom SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxx
```

### NPM Package
```bash
npm install nodemailer
```

### Cost Estimate
- **Free Tier**: 100 emails/day (3,000/month)
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

### Already Included in Code
✅ Service implemented in `libs/notifications/email.service.ts`

### Testing
```typescript
import { emailService } from './libs/notifications';

// Test email
await emailService.sendEmail(
  'test@example.com',
  'Test Email',
  '<h1>Hello from Reeyo</h1>'
);
```

---

# 5. 🐛 Sentry (Error Tracking) - OPTIONAL

## Purpose
Track and debug production errors in real-time

## Setup Steps

### Step 1: Create Account
```
1. Go to https://sentry.io/signup/
2. Sign up (free tier: 5,000 errors/month)
3. Create organization: Reeyo
```

### Step 2: Create Project
```
1. Create Project → Node.js
2. Project name: reeyo-backend
3. Copy DSN (Data Source Name)
```

### Step 3: Install SDK
```bash
npm install @sentry/node @sentry/tracing
```

### Step 4: Initialize in Code
```typescript
// Add to each API's server.ts
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Add to error middleware
Sentry.captureException(error);
```

### Environment Variables
```env
SENTRY_DSN=https://xxxxxxxx@o000000.ingest.sentry.io/0000000
```

### Cost Estimate
- **Free Tier**: 5,000 errors/month
- **Team**: $26/month for 50,000 errors
- **Business**: $80/month for 150,000 errors

---

# 6. 📊 Summary Table

## Complete Setup Checklist

| Service | Required | Monthly Cost | Setup Time | Difficulty |
|---------|----------|--------------|------------|-----------|
| **AWS Account** | ✅ Yes | Free | 10 min | Easy |
| **DynamoDB** | ✅ Yes | $25 | 5 min | Easy |
| **S3** | ✅ Yes | $5 | 5 min | Easy |
| **SNS** | ✅ Yes | $2 | 30 min | Medium |
| **Redis** | ✅ Yes | $13 | 10 min | Easy |
| **Campay** | ✅ Yes | Transaction fees | 2-5 days | Medium |
| **Twilio** | ⚠️ Optional | $8 | 15 min | Easy |
| **SendGrid** | ⚠️ Optional | $0-20 | 15 min | Easy |
| **Sentry** | ⚠️ Optional | $0-26 | 10 min | Easy |

**Total Required Monthly Cost**: ~$45-50
**Total with Optional**: ~$80-100

---

# 7. 🔐 Security Best Practices

## Never Commit:
- ✅ All credentials in `.env` file
- ✅ `.env` already in `.gitignore`
- ✅ AWS access keys
- ✅ API keys
- ✅ Database passwords

## Environment Variable Template
Copy this to `.env`:
```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
DYNAMODB_TABLE=ReeYo-Production
S3_BUCKET_NAME=reeyo-uploads-production
SNS_PLATFORM_APPLICATION_ARN=

# Redis
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=

# Campay
CAMPAY_BASE_URL=https://api.campay.net/v1
CAMPAY_USERNAME=
CAMPAY_PASSWORD=
CAMPAY_APP_KEY=

# Twilio (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# SendGrid (Optional)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@reeyo.cm

# Sentry (Optional)
SENTRY_DSN=
```

---

# 8. 🚀 Quick Start Installation

```bash
# 1. Install Node.js dependencies (already in package.json)
npm install

# 2. Install AWS CLI
brew install awscli  # macOS
choco install awscli  # Windows
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"  # Linux

# 3. Configure AWS
aws configure

# 4. Install Docker (for local Redis/DynamoDB)
# Download from https://www.docker.com/products/docker-desktop

# 5. Start local services
docker-compose up -d

# 6. Build libraries
npm run build:libs

# 7. Start APIs
npm run dev
```

---

# 9. ✅ Verification Checklist

After setup, verify each service:

```bash
# Test AWS
aws s3 ls

# Test DynamoDB
aws dynamodb list-tables

# Test Redis
redis-cli ping
# Should return: PONG

# Test services programmatically
npm test
```

---

# 10. 📞 Support Resources

## AWS
- Documentation: https://docs.aws.amazon.com
- Support: AWS Console → Support Center
- Pricing: https://calculator.aws

## Campay
- Documentation: https://docs.campay.net
- Support: support@campay.net
- Dashboard: https://dashboard.campay.net

## Twilio
- Documentation: https://www.twilio.com/docs
- Support: https://support.twilio.com
- Console: https://console.twilio.com

## SendGrid
- Documentation: https://docs.sendgrid.com
- Support: https://support.sendgrid.com
- Dashboard: https://app.sendgrid.com

---

**Ready to proceed? Let me know which part needs more detail! 🚀**