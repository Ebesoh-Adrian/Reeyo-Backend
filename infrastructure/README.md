# 🏗️ Reeyo Platform Infrastructure

Complete infrastructure as code (IaC) for deploying the Reeyo delivery platform.

---

## 📁 Directory Structure

```
infrastructure/
├── terraform/              # AWS infrastructure (IaC)
│   ├── main.tf            # Main configuration
│   ├── variables.tf       # Input variables
│   ├── modules/           # Reusable modules
│   │   ├── vpc/          # Network infrastructure
│   │   ├── ecs/          # Container orchestration
│   │   ├── dynamodb/     # NoSQL database
│   │   ├── elasticache/  # Redis cache
│   │   ├── alb/          # Load balancer
│   │   ├── s3/           # Object storage
│   │   ├── cloudwatch/   # Monitoring & logs
│   │   └── secrets/      # Secrets management
│   └── environments/      # Environment configs
│       ├── dev/
│       ├── staging/
│       └── production/
│
├── docker/                 # Docker configurations
│   ├── nginx/             # Reverse proxy
│   └── monitoring/        # Prometheus + Grafana
│
├── kubernetes/            # Kubernetes manifests
│   ├── deployments/      # Pod deployments
│   ├── services/         # Service definitions
│   ├── configmaps/       # Configuration
│   ├── secrets/          # Sensitive data
│   └── ingress/          # Routing rules
│
└── scripts/               # Automation scripts
    ├── setup/            # Initial setup
    ├── deployment/       # Deploy scripts
    ├── backup/           # Backup scripts
    └── monitoring/       # Health checks
```

---

## 🚀 Quick Start

### **Option 1: AWS Deployment (Terraform)**

```bash
cd infrastructure/terraform

# 1. Initialize Terraform
terraform init

# 2. Select environment
cd environments/production

# 3. Plan deployment
terraform plan -var-file=terraform.tfvars

# 4. Deploy infrastructure
terraform apply -var-file=terraform.tfvars
```

### **Option 2: Kubernetes Deployment**

```bash
cd infrastructure/kubernetes

# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets
kubectl apply -f secrets/

# 3. Create configmaps
kubectl apply -f configmaps/

# 4. Deploy services
kubectl apply -f deployments/
kubectl apply -f services/

# 5. Setup ingress
kubectl apply -f ingress/
```

### **Option 3: Docker Compose (Local)**

```bash
# Use root docker-compose.yml
cd ../..
docker-compose up -d
```

---

## 📋 Prerequisites

### **For Terraform (AWS):**
- AWS CLI configured (`aws configure`)
- Terraform >= 1.5.0 installed
- AWS account with appropriate permissions
- Domain name registered
- SSL certificate in ACM

### **For Kubernetes:**
- kubectl installed
- Kubernetes cluster (EKS, GKE, or local)
- Helm (optional, for cert-manager)

### **For Docker:**
- Docker >= 20.10
- Docker Compose >= 2.0

---

## 🏗️ Terraform Modules

### **1. VPC Module**
**Purpose:** Network infrastructure

**Creates:**
- VPC with public/private subnets
- Internet Gateway
- NAT Gateways (one per AZ)
- Route tables
- Security groups

