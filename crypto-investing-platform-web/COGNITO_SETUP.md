# Cognito設定ガイド

CognitoとNextAuthを連携させるための設定手順です。

## 1. TerraformでCognitoリソースをデプロイ

```bash
cd terraform
make plan e=production
make apply e=production
```

## 2. Terraformの出力値を取得

デプロイ後、以下のコマンドでCognitoの設定値を取得します：

```bash
cd terraform/environments/production
terraform output
```

以下の値が表示されます：
- `cognito_user_pool_id`: User Pool ID
- `cognito_user_pool_client_id`: Client ID
- `cognito_user_pool_client_secret`: Client Secret（機密情報）
- `cognito_issuer_url`: Issuer URL（NextAuthで使用）
- `cognito_user_pool_domain`: Cognitoドメイン

## 3. .envファイルに環境変数を設定

`crypto-investing-platform-web/.env`ファイルに以下の環境変数を追加します：

```env
# AWS Cognito Configuration
COGNITO_CLIENT_ID="<cognito_user_pool_client_idの値>"
COGNITO_CLIENT_SECRET="<cognito_user_pool_client_secretの値>"
COGNITO_ISSUER="<cognito_issuer_urlの値>"
COGNITO_DOMAIN="<cognito_user_pool_domainの値>"

# NextAuth Secret (必須)
AUTH_SECRET="<任意の秘密鍵>"
# 生成方法: openssl rand -base64 32
```

## 4. 値の取得方法（詳細）

### 方法1: Terraform出力を直接取得

```bash
cd terraform/environments/production

# Client ID
terraform output -raw cognito_user_pool_client_id

# Client Secret（機密情報）
terraform output -raw cognito_user_pool_client_secret

# Issuer URL
terraform output -raw cognito_issuer_url

# Domain
terraform output -raw cognito_user_pool_domain
```

### 方法2: AWS CLIで確認

```bash
# User Pool IDを取得（Terraform出力から）
USER_POOL_ID=$(cd terraform/environments/production && terraform output -raw cognito_user_pool_id)

# User Pool Client情報を取得
aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $(cd terraform/environments/production && terraform output -raw cognito_user_pool_client_id) \
  --profile investing-platform-20251224 \
  --region ap-northeast-1
```

## 5. コールバックURLの確認

NextAuthのデフォルトコールバックURLは：
- 開発環境: `http://localhost:3000/api/auth/callback/cognito`
- 本番環境: `https://app.stockbit.click/api/auth/callback/cognito`

これらは既にTerraformで設定済みです。

## 6. 動作確認

1. 開発サーバーを起動：
```bash
cd crypto-investing-platform-web
bun run dev
```

2. ブラウザで`http://localhost:3000/private`にアクセス

3. 認証されていない場合、自動的にサインインページにリダイレクトされます

4. Cognitoでログインすると、`/private`ページにアクセスできるようになります

## トラブルシューティング

### エラー: "Invalid issuer"
- `COGNITO_ISSUER`の値が正しいか確認してください
- 形式: `https://cognito-idp.ap-northeast-1.amazonaws.com/{USER_POOL_ID}`

### エラー: "Invalid client"
- `COGNITO_CLIENT_ID`と`COGNITO_CLIENT_SECRET`が正しいか確認してください
- Terraformで作成したClient IDとSecretを使用しているか確認

### コールバックURLエラー
- CognitoのUser Pool Client設定で、コールバックURLが正しく設定されているか確認
- Terraformの`callback_urls`が`/api/auth/callback/cognito`を含んでいるか確認

