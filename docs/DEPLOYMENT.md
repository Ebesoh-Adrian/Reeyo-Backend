# 🚀 Production Deployment Guide

Complete guide for deploying Reeyo Platform to production on AWS.

---

## 📋 Pre-Deployment Checklist

- [ ] AWS Account created and configured
- [ ] Domain name registered
- [ ] SSL certificates obtained
- [ ] Twilio account setup
- [ ] SendGrid account setup
- [ ] Campay payment credentials
- [ ] All environment variables configured
- [ ] Database backup strategy in place
- [ ] Monitoring tools configured

---

## 🏗️ AWS Architecture

```
Internet
   │
   ▼
CloudFront (CDN) ──────────► S3 (Static Assets)
   │
   ▼
Route 53 (DNS)
   │
   ▼
Application Load Balancer
   │
   ├── Target Group: User API (ECS)
   ├── Target Group: Vendor API (ECS)
   ├── Target Group: Rider API (ECS)
   ├── Target Group: Admin API (ECS)
   └── Target Group: Socket Server (ECS)
   │
   ▼
VPC (Private Subnet)
   │
   ├── ECS Fargate Cluster
   │   ├── User API Tasks (2-10 instances)
   │   ├── Vendor API Tasks (2-10 instances)
   │   ├── Rider API Tasks (2-10 instances)
   │   ├── Admin API Tasks (2-5 instances)
   │   └── Socket Server Tasks (2-5 instances)
   │
   ├── ElastiCache (Redis Cluster)
   ├── DynamoDB Tables
   ├── SNS (Push Notifications)
   ├── SES (Email)
   └── S3 (File Storage)
```

---

## 🚀 Deployment Steps

### Step 1: Configure AWS CLI

```bash
aws configure

# Enter your credentials:
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: us-east-1
# Default output format: json
```

### Step 2: Create DynamoDB Tables

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="production.tfvars"

# Apply (create resources)
terraform apply -var-file="production.tfvars"
```

### Step 3: Build Docker Images

```bash
# User API
cd apps/user-api
docker build -t reeyo-user-api:latest .

# Vendor API
cd ../vendor-api
docker build -t reeyo-vendor-api:latest .

# Rider API
cd ../rider-api
docker build -t reeyo-rider-api:latest .

# Admin API
cd ../admin-api
docker build -t reeyo-admin-api:latest .
```

### Step 4: Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag reeyo-user-api:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/reeyo-user-api:latest

# Push images
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/reeyo-user-api:latest

# Repeat for all services
```

### Step 5: Deploy to ECS

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name reeyo-production

# Register task definitions
aws ecs register-task-definition --cli-input-json file://user-api-task.json

# Create services
aws ecs create-service \
  --cluster reeyo-production \
  --service-name user-api \
  --task-definition reeyo-user-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

### Step 6: Configure Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name reeyo-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345

# Create target groups for each service
aws elbv2 create-target-group \
  --name reeyo-user-api-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-12345 \
  --health-check-path /api/v1/health

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 7: Configure Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/reeyo-production/user-api \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/reeyo-production/user-api \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## 📊 Monitoring Setup

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name reeyo-user-api-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Log Aggregation

```bash
# Create log group
aws logs create-log-group --log-group-name /reeyo/production/user-api

# Set retention
aws logs put-retention-policy \
  --log-group-name /reeyo/production/user-api \
  --retention-in-days 30
```

---

## 🔐 Security Configuration

### Secrets Manager

```bash
# Store secrets
aws secretsmanager create-secret \
  --name reeyo/production/jwt-secret \
  --secret-string "your-super-secret-key"

# Update ECS task definition to use secrets
```

### VPC Configuration

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id vpc-12345 --cidr-block 10.0.1.0/24
aws ec2 create-subnet --vpc-id vpc-12345 --cidr-block 10.0.2.0/24

# Create security groups
aws ec2 create-security-group \
  --group-name reeyo-api-sg \
  --description "Security group for Reeyo APIs" \
  --vpc-id vpc-12345
```

---

## 🌐 Domain & SSL Setup

### Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone --name reeyo.cm --caller-reference $(date +%s)

# Create A record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-change.json
```

### ACM Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name reeyo.cm \
  --subject-alternative-names *.reeyo.cm \
  --validation-method DNS
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        run: |
          docker build -t reeyo-user-api:${{ github.sha }} apps/user-api
          docker push ${{ steps.login-ecr.outputs.registry }}/reeyo-user-api:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster reeyo-production --service user-api --force-new-deployment
```

---

## ✅ Post-Deployment Checklist

- [ ] All services running and healthy
- [ ] Load balancer responding correctly
- [ ] Auto-scaling configured
- [ ] Monitoring and alarms set up
- [ ] Logs being collected
- [ ] Backup strategy implemented
- [ ] SSL certificate installed
- [ ] Domain pointing to load balancer
- [ ] Rate limiting configured
- [ ] DDoS protection enabled

---

## 🎯 Zero-Downtime Deployments

### Blue-Green Deployment

```bash
# Create new task definition version
aws ecs register-task-definition --cli-input-json file://user-api-task-v2.json

# Update service with new version
aws ecs update-service \
  --cluster reeyo-production \
  --service user-api \
  --task-definition reeyo-user-api:2

# Monitor deployment
aws ecs wait services-stable --cluster reeyo-production --services user-api
```

---

## 📈 Cost Optimization

- Use Reserved Instances for predictable workloads
- Enable auto-scaling to minimize idle resources
- Use S3 lifecycle policies for old logs
- Implement CloudFront caching
- Use DynamoDB on-demand pricing for variable workloads

---

**Deployment complete! Monitor your services and scale as needed.** 🚀
