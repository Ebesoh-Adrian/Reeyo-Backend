# 🚀 AWS Deployment Guide - Reeyo Rider API

## 📋 **Prerequisites**

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed (for containerization)
- Node.js 18+ and npm

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Route 53   │──────│  CloudFront  │                     │
│  │     DNS      │      │     CDN      │                     │
│  └──────────────┘      └──────────────┘                     │
│                               │                              │
│                        ┌──────┴──────┐                       │
│                        │             │                       │
│               ┌────────▼──────┐  ┌──▼──────────┐           │
│               │   ALB (Load   │  │  CloudWatch  │           │
│               │   Balancer)   │  │  Monitoring  │           │
│               └────────┬──────┘  └──────────────┘           │
│                        │                                     │
│         ┌──────────────┴──────────────┐                     │
│         │                              │                     │
│  ┌──────▼──────┐              ┌───────▼──────┐             │
│  │   ECS/EC2   │              │   ECS/EC2    │             │
│  │  Container  │              │  Container   │             │
│  │  (Rider API)│              │  (Rider API) │             │
│  └──────┬──────┘              └───────┬──────┘             │
│         │                              │                     │
│         └──────────────┬───────────────┘                     │
│                        │                                     │
│         ┌──────────────┴──────────────┐                     │
│         │                              │                     │
│  ┌──────▼──────┐              ┌───────▼──────┐             │
│  │  DynamoDB   │              │  ElastiCache │             │
│  │  (Database) │              │    (Redis)   │             │
│  └─────────────┘              └──────────────┘             │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │     SNS     │  │     SES     │  │     S3      │         │
│  │(Push Notif) │  │   (Email)   │  │  (Storage)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ **Setup DynamoDB**

### **Create DynamoDB Tables**

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Create Riders table
aws dynamodb create-table \
    --table-name reeyo-prod-riders \
    --attribute-definitions \
        AttributeName=riderId,AttributeType=S \
        AttributeName=phone,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=riderId,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"PhoneIndex\",
                \"KeySchema\": [{\"AttributeName\":\"phone\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
            },
            {
                \"IndexName\": \"EmailIndex\",
                \"KeySchema\": [{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
            }
        ]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION

# Create Orders table
aws dynamodb create-table \
    --table-name reeyo-prod-orders \
    --attribute-definitions \
        AttributeName=orderId,AttributeType=S \
        AttributeName=riderId,AttributeType=S \
        AttributeName=status,AttributeType=S \
    --key-schema \
        AttributeName=orderId,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"RiderIndex\",
                \"KeySchema\": [{\"AttributeName\":\"riderId\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":10,\"WriteCapacityUnits\":10}
            },
            {
                \"IndexName\": \"StatusIndex\",
                \"KeySchema\": [{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":10,\"WriteCapacityUnits\":10}
            }
        ]" \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=10 \
    --region $AWS_REGION

# Create Wallets table
aws dynamodb create-table \
    --table-name reeyo-prod-wallets \
    --attribute-definitions \
        AttributeName=walletId,AttributeType=S \
        AttributeName=ownerId,AttributeType=S \
    --key-schema \
        AttributeName=walletId,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"OwnerIndex\",
                \"KeySchema\": [{\"AttributeName\":\"ownerId\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"},
                \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
            }
        ]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region $AWS_REGION
```

### **Enable Point-in-Time Recovery (Recommended)**

```bash
aws dynamodb update-continuous-backups \
    --table-name reeyo-prod-riders \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
    --table-name reeyo-prod-orders \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
    --table-name reeyo-prod-wallets \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

---

## 2️⃣ **Setup ElastiCache (Redis)**

```bash
# Create Redis cluster for location tracking
aws elasticache create-cache-cluster \
    --cache-cluster-id reeyo-rider-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --cache-subnet-group-name your-subnet-group \
    --security-group-ids sg-xxxxxxxxx \
    --region $AWS_REGION
```

---

## 3️⃣ **Setup SNS (Push Notifications)**

```bash
# Create SNS platform application for Android
aws sns create-platform-application \
    --name ReeyoRiderAndroid \
    --platform GCM \
    --attributes PlatformCredential=YOUR_FCM_SERVER_KEY \
    --region $AWS_REGION

# Create SNS platform application for iOS
aws sns create-platform-application \
    --name ReeyoRiderIOS \
    --platform APNS \
    --attributes PlatformCredential=YOUR_APNS_CERTIFICATE \
    --region $AWS_REGION
```

---

## 4️⃣ **Setup S3 for Document Storage**

```bash
# Create S3 bucket
aws s3api create-bucket \
    --bucket reeyo-rider-documents \
    --region $AWS_REGION \
    --create-bucket-configuration LocationConstraint=$AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket reeyo-rider-documents \
    --versioning-configuration Status=Enabled

# Set CORS configuration
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
    --bucket reeyo-rider-documents \
    --cors-configuration file://cors.json

# Set lifecycle policy for documents
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldDocuments",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket reeyo-rider-documents \
    --lifecycle-configuration file://lifecycle.json
```

---

## 5️⃣ **Setup IAM Roles**

### **Create ECS Task Execution Role**

