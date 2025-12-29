import { beforeEach, describe, expect, it, vi } from "vitest";

import { signIn } from "../cognito";

// signInの戻り値の型
type SignInResult = {
	accessToken?: string;
	idToken?: string;
	refreshToken?: string;
	challenge?: {
		name: string;
		session: string;
		parameters?: Record<string, unknown>;
	};
};

// Next.js cookiesをモック
vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		set: vi.fn(),
		get: vi.fn(),
		delete: vi.fn(),
	})),
}));

// 環境変数をモック
vi.mock("~/env", () => ({
	env: {
		NODE_ENV: "test",
		COGNITO_USER_POOL_ID: "test-pool-id",
		COGNITO_CLIENT_ID: "test-client-id",
		COGNITO_CLIENT_SECRET: undefined,
		AWS_REGION: "us-east-1",
	},
}));

describe("signIn", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const testCases = [
		{
			name: "正常系: ログイン成功",
			input: {
				username: "test@example.com",
				password: "password123",
			},
			expected: async (result: SignInResult) => {
				expect(result).toHaveProperty("accessToken");
				expect(result).toHaveProperty("idToken");
				expect(result).toHaveProperty("refreshToken");
				expect(result.accessToken).toBeTruthy();
				expect(result.idToken).toBeTruthy();
				expect(result.refreshToken).toBeTruthy();
			},
		},
		{
			name: "異常系: NEW_PASSWORD_REQUIREDチャレンジ",
			input: {
				username: "newpassword@example.com",
				password: "oldpassword",
			},
			expected: async (result: SignInResult) => {
				expect(result).toHaveProperty("challenge");
				expect(result.challenge?.name).toBe("NEW_PASSWORD_REQUIRED");
				expect(result.challenge?.session).toBeTruthy();
				expect(result.challenge?.parameters).toBeTruthy();
			},
		},
		{
			name: "異常系: ユーザーが見つからない（UserNotFoundException）",
			input: {
				username: "notfound@example.com",
				password: "password123",
			},
			shouldThrow: true,
			expectedError: {
				message: "ユーザーが見つかりません。",
			},
		},
		{
			name: "異常系: パスワードが間違っている（NotAuthorizedException）",
			input: {
				username: "test@example.com",
				password: "wrong-password",
			},
			shouldThrow: true,
			expectedError: {
				message: "ユーザー名またはパスワードが正しくありません。",
			},
		},
		{
			name: "異常系: アカウントが確認されていない（UserNotConfirmedException）",
			input: {
				username: "unconfirmed@example.com",
				password: "password123",
			},
			shouldThrow: true,
			expectedError: {
				message: "アカウントが確認されていません。",
			},
		},
	];

	testCases.forEach((testCase) => {
		it(testCase.name, async () => {
			// Arrange
			// Act & Assert
			if ("shouldThrow" in testCase && testCase.shouldThrow) {
				const promise = signIn(testCase.input.username, testCase.input.password);
				await expect(promise).rejects.toThrow();

				if ("expectedError" in testCase && testCase.expectedError) {
					await expect(promise).rejects.toMatchObject(testCase.expectedError);
				}
			} else {
				const result = await signIn(testCase.input.username, testCase.input.password);
				if ("expected" in testCase && testCase.expected) {
					await testCase.expected(result);
				}
			}
		});
	});
});
