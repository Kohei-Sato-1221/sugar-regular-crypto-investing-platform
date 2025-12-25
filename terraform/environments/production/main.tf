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
  # Note: Standard attributes (name, picture, given_name, family_name, email, phone_number, etc.)
  # are available by default and do not need to be added to schema_attributes.
  # Available standard attributes include:
  # - name: Full name of the user
  # - picture: Profile picture URL
  # - email, phone_number, given_name, family_name, address, birthdate, etc.
  # Only add custom attributes here (prefixed with "custom:").
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

  # Sample users to create in Cognito
  sample_users = [
    {
      username              = "crypto-satoko@stockbit.click"
      email                 = "crypto-satoko@stockbit.click"
      phone_number          = "+818011112222"
      name                  = "Crypto Satoko"
      picture               = "https://assets.st-note.com/img/1712232991663-NKttzIyYUF.jpg"
      temporary_password    = "StockBidPass123!?"
      email_verified        = true
      phone_number_verified = true
    }
  ]
}
