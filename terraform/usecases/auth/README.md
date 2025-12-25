# Auth Usecase

このディレクトリは、Cognito User Poolを含む認証リソースを定義します。Webアプリケーションで使用するためのCognito設定です。

## 使用方法

1. `terraform.tfvars.example`を`terraform.tfvars`にコピーして、値をカスタマイズします：

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. `terraform.tfvars`を編集して、環境に合わせた値を設定します。特に以下を設定してください：
   - `callback_urls`: アプリの認証コールバックURL
   - `logout_urls`: ログアウト後のリダイレクトURL

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

- `user_pool_id`: Cognito User PoolのID
- `user_pool_client_id`: User Pool ClientのID（Webアプリで使用）
- `user_pool_domain`: User Pool Domain
- `authorization_endpoint`: 認証エンドポイントURL
- `token_endpoint`: トークンエンドポイントURL

## Webアプリでの使用

Next.jsなどのWebアプリで使用する場合、環境変数に以下を設定してください：

```
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<user_pool_id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<user_pool_client_id>
NEXT_PUBLIC_COGNITO_DOMAIN=<user_pool_domain>
```

認証ライブラリ（例：`next-auth`、`aws-amplify`）を使用して、OAuth 2.0 Authorization Code Flowを実装します。

## モジュール

このusecaseは`../../modules/cognito`モジュールを使用しています。

