import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createTRPCRouter,
	publicProcedure,
} from "~/server/api/trpc";
import { signIn, saveSession } from "~/server/auth/cognito";

export const authRouter = createTRPCRouter({
	/**
	 * ログイン
	 */
	signIn: publicProcedure
		.input(
			z.object({
				username: z.string().email("有効なメールアドレスを入力してください"),
				password: z.string().min(1, "パスワードが必要です"),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				// Cognitoで認証
				const result = await signIn(input.username, input.password);

				// チャレンジが返ってきた場合（NEW_PASSWORD_REQUIREDなど）
				if ("challenge" in result && result.challenge) {
					// ChallengeParametersからUSERNAMEを取得
					let challengeUsername = input.username;
					
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

					return {
						success: false as const,
						requiresPasswordChange: true,
						challenge: {
							name: result.challenge.name,
							session: result.challenge.session,
							username: challengeUsername,
						},
					};
				}

				// チャレンジでない場合、トークンが返ってきているはず
				if (
					!("accessToken" in result) ||
					!("idToken" in result) ||
					!result.accessToken ||
					!result.idToken
				) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "認証に失敗しました",
					});
				}

				// セッションに保存
				const accessToken = result.accessToken;
				const idToken = result.idToken;
				const refreshToken = result.refreshToken;

				const session = await saveSession({
					accessToken,
					idToken,
					refreshToken,
				});

				return {
					success: true as const,
					user: session.user,
				};
			} catch (error) {
				console.error("Sign in error:", error);

				// tRPCエラーの場合はそのまま投げる
				if (error instanceof TRPCError) {
					throw error;
				}

				// その他のエラーを処理
				if (error instanceof Error) {
					if (error.message.includes("認証フローが有効になっていません")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
					if (error.message.includes("NotAuthorizedException") || error.message.includes("ユーザー名またはパスワードが正しくありません")) {
						throw new TRPCError({
							code: "UNAUTHORIZED",
							message: "ユーザー名またはパスワードが正しくありません。",
						});
					}
					if (error.message.includes("UserNotFoundException") || error.message.includes("ユーザーが見つかりません")) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "ユーザーが見つかりません。",
						});
					}
					if (error.message.includes("UserNotConfirmedException") || error.message.includes("アカウントが確認されていません")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "アカウントが確認されていません。",
						});
					}
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "ログインに失敗しました。",
				});
			}
		}),

	/**
	 * パスワード変更
	 */
	changePassword: publicProcedure
		.input(
			z.object({
				session: z.string().min(1, "セッションが必要です"),
				newPassword: z.string().min(8, "パスワードは8文字以上である必要があります"),
				username: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const { respondToNewPasswordChallenge, saveSession } = await import("~/server/auth/cognito");
				
				// パスワード変更を実行
				const tokens = await respondToNewPasswordChallenge(
					input.session,
					input.newPassword,
					input.username,
				);

				// トークンの存在確認
				if (!tokens.accessToken || !tokens.idToken) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "パスワード変更に失敗しました",
					});
				}

				// セッションに保存
				const session = await saveSession({
					accessToken: tokens.accessToken,
					idToken: tokens.idToken,
					refreshToken: tokens.refreshToken,
				});

				return {
					success: true,
					user: session.user,
				};
			} catch (error) {
				console.error("Change password error:", error);

				if (error instanceof TRPCError) {
					throw error;
				}

				if (error instanceof Error) {
					if (error.message.includes("InvalidPasswordException")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "パスワードがポリシーに適合していません。",
						});
					}
					if (error.message.includes("NotAuthorizedException")) {
						throw new TRPCError({
							code: "UNAUTHORIZED",
							message: "セッションが無効です。再度ログインしてください。",
						});
					}
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "パスワード変更に失敗しました。",
				});
			}
		}),

	/**
	 * ログアウト
	 */
	signOut: publicProcedure.mutation(async () => {
		const { clearSession } = await import("~/server/auth/cognito");
		await clearSession();
		return { success: true };
	}),

	/**
	 * 現在のセッションを取得
	 */
	getSession: publicProcedure.query(async ({ ctx }) => {
		return ctx.session;
	}),
});


