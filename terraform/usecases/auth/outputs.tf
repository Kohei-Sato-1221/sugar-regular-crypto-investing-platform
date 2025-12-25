output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = module.cognito.user_pool_arn
}

output "user_pool_name" {
  description = "Name of the Cognito User Pool"
  value       = module.cognito.user_pool_name
}

output "user_pool_client_id" {
  description = "ID of the Cognito User Pool Client (Web App)"
  value       = module.cognito.user_pool_client_id
}

output "user_pool_domain" {
  description = "Domain of the Cognito User Pool"
  value       = module.cognito.user_pool_domain
}

output "authorization_endpoint" {
  description = "Authorization endpoint URL for OAuth flows"
  value       = module.cognito.authorization_endpoint
}

output "token_endpoint" {
  description = "Token endpoint URL for OAuth flows"
  value       = module.cognito.token_endpoint
}

output "user_info_endpoint" {
  description = "User info endpoint URL"
  value       = module.cognito.user_info_endpoint
}

output "logout_endpoint" {
  description = "Logout endpoint URL"
  value       = module.cognito.logout_endpoint
}

