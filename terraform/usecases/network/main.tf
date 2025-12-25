# Network Usecase - VPC and Subnets

module "vpc" {
  source = "../../modules/vpc"

  name_prefix            = var.name_prefix
  vpc_cidr               = var.vpc_cidr
  public_subnet_cidrs    = var.public_subnet_cidrs
  private_subnet_cidrs   = var.private_subnet_cidrs
  availability_zones     = var.availability_zones
  enable_dns_hostnames   = var.enable_dns_hostnames
  enable_dns_support     = var.enable_dns_support
  enable_nat_gateway     = var.enable_nat_gateway
  tags                   = var.tags
}

