output "root_domain_hosted_zone_id" {
  description = "ID of the Route53 hosted zone for root domain"
  value       = module.route53_root.hosted_zone_id
}

output "root_domain_name_servers" {
  description = "Name servers of the Route53 hosted zone for root domain"
  value       = module.route53_root.hosted_zone_name_servers
}

output "app_domain_hosted_zone_id" {
  description = "ID of the Route53 hosted zone for app domain"
  value       = module.route53_app.hosted_zone_id
}

output "app_domain_name_servers" {
  description = "Name servers of the Route53 hosted zone for app domain"
  value       = module.route53_app.hosted_zone_name_servers
}

