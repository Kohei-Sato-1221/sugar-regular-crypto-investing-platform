import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	ACCESS_TOKEN_COOKIE_KEY,
	ID_TOKEN_COOKIE_KEY,
	REFRESH_TOKEN_COOKIE_KEY,
} from "~/const/auth";

// saveSessionの戻り値の型
type SaveSessionResult = {
	user: {
		id: string;
		email: string | null;
		name: string | null;
		image: string | null;
	};
};

// vi.hoisted()を使用してモック関数を先に定義
const { mockSet, mockCookieStore, mockDecodeIdToken, mockEncryptToken } = vi.hoisted(() => {
	const mockSet = vi.fn();
	const mockCookieStore = {
		set: mockSet,
		get: vi.fn(),
		delete: vi.fn(),
	};
	const mockDecodeIdToken = vi.fn();
	const mockEncryptToken = vi.fn((token: string) => `encrypted-${token}`);
	return { mockSet, mockCookieStore, mockDecodeIdToken, mockEncryptToken };
});

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => mockCookieStore),
}));

vi.mock("../token-utils", () => ({
	decodeIdToken: mockDecodeIdToken,
}));

vi.mock("../crypto-utils", () => ({
	encryptToken: mockEncryptToken,
	decryptToken: vi.fn(),
}));

vi.mock("~/env", () => ({
	env: {
		AUTH_SECRET: "test-auth-secret-key-for-testing-purposes-only",
		NODE_ENV: "test",
	},
}));

// saveSessionをインポート（モック設定後）
import { saveSession } from "../cognito";

describe("saveSession", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		mockSet.mockClear();
		mockDecodeIdToken.mockClear();
		mockEncryptToken.mockClear();
		// デフォルトのモック動作を再設定
		mockEncryptToken.mockImplementation((token: string) => `encrypted-${token}`);
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
			expected: async (result: SaveSessionResult) => {
				expect(result).toHaveProperty("user");
				expect(result.user.id).toBe("user-123");
				expect(result.user.email).toBe("test@example.com");
				expect(result.user.name).toBe("Test User");
				expect(result.user.image).toBe("https://example.com/avatar.jpg");

				// Cookieが3回設定されることを確認（暗号化された値が保存される）
				expect(mockSet).toHaveBeenCalledTimes(3);
				expect(mockSet).toHaveBeenCalledWith(
					ACCESS_TOKEN_COOKIE_KEY,
					"encrypted-access-token-user-123",
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
					"encrypted-id-token-user-123",
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
					"encrypted-refresh-token-user-123",
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
			expected: async (result: SaveSessionResult) => {
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
