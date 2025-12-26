# テスト実装例

## セットアップ手順

### 1. パッケージのインストール

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom @vitejs/plugin-react
```

### 2. `vitest.config.ts` の作成

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. `src/__tests__/setup.ts` の作成

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### 4. `package.json` にスクリプトを追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## バックエンドテスト例

### `src/server/auth/__tests__/token-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { decodeIdToken, decodeAccessToken } from '../token-utils';

describe('token-utils', () => {
  describe('decodeIdToken', () => {
    it('正常なIDトークンをデコードできる', () => {
      // モックJWTトークン（実際のトークン構造に合わせて調整）
      const mockToken = createMockJWT({
        sub: 'user-123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const decoded = decodeIdToken(mockToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
    });

    it('無効なトークンはnullを返す', () => {
      const invalidToken = 'invalid.token';
      const decoded = decodeIdToken(invalidToken);
      expect(decoded).toBeNull();
    });

    it('期限切れトークンはデコードできるが、expが過去の値', () => {
      const expiredToken = createMockJWT({
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1時間前
      });

      const decoded = decodeIdToken(expiredToken);
      expect(decoded).toBeTruthy();
      expect(decoded?.exp).toBeLessThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('decodeAccessToken', () => {
    it('正常なアクセストークンをデコードできる', () => {
      const mockToken = createMockJWT({
        sub: 'user-123',
        client_id: 'test-client',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const decoded = decodeAccessToken(mockToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.client_id).toBe('test-client');
    });
  });
});

// ヘルパー関数
function createMockJWT(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  return `${encodedHeader}.${encodedPayload}.signature`;
}
```

### `src/server/auth/__tests__/cognito.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, saveSession, getSession } from '../cognito';
import { cookies } from 'next/headers';

// モック
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: vi.fn(),
  InitiateAuthCommand: vi.fn(),
}));

describe('cognito', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('正常なログインが成功する', async () => {
      // モックの設定
      const mockResponse = {
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: createMockJWT({ sub: 'user-123', email: 'test@example.com' }),
          RefreshToken: 'refresh-token',
        },
      };

      // signIn関数のテスト
      // 実際の実装に合わせてモックを設定
    });

    it('NEW_PASSWORD_REQUIREDチャレンジを返す', async () => {
      const mockResponse = {
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: 'session-token',
        ChallengeParameters: {
          USERNAME: 'test@example.com',
        },
      };

      // テスト実装
    });

    it('無効な認証情報でエラーを返す', async () => {
      // エラーケースのテスト
    });
  });

  describe('saveSession', () => {
    it('Cookieにトークンを保存する', async () => {
      const mockCookieStore = {
        set: vi.fn(),
      };

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      await saveSession({
        accessToken: 'access-token',
        idToken: createMockJWT({ sub: 'user-123' }),
        refreshToken: 'refresh-token',
      });

      expect(mockCookieStore.set).toHaveBeenCalledTimes(3);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        expect.any(String),
        'access-token',
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
        }),
      );
    });
  });

  describe('getSession', () => {
    it('有効なセッションを取得できる', async () => {
      const mockCookieStore = {
        get: vi.fn((key: string) => {
          if (key === 'idToken') {
            return { value: createMockJWT({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 }) };
          }
          return undefined;
        }),
      };

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const session = await getSession();

      expect(session).toBeTruthy();
      expect(session?.user.id).toBe('user-123');
    });

    it('期限切れトークンはnullを返す', async () => {
      const mockCookieStore = {
        get: vi.fn((key: string) => {
          if (key === 'idToken') {
            return { value: createMockJWT({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 }) };
          }
          return undefined;
        }),
      };

      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const session = await getSession();

      expect(session).toBeNull();
    });
  });
});
```

### `src/server/api/routers/__tests__/auth.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '~/server/api/trpc';
import { appRouter } from '~/server/api/root';
import { signIn, saveSession } from '~/server/auth/cognito';

vi.mock('~/server/auth/cognito');

