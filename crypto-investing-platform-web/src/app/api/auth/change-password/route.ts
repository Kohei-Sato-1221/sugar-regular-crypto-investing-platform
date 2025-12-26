import { NextRequest, NextResponse } from "next/server";

import {
	respondToNewPasswordChallenge,
	saveSession,
} from "~/server/auth/cognito";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { session, newPassword, username } = body;

		if (!session || !newPassword) {
			return NextResponse.json(
				{ error: "セッションと新しいパスワードが必要です" },
				{ status: 400 },
			);
		}

		// パスワード変更を実行
		const tokens = await respondToNewPasswordChallenge(
			session,
			newPassword,
			username,
		);

		// トークンの存在確認
		if (!tokens.accessToken || !tokens.idToken) {
			throw new Error("パスワード変更に失敗しました");
		}

		// セッションに保存
		const sessionData = await saveSession({
			accessToken: tokens.accessToken,
			idToken: tokens.idToken,
			refreshToken: tokens.refreshToken,
		});

		return NextResponse.json({ success: true, user: sessionData.user });
	} catch (error) {
		// 詳細なエラーログを出力（サーバーサイド）
		console.error("Change password API error details:", {
			error: error,
			errorName: error instanceof Error ? error.name : "Unknown",
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});

		// エラーメッセージを適切に処理
		let errorMessage = "パスワード変更に失敗しました。";
		let statusCode = 400;

		if (error instanceof Error) {
			if (error.message.includes("InvalidPasswordException")) {
				errorMessage = "パスワードがポリシーに適合していません。";
			} else if (error.message.includes("NotAuthorizedException")) {
				errorMessage = "セッションが無効です。再度ログインしてください。";
			} else if (error.message) {
				errorMessage = error.message;
			}
		}

		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode },
		);
	}
}

