output "hosted_zone_id" {
  description = "ID of the Route53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers of the Route53 hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "hosted_zone_arn" {
  description = "ARN of the Route53 hosted zone"
  value       = aws_route53_zone.main.arn
}

output "domain_name" {
  description = "Domain name of the hosted zone"
  value       = aws_route53_zone.main.name
}