describe('auth router', () => {
  const createCaller = createCallerFactory(appRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('正常なログインが成功する', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        idToken: createMockJWT({ sub: 'user-123', email: 'test@example.com' }),
        refreshToken: 'refresh-token',
      };

      vi.mocked(signIn).mockResolvedValue(mockTokens);
      vi.mocked(saveSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: null,
          image: null,
        },
      });

      const caller = createCaller({
        headers: new Headers(),
        db: {} as any,
        session: null,
      });

      const result = await caller.auth.signIn({
        username: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('バリデーションエラーを返す', async () => {
      const caller = createCaller({
        headers: new Headers(),
        db: {} as any,
        session: null,
      });

      await expect(
        caller.auth.signIn({
          username: 'invalid-email',
          password: '',
        }),
      ).rejects.toThrow();
    });

    it('NEW_PASSWORD_REQUIREDチャレンジを返す', async () => {
      vi.mocked(signIn).mockResolvedValue({
        challenge: {
          name: 'NEW_PASSWORD_REQUIRED',
          session: 'session-token',
          parameters: {
            USERNAME: 'test@example.com',
          },
        },
      });

      const caller = createCaller({
        headers: new Headers(),
        db: {} as any,
        session: null,
      });

      const result = await caller.auth.signIn({
        username: 'test@example.com',
        password: 'temp-password',
      });

      expect(result.success).toBe(false);
      expect(result.requiresPasswordChange).toBe(true);
      expect(result.challenge?.session).toBe('session-token');
    });
  });
});
```

---

## フロントエンドテスト例

### `src/app/public/signin/__tests__/page.test.tsx`

```typescript
import { describe, it, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import SignInPage from '../page';
import { api } from '~/trpc/react';

// モック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

vi.mock('~/trpc/react', () => ({
  api: {
    auth: {
      signIn: {
        useMutation: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}));

describe('SignInPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any);

    vi.mocked(api.auth.signIn.useMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  it('フォームが正しくレンダリングされる', () => {
    render(<SignInPage />);

    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
  });

  it('フォーム送信でログインAPIが呼ばれる', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com');
    await user.type(screen.getByLabelText(/パスワード/i), 'password123');
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('ログイン成功時にリダイレクトする', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' },
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com');
    await user.type(screen.getByLabelText(/パスワード/i), 'password123');
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/private');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('エラーメッセージが表示される', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue({
      message: 'ユーザー名またはパスワードが正しくありません。',
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com');
    await user.type(screen.getByLabelText(/パスワード/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    await waitFor(() => {
      expect(screen.getByText(/ユーザー名またはパスワードが正しくありません/i)).toBeInTheDocument();
    });
  });

  it('NEW_PASSWORD_REQUIRED時にパスワード変更ページにリダイレクト', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      success: false,
      requiresPasswordChange: true,
      challenge: {
        session: 'session-token',
        username: 'test@example.com',
      },
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com');
    await user.type(screen.getByLabelText(/パスワード/i), 'temp-password');
    await user.click(screen.getByRole('button', { name: /ログイン/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/public/change-password'),
      );
    });
  });
});
```

---

## E2Eテスト例（竹・松プラン）

### `e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログイン成功フロー', async ({ page }) => {
    await page.goto('/public/signin');

    // フォーム入力
    await page.fill('input[name="username"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // リダイレクトを待つ
    await page.waitForURL('/private');

    // 認証済みページが表示されることを確認
    await expect(page).toHaveURL('/private');
  });

  test('パスワード変更フロー', async ({ page }) => {
    // 初回ログイン（パスワード変更が必要）
    await page.goto('/public/signin');
    await page.fill('input[name="username"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'TempPassword123!');

    await page.click('button[type="submit"]');

    // パスワード変更ページにリダイレクト
    await page.waitForURL(/\/public\/change-password/);

    // 新しいパスワードを入力
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    await page.click('button[type="submit"]');

    // ログイン成功
    await page.waitForURL('/private');
  });

  test('未認証ユーザーはリダイレクトされる', async ({ page }) => {
    await page.goto('/private');

    // ログインページにリダイレクト
    await page.waitForURL(/\/public\/signin/);
  });
});
```

---

## テスト実行

```bash
# 全テスト実行
bun test

# ウォッチモード
bun test --watch

# UIモード
bun test:ui

# カバレッジレポート
bun test:coverage

# E2Eテスト（竹・松プラン）
bunx playwright test
```

