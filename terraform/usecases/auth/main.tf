# Auth Usecase - Cognito User Pool for Web App

module "cognito" {
  source = "../../modules/cognito"

  name_prefix = var.name_prefix

  # Password policy
  password_minimum_length    = var.password_minimum_length
  password_require_lowercase = var.password_require_lowercase
  password_require_numbers   = var.password_require_numbers
  password_require_symbols   = var.password_require_symbols
  password_require_uppercase = var.password_require_uppercase

  # Username configuration
  username_attributes      = var.username_attributes
  auto_verified_attributes = var.auto_verified_attributes

  # Email configuration
  email_sending_account = var.email_sending_account
  from_email_address    = var.from_email_address

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  # Schema attributes
  schema_attributes = var.schema_attributes

  # User Pool Domain
  create_user_pool_domain = var.create_user_pool_domain
  domain                  = var.domain

  # OAuth configuration
  allowed_oauth_flows          = var.allowed_oauth_flows
  allowed_oauth_scopes         = var.allowed_oauth_scopes
  callback_urls                = var.callback_urls
  logout_urls                  = var.logout_urls
  supported_identity_providers = var.supported_identity_providers

  # Token validity
  access_token_validity         = var.access_token_validity
  id_token_validity             = var.id_token_validity
  refresh_token_validity        = var.refresh_token_validity
  access_token_validity_unit    = var.access_token_validity_unit
  id_token_validity_unit        = var.id_token_validity_unit
  refresh_token_validity_unit   = var.refresh_token_validity_unit
  prevent_user_existence_errors = var.prevent_user_existence_errors

  tags = var.tags
}

