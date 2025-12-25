# Domain Usecase - Route53 Hosted Zones
module "domain" {
  source = "../../usecases/domain"

  root_domain = local.root_domain
  app_domain  = local.app_domain
  tags        = local.tags
}

