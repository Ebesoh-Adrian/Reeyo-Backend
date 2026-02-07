#!/bin/bash
# Reeyo Platform - AWS Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Reeyo Platform - AWS Deployment    ${NC}"
echo -e "${GREEN}======================================${NC}"

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${2:-us-east-1}
ECR_REPOSITORY="123456789.dkr.ecr.${AWS_REGION}.amazonaws.com"
CLUSTER_NAME="reeyo-${ENVIRONMENT}"

echo -e "\n${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Region: ${AWS_REGION}${NC}\n"

# Step 1: Build Docker images
echo -e "${GREEN}[1/7] Building Docker images...${NC}"
cd ../../

docker build -t reeyo-user-api:latest -f apps/user-api/Dockerfile apps/user-api
docker build -t reeyo-vendor-api:latest -f apps/vendor-api/Dockerfile apps/vendor-api
docker build -t reeyo-rider-api:latest -f apps/rider-api/Dockerfile apps/rider-api
docker build -t reeyo-admin-api:latest -f apps/admin-api/Dockerfile apps/admin-api

echo -e "${GREEN}✓ Images built successfully${NC}\n"

# Step 2: Login to ECR
echo -e "${GREEN}[2/7] Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_REPOSITORY}

echo -e "${GREEN}✓ Logged in to ECR${NC}\n"

# Step 3: Tag images
echo -e "${GREEN}[3/7] Tagging images...${NC}"
TAG=$(git rev-parse --short HEAD)

docker tag reeyo-user-api:latest ${ECR_REPOSITORY}/reeyo-user-api:${TAG}
docker tag reeyo-user-api:latest ${ECR_REPOSITORY}/reeyo-user-api:latest
docker tag reeyo-vendor-api:latest ${ECR_REPOSITORY}/reeyo-vendor-api:${TAG}
docker tag reeyo-vendor-api:latest ${ECR_REPOSITORY}/reeyo-vendor-api:latest
docker tag reeyo-rider-api:latest ${ECR_REPOSITORY}/reeyo-rider-api:${TAG}
docker tag reeyo-rider-api:latest ${ECR_REPOSITORY}/reeyo-rider-api:latest
docker tag reeyo-admin-api:latest ${ECR_REPOSITORY}/reeyo-admin-api:${TAG}
docker tag reeyo-admin-api:latest ${ECR_REPOSITORY}/reeyo-admin-api:latest

echo -e "${GREEN}✓ Images tagged with ${TAG}${NC}\n"

# Step 4: Push to ECR
echo -e "${GREEN}[4/7] Pushing images to ECR...${NC}"

docker push ${ECR_REPOSITORY}/reeyo-user-api:${TAG}
docker push ${ECR_REPOSITORY}/reeyo-user-api:latest
docker push ${ECR_REPOSITORY}/reeyo-vendor-api:${TAG}
docker push ${ECR_REPOSITORY}/reeyo-vendor-api:latest
docker push ${ECR_REPOSITORY}/reeyo-rider-api:${TAG}
docker push ${ECR_REPOSITORY}/reeyo-rider-api:latest
docker push ${ECR_REPOSITORY}/reeyo-admin-api:${TAG}
docker push ${ECR_REPOSITORY}/reeyo-admin-api:latest

echo -e "${GREEN}✓ Images pushed to ECR${NC}\n"

# Step 5: Update ECS services
echo -e "${GREEN}[5/7] Updating ECS services...${NC}"

aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service user-api \
  --force-new-deployment \
  --region ${AWS_REGION}

aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service vendor-api \
  --force-new-deployment \
  --region ${AWS_REGION}

aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service rider-api \
  --force-new-deployment \
  --region ${AWS_REGION}

aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service admin-api \
  --force-new-deployment \
  --region ${AWS_REGION}

echo -e "${GREEN}✓ ECS services updated${NC}\n"

# Step 6: Wait for deployment to stabilize
echo -e "${GREEN}[6/7] Waiting for services to stabilize...${NC}"

aws ecs wait services-stable \
  --cluster ${CLUSTER_NAME} \
  --services user-api vendor-api rider-api admin-api \
  --region ${AWS_REGION}

echo -e "${GREEN}✓ Services are stable${NC}\n"

# Step 7: Verify deployment
echo -e "${GREEN}[7/7] Verifying deployment...${NC}"

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names reeyo-${ENVIRONMENT}-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text \
  --region ${AWS_REGION})

echo -e "\nTesting health endpoints..."
curl -f http://${ALB_DNS}/api/v1/user/health || echo -e "${RED}User API health check failed${NC}"
curl -f http://${ALB_DNS}/api/v1/vendor/health || echo -e "${RED}Vendor API health check failed${NC}"
curl -f http://${ALB_DNS}/api/v1/rider/health || echo -e "${RED}Rider API health check failed${NC}"
curl -f http://${ALB_DNS}/api/v1/admin/health || echo -e "${RED}Admin API health check failed${NC}"

echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete!                ${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "\nLoad Balancer: ${ALB_DNS}"
echo -e "Git Commit: ${TAG}"
echo -e "\nMonitor your services at:"
echo -e "https://console.aws.amazon.com/ecs/home?region=${AWS_REGION}#/clusters/${CLUSTER_NAME}/services\n"
