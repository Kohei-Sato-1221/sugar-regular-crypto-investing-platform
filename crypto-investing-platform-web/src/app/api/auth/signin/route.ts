import { NextRequest, NextResponse } from "next/server";

import { signIn, saveSession } from "~/server/auth/cognito";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { username, password } = body;

		if (!username || !password) {
			return NextResponse.json(
				{ error: "ユーザー名とパスワードが必要です" },
				{ status: 400 },
			);
		}

		// Cognitoで認証
		const result = await signIn(username, password);

		// チャレンジが返ってきた場合（NEW_PASSWORD_REQUIREDなど）
		if ("challenge" in result && result.challenge) {
			// ChallengeParametersからUSERNAMEを取得
			// userAttributesはJSON文字列の場合があるのでパースする
			let challengeUsername = username; // デフォルトはリクエストのusername
			
			if (result.challenge.parameters?.USERNAME) {
				challengeUsername = result.challenge.parameters.USERNAME;
			} else if (result.challenge.parameters?.userAttributes) {
				try {
					const userAttributes = typeof result.challenge.parameters.userAttributes === "string"
						? JSON.parse(result.challenge.parameters.userAttributes)
						: result.challenge.parameters.userAttributes;
					
					if (userAttributes?.email) {
						challengeUsername = userAttributes.email;
					}
				} catch (e) {
					console.error("Failed to parse userAttributes:", e);
				}
			}

			console.log("Challenge response:", {
				challengeName: result.challenge.name,
				hasSession: !!result.challenge.session,
				username: challengeUsername,
			});

			return NextResponse.json({
				success: false,
				requiresPasswordChange: true,
				challenge: {
					name: result.challenge.name,
					session: result.challenge.session,
					username: challengeUsername,
				},
			});
		}

		// チャレンジでない場合、トークンが返ってきているはず
		if (
			!("accessToken" in result) ||
			!("idToken" in result) ||
			!result.accessToken ||
			!result.idToken
		) {
			throw new Error("認証に失敗しました");
		}

		// 型ガードにより、accessTokenとidTokenはstringであることが保証される
		const accessToken = result.accessToken;
		const idToken = result.idToken;
		const refreshToken = result.refreshToken;

		// セッションに保存
		const session = await saveSession({
			accessToken,
			idToken,
			refreshToken,
		});

		return NextResponse.json({ success: true, user: session.user });
	} catch (error) {
		// 詳細なエラーログを出力（サーバーサイド）
		console.error("Sign in API error details:", {
			error: error,
			errorName: error instanceof Error ? error.name : "Unknown",
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});
		
		// エラーメッセージを適切に処理
		let errorMessage = "ログインに失敗しました。メールアドレスとパスワードを確認してください。";
		let statusCode = 401;
		
		if (error instanceof Error) {
			// Cognitoのエラーメッセージを処理
			if (error.message.includes("認証フローが有効になっていません")) {
				errorMessage = error.message;
				statusCode = 500;
			} else if (error.message.includes("NotAuthorizedException") || error.message.includes("ユーザー名またはパスワードが正しくありません")) {
				errorMessage = "ユーザー名またはパスワードが正しくありません。";
			} else if (error.message.includes("UserNotFoundException") || error.message.includes("ユーザーが見つかりません")) {
				errorMessage = "ユーザーが見つかりません。";
			} else if (error.message.includes("UserNotConfirmedException") || error.message.includes("アカウントが確認されていません")) {
				errorMessage = "アカウントが確認されていません。";
			} else if (error.message) {
				// その他のエラーメッセージをそのまま使用
				errorMessage = error.message;
			}
		}

		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode },
		);
	}
}