**Usage:**
```hcl
module "vpc" {
  source = "./modules/vpc"
  
  environment         = "production"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

---

### **2. ECS Module**
**Purpose:** Container orchestration

**Creates:**
- ECS Cluster (Fargate)
- Task definitions for each API
- ECS Services with auto-scaling
- CloudWatch log groups

**Services:**
- User API (2-10 instances)
- Vendor API (2-10 instances)
- Rider API (2-10 instances)
- Admin API (1-5 instances)
- Socket Server (2-5 instances)

---

### **3. DynamoDB Module**
**Purpose:** NoSQL database

**Creates:**
- Users table
- Vendors table
- Riders table
- Orders table
- Wallets table
- Transactions table

**Features:**
- On-demand billing
- Global Secondary Indexes (GSI)
- Point-in-time recovery
- Auto-scaling (optional)

---

### **4. ElastiCache Module**
**Purpose:** Redis cache & geospatial data

**Creates:**
- Redis cluster (2-3 nodes)
- Replication group
- Subnet group
- Security group

**Use cases:**
- Session storage
- API caching
- Rider location (geospatial)
- Rate limiting

---

### **5. ALB Module**
**Purpose:** Load balancing & SSL termination

**Creates:**
- Application Load Balancer
- Target groups (one per API)
- Listeners (HTTP/HTTPS)
- SSL certificate attachment

**Features:**
- Path-based routing
- Health checks
- Sticky sessions
- SSL termination

---

### **6. S3 Module**
**Purpose:** Object storage

**Creates:**
- Upload bucket (user files)
- Documents bucket (vendor docs)
- Backups bucket (database backups)

**Features:**
- Versioning enabled
- Encryption at rest
- Lifecycle policies
- CORS configuration

---

### **7. CloudWatch Module**
**Purpose:** Monitoring & alerting

**Creates:**
- Log groups for each service
- Metric alarms (CPU, memory, errors)
- SNS topics for notifications
- CloudWatch dashboards

**Alarms:**
- High CPU (> 80%)
- High memory (> 85%)
- High error rate (> 5%)
- Low disk space

---

### **8. Secrets Module**
**Purpose:** Secure credential storage

**Creates:**
- AWS Secrets Manager secrets
- IAM roles for ECS access
- Automatic rotation (optional)

**Secrets stored:**
- JWT secret
- Database credentials
- API keys (Twilio, SendGrid, Campay)
- OAuth tokens

---

## 🔧 Deployment Scripts

### **1. Deploy to AWS**
```bash
./scripts/deployment/deploy-to-aws.sh production us-east-1
```

**What it does:**
1. Builds Docker images
2. Logs in to ECR
3. Tags images with git commit
4. Pushes to ECR
5. Updates ECS services
6. Waits for stabilization
7. Verifies health endpoints

---

### **2. Setup Database**
```bash
# Local DynamoDB
./scripts/setup/setup-database.sh local

# AWS DynamoDB
./scripts/setup/setup-database.sh production us-east-1
```

**Creates:**
- All DynamoDB tables
- Global Secondary Indexes
- Enables auto-scaling

---

### **3. Backup Database**
```bash
./scripts/backup/backup-dynamodb.sh production us-east-1
```

**Creates:**
- On-demand backups
- Exports to S3 (optional)
- Retention: 35 days

---

## 🐳 Docker Configuration

### **Nginx Reverse Proxy**

**File:** `docker/nginx/nginx.conf`

**Features:**
- SSL termination
- Path-based routing
- WebSocket support
- Gzip compression
- Security headers
- Rate limiting

**Routes:**
```
/api/v1/user   → User API (3001)
/api/v1/vendor → Vendor API (3002)
/api/v1/rider  → Rider API (3003)
/api/v1/admin  → Admin API (3005)
/socket.io     → Socket Server (3004)
```

---

### **Monitoring Stack**

**File:** `docker/monitoring/docker-compose.monitoring.yml`

**Includes:**
- Prometheus (metrics collection)
- Grafana (visualization)
- Node Exporter (system metrics)

**Access:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3010 (admin/admin)

---

## ☸️ Kubernetes Deployment

### **1. Namespace**
```bash
kubectl apply -f kubernetes/namespace.yaml
```

Creates `reeyo` namespace for all resources.

---

### **2. Secrets**
```bash
# Create secrets from literals
kubectl create secret generic reeyo-secrets \
  --from-literal=jwt-secret=your-secret \
  --from-literal=twilio-sid=your-sid \
  -n reeyo

