# Reeyo Platform - Main Terraform Configuration
# Complete AWS infrastructure for production deployment

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "reeyo-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "reeyo-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Reeyo"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"
  
  environment = var.environment
  tables      = var.dynamodb_tables
}

# ElastiCache (Redis) Module
module "elasticache" {
  source = "./modules/elasticache"
  
  environment        = var.environment
  node_type         = var.redis_node_type
  num_cache_nodes   = var.redis_num_nodes
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"
  
  environment       = var.environment
  vpc_id           = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.ssl_certificate_arn
}

# ECS Cluster Module
module "ecs" {
  source = "./modules/ecs"
  
  environment        = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  alb_target_groups  = module.alb.target_groups
  
  services = {
    user-api = {
      image         = "${var.ecr_repository_url}/user-api:latest"
      cpu           = 1024
      memory        = 2048
      desired_count = 2
      min_count     = 2
      max_count     = 10
      port          = 3001
    }
    vendor-api = {
      image         = "${var.ecr_repository_url}/vendor-api:latest"
      cpu           = 1024
      memory        = 2048
      desired_count = 2
      min_count     = 2
      max_count     = 10
      port          = 3002
    }
    rider-api = {
      image         = "${var.ecr_repository_url}/rider-api:latest"
      cpu           = 1024
      memory        = 2048
      desired_count = 2
      min_count     = 2
      max_count     = 10
      port          = 3003
    }
    admin-api = {
      image         = "${var.ecr_repository_url}/admin-api:latest"
      cpu           = 512
      memory        = 1024
      desired_count = 1
      min_count     = 1
      max_count     = 5
      port          = 3005
    }
    socket-server = {
      image         = "${var.ecr_repository_url}/socket-server:latest"
      cpu           = 1024
      memory        = 2048
      desired_count = 2
      min_count     = 2
      max_count     = 5
      port          = 3004
    }
  }
}

# S3 Buckets Module
module "s3" {
  source = "./modules/s3"
  
  environment = var.environment
  buckets = [
    "reeyo-${var.environment}-uploads",
    "reeyo-${var.environment}-documents",
    "reeyo-${var.environment}-backups"
  ]
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
  
  alarm_email = var.alarm_email
  
  # ECS service names for monitoring
  ecs_services = module.ecs.service_names
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"
  
  environment = var.environment
  
  secrets = {
    jwt_secret           = var.jwt_secret
    twilio_account_sid   = var.twilio_account_sid
    twilio_auth_token    = var.twilio_auth_token
    sendgrid_api_key     = var.sendgrid_api_key
    campay_api_key       = var.campay_api_key
  }
}

# Outputs
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_dns_name" {
  value = module.alb.dns_name
}

output "redis_endpoint" {
  value = module.elasticache.endpoint
}

output "s3_buckets" {
  value = module.s3.bucket_names
}
