import {
	InitiateAuthCommand,
	RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

/**
 * テスト用ユーザーの型定義
 */
type MockUser = {
	username: string;
	email: string;
	password: string;
	confirmed: boolean;
	requiresPasswordChange: boolean;
	sub: string;
	name?: string;
};

/**
 * テスト用ユーザーデータの初期値（リセット用）
 */
const initialMockUsers: MockUser[] = [
	{
		username: "test@example.com",
		email: "test@example.com",
		password: "password123",
		confirmed: true,
		requiresPasswordChange: false,
		sub: "user-123",
		name: "Test User",
	},
	{
		username: "unconfirmed@example.com",
		email: "unconfirmed@example.com",
		password: "password123",
		confirmed: false,
		requiresPasswordChange: false,
		sub: "user-456",
		name: "Unconfirmed User",
	},
	{
		username: "newpassword@example.com",
		email: "newpassword@example.com",
		password: "oldpassword",
		confirmed: true,
		requiresPasswordChange: true,
		sub: "user-789",
		name: "New Password User",
	},
];

// テスト用ユーザーデータ（変更可能）
let mockUsers: MockUser[] = JSON.parse(JSON.stringify(initialMockUsers));

// セッション管理用のMap（グローバルに共有）
const sessions = new Map<string, { username: string; challengeName?: string }>();

/**
 * テスト用: セッションをクリア
 */
export function clearMockSessions() {
	sessions.clear();
}

/**
 * テスト用: ユーザーデータをリセット
 */
export function resetMockUsers() {
	mockUsers = JSON.parse(JSON.stringify(initialMockUsers));
}

/**
 * テスト用のモックCognitoクライアントを作成
 */
export function createMockCognitoClient() {
	// トークンを生成するヘルパー関数（JWT形式）
	const generateToken = (user: MockUser): string => {
		const header = { alg: "HS256", typ: "JWT" };
		const payload = {
			sub: user.sub,
			email: user.email,
			"cognito:username": user.username,
			name: user.name,
			exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
		};
		// JWT形式: header.payload.signature
		const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
		const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
		return `${encodedHeader}.${encodedPayload}.mock-signature`;
	};

	return {
		send: async (command: InitiateAuthCommand | RespondToAuthChallengeCommand) => {
			// InitiateAuthCommandの処理
			if (command instanceof InitiateAuthCommand) {
				const { AuthFlow, AuthParameters } = command.input;

				// REFRESH_TOKEN_AUTHフローの処理
				if (AuthFlow === "REFRESH_TOKEN_AUTH") {
					const refreshToken = AuthParameters?.REFRESH_TOKEN;

					if (!refreshToken) {
						throw {
							name: "InvalidParameterException",
							code: "InvalidParameterException",
							message: "REFRESH_TOKEN is required",
						};
					}

					// RefreshTokenからユーザーIDを抽出（形式: refresh-token-{user.sub}）
					const userIdMatch = refreshToken.match(/^refresh-token-(.+)$/);
					if (!userIdMatch) {
						throw {
							name: "NotAuthorizedException",
							code: "NotAuthorizedException",
							message: "リフレッシュトークンが無効です",
						};
					}

					const userId = userIdMatch[1];
					const user = mockUsers.find((u) => u.sub === userId);

					if (!user) {
						throw {
							name: "NotAuthorizedException",
							code: "NotAuthorizedException",
							message: "リフレッシュトークンが無効です",
						};
					}

					// 新しいトークンを生成
					return {
						AuthenticationResult: {
							AccessToken: generateToken(user),
							IdToken: generateToken(user),
							// RefreshTokenは返さない（既存のRefreshTokenを継続使用）
						},
					};
				}

				// USER_PASSWORD_AUTHフローの処理
				const username = AuthParameters?.USERNAME;
				const password = AuthParameters?.PASSWORD;

				if (!username || !password) {
					throw {
						name: "InvalidParameterException",
						code: "InvalidParameterException",
						message: "USERNAME and PASSWORD are required",
					};
				}

				// ユーザーを検索
				const user = mockUsers.find((u) => u.username === username || u.email === username);

				if (!user) {
					throw {
						name: "UserNotFoundException",
						code: "UserNotFoundException",
						message: "ユーザーが見つかりません",
					};
				}

				if (!user.confirmed) {
					throw {
						name: "UserNotConfirmedException",
						code: "UserNotConfirmedException",
						message: "アカウントが確認されていません",
					};
				}

				if (user.password !== password) {
					throw {
						name: "NotAuthorizedException",
						code: "NotAuthorizedException",
						message: "ユーザー名またはパスワードが正しくありません",
					};
				}

				// NEW_PASSWORD_REQUIREDチャレンジの場合
				if (user.requiresPasswordChange) {
					const sessionId = `session-${Date.now()}-${Math.random()}`;
					sessions.set(sessionId, {
						username: user.username,
						challengeName: "NEW_PASSWORD_REQUIRED",
					});
					return {
						ChallengeName: "NEW_PASSWORD_REQUIRED",
						Session: sessionId,
						ChallengeParameters: {
							USERNAME: user.username,
							userAttributes: JSON.stringify({
								email: user.email,
							}),
						},
					};
				}

				// 正常な認証
				return {
					AuthenticationResult: {
						AccessToken: generateToken(user),
						IdToken: generateToken(user),
						RefreshToken: `refresh-token-${user.sub}`,
					},
				};
			}

			// REFRESH_TOKEN_AUTHフローの処理
			if (
				command instanceof InitiateAuthCommand &&
				command.input.AuthFlow === "REFRESH_TOKEN_AUTH"
			) {
				const { AuthParameters } = command.input;
				const refreshToken = AuthParameters?.REFRESH_TOKEN;

				if (!refreshToken) {
					throw {
						name: "InvalidParameterException",
						code: "InvalidParameterException",
						message: "REFRESH_TOKEN is required",
					};
				}

				// RefreshTokenからユーザーIDを抽出（形式: refresh-token-{user.sub}）
				const userIdMatch = refreshToken.match(/^refresh-token-(.+)$/);
				if (!userIdMatch) {
					throw {
						name: "NotAuthorizedException",
						code: "NotAuthorizedException",
						message: "リフレッシュトークンが無効です",
					};
				}

				const userId = userIdMatch[1];
				const user = mockUsers.find((u) => u.sub === userId);

				if (!user) {
					throw {
						name: "NotAuthorizedException",
						code: "NotAuthorizedException",
						message: "リフレッシュトークンが無効です",
					};
				}

				// 新しいトークンを生成
				return {
					AuthenticationResult: {
						AccessToken: generateToken(user),
						IdToken: generateToken(user),
						// RefreshTokenは返さない（既存のRefreshTokenを継続使用）
					},
				};
			}

			// RespondToAuthChallengeCommandの処理
			if (command instanceof RespondToAuthChallengeCommand) {
				const { Session, ChallengeResponses } = command.input;
				const newPassword = ChallengeResponses?.NEW_PASSWORD;
				const username = ChallengeResponses?.USERNAME;

				if (!Session || !newPassword) {
					throw {
						name: "InvalidParameterException",
						code: "InvalidParameterException",
						message: "Session and NEW_PASSWORD are required",
					};
				}

				const session = sessions.get(Session);
				if (!session) {
					throw {
						name: "NotAuthorizedException",
						code: "NotAuthorizedException",
						message: "セッションが無効です",
					};
				}

				const user = mockUsers.find((u) => u.username === (username ?? session.username));

				if (!user) {
					throw {
						name: "UserNotFoundException",
						code: "UserNotFoundException",
						message: "ユーザーが見つかりません",
					};
				}

				// パスワードを更新
				user.password = newPassword;
				user.requiresPasswordChange = false;

				// セッションを削除
				sessions.delete(Session);

				return {
					AuthenticationResult: {
						AccessToken: generateToken(user),
						IdToken: generateToken(user),
						RefreshToken: `refresh-token-${user.sub}`,
					},
				};
			}

			throw new Error(`Unsupported command: ${command.constructor.name}`);
		},
	};
}
