# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "cognito_user_pool_client_secret" {
  description = "Cognito User Pool Client Secret (sensitive)"
  value       = module.cognito.user_pool_client_secret
  sensitive   = true
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = module.cognito.user_pool_domain
}

output "cognito_issuer_url" {
  description = "Cognito Issuer URL (for NextAuth)"
  value       = "https://cognito-idp.ap-northeast-1.amazonaws.com/${module.cognito.user_pool_id}"
}

output "cognito_authorization_endpoint" {
  description = "Cognito Authorization Endpoint URL"
  value       = module.cognito.authorization_endpoint
}

output "cognito_token_endpoint" {
  description = "Cognito Token Endpoint URL"
  value       = module.cognito.token_endpoint
}

output "cognito_user_info_endpoint" {
  description = "Cognito User Info Endpoint URL"
  value       = module.cognito.user_info_endpoint
}

output "cognito_logout_endpoint" {
  description = "Cognito Logout Endpoint URL"
  value       = module.cognito.logout_endpoint
}
