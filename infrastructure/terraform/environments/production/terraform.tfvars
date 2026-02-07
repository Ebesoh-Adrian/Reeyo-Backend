# Reeyo Production Environment Configuration

environment = "production"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# ECR Repository
ecr_repository_url = "123456789.dkr.ecr.us-east-1.amazonaws.com"

# SSL Certificate
ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/abc-123"

# Monitoring
alarm_email = "alerts@reeyo.cm"

# Redis Configuration
redis_node_type = "cache.r6g.large"
redis_num_nodes = 3

# DynamoDB Tables
dynamodb_tables = {
  users = {
    hash_key = "userId"
    attributes = [
      { name = "userId", type = "S" },
      { name = "phone", type = "S" },
      { name = "email", type = "S" }
    ]
    global_secondary_indexes = [
      {
        name            = "phone-index"
        hash_key        = "phone"
        projection_type = "ALL"
      },
      {
        name            = "email-index"
        hash_key        = "email"
        projection_type = "ALL"
      }
    ]
  }
  
  vendors = {
    hash_key = "vendorId"
    attributes = [
      { name = "vendorId", type = "S" },
      { name = "phone", type = "S" },
      { name = "approvalStatus", type = "S" }
    ]
    global_secondary_indexes = [
      {
        name            = "phone-index"
        hash_key        = "phone"
        projection_type = "ALL"
      },
      {
        name            = "approval-status-index"
        hash_key        = "approvalStatus"
        projection_type = "ALL"
      }
    ]
  }
  
  riders = {
    hash_key = "riderId"
    attributes = [
      { name = "riderId", type = "S" },
      { name = "phone", type = "S" },
      { name = "approvalStatus", type = "S" }
    ]
    global_secondary_indexes = [
      {
        name            = "phone-index"
        hash_key        = "phone"
        projection_type = "ALL"
      },
      {
        name            = "approval-status-index"
        hash_key        = "approvalStatus"
        projection_type = "ALL"
      }
    ]
  }
  
  orders = {
    hash_key = "orderId"
    attributes = [
      { name = "orderId", type = "S" },
      { name = "userId", type = "S" },
      { name = "vendorId", type = "S" },
      { name = "riderId", type = "S" },
      { name = "status", type = "S" },
      { name = "createdAt", type = "S" }
    ]
    global_secondary_indexes = [
      {
        name            = "userId-index"
        hash_key        = "userId"
        range_key       = "createdAt"
        projection_type = "ALL"
      },
      {
        name            = "vendorId-index"
        hash_key        = "vendorId"
        range_key       = "createdAt"
        projection_type = "ALL"
      },
      {
        name            = "riderId-index"
        hash_key        = "riderId"
        range_key       = "createdAt"
        projection_type = "ALL"
      },
      {
        name            = "status-index"
        hash_key        = "status"
        projection_type = "ALL"
      }
    ]
  }
  
  wallets = {
    hash_key = "walletId"
    attributes = [
      { name = "walletId", type = "S" },
      { name = "ownerId", type = "S" }
    ]
    global_secondary_indexes = [
      {
        name            = "owner-index"
        hash_key        = "ownerId"
        projection_type = "ALL"
      }
    ]
  }
  
  transactions = {
    hash_key = "transactionId"
    attributes = [
      { name = "transactionId", type = "S" },
      { name = "walletId", type = "S" },
      { name = "createdAt", type = "S" }
    ]
    global_secondary_indexes = [
      {
        name            = "walletId-index"
        hash_key        = "walletId"
        range_key       = "createdAt"
        projection_type = "ALL"
      }
    ]
  }
}

# Secrets (store in AWS Secrets Manager or use environment variables)
# jwt_secret         = "use-aws-secrets-manager"
# twilio_account_sid = "use-aws-secrets-manager"
# twilio_auth_token  = "use-aws-secrets-manager"
# sendgrid_api_key   = "use-aws-secrets-manager"
# campay_api_key     = "use-aws-secrets-manager"
