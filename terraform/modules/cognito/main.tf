# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-user-pool"

  # Password policy
  password_policy {
    minimum_length    = var.password_minimum_length
    require_lowercase = var.password_require_lowercase
    require_numbers   = var.password_require_numbers
    require_symbols   = var.password_require_symbols
    require_uppercase = var.password_require_uppercase
  }

  # Username configuration
  username_attributes      = var.username_attributes
  auto_verified_attributes = var.auto_verified_attributes

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = var.email_sending_account
    from_email_address    = var.from_email_address
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  dynamic "software_token_mfa_configuration" {
    for_each = var.mfa_configuration != "OFF" ? [1] : []
    content {
      enabled = true
    }
  }

  # Schema attributes
  dynamic "schema" {
    for_each = var.schema_attributes
    content {
      name                     = schema.value.name
      attribute_data_type      = schema.value.attribute_data_type
      mutable                 = schema.value.mutable
      required                = schema.value.required
      developer_only_attribute = schema.value.developer_only_attribute

      dynamic "string_attribute_constraints" {
        for_each = schema.value.string_attribute_constraints != null ? [schema.value.string_attribute_constraints] : []
        content {
          min_length = string_attribute_constraints.value.min_length
          max_length = string_attribute_constraints.value.max_length
        }
      }

      dynamic "number_attribute_constraints" {
        for_each = schema.value.number_attribute_constraints != null ? [schema.value.number_attribute_constraints] : []
        content {
          min_value = number_attribute_constraints.value.min_value
          max_value = number_attribute_constraints.value.max_value
        }
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-user-pool"
    }
  )
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  count        = var.create_user_pool_domain ? 1 : 0
  domain       = var.domain != "" ? var.domain : "${var.name_prefix}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito User Pool Client (Web App)
resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.name_prefix}-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false # Web apps should not have client secrets
  allowed_oauth_flows                  = var.allowed_oauth_flows
  allowed_oauth_scopes                 = var.allowed_oauth_scopes
  allowed_oauth_flows_user_pool_client = true
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  supported_identity_providers         = var.supported_identity_providers

  token_validity_units {
    access_token  = var.access_token_validity_unit
    id_token      = var.id_token_validity_unit
    refresh_token = var.refresh_token_validity_unit
  }

  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  prevent_user_existence_errors = var.prevent_user_existence_errors
}

# Data source for current region
data "aws_region" "current" {}

