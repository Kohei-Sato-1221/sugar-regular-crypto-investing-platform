# authConfig の呼び出しタイミング

## 1. 初期化（アプリ起動時 - 1回のみ）

### `src/server/auth/index.ts`で実行

```typescript
import { authConfig } from "./config";

// モジュールが読み込まれた時に実行される（1回のみ）
const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);
```

**実行タイミング**: 
- Next.jsアプリケーションが起動した時
- このモジュールが初めてインポートされた時

**何が起こる**:
- `authConfig`が`NextAuth()`に渡される
- NextAuthが設定を読み込み、内部で使用する関数を生成
- `auth`, `handlers`, `signIn`, `signOut`が返される

---

## 2. リクエスト時の呼び出し

### 2-1. Middleware（全リクエストの最初）

**ファイル**: `src/middleware.ts`
```typescript
import { auth } from "~/server/auth";

export default auth; // Middlewareとして実行される
```

**実行タイミング**: 
- リクエストがサーバーに到達した時（他の処理より先）
- `matcher`で指定されたパスにマッチした場合

**`authConfig`の使用箇所**:
- `callbacks.authorized()` が実行される
  - パスの判定と認証チェックを行う

**例**: `/private`にアクセスした時
1. Middlewareが実行される
2. `authConfig.callbacks.authorized()`が呼ばれる
3. 認証されていない場合、`/signin`にリダイレクト

---

### 2-2. API Route（`/api/auth/*`へのリクエスト）

**ファイル**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from "~/server/auth";

export const { GET, POST } = handlers;
```

**実行タイミング**: 
- `/api/auth/signin`, `/api/auth/callback/cognito`などへのリクエスト時

**`authConfig`の使用箇所**:
- `providers`: どの認証プロバイダーを使用するか
- `callbacks.jwt()`: JWTトークンの生成・更新時
- `callbacks.session()`: セッション情報の構築時
- `pages`: カスタムページのURL

**例**: `/signin`ページでログインフォームを送信した時
1. `signIn("Cognito", {...})`が呼ばれる（クライアント側）
2. `/api/auth/callback/credentials`にPOSTリクエスト
3. `handlers.POST`が実行される
4. `authConfig.providers[0]`（Cognito CredentialsProvider）が使用される
5. `authConfig.callbacks.jwt()`が実行される（ログイン成功時）

---

### 2-3. Server Components（`auth()`呼び出し時）

**ファイル**: `src/app/private/page.tsx`, `src/app/page.tsx`
```typescript
import { auth } from "~/server/auth";

export default async function PrivatePage() {
  const session = await auth(); // ← ここでauthConfigが使用される
  // ...
}
```

**実行タイミング**: 
- Server Componentがレンダリングされる時
- ページアクセス時

**`authConfig`の使用箇所**:
- `callbacks.session()`: セッション情報を構築
- `session.strategy`: JWTセッションを使用

**例**: `/private`ページにアクセスした時（認証済み）
1. Server Componentがレンダリング開始
2. `auth()`関数が呼ばれる
3. JWTトークンからセッション情報を復元
4. `authConfig.callbacks.session()`が実行される
5. カスタマイズされたセッション情報が返される

---

### 2-4. tRPC Context（API呼び出し時）

**ファイル**: `src/server/api/trpc.ts`
```typescript
import { auth } from "~/server/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth(); // ← ここでauthConfigが使用される
  return { db, session, ...opts };
};
```

**実行タイミング**: 
- tRPCのAPIエンドポイントが呼び出される時

**`authConfig`の使用箇所**:
- `callbacks.session()`: セッション情報を構築

---

## まとめ

| タイミング | 場所 | `authConfig`の使用箇所 |
|----------|------|----------------------|
| **1回のみ（起動時）** | `src/server/auth/index.ts` | `NextAuth(authConfig)`で初期化 |
| **全リクエスト** | `src/middleware.ts` | `callbacks.authorized()` |
| **認証エンドポイント** | `src/app/api/auth/[...nextauth]/route.ts` | `providers`, `callbacks.jwt()`, `callbacks.session()` |
| **Server Components** | 各ページコンポーネント | `callbacks.session()` |
| **tRPC API** | `src/server/api/trpc.ts` | `callbacks.session()` |

**重要なポイント**:
- `authConfig`自体は**1回だけ**読み込まれる（モジュール読み込み時）
- 各コールバック関数（`authorized`, `jwt`, `session`）は**リクエストごと**に実行される
- `authConfig`の変更は、アプリケーションの再起動が必要


