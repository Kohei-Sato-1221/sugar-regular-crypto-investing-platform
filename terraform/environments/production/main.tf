terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.17.0"
    }
  }

  backend "s3" {
    region                  = "ap-northeast-1"
    bucket                  = "tfstate-investing-platform-20251224"
    key                     = "production/terraform.tfstate"
    profile                 = "investing-platform-20251224"
    shared_credentials_file = "~/.aws/credentials"
  }

  required_version = "= 1.14.3"
}

provider "aws" {
  profile                  = "investing-platform-20251224"
  region                   = "ap-northeast-1"
  shared_config_files      = ["~/.aws/config"]
  shared_credentials_files = ["~/.aws/credentials"]
}

# Locals - Computed values
locals {
  # Network configuration
  name_prefix          = "investing-platform-prod"
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  availability_zones   = ["ap-northeast-1a", "ap-northeast-1c"]

  # Route53 configuration
  root_domain = "stockbit.click"
  app_domain  = "app.${local.root_domain}"

  # OAuth URLs
  callback_urls = concat(
    ["http://localhost:3000/auth/callback"],
    ["https://${local.app_domain}/auth/callback"]
  )
  logout_urls = concat(
    ["http://localhost:3000"],
    ["https://${local.app_domain}"]
  )

  # Cognito - Password policy
  password_minimum_length    = 8
  password_require_lowercase = true
  password_require_numbers   = true
  password_require_symbols   = true
  password_require_uppercase = true

  # Cognito - Username configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Cognito - Email configuration
  email_sending_account = "COGNITO_DEFAULT"
  from_email_address    = ""

  # Cognito - MFA configuration
  mfa_configuration = "OPTIONAL"

  # Cognito - Schema attributes
  schema_attributes = []

  # Cognito - User Pool Domain
  create_user_pool_domain = true
  domain                  = "" # If empty, will use name_prefix

  # Cognito - OAuth configuration
  allowed_oauth_flows          = ["code"]
  allowed_oauth_scopes         = ["email", "openid", "profile"]
  supported_identity_providers = ["COGNITO"]

  # Cognito - Token validity
  access_token_validity         = 24 # hours
  id_token_validity             = 24 # hours
  refresh_token_validity        = 30 # days
  access_token_validity_unit    = "hours"
  id_token_validity_unit        = "hours"
  refresh_token_validity_unit   = "days"
  prevent_user_existence_errors = "ENABLED"

  # Common tags
  tags = {
    Environment = "production"
    Project     = "crypto-investing-platform"
    ManagedBy   = "terraform"
  }
}
