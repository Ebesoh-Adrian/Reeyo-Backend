#!/bin/bash
# Backup DynamoDB tables to S3

set -e

ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
BACKUP_BUCKET="reeyo-${ENVIRONMENT}-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "Starting DynamoDB backup..."

TABLES=(
  "reeyo-${ENVIRONMENT}-users"
  "reeyo-${ENVIRONMENT}-vendors"
  "reeyo-${ENVIRONMENT}-riders"
  "reeyo-${ENVIRONMENT}-orders"
  "reeyo-${ENVIRONMENT}-wallets"
  "reeyo-${ENVIRONMENT}-transactions"
)

for TABLE in "${TABLES[@]}"; do
  echo "Backing up ${TABLE}..."
  
  aws dynamodb create-backup \
    --table-name ${TABLE} \
    --backup-name ${TABLE}-${TIMESTAMP} \
    --region ${REGION}
  
  echo "✓ ${TABLE} backup created"
done

echo ""
echo "All backups created successfully!"
echo "Backups are stored in AWS DynamoDB Backup"
