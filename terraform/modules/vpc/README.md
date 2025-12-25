# VPC Module

再利用可能なVPCモジュールです。VPC、サブネット、インターネットゲートウェイ、NATゲートウェイなどのネットワークリソースを作成します。

## 使用方法

```hcl
module "vpc" {
  source = "../../modules/vpc"

  name_prefix          = "my-app"
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
  availability_zones   = ["ap-northeast-1a", "ap-northeast-1c"]
  
  enable_nat_gateway = true
  tags = {
    Environment = "production"
  }
}
```

## リソース

- VPC
- インターネットゲートウェイ
- パブリックサブネット
- プライベートサブネット
- NATゲートウェイ（オプション）
- ルートテーブル

## 変数

詳細は`variables.tf`を参照してください。

## 出力

詳細は`outputs.tf`を参照してください。

