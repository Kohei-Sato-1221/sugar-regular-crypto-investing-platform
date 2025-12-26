import { describe, it, expect, vi, beforeEach } from "vitest";

import { refreshTokens } from "../cognito";
import { ID_TOKEN_COOKIE_KEY } from "~/const/auth";

// Next.js cookiesをモック
vi.mock("next/headers", () => ({
	cookies: vi.fn(() => ({
		set: vi.fn(),
		get: vi.fn((key: string) => {
			// IdTokenを返す（SECRET_HASH計算用）
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
				return {
					value: `${encodedHeader}.${encodedPayload}.mock-signature`,
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
			expected: async (result: any) => {
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
