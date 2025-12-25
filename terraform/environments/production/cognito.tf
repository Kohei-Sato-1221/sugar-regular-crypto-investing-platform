# Auth Module - Cognito User Pool for Web App
module "cognito" {
  source = "../../modules/cognito"

  name_prefix = local.name_prefix

  # Password policy
  password_minimum_length    = local.password_minimum_length
  password_require_lowercase = local.password_require_lowercase
  password_require_numbers   = local.password_require_numbers
  password_require_symbols   = local.password_require_symbols
  password_require_uppercase = local.password_require_uppercase

  # Username configuration
  username_attributes      = local.username_attributes
  auto_verified_attributes = local.auto_verified_attributes

  # Email configuration
  email_sending_account = local.email_sending_account
  from_email_address    = local.from_email_address

  # MFA configuration
  mfa_configuration = local.mfa_configuration

  # Schema attributes
  schema_attributes = local.schema_attributes

  # User Pool Domain
  create_user_pool_domain = local.create_user_pool_domain
  domain                  = local.domain

  # OAuth configuration
  allowed_oauth_flows          = local.allowed_oauth_flows
  allowed_oauth_scopes         = local.allowed_oauth_scopes
  callback_urls                = local.callback_urls
  logout_urls                  = local.logout_urls
  supported_identity_providers = local.supported_identity_providers

  # Token validity
  access_token_validity         = local.access_token_validity
  id_token_validity             = local.id_token_validity
  refresh_token_validity        = local.refresh_token_validity
  access_token_validity_unit    = local.access_token_validity_unit
  id_token_validity_unit        = local.id_token_validity_unit
  refresh_token_validity_unit   = local.refresh_token_validity_unit
  prevent_user_existence_errors = local.prevent_user_existence_errors

  tags = local.tags
}

# Sample Users - Created from local.sample_users array
resource "aws_cognito_user" "sample_users" {
  for_each = {
    for user in local.sample_users : user.username => user
  }

  user_pool_id = module.cognito.user_pool_id
  username     = each.value.username

  attributes = {
    email                 = each.value.email
    email_verified        = tostring(each.value.email_verified)
    phone_number          = each.value.phone_number
    phone_number_verified = tostring(each.value.phone_number_verified)
    name                  = each.value.name
    picture               = each.value.picture
  }

  # Temporary password (user will be required to change on first login)
  temporary_password = each.value.temporary_password

  # Prevent sending welcome message
  message_action = "SUPPRESS"
}

