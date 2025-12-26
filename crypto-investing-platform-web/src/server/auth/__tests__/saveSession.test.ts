import { describe, it, expect, vi, beforeEach } from "vitest";

import { saveSession } from "../cognito";
import {
	ID_TOKEN_COOKIE_KEY,
	ACCESS_TOKEN_COOKIE_KEY,
	REFRESH_TOKEN_COOKIE_KEY,
} from "~/const/auth";

// Next.js cookiesをモック
const mockSet = vi.fn();
const mockCookieStore = {
	set: mockSet,
	get: vi.fn(),
	delete: vi.fn(),
};

vi.mock("next/headers", () => ({
	cookies: vi.fn(() => mockCookieStore),
}));

// token-utilsをモック
const mockDecodeIdToken = vi.fn();
vi.mock("../token-utils", () => ({
	decodeIdToken: (token: string) => mockDecodeIdToken(token),
}));

describe("saveSession", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSet.mockClear();
		mockDecodeIdToken.mockClear();
		// デフォルトのモック動作を設定
		mockDecodeIdToken.mockImplementation((token: string) => {
			// テスト用のトークンをデコード
			if (token.includes("user-123")) {
				return {
					sub: "user-123",
					email: "test@example.com",
					name: "Test User",
					"cognito:username": "test@example.com",
					picture: "https://example.com/avatar.jpg",
				};
			}
			return null;
		});
	});

	const testCases = [
		{
			name: "正常系: トークンをCookieに保存（RefreshTokenあり）",
			input: {
				accessToken: "access-token-user-123",
				idToken: "id-token-user-123",
				refreshToken: "refresh-token-user-123",
			},
			expected: async (result: any) => {
				expect(result).toHaveProperty("user");
				expect(result.user.id).toBe("user-123");
				expect(result.user.email).toBe("test@example.com");
				expect(result.user.name).toBe("Test User");
				expect(result.user.image).toBe("https://example.com/avatar.jpg");

				// Cookieが3回設定されることを確認
				expect(mockSet).toHaveBeenCalledTimes(3);
				expect(mockSet).toHaveBeenCalledWith(
					ACCESS_TOKEN_COOKIE_KEY,
					"access-token-user-123",
					expect.objectContaining({
						httpOnly: true,
						secure: false, // テスト環境ではfalse
						sameSite: "strict",
						path: "/",
						maxAge: 60 * 60, // 1時間
					}),
				);
				expect(mockSet).toHaveBeenCalledWith(
					ID_TOKEN_COOKIE_KEY,
					"id-token-user-123",
					expect.objectContaining({
						httpOnly: true,
						secure: false,
						sameSite: "strict",
						path: "/",
						maxAge: 60 * 60, // 1時間
					}),
				);
				expect(mockSet).toHaveBeenCalledWith(
					REFRESH_TOKEN_COOKIE_KEY,
					"refresh-token-user-123",
					expect.objectContaining({
						httpOnly: true,
						secure: false,
						sameSite: "strict",
						path: "/",
						maxAge: 60 * 60 * 24 * 30, // 30日
					}),
				);
			},
		},
		{
			name: "正常系: トークンをCookieに保存（RefreshTokenなし）",
			input: {
				accessToken: "access-token-user-123",
				idToken: "id-token-user-123",
			},
			expected: async (result: any) => {
				expect(result).toHaveProperty("user");
				expect(result.user.id).toBe("user-123");

				// Cookieが2回設定されることを確認（RefreshTokenなし）
				expect(mockSet).toHaveBeenCalledTimes(2);
			},
		},
		{
			name: "異常系: トークンのデコードに失敗",
			input: {
				accessToken: "access-token-invalid",
				idToken: "id-token-invalid",
			},
			setup: () => {
				// decodeIdTokenをnullを返すようにモック
				mockDecodeIdToken.mockReturnValue(null);
			},
			shouldThrow: true,
			expectedError: {
				message: "トークンのデコードに失敗しました",
			},
		},
	];

	testCases.forEach((testCase) => {
		it(testCase.name, async () => {
			// Arrange
			if ("setup" in testCase && testCase.setup) {
				testCase.setup();
			}

			// Act & Assert
			if ("shouldThrow" in testCase && testCase.shouldThrow) {
				const promise = saveSession(testCase.input);
				await expect(promise).rejects.toThrow();

				if ("expectedError" in testCase && testCase.expectedError) {
					await expect(promise).rejects.toMatchObject(testCase.expectedError);
				}
			} else {
				const result = await saveSession(testCase.input);
				if ("expected" in testCase && testCase.expected) {
					await testCase.expected(result);
				}
			}
		});
	});
});

