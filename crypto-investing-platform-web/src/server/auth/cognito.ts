import { createHmac } from "node:crypto";
import {
	CognitoIdentityProviderClient,
	InitiateAuthCommand,
	RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cookies } from "next/headers";
import {
	ACCESS_TOKEN_COOKIE_KEY,
	ID_TOKEN_COOKIE_KEY,
	REFRESH_TOKEN_COOKIE_KEY,
} from "~/const/auth";
import { env } from "~/env";
import { decryptToken, encryptToken } from "./crypto-utils";
import { createMockCognitoClient } from "./mock-auth";
import { decodeIdToken } from "./token-utils";

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
function generateSecretHash(username: string, clientId: string, clientSecret: string): string {
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

			// Challengeが返ってきた場合のエラーメッセージ
			if (response.ChallengeName) {
				throw new Error(`認証に追加のチャレンジが必要です: ${response.ChallengeName}`);
			}

			throw new Error("認証に失敗しました");
		}

		return {
			accessToken: response.AuthenticationResult.AccessToken,
			idToken: response.AuthenticationResult.IdToken,
			refreshToken: response.AuthenticationResult.RefreshToken,
		};
	} catch (error) {
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
 * セッションにトークンを保存
 */
export async function saveSession(tokens: {
	accessToken: string;
	idToken: string;
	refreshToken?: string;
}) {
	const cookieStore = await cookies();

	// ID Tokenからユーザー情報を取得
	const user = decodeIdToken(tokens.idToken);
	if (!user) {
		throw new Error("トークンのデコードに失敗しました");
	}

	// トークンをCookieに保存（HttpOnly、Secure、SameSiteを設定）
	// SameSite="strict"でCSRF攻撃をより強力に防ぐ
	// ただし、外部サイトからのリンクでログインする場合は"lax"が必要
	const cookieOptions = {
		httpOnly: true, // XSS攻撃を防ぐ（JavaScriptからアクセス不可）
		secure: process.env.NODE_ENV === "production", // HTTPS必須（本番環境）
		sameSite: "strict" as const, // CSRF攻撃を防ぐ（同一サイトからのリクエストのみ許可）
		path: "/",
	};

	// トークンを暗号化してCookieに保存
	cookieStore.set(ACCESS_TOKEN_COOKIE_KEY, encryptToken(tokens.accessToken), {
		...cookieOptions,
		maxAge: 60 * 60, // 1時間
	});

	cookieStore.set(ID_TOKEN_COOKIE_KEY, encryptToken(tokens.idToken), {
		...cookieOptions,
		maxAge: 60 * 60, // 1時間
	});

	if (tokens.refreshToken) {
		cookieStore.set(REFRESH_TOKEN_COOKIE_KEY, encryptToken(tokens.refreshToken), {
			...cookieOptions,
			maxAge: 60 * 60 * 24 * 30, // 30日
		});
	}

	return {
		user: {
			id: user.sub,
			email: user.email ?? null,
			name: user.name ?? user["cognito:username"] ?? null,
			image: user.picture ?? null,
		},
	};
}

/**
 * RefreshTokenを使って新しいAccessToken/IdTokenを取得
 */
export async function refreshTokens(refreshToken: string) {
	// テスト環境の場合は環境変数のチェックをスキップ
	if (env.NODE_ENV !== "test") {
		if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
			throw new Error("Cognito設定が完了していません。環境変数を確認してください。");
		}
	}

	const client = createCognitoClient();

	try {
		const authParams: Record<string, string> = {
			REFRESH_TOKEN: refreshToken,
		};

		// Confidential Clientの場合、SECRET_HASHを追加
		// REFRESH_TOKEN_AUTHでは、USERNAMEが必要（IdTokenから取得するか、RefreshTokenから推測）
		if (env.COGNITO_CLIENT_SECRET && env.COGNITO_CLIENT_ID) {
			// RefreshTokenからユーザー名を取得する必要がある
			// 実際の実装では、IdTokenから取得するか、別の方法で取得する必要がある
			// ここでは、CookieからIdTokenを取得してユーザー名を抽出する
			const cookieStore = await cookies();
			const encryptedIdToken = cookieStore.get(ID_TOKEN_COOKIE_KEY)?.value;

			if (encryptedIdToken) {
				const idToken = decryptToken(encryptedIdToken);
				if (idToken) {
					const decodedToken = decodeIdToken(idToken);
					if (decodedToken) {
						const username = decodedToken["cognito:username"] ?? decodedToken.email ?? "";
						if (username) {
							authParams.SECRET_HASH = generateSecretHash(
								username,
								env.COGNITO_CLIENT_ID,
								env.COGNITO_CLIENT_SECRET,
							);
						}
					}
				}
			}
		}

		// テスト環境ではCOGNITO_CLIENT_IDがundefinedでもモッククライアントを使用するため、空文字列を使用
		const clientId =
			env.COGNITO_CLIENT_ID || (env.NODE_ENV === "test" ? "test-client-id" : undefined);
		if (!clientId && env.NODE_ENV !== "test") {
			throw new Error("Cognito設定が完了していません。環境変数を確認してください。");
		}

		const params = {
			ClientId: clientId,
			AuthFlow: "REFRESH_TOKEN_AUTH" as const,
			AuthParameters: authParams,
		};

		const command = new InitiateAuthCommand(params);
		const response = await client.send(command);

		if (!response.AuthenticationResult) {
			throw new Error("トークンのリフレッシュに失敗しました");
		}

		if (!response.AuthenticationResult.AccessToken || !response.AuthenticationResult.IdToken) {
			throw new Error("トークンのリフレッシュに失敗しました");
		}

		return {
			accessToken: response.AuthenticationResult.AccessToken,
			idToken: response.AuthenticationResult.IdToken,
			// RefreshTokenは返さない（既存のRefreshTokenを継続使用）
		};
	} catch (error) {
		const errorObj = error instanceof Error ? error : (error as object);
		const errorName = "name" in errorObj ? (errorObj as { name?: string }).name : undefined;
		const errorCode = "code" in errorObj ? (errorObj as { code?: string }).code : undefined;

		if (errorName === "NotAuthorizedException" || errorCode === "NotAuthorizedException") {
			throw new Error("リフレッシュトークンが無効です。再度ログインしてください。");
		}

		throw error;
	}
}

