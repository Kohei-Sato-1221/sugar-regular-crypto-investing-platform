output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_name" {
  description = "Name of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.name
}

output "user_pool_client_id" {
  description = "ID of the Cognito User Pool Client (Web App)"
  value       = aws_cognito_user_pool_client.web.id
}

output "user_pool_client_secret" {
  description = "Client secret of the Cognito User Pool Client (null for public clients)"
  value       = aws_cognito_user_pool_client.web.client_secret
  sensitive   = true
}

output "user_pool_domain" {
  description = "Domain of the Cognito User Pool"
  value       = var.create_user_pool_domain ? aws_cognito_user_pool_domain.main[0].domain : null
}

output "user_pool_endpoint" {
  description = "Endpoint name of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "authorization_endpoint" {
  description = "Authorization endpoint URL for OAuth flows"
  value = var.create_user_pool_domain ? (
    "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.name}.amazoncognito.com/oauth2/authorize"
  ) : null
}

output "token_endpoint" {
  description = "Token endpoint URL for OAuth flows"
  value = var.create_user_pool_domain ? (
    "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.name}.amazoncognito.com/oauth2/token"
  ) : null
}

output "user_info_endpoint" {
  description = "User info endpoint URL"
  value = var.create_user_pool_domain ? (
    "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.name}.amazoncognito.com/oauth2/userInfo"
  ) : null
}

output "logout_endpoint" {
  description = "Logout endpoint URL"
  value = var.create_user_pool_domain ? (
    "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.name}.amazoncognito.com/logout"
  ) : null
}

