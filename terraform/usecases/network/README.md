# Network Usecase

このディレクトリは、VPCとサブネットを含むネットワークリソースを定義します。

## 使用方法

1. `terraform.tfvars.example`を`terraform.tfvars`にコピーして、値をカスタマイズします：

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. `terraform.tfvars`を編集して、環境に合わせた値を設定します。

3. Terraformを初期化します：

```bash
terraform init
```

4. プランを確認します：

```bash
terraform plan
```

5. 適用します：

```bash
terraform apply
```

## 出力値

- `vpc_id`: VPCのID
- `vpc_cidr_block`: VPCのCIDRブロック
- `internet_gateway_id`: インターネットゲートウェイのID
- `public_subnet_ids`: パブリックサブネットのIDリスト
- `private_subnet_ids`: プライベートサブネットのIDリスト
- `nat_gateway_ids`: NATゲートウェイのIDリスト

## モジュール

このusecaseは`../../modules/vpc`モジュールを使用しています。

