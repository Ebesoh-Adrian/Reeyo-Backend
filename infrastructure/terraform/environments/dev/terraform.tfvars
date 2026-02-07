# Reeyo Development Environment Configuration

environment = "dev"
aws_region  = "us-east-1"

vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

ecr_repository_url  = "123456789.dkr.ecr.us-east-1.amazonaws.com"
ssl_certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/dev-123"

alarm_email = "dev-alerts@reeyo.cm"

redis_node_type = "cache.t3.micro"
redis_num_nodes = 1

# Same table structure as production but with smaller capacity
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
      }
    ]
  }
  # ... (similar structure for other tables)
}
