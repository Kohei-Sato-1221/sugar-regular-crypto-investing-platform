import {
	CognitoIdentityProviderClient,
	InitiateAuthCommand,
	RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { cookies } from "next/headers";

import { env } from "~/env";
import { decodeIdToken } from "./token-utils";

import { ID_TOKEN_COOKIE_KEY, ACCESS_TOKEN_COOKIE_KEY, REFRESH_TOKEN_COOKIE_KEY } from "~/const/auth";

/**
 * Cognito認証クライアントを作成
 */
function createCognitoClient() {
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
	if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
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
		if (env.COGNITO_CLIENT_SECRET) {
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
		
		// リクエストパラメータをログ出力（デバッグ用）
		console.log("Cognito authentication request:", {
			ClientId: env.COGNITO_CLIENT_ID,
			AuthFlow: "USER_PASSWORD_AUTH",
			hasSecretHash: !!env.COGNITO_CLIENT_SECRET,
			username: username,
		});
		
		const response = await client.send(command);

		// レスポンスの詳細をログ出力
		console.log("Cognito authentication response:", {
			hasAuthenticationResult: !!response.AuthenticationResult,
			hasChallengeName: !!response.ChallengeName,
			challengeName: response.ChallengeName,
			challengeParameters: response.ChallengeParameters,
			session: response.Session,
			responseKeys: Object.keys(response),
		});

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
		if (error instanceof Error) {
			// AWS SDKのエラーを処理
			if ("$metadata" in error || "name" in error) {
				const errorName = (error as { name?: string }).name;
				const errorCode = (error as { code?: string }).code;
				
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
			}
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
	const user = await decodeIdToken(tokens.idToken);
	if (!user) {
		throw new Error("トークンのデコードに失敗しました");
	}

	// トークンをCookieに保存（HttpOnly、Secure、SameSiteを設定）
	cookieStore.set(ACCESS_TOKEN_COOKIE_KEY, tokens.accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60, // 1時間
		path: "/",
	});

	cookieStore.set(ID_TOKEN_COOKIE_KEY, tokens.idToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60, // 1時間
		path: "/",
	});

	if (tokens.refreshToken) {
		cookieStore.set(REFRESH_TOKEN_COOKIE_KEY, tokens.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30日
			path: "/",
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
 * セッションからユーザー情報を取得
 */
export async function getSession() {
	const cookieStore = await cookies();
	const idToken = cookieStore.get(ID_TOKEN_COOKIE_KEY)?.value;

	if (!idToken) {
		return null;
	}

	const user = await decodeIdToken(idToken);
	if (!user) {
		return null;
	}

	// トークンの有効期限をチェック
	if (user.exp && user.exp * 1000 < Date.now()) {
		// トークンが期限切れの場合はセッションをクリア
		await clearSession();
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
			ChallengeName: "NEW_PASSWORD_REQUIRED",
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

