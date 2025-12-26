# ユニットテスト方針

## 基本方針

### テストの目的
- **回帰テストの防止**: 既存機能が壊れないことを保証
- **リファクタリングの安全性**: コード変更時の動作保証
- **仕様の明確化**: テストが仕様書として機能
- **バグの早期発見**: 開発中の問題検出

### テスト対象の優先順位
1. **認証機能** (最優先)
   - ログイン/ログアウト
   - セッション管理
   - パスワード変更
   - 認証ミドルウェア

2. **ビジネスロジック**
   - tRPCルーター
   - データ変換・バリデーション
   - エラーハンドリング

3. **ユーティリティ関数**
   - トークンデコード
   - データフォーマット
   - ヘルパー関数

4. **UIコンポーネント** (低優先度)
   - フォームバリデーション
   - エラー表示
   - リダイレクト処理

---

## テストの種類

### ユニットテスト（必須）
- 個別の関数・モジュールのテスト
- モックを使用して依存関係を分離
- 高速実行が可能

### 統合テスト（推奨）
- 複数のモジュールの連携テスト
- tRPCルーター + 認証ロジック
- 実際の依存関係を使用（DBはモック）

### E2Eテスト（除外）
- Playwrightを使用したE2Eテストは**今回の実装対象外**
- 将来的に追加を検討

---

## テストツール

### 必須ツール
- **Vitest**: テストフレームワーク（Jestより高速）
- **React Testing Library**: Reactコンポーネントのテスト
- **@testing-library/user-event**: ユーザーインタラクションのシミュレーション

### モックツール
- **vi.mock()**: Vitestのモック機能
- **MSW (Mock Service Worker)**: APIモック（必要に応じて）

---

## テストファイルの配置規則

### ディレクトリ構造

```
src/
├── server/
│   ├── auth/
│   │   ├── __tests__/
│   │   │   ├── cognito.test.ts
│   │   │   ├── token-utils.test.ts
│   │   │   └── index.test.ts
│   │   ├── cognito.ts
│   │   └── token-utils.ts
│   └── api/
│       └── routers/
│           ├── __tests__/
│           │   ├── auth.test.ts
│           │   └── post.test.ts
│           ├── auth.ts
│           └── post.ts
├── app/
│   └── public/
│       └── signin/
│           ├── __tests__/
│           │   └── page.test.tsx
│           └── page.tsx
└── __tests__/
    ├── setup.ts
    └── helpers/
        └── test-utils.ts
```

### 命名規則
- テストファイル: `*.test.ts` または `*.test.tsx`
- テストディレクトリ: `__tests__`
- テスト関数: `describe` と `it` を使用

---

## テストの書き方

### 基本構造

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('モジュール名', () => {
  beforeEach(() => {
    // 各テスト前のセットアップ
    vi.clearAllMocks();
  });

  describe('関数名', () => {
    it('正常系: 期待される動作', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('異常系: エラーケース', () => {
      // エラーケースのテスト
    });
  });
});
```

### テストパターン

#### 1. 正常系テスト
- 期待される動作を確認
- 複数の入力パターンをテスト

#### 2. 異常系テスト
- エラーケースの処理を確認
- バリデーションエラー
- 外部APIエラー

#### 3. エッジケース
- 境界値のテスト
- null/undefinedの処理
- 空文字列の処理

#### 4. モックの使用
- 外部依存（AWS Cognito、DB）はモック
- 同じリクエスト内で一貫したモック

---

## カバレッジ目標

### 最小カバレッジ
- **認証機能**: 80%以上
- **tRPCルーター**: 70%以上
- **ユーティリティ関数**: 90%以上
- **全体**: 60%以上

### カバレッジの測定
```bash
bun test:coverage
```

---

## モックのルール

### モック対象
- **外部API**: AWS Cognito、データベース
- **Next.js API**: `cookies()`, `headers()`, `useRouter()`
- **tRPC**: クライアント側のフック

### モックの書き方

```typescript
// モジュール全体をモック
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

// 関数をモック
vi.mock('~/server/auth/cognito', () => ({
  signIn: vi.fn(),
  saveSession: vi.fn(),
}));
```

### モックのリセット
- 各テスト前に `vi.clearAllMocks()` を実行
- テスト間で状態が共有されないようにする

---

## アサーションのルール

### 推奨アサーション
- `expect().toBe()`: プリミティブ値の比較
- `expect().toEqual()`: オブジェクトの比較
- `expect().toHaveBeenCalledWith()`: 関数呼び出しの確認
- `expect().toBeTruthy()` / `toBeFalsy()`: 真偽値の確認

### 非推奨
- `expect().not.toBe()`: 代わりに `toBeFalsy()` を使用
- 複雑なネストしたアサーション: 分割してテスト

---

## テストデータの管理

### テストデータの作成
- ファクトリー関数を使用
- テストごとに独立したデータ

```typescript
// ヘルパー関数
function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}
```

### フィクスチャ
- 複雑なテストデータは `__tests__/fixtures/` に配置
- JSONファイルで管理（必要に応じて）

---

## 非同期処理のテスト

### async/await の使用
```typescript
it('非同期処理のテスト', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### waitFor の使用（React Testing Library）
```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

---

## エラーハンドリングのテスト

### エラーテストの書き方
```typescript
it('エラーを適切に処理する', async () => {
  vi.mocked(signIn).mockRejectedValue(
    new Error('認証に失敗しました')
  );

  await expect(caller.auth.signIn({ ... })).rejects.toThrow();
});
```

---

## CI/CD統合

### GitHub Actions
- プルリクエスト時に自動テスト実行
- カバレッジレポートの生成
- テスト失敗時はマージ不可

### テスト実行コマンド
```bash
# 開発時
bun test --watch

# CI/CD
bun test --run

# カバレッジ
bun test:coverage
```

---

## テストのメンテナンス

### テストの更新ルール
- 機能追加時: 新しいテストを追加
- バグ修正時: バグを再現するテストを追加
- リファクタリング時: テストを更新（動作は維持）

### テストの削除
- 削除した機能のテストは削除
- 重複するテストは統合
- 意味のないテストは削除

---

## 禁止事項

### ❌ やってはいけないこと
1. **実装詳細のテスト**: 内部実装に依存したテスト
2. **スナップショットテストの過度な使用**: UIの細かい変更で頻繁に失敗
3. **統合テストの代わりにE2E**: ユニットテストで十分な場合はE2Eを使わない
4. **モックの過度な使用**: 実際の動作を確認できない
5. **テスト間の依存関係**: テストは独立して実行可能であること

### ✅ 推奨事項
1. **テストファースト**: 可能な限りTDDを実践
2. **明確なテスト名**: 何をテストしているか明確に
3. **AAA パターン**: Arrange, Act, Assert
4. **DRY原則**: テストヘルパー関数を活用
5. **可読性**: テストコードも読みやすく

---

## 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [React Testing Library公式ドキュメント](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

