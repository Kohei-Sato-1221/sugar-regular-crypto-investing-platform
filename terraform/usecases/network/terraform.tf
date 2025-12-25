terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.17.0"
    }
  }

  backend "s3" {
    region                  = "ap-northeast-1"
    bucket                  = "tfstate-investing-platform-20251224"
    key                     = "network/terraform.tfstate"
    profile                 = "investing-platform-20251224"
    shared_credentials_file = "~/.aws/credentials"
  }

  required_version = "= 1.13.5"
}

provider "aws" {
  profile                  = "investing-platform-20251224"
  region                   = "ap-northeast-1"
  shared_config_files      = ["~/.aws/config"]
  shared_credentials_files = ["~/.aws/credentials"]
}