```bash
# Create trust policy
cat > ecs-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
    --role-name ReeyoRiderAPIExecutionRole \
    --assume-role-policy-document file://ecs-trust-policy.json

# Attach policies
aws iam attach-role-policy \
    --role-name ReeyoRiderAPIExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### **Create Application IAM Policy**

```bash
cat > rider-api-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/reeyo-prod-riders",
        "arn:aws:dynamodb:*:*:table/reeyo-prod-riders/index/*",
        "arn:aws:dynamodb:*:*:table/reeyo-prod-orders",
        "arn:aws:dynamodb:*:*:table/reeyo-prod-orders/index/*",
        "arn:aws:dynamodb:*:*:table/reeyo-prod-wallets",
        "arn:aws:dynamodb:*:*:table/reeyo-prod-wallets/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:CreatePlatformEndpoint"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::reeyo-rider-documents/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create policy
aws iam create-policy \
    --policy-name ReeyoRiderAPIPolicy \
    --policy-document file://rider-api-policy.json

# Attach to role
aws iam attach-role-policy \
    --role-name ReeyoRiderAPIExecutionRole \
    --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ReeyoRiderAPIPolicy
```

---

## 6️⃣ **Build and Push Docker Image**

### **Build Docker Image**

```bash
cd apps/rider-api

# Build image
docker build -t reeyo-rider-api:latest .

# Test locally
docker run -p 3003:3003 --env-file .env reeyo-rider-api:latest
```

### **Push to ECR**

```bash
# Create ECR repository
aws ecr create-repository \
    --repository-name reeyo-rider-api \
    --region $AWS_REGION

# Get login credentials
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag image
docker tag reeyo-rider-api:latest \
    YOUR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/reeyo-rider-api:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/reeyo-rider-api:latest
```

---

## 7️⃣ **Deploy to ECS Fargate**

### **Create ECS Cluster**

```bash
aws ecs create-cluster \
    --cluster-name reeyo-cluster \
    --region $AWS_REGION
```

### **Create Task Definition**

```bash
cat > rider-api-task-definition.json << EOF
{
  "family": "reeyo-rider-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ReeyoRiderAPIExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ReeyoRiderAPIExecutionRole",
  "containerDefinitions": [
    {
      "name": "rider-api",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/reeyo-rider-api:latest",
      "portMappings": [
        {
          "containerPort": 3003,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3003"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "DYNAMODB_TABLE_PREFIX", "value": "reeyo-prod"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:reeyo/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/reeyo-rider-api",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3003/api/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition \
    --cli-input-json file://rider-api-task-definition.json
```

### **Create ECS Service with Load Balancer**

```bash
aws ecs create-service \
    --cluster reeyo-cluster \
    --service-name rider-api-service \
    --task-definition reeyo-rider-api \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:region:account-id:targetgroup/rider-api/xxx,containerName=rider-api,containerPort=3003" \
    --region $AWS_REGION
```

---

## 8️⃣ **Setup CloudWatch Monitoring**

```bash
# Create log group
aws logs create-log-group \
    --log-group-name /ecs/reeyo-rider-api \
    --region $AWS_REGION

# Create alarms
aws cloudwatch put-metric-alarm \
    --alarm-name rider-api-high-cpu \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=rider-api-service

aws cloudwatch put-metric-alarm \
    --alarm-name rider-api-high-memory \
    --alarm-description "Alert when memory exceeds 80%" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=rider-api-service
```

---

## 9️⃣ **Setup Auto Scaling**

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/reeyo-cluster/rider-api-service \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 2 \
    --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/reeyo-cluster/rider-api-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name rider-api-cpu-scaling \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json

cat > scaling-policy.json << EOF
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
EOF
```

---

## 🔟 **Environment Variables (AWS Secrets Manager)**

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
    --name reeyo/rider-api/jwt-secret \
    --secret-string "your-super-secret-jwt-key" \
    --region $AWS_REGION

aws secretsmanager create-secret \
    --name reeyo/rider-api/campay \
    --secret-string '{"username":"xxx","password":"yyy"}' \
    --region $AWS_REGION

aws secretsmanager create-secret \
    --name reeyo/rider-api/twilio \
    --secret-string '{"accountSid":"xxx","authToken":"yyy"}' \
    --region $AWS_REGION
```

---

## 📊 **Cost Optimization Tips**

1. **Use Reserved Instances** for predictable workloads
2. **Enable DynamoDB Auto Scaling** based on traffic
3. **Use S3 Lifecycle Policies** to archive old documents
4. **Set CloudWatch Log Retention** to 30 days
5. **Use ElastiCache Reserved Nodes** for Redis
6. **Enable AWS Cost Explorer** for monitoring

---

## 🔒 **Security Best Practices**

- ✅ Use VPC with private subnets
- ✅ Enable encryption at rest for DynamoDB
- ✅ Enable encryption for S3 buckets
- ✅ Use AWS WAF for API protection
- ✅ Enable CloudTrail for audit logging
- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Implement least privilege IAM policies
- ✅ Enable MFA for AWS root account

---

## 📈 **Monitoring Dashboard**

Access your CloudWatch dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:
```

Key metrics to monitor:
- API Response Time
- Error Rate (5xx errors)
- Request Count
- CPU Utilization
- Memory Utilization
- DynamoDB Read/Write Capacity

---

## 🎯 **Post-Deployment Checklist**

- [ ] Verify health check endpoint
- [ ] Test authentication flow
- [ ] Test order lifecycle
- [ ] Verify push notifications
- [ ] Test SMS OTP delivery
- [ ] Check CloudWatch logs
- [ ] Monitor error rates
- [ ] Test auto-scaling
- [ ] Verify backup strategy
- [ ] Document API endpoints

**Your Rider API is now live on AWS! 🚀**
