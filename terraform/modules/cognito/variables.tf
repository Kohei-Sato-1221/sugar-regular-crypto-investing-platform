variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

# Password policy
variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 8
}

variable "password_require_lowercase" {
  description = "Require lowercase characters in password"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers in password"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols in password"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase characters in password"
  type        = bool
  default     = true
}

# Username configuration
variable "username_attributes" {
  description = "Attributes used for username (email, phone_number, or both)"
  type        = list(string)
  default     = ["email"]
}

variable "auto_verified_attributes" {
  description = "Attributes that are auto-verified"
  type        = list(string)
  default     = ["email"]
}

# Email configuration
variable "email_sending_account" {
  description = "Email sending account (COGNITO_DEFAULT or DEVELOPER)"
  type        = string
  default     = "COGNITO_DEFAULT"
}

variable "from_email_address" {
  description = "From email address for emails sent by Cognito"
  type        = string
  default     = ""
}

# MFA configuration
variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OPTIONAL"
}

# Schema attributes
variable "schema_attributes" {
  description = "Custom schema attributes for user pool"
  type = list(object({
    name                     = string
    attribute_data_type      = string
    mutable                 = optional(bool, true)
    required                = optional(bool, false)
    developer_only_attribute = optional(bool, false)
    string_attribute_constraints = optional(object({
      min_length = optional(number)
      max_length = optional(number)
    }))
    number_attribute_constraints = optional(object({
      min_value = optional(number)
      max_value = optional(number)
    }))
  }))
  default = []
}

# User Pool Domain
variable "create_user_pool_domain" {
  description = "Whether to create a user pool domain"
  type        = bool
  default     = true
}

variable "domain" {
  description = "Domain name for Cognito (if empty, will use name_prefix)"
  type        = string
  default     = ""
}

# OAuth configuration
variable "allowed_oauth_flows" {
  description = "Allowed OAuth flows (code, implicit, client_credentials)"
  type        = list(string)
  default     = ["code"]
}

variable "allowed_oauth_scopes" {
  description = "Allowed OAuth scopes"
  type        = list(string)
  default     = ["email", "openid", "profile"]
}

variable "callback_urls" {
  description = "Allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/auth/callback"]
}

variable "logout_urls" {
  description = "Allowed logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "supported_identity_providers" {
  description = "Supported identity providers"
  type        = list(string)
  default     = ["COGNITO"]
}

# Token validity
variable "access_token_validity" {
  description = "Access token validity in hours"
  type        = number
  default     = 24
}

variable "id_token_validity" {
  description = "ID token validity in hours"
  type        = number
  default     = 24
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "access_token_validity_unit" {
  description = "Access token validity unit"
  type        = string
  default     = "hours"
}

variable "id_token_validity_unit" {
  description = "ID token validity unit"
  type        = string
  default     = "hours"
}

variable "refresh_token_validity_unit" {
  description = "Refresh token validity unit"
  type        = string
  default     = "days"
}

variable "prevent_user_existence_errors" {
  description = "Prevent user existence errors (ENABLED or LEGACY)"
  type        = string
  default     = "ENABLED"
}

variable "explicit_auth_flows" {
  description = "List of explicit authentication flows (ALLOW_USER_PASSWORD_AUTH, ALLOW_USER_SRP_AUTH, ALLOW_REFRESH_TOKEN_AUTH, etc.)"
  type        = list(string)
  default     = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