# Or apply from file
kubectl apply -f kubernetes/secrets/
```

---

### **3. ConfigMaps**
```bash
kubectl apply -f kubernetes/configmaps/
```

Contains non-sensitive configuration.

---

### **4. Deployments**
```bash
kubectl apply -f kubernetes/deployments/
```

**Creates:**
- User API deployment (3 replicas)
- Vendor API deployment (2 replicas)
- Rider API deployment (2 replicas)
- Admin API deployment (1 replica)
- Horizontal Pod Autoscalers (HPA)

---

### **5. Services**
```bash
kubectl apply -f kubernetes/services/
```

Creates ClusterIP services for internal communication.

---

### **6. Ingress**
```bash
kubectl apply -f kubernetes/ingress/
```

**Features:**
- SSL/TLS termination
- Path-based routing
- Rate limiting
- CORS support

---

## 📊 Monitoring

### **CloudWatch Metrics**

**Key metrics tracked:**
- Request count
- Response time (p50, p99)
- Error rate
- CPU utilization
- Memory utilization
- Active connections

**Alarms sent to:** `alerts@reeyo.cm`

---

### **Log Aggregation**

**Log groups:**
- `/reeyo/production/user-api`
- `/reeyo/production/vendor-api`
- `/reeyo/production/rider-api`
- `/reeyo/production/admin-api`

**Retention:** 30 days

---

### **Application Insights**

**Tools:**
- AWS X-Ray (distributed tracing)
- CloudWatch Insights (log queries)
- Custom metrics

---

## 💰 Cost Estimation

### **Monthly AWS Costs (Production)**

| Service | Configuration | Cost |
|---------|--------------|------|
| ECS Fargate | 10 tasks × 1 vCPU × 2 GB | $150-300 |
| DynamoDB | On-demand (1M reads, 500K writes) | $50-200 |
| ElastiCache | cache.r6g.large × 3 nodes | $150-300 |
| ALB | 1 ALB + data transfer | $25-50 |
| S3 | 100 GB storage + transfer | $10-30 |
| CloudWatch | Logs + Metrics + Alarms | $20-50 |
| Data Transfer | 500 GB/month | $50-100 |
| **TOTAL** | | **$455-1,030/month** |

**Optimization tips:**
- Use Reserved Instances (save 30-40%)
- Enable auto-scaling (reduce idle costs)
- Use S3 lifecycle policies
- Optimize database queries

---

## 🔐 Security Best Practices

### **Network Security**
- ✅ VPC with private subnets
- ✅ Security groups (least privilege)
- ✅ NACLs for additional protection
- ✅ AWS WAF on ALB

### **Application Security**
- ✅ Secrets in AWS Secrets Manager
- ✅ IAM roles (not access keys)
- ✅ SSL/TLS encryption
- ✅ Signed container images

### **Data Security**
- ✅ DynamoDB encryption at rest
- ✅ S3 bucket encryption
- ✅ Encrypted EBS volumes
- ✅ Backup encryption

### **Access Control**
- ✅ MFA required for AWS console
- ✅ IAM policies (least privilege)
- ✅ CloudTrail audit logs
- ✅ Regular access reviews

---

## 🚨 Disaster Recovery

### **Backup Strategy**

**Automated backups:**
- DynamoDB: Continuous backups (35-day retention)
- S3: Versioning enabled
- ECS: Docker images in ECR

**Manual backups:**
```bash
./scripts/backup/backup-dynamodb.sh production
```

**Recovery time:**
- Database: < 1 hour (point-in-time recovery)
- Application: < 30 minutes (rollback deployment)
- Infrastructure: < 2 hours (Terraform re-apply)

---

### **High Availability**

**Multi-AZ deployment:**
- ECS tasks across 3 availability zones
- ALB in multiple AZs
- Redis with replication
- DynamoDB (inherently multi-AZ)

**RTO (Recovery Time Objective):** 30 minutes
**RPO (Recovery Point Objective):** 5 minutes

---

## 📚 Additional Resources

### **Documentation**
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### **Monitoring Tools**
- [AWS CloudWatch](https://console.aws.amazon.com/cloudwatch)
- [AWS X-Ray](https://console.aws.amazon.com/xray)
- [Grafana Dashboards](http://localhost:3010)

### **Support**
- 📧 DevOps team: devops@reeyo.cm
- 🐛 Issues: GitHub Issues
- 📖 Wiki: Confluence

---

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] AWS credentials configured
- [ ] Domain name registered
- [ ] SSL certificate obtained
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Terraform variables configured
- [ ] Docker images built and tested

### **Deployment**
- [ ] Terraform plan reviewed
- [ ] Infrastructure deployed
- [ ] Database tables created
- [ ] ECS services running
- [ ] Health checks passing
- [ ] SSL certificate attached
- [ ] DNS records updated

### **Post-Deployment**
- [ ] Monitoring dashboards configured
- [ ] Alarms set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team notified

---

**Infrastructure is ready for production! 🚀**

For support, contact: devops@reeyo.cm
