#!/bin/bash
# Setup DynamoDB tables locally or on AWS

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

if [ "$ENVIRONMENT" = "local" ]; then
  ENDPOINT="--endpoint-url http://localhost:8000"
else
  ENDPOINT=""
fi

echo "Setting up DynamoDB tables for ${ENVIRONMENT}..."

# Users table
aws dynamodb create-table \
  --table-name reeyo-${ENVIRONMENT}-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=phone,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"phone-index\",\"KeySchema\":[{\"AttributeName\":\"phone\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"email-index\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ${REGION} \
  ${ENDPOINT}

echo "✓ Users table created"

# Vendors table
aws dynamodb create-table \
  --table-name reeyo-${ENVIRONMENT}-vendors \
  --attribute-definitions \
    AttributeName=vendorId,AttributeType=S \
    AttributeName=phone,AttributeType=S \
  --key-schema AttributeName=vendorId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"phone-index\",\"KeySchema\":[{\"AttributeName\":\"phone\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ${REGION} \
  ${ENDPOINT}

echo "✓ Vendors table created"

# Riders table
aws dynamodb create-table \
  --table-name reeyo-${ENVIRONMENT}-riders \
  --attribute-definitions \
    AttributeName=riderId,AttributeType=S \
    AttributeName=phone,AttributeType=S \
  --key-schema AttributeName=riderId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"phone-index\",\"KeySchema\":[{\"AttributeName\":\"phone\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ${REGION} \
  ${ENDPOINT}

echo "✓ Riders table created"

# Orders table
aws dynamodb create-table \
  --table-name reeyo-${ENVIRONMENT}-orders \
  --attribute-definitions \
    AttributeName=orderId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=orderId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"userId-index\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ${REGION} \
  ${ENDPOINT}

echo "✓ Orders table created"

# Wallets table
aws dynamodb create-table \
  --table-name reeyo-${ENVIRONMENT}-wallets \
  --attribute-definitions \
    AttributeName=walletId,AttributeType=S \
    AttributeName=ownerId,AttributeType=S \
  --key-schema AttributeName=walletId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"owner-index\",\"KeySchema\":[{\"AttributeName\":\"ownerId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ${REGION} \
  ${ENDPOINT}

echo "✓ Wallets table created"

# Transactions table
aws dynamodb create-table \
  --table-name reeyo-${ENVIRONMENT}-transactions \
  --attribute-definitions \
    AttributeName=transactionId,AttributeType=S \
    AttributeName=walletId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=transactionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"walletId-index\",\"KeySchema\":[{\"AttributeName\":\"walletId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region ${REGION} \
  ${ENDPOINT}

echo "✓ Transactions table created"

echo ""
echo "All tables created successfully!"
