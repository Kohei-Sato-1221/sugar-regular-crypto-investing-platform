import { beforeEach, describe, expect, it, vi } from "vitest";
import { ID_TOKEN_COOKIE_KEY } from "~/const/auth";
import { refreshTokens } from "../cognito";

// refreshTokensの戻り値の型
type RefreshResult = {
	accessToken: string;
	idToken: string;
	refreshToken?: string;
};

// token-utilsをモック
vi.mock("../token-utils", () => ({
	decodeIdToken: vi.fn((token: string) => {
		// テスト用のIdTokenをデコード
		if (token.includes("user-123")) {
			return {
				sub: "user-123",
				email: "test@example.com",
				"cognito:username": "test@example.com",
				name: "Test User",
				exp: Math.floor(Date.now() / 1000) - 3600, // 期限切れ
			};
		}
		return null;
	}),
}));

// crypto-utilsをモック
const mockDecryptToken = vi.fn((encrypted: string) => {
	// "encrypted-"プレフィックスを削除して元のトークンを返す
	if (encrypted.startsWith("encrypted-")) {
		return encrypted.replace("encrypted-", "");
	}
	return null;
});
vi.mock("../crypto-utils", () => ({
	encryptToken: vi.fn(),
	decryptToken: (encrypted: string) => mockDecryptToken(encrypted),
}));

// env.jsをモック
vi.mock("~/env", () => ({
	env: {
		AUTH_SECRET: "test-auth-secret-key-for-testing-purposes-only",
		NODE_ENV: "test",
	},
}));

// Next.js cookiesをモック
vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		set: vi.fn(),
		get: vi.fn((key: string) => {
			// IdTokenを返す（SECRET_HASH計算用）
			// Cookieには暗号化された値が保存されている
			if (key === ID_TOKEN_COOKIE_KEY) {
				// テスト用のIdToken
				const header = { alg: "HS256", typ: "JWT" };
				const payload = {
					sub: "user-123",
					email: "test@example.com",
					"cognito:username": "test@example.com",
					name: "Test User",
					exp: Math.floor(Date.now() / 1000) - 3600, // 期限切れ
				};
				const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
				const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
				const idToken = `${encodedHeader}.${encodedPayload}.mock-signature`;
				return {
					value: `encrypted-${idToken}`,
				};
			}
			return undefined;
		}),
		delete: vi.fn(),
	})),
}));

describe("refreshTokens", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const testCases = [
		{
			name: "正常系: RefreshTokenで新しいトークンを取得",
			input: "refresh-token-user-123",
			expected: async (result: RefreshResult) => {
				expect(result).toHaveProperty("accessToken");
				expect(result).toHaveProperty("idToken");
				expect(result.accessToken).toBeTruthy();
				expect(result.idToken).toBeTruthy();
				// RefreshTokenは返さない
				expect(result).not.toHaveProperty("refreshToken");
			},
		},
		{
			name: "異常系: 無効なRefreshToken",
			input: "invalid-refresh-token",
			shouldThrow: true,
			expectedError: {
				message: "リフレッシュトークンが無効です。再度ログインしてください。",
			},
		},
		{
			name: "異常系: 存在しないユーザーのRefreshToken",
			input: "refresh-token-non-existent-user",
			shouldThrow: true,
			expectedError: {
				message: "リフレッシュトークンが無効です。再度ログインしてください。",
			},
		},
	];

	testCases.forEach((testCase) => {
		it(testCase.name, async () => {
			// Arrange
			// Act & Assert
			if ("shouldThrow" in testCase && testCase.shouldThrow) {
				const promise = refreshTokens(testCase.input);
				await expect(promise).rejects.toThrow();

				if ("expectedError" in testCase && testCase.expectedError) {
					await expect(promise).rejects.toMatchObject(testCase.expectedError);
				}
			} else {
				const result = await refreshTokens(testCase.input);
				if ("expected" in testCase && testCase.expected) {
					await testCase.expected(result);
				}
			}
		});
	});
});
