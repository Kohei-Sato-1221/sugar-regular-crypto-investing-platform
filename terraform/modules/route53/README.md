# Route53 Module

再利用可能なRoute53 Hosted Zoneモジュールです。

## 使用方法

```hcl
module "route53" {
  source = "../../modules/route53"

  domain_name = "example.com"
  
  tags = {
    Environment = "production"
  }
}
```

## リソース

- Route53 Hosted Zone

## 変数

- `domain_name`: ホストゾーンのドメイン名（必須）

## 出力

- `hosted_zone_id`: Hosted ZoneのID
- `hosted_zone_name_servers`: Name Serversのリスト
- `hosted_zone_arn`: Hosted ZoneのARN
- `domain_name`: ドメイン名

## 注意事項

Route53でホストゾーンを作成した後、ドメインレジストラ（お名前.comなど）で以下のName Serversを設定する必要があります：

```
ns-xxx.awsdns-xx.com
ns-yyy.awsdns-yy.co.uk
ns-zzz.awsdns-zz.net
ns-www.awsdns-www.org
```

モジュールの出力で取得した`hosted_zone_name_servers`を使用してください。

