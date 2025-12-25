# Cognito Module

再利用可能なCognitoモジュールです。Cognito User Pool、User Pool Client、User Pool Domainなどの認証リソースを作成します。

## 使用方法

```hcl
module "cognito" {
  source = "../../modules/cognito"

  name_prefix = "my-app"

  # Password policy
  password_minimum_length = 8
  password_require_lowercase = true
  password_require_numbers = true
  password_require_symbols = true
  password_require_uppercase = true

  # Username configuration
  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  # OAuth configuration for Web App
  callback_urls = [
    "http://localhost:3000/auth/callback",
    "https://example.com/auth/callback"
  ]
  logout_urls = [
    "http://localhost:3000",
    "https://example.com"
  ]

  # MFA
  mfa_configuration = "OPTIONAL"

  tags = {
    Environment = "production"
  }
}
```

## リソース

- Cognito User Pool
- Cognito User Pool Client (Web App用、client secretなし)
- Cognito User Pool Domain (オプション)

## 変数

詳細は`variables.tf`を参照してください。

## 出力

- `user_pool_id`: User PoolのID
- `user_pool_client_id`: User Pool ClientのID
- `user_pool_domain`: User Pool Domain
- `authorization_endpoint`: 認証エンドポイントURL
- `token_endpoint`: トークンエンドポイントURL

## Webアプリでの使用

Next.jsなどのWebアプリで使用する場合：

1. User Pool IDとClient IDを環境変数に設定
2. Callback URLを設定
3. OAuth 2.0 Authorization Code Flowを使用

