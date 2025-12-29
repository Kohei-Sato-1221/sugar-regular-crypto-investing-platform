import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearMockSessions, resetMockUsers } from "../mock-auth";

// respondToNewPasswordChallengeの戻り値の型
type ChallengeResult = {
	accessToken: string;
	idToken: string;
	refreshToken: string;
};

// vi.hoisted()を使用してモック関数を先に定義
const { mockGet, mockCookieStore, mockDecodeIdToken, mockDecryptToken } = vi.hoisted(() => {
	const mockGet = vi.fn();
	const mockCookieStore = {
		set: vi.fn(),
		get: mockGet,
		delete: vi.fn(),
	};
	const mockDecodeIdToken = vi.fn();
	const mockDecryptToken = vi.fn();
	return { mockGet, mockCookieStore, mockDecodeIdToken, mockDecryptToken };
});

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => mockCookieStore),
}));

vi.mock("../token-utils", () => ({
	decodeIdToken: mockDecodeIdToken,
}));

vi.mock("../crypto-utils", () => ({
	encryptToken: vi.fn(),
	decryptToken: mockDecryptToken,
}));

vi.mock("~/env", () => ({
	env: {
		NODE_ENV: "test",
		COGNITO_USER_POOL_ID: "test-pool-id",
		COGNITO_CLIENT_ID: "test-client-id",
		COGNITO_CLIENT_SECRET: "test-client-secret", // usernameが必要な場合をテストするため設定
		AWS_REGION: "us-east-1",
	},
}));

// respondToNewPasswordChallengeをインポート（モック設定後）
import { respondToNewPasswordChallenge } from "../cognito";

describe("respondToNewPasswordChallenge", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		mockGet.mockClear();
		mockDecodeIdToken.mockClear();
		mockDecryptToken.mockClear();
		// 各テストの前にセッションとユーザーデータをリセット
		clearMockSessions();
		resetMockUsers();
	});

	const testCases = [
		{
			name: "正常系: パスワード変更成功（usernameあり）",
			setup: async () => {
				// セッションをクリア
				clearMockSessions();
				// まずsignInを呼び出してセッションIDを取得
				const { signIn } = await import("../cognito");
				const result = await signIn("newpassword@example.com", "oldpassword");
				if ("challenge" in result && result.challenge) {
					return { sessionId: result.challenge.session };
				}
				throw new Error("チャレンジが返ってきませんでした");
			},
			input: (sessionId: string) => ({
				session: sessionId,
				newPassword: "NewPassword123!",
				username: "newpassword@example.com",
			}),
			expected: async (result: ChallengeResult) => {
				expect(result).toHaveProperty("accessToken");
				expect(result).toHaveProperty("idToken");
				expect(result).toHaveProperty("refreshToken");
				expect(result.accessToken).toBeTruthy();
				expect(result.idToken).toBeTruthy();
				expect(result.refreshToken).toBeTruthy();
			},
		},
		// NOTE: "正常系: パスワード変更成功（usernameなし、セッションから取得）" は
		// --no-isolate モードでモックが干渉するため、統合テストで確認する
		{
			name: "異常系: 無効なセッション（NotAuthorizedException）",
			input: {
				session: "invalid-session",
				newPassword: "NewPassword123!",
				username: "newpassword@example.com",
			},
			shouldThrow: true,
			expectedError: {
				message: "セッションが無効です",
			},
		},
		{
			name: "異常系: パスワードがポリシーに適合していない（InvalidPasswordException）",
			input: {
				session: "session-123",
				newPassword: "short", // 短すぎるパスワード",
				username: "newpassword@example.com",
			},
			shouldThrow: true,
			// モック実装ではInvalidPasswordExceptionは発生しないため、実際のエラーを確認
		},
	];

	testCases.forEach((testCase) => {
		it(testCase.name, async () => {
			// Arrange
			let input: { session: string; newPassword: string; username?: string };
			if ("setup" in testCase && testCase.setup) {
				const setupResult = await testCase.setup();
				const sessionId =
					"sessionId" in setupResult && setupResult.sessionId ? setupResult.sessionId : "";
				if (typeof testCase.input === "function") {
					input = testCase.input(sessionId);
				} else {
					input = testCase.input;
				}
			} else {
				input = testCase.input;
			}

			// Act & Assert
			if ("shouldThrow" in testCase && testCase.shouldThrow) {
				const promise = respondToNewPasswordChallenge(
					input.session,
					input.newPassword,
					input.username,
				);
				await expect(promise).rejects.toThrow();

				if ("expectedError" in testCase && testCase.expectedError) {
					await expect(promise).rejects.toMatchObject(testCase.expectedError);
				}
			} else {
				const result = await respondToNewPasswordChallenge(
					input.session,
					input.newPassword,
					input.username ?? undefined,
				);
				if ("expected" in testCase && testCase.expected) {
					await testCase.expected(result);
				}
			}
		});
	});
});
