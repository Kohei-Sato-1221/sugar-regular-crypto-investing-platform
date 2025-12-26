# authConfig の役割と動作の仕組み

`src/server/auth/config.ts`の`authConfig`について説明します。

## authConfig の役割

`authConfig`は、NextAuth v5の設定オブジェクトです。NextAuthライブラリの動作を定義します。

## 呼び出しフロー

```
1. config.ts (authConfig定義)
   ↓
2. index.ts (NextAuth初期化)
   NextAuth(authConfig) → { auth, handlers, signIn, signOut }
   ↓
3. 以下の場所で使用:
   - middleware.ts (認証チェック)
   - route.ts (API Route Handler)
   - Server Components (セッション取得)
   - tRPC Context (API認証)
```

## 1. 初期化 - `src/server/auth/index.ts`

```typescript
import { authConfig } from "./config";

// authConfigを使ってNextAuthを初期化
const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
```

**役割**: `authConfig`を受け取って、NextAuthを初期化し、以下の関数を生成：
- `auth()`: セッション情報を取得する関数
- `handlers`: API Route用のハンドラー（GET, POST）
- `signIn()`: サインイン関数
- `signOut()`: サインアウト関数

**実行タイミング**: アプリケーション起動時（一度だけ実行）

## 2. Middleware - `src/middleware.ts`

```typescript
import { auth } from "~/server/auth";

export default auth;
```

**役割**: 全てのリクエストに対して認証チェックを実行

**実行タイミング**: 
- リクエストがサーバーに到達する**前**に実行（Edge Runtime）
- matcherで指定されたパスにマッチした場合のみ

**動作**:
1. `auth()`関数が呼び出される
2. `authConfig`の`authorized`コールバックが実行される
3. `authorized`が`false`を返すと、自動的にサインインページにリダイレクト

## 3. API Route - `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "~/server/auth";

export const { GET, POST } = handlers;
```

**役割**: NextAuthの認証エンドポイント（`/api/auth/signin`, `/api/auth/callback/cognito`など）

**実行タイミング**: 
- `/api/auth/*`へのリクエストが来た時
- サインイン、コールバック、セッション更新などの処理

**動作**:
1. リクエストが`handlers`に渡される
2. `authConfig`の設定に基づいて認証処理を実行
3. Cognitoへのリダイレクト、コールバック処理、セッション作成など

## 4. Server Components - `src/app/private/page.tsx`

```typescript
import { auth } from "~/server/auth";

export default async function PrivatePage() {
  const session = await auth(); // ← ここでauthConfigが使われる
  // ...
}
```

**役割**: サーバー側でセッション情報を取得

**実行タイミング**: 
- Server Componentがレンダリングされる時
- ページアクセス時

**動作**:
1. `auth()`関数が呼び出される
2. `authConfig`の`session`コールバックが実行される
3. セッション情報を返す

## 5. tRPC Context - `src/server/api/trpc.ts`

```typescript
import { auth } from "~/server/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth(); // ← ここでauthConfigが使われる
  return { db, session, ...opts };
};
```

**役割**: tRPCのAPI呼び出し時にセッション情報を取得

**実行タイミング**: 
- tRPCのAPIエンドポイントが呼び出される時

## authConfig の各プロパティの役割

### `providers`
```typescript
providers: [CognitoProvider({ ... })]
```
- **役割**: 使用する認証プロバイダーを定義（Cognito、Google、GitHubなど）
- **実行タイミング**: サインイン時、認証フロー中

### `adapter`
```typescript
adapter: PrismaAdapter(db)
```
- **役割**: データベースとの連携（セッション、ユーザー情報の保存）
- **実行タイミング**: セッション作成・更新時、ユーザー情報の保存時

### `pages`
```typescript
pages: {
  signIn: "/api/auth/signin",
  error: "/api/auth/error",
}
```
- **役割**: カスタムページのURLを指定
- **実行タイミング**: リダイレクトが必要な時

### `callbacks.authorized`
```typescript
authorized({ request, auth }) {
  // 認証チェックロジック
}
```
- **役割**: Middlewareでの認証チェック
- **実行タイミング**: Middleware実行時（リクエストの最初）
- **戻り値**: 
  - `true`: リクエストを許可
  - `false`: サインインページにリダイレクト

### `callbacks.session`
```typescript
session({ session, user }) {
  // セッション情報をカスタマイズ
}
```
- **役割**: セッション情報をカスタマイズ（例：user.idを追加）
- **実行タイミング**: `auth()`関数が呼び出された時

### `trustHost`
```typescript
trustHost: true
```
- **役割**: 本番環境でのホスト検証をスキップ
- **実行タイミング**: リクエスト処理時

## まとめ

`authConfig`は：
1. **定義場所**: `src/server/auth/config.ts`
2. **初期化**: `src/server/auth/index.ts`で`NextAuth(authConfig)`として使用
3. **使用箇所**:
   - Middleware（全リクエストの認証チェック）
   - API Route（認証エンドポイント）
   - Server Components（セッション取得）
   - tRPC Context（API認証）

**重要なポイント**:
- `authConfig`は一度定義されると、NextAuthの内部で様々な場所で参照される
- `authorized`コールバックはMiddlewareでのみ実行される
- `session`コールバックは`auth()`関数が呼ばれるたびに実行される

