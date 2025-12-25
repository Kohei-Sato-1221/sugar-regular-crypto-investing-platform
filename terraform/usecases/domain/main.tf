# Domain Usecase - Route53 Hosted Zones

module "route53_root" {
  source = "../../modules/route53"

  domain_name = var.root_domain
  tags        = var.tags
}

module "route53_app" {
  source = "../../modules/route53"

  domain_name = var.app_domain
  tags        = var.tags
}

# Register NS record for app.stockbit.click in root domain hosted zone
resource "aws_route53_record" "app_ns" {
  zone_id = module.route53_root.hosted_zone_id
  name    = var.app_domain
  type    = "NS"
  ttl     = 300

  records = module.route53_app.hosted_zone_name_servers
}

