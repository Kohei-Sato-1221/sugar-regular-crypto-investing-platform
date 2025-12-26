# .envファイル設定ガイド

Terraformの出力値を`.env`ファイルに設定する手順です。

## 取得したTerraform出力値

以下の値が取得できました：

```
cognito_user_pool_id = "ap-northeast-1_ep13tJ6Dm"
cognito_user_pool_client_id = "7nl2ksifv5i3bgf960mr8ukb5n"
cognito_user_pool_client_secret = <sensitive>  # 別途取得が必要
cognito_user_pool_domain = "investing-platform-prod-auth"
cognito_issuer_url = "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_ep13tJ6Dm"
```

## Client Secretの取得

Client Secretは機密情報のため、以下のコマンドで取得してください：

```bash
cd terraform/environments/production
terraform output -raw cognito_user_pool_client_secret
```

## .envファイルの設定

`crypto-investing-platform-web/.env`ファイルに以下を追加/更新してください：

```env
# AWS Cognito Configuration
COGNITO_USER_POOL_ID="ap-northeast-1_ep13tJ6Dm"
COGNITO_CLIENT_ID="7nl2ksifv5i3bgf960mr8ukb5n"
COGNITO_CLIENT_SECRET="<上記コマンドで取得した値>"
AWS_REGION="ap-northeast-1"
COGNITO_ISSUER="https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_ep13tJ6Dm"
COGNITO_DOMAIN="https://investing-platform-prod-auth.auth.ap-northeast-1.amazoncognito.com"
```

## 完全な.envファイル例

```env
# Database
DATABASE_URL="postgresql://ragus:investingPassWork12345@localhost:6543/investing_platform_db?schema=public"

# NextAuth
AUTH_SECRET="your-auth-secret-here"

# AWS Cognito Configuration
COGNITO_USER_POOL_ID="ap-northeast-1_ep13tJ6Dm"
COGNITO_CLIENT_ID="7nl2ksifv5i3bgf960mr8ukb5n"
COGNITO_CLIENT_SECRET="<terraform output -raw cognito_user_pool_client_secret で取得>"
AWS_REGION="ap-northeast-1"
COGNITO_ISSUER="https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_ep13tJ6Dm"
COGNITO_DOMAIN="https://investing-platform-prod-auth.auth.ap-northeast-1.amazoncognito.com"
```

## 動作確認

設定後、開発サーバーを起動して動作確認：

```bash
cd crypto-investing-platform-web
bun run dev
```

`http://localhost:3000/private`にアクセスして、Cognitoの認証画面が表示されることを確認してください。