/**
 * セッションからユーザー情報を取得（読み取り専用）
 * Server Componentから呼び出されるため、Cookieの変更は行わない
 * トークンのリフレッシュはミドルウェアで行う
 */
export async function getSession() {
	const cookieStore = await cookies();
	const encryptedIdToken = cookieStore.get(ID_TOKEN_COOKIE_KEY)?.value;

	// 暗号化されたトークンを復号化
	const idToken = encryptedIdToken ? decryptToken(encryptedIdToken) : null;

	// IdTokenがない場合はnullを返す
	if (!idToken) {
		return null;
	}

	// IdTokenをデコード
	const user = decodeIdToken(idToken);
	if (!user) {
		return null;
	}

	// トークンの有効期限をチェック
	// 期限切れの場合はnullを返す（ミドルウェアがリフレッシュを処理する）
	const expirationTime = user.exp ? user.exp * 1000 : 0;
	const now = Date.now();

	if (expirationTime < now) {
		// トークンが完全に期限切れの場合はnullを返す
		return null;
	}

	return {
		user: {
			id: user.sub,
			email: user.email ?? null,
			name: user.name ?? user["cognito:username"] ?? null,
			image: user.picture ?? null,
		},
	};
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
			// セッションからユーザー名を取得を試行
			const cookieStore = await cookies();
			const encryptedIdToken = cookieStore.get(ID_TOKEN_COOKIE_KEY)?.value;
			if (encryptedIdToken) {
				const idToken = decryptToken(encryptedIdToken);
				if (idToken) {
					const decodedToken = decodeIdToken(idToken);
					if (decodedToken) {
						username = decodedToken["cognito:username"] ?? decodedToken.email ?? undefined;
						if (username) {
							challengeParams.USERNAME = username;
						}
					}
				}
			}
			if (!username) {
				throw new Error("ユーザー名が必要です");
			}
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
		throw new Error("パスワード変更に失敗しました");
	}

	return {
		accessToken: response.AuthenticationResult.AccessToken,
		idToken: response.AuthenticationResult.IdToken,
		refreshToken: response.AuthenticationResult.RefreshToken,
	};
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
