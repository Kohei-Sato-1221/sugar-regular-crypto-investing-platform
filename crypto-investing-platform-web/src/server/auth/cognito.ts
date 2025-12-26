import {
	CognitoIdentityProviderClient,
	InitiateAuthCommand,
	RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { cookies } from "next/headers";

import { env } from "~/env";


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
 * テスト用ユーザーデータ
 */
const mockUsers: MockUser[] = [
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

/**
 * テスト用のモックCognitoクライアントを作成
 */
function createMockCognitoClient() {
	// セッション管理用のMap
	const sessions = new Map<string, { username: string; challengeName?: string }>();

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
		send: async (command: any) => {
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
				const user = mockUsers.find(
					(u) => u.username === username || u.email === username,
				);

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
					sessions.set(sessionId, { username: user.username, challengeName: "NEW_PASSWORD_REQUIRED" });
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
			if (command instanceof InitiateAuthCommand && command.input.AuthFlow === "REFRESH_TOKEN_AUTH") {
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

				const user = mockUsers.find(
					(u) => u.username === (username ?? session.username),
				);

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

/**
 * Cognito認証クライアントを作成
 * テスト環境の場合はモッククライアントを返す
 */
function createCognitoClient() {
	// テスト環境の場合はモッククライアントを返す
	if (env.NODE_ENV === "test") {
		return createMockCognitoClient() as unknown as CognitoIdentityProviderClient;
	}

	return new CognitoIdentityProviderClient({
		region: env.AWS_REGION,
		...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
			? {
					credentials: {
						accessKeyId: env.AWS_ACCESS_KEY_ID,
						secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
					},
			  }
			: {}),
	});
}

/**
 * Cognito用のSecret Hashを生成
 * Confidential Clientの場合、SECRET_HASHが必要
 */
function generateSecretHash(
	username: string,
	clientId: string,
	clientSecret: string,
): string {
	return createHmac("SHA256", clientSecret)
		.update(username + clientId)
		.digest("base64");
}

/**
 * ユーザー名とパスワードでログイン
 */
export async function signIn(username: string, password: string) {
	// テスト環境の場合は環境変数のチェックをスキップ
	if (env.NODE_ENV !== "test" && (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID)) {
		throw new Error("Cognito設定が完了していません。環境変数を確認してください。");
	}

	const client = createCognitoClient();

	try {
		// USER_PASSWORD_AUTHフローを使用（Confidential Clientの場合はSECRET_HASHを追加）
		const authParams: Record<string, string> = {
			USERNAME: username,
			PASSWORD: password,
		};

		// Confidential Clientの場合、SECRET_HASHを追加
		if (env.COGNITO_CLIENT_SECRET && env.COGNITO_CLIENT_ID) {
			authParams.SECRET_HASH = generateSecretHash(
				username,
				env.COGNITO_CLIENT_ID,
				env.COGNITO_CLIENT_SECRET,
			);
		}

		const params = {
			ClientId: env.COGNITO_CLIENT_ID,
			AuthFlow: "USER_PASSWORD_AUTH" as const,
			AuthParameters: authParams,
		};

		const command = new InitiateAuthCommand(params);
		const response = await client.send(command);

		if (!response.AuthenticationResult) {
			// NEW_PASSWORD_REQUIREDチャレンジの場合は、セッション情報を返す
			if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
				return {
					challenge: {
						name: response.ChallengeName,
						session: response.Session,
						parameters: response.ChallengeParameters,
					},
				};
			}
			
			console.error("Cognito authentication failed: No AuthenticationResult in response", {
				fullResponse: JSON.stringify(response, null, 2),
				challengeName: response.ChallengeName,
				challengeParameters: response.ChallengeParameters,
				session: response.Session,
			});
			
			// Challengeが返ってきた場合のエラーメッセージ
			if (response.ChallengeName) {
				throw new Error(
					`認証に追加のチャレンジが必要です: ${response.ChallengeName}`,
				);
			}
			
			throw new Error("認証に失敗しました");
		}

		return {
			accessToken: response.AuthenticationResult.AccessToken,
			idToken: response.AuthenticationResult.IdToken,
			refreshToken: response.AuthenticationResult.RefreshToken,
		};
	} catch (error) {
		// 詳細なエラーログを出力
		console.error("Cognito authentication error details:", {
			error: error,
			errorName: error instanceof Error ? error.name : "Unknown",
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			// AWS SDKのエラー情報
			...(error && typeof error === "object" && "$metadata" in error
				? {
						metadata: (error as { $metadata?: unknown }).$metadata,
						code: (error as { code?: string }).code,
						requestId: (error as { $metadata?: { requestId?: string } }).$metadata
							?.requestId,
				  }
				: {}),
			// リクエストパラメータ（パスワードは除外）
			requestParams: {
				ClientId: env.COGNITO_CLIENT_ID,
				AuthFlow: "USER_PASSWORD_AUTH",
				hasSecretHash: !!env.COGNITO_CLIENT_SECRET,
			},
		});
		
		// より詳細なエラーメッセージを提供
		// エラーオブジェクトの形式をチェック（Errorインスタンスまたはオブジェクト）
		const errorObj = error instanceof Error ? error : (error as object);
		const errorName = "name" in errorObj ? (errorObj as { name?: string }).name : undefined;
		const errorCode = "code" in errorObj ? (errorObj as { code?: string }).code : undefined;
		
		if (errorName === "InvalidParameterException" || errorCode === "InvalidParameterException") {
			throw new Error(
				"認証フローが有効になっていません。Cognito App Clientの設定で「ALLOW_USER_PASSWORD_AUTH」を有効にしてください。",
			);
		}
		if (errorName === "NotAuthorizedException" || errorCode === "NotAuthorizedException") {
			throw new Error("ユーザー名またはパスワードが正しくありません。");
		}
		if (errorName === "UserNotFoundException" || errorCode === "UserNotFoundException") {
			throw new Error("ユーザーが見つかりません。");
		}
		if (errorName === "UserNotConfirmedException" || errorCode === "UserNotConfirmedException") {
			throw new Error("アカウントが確認されていません。");
		}
		
		throw error;
	}
}


/**
 * NEW_PASSWORD_REQUIREDチャレンジに応答してパスワードを変更
 */
export async function respondToNewPasswordChallenge(
	session: string,
	newPassword: string,
	username?: string,
) {
	if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
		throw new Error("Cognito設定が完了していません。環境変数を確認してください。");
	}

	const client = createCognitoClient();

	try {
		const challengeParams: Record<string, string> = {
			NEW_PASSWORD: newPassword,
		};

		// USERNAMEが提供されている場合は追加
		if (username) {
			challengeParams.USERNAME = username;
		}

		// Confidential Clientの場合、SECRET_HASHを追加
		if (env.COGNITO_CLIENT_SECRET) {
			// USERNAMEが必要（Secret Hashの計算に必要）
			if (!username) {
				throw new Error("ユーザー名が必要です");
			}
			challengeParams.SECRET_HASH = generateSecretHash(
				username,
				env.COGNITO_CLIENT_ID,
				env.COGNITO_CLIENT_SECRET,
			);
		}

		const params = {
			ClientId: env.COGNITO_CLIENT_ID,
			ChallengeName: "NEW_PASSWORD_REQUIRED" as const,
			Session: session,
			ChallengeResponses: challengeParams,
		};

		const command = new RespondToAuthChallengeCommand(params);
		const response = await client.send(command);

		if (!response.AuthenticationResult) {
			console.error("Password change failed: No AuthenticationResult in response", {
				fullResponse: JSON.stringify(response, null, 2),
			});
			throw new Error("パスワード変更に失敗しました");
		}

		return {
			accessToken: response.AuthenticationResult.AccessToken,
			idToken: response.AuthenticationResult.IdToken,
			refreshToken: response.AuthenticationResult.RefreshToken,
		};
	} catch (error) {
		console.error("Password change error details:", {
			error: error,
			errorName: error instanceof Error ? error.name : "Unknown",
			errorMessage: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

/**
 * セッションをクリア（ログアウト）
 */
export async function clearSession() {
	const cookieStore = await cookies();
	cookieStore.delete(ID_TOKEN_COOKIE_KEY);
	cookieStore.delete(ACCESS_TOKEN_COOKIE_KEY);
	cookieStore.delete(REFRESH_TOKEN_COOKIE_KEY);
}

