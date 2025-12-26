import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { signIn as cognitoSignIn } from "~/server/auth/cognito";
import { env } from "~/env";
import { STOCKBIT_SESSION_COOKIE } from "~/const/auth";

/**
 * NextAuth V4の設定
 * PageRouterで使用
 * 
 * 注意: JWTストラテジーを使用しているため、Prismaアダプターは不要です。
 * セッション情報はJWTトークンに保存されます。
 */
export const authOptions = {
	providers: [
		CredentialsProvider({
			id: "cognito",
			name: "Cognito",
			credentials: {
				username: { label: "Username", type: "text", placeholder: "username or email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) {
					throw new Error("ユーザー名とパスワードを入力してください");
				}

				const username = credentials.username as string;
				const password = credentials.password as string;

				try {
					// Cognitoで認証
					const result = await cognitoSignIn(username, password);

					// チャレンジが必要な場合はエラーを返す
					if ("challenge" in result && result.challenge) {
						throw new Error(
							`認証に追加のチャレンジが必要です: ${result.challenge.name}`,
						);
					}

					// トークンからユーザー情報を取得
					if (!("idToken" in result) || !result.idToken) {
						throw new Error("認証に失敗しました");
					}

					const { decodeIdToken } = await import("~/server/auth/token-utils");
					const user = decodeIdToken(result.idToken);

					if (!user) {
						throw new Error("トークンのデコードに失敗しました");
					}

					// NextAuthのUserオブジェクトを返す
					return {
						id: user.sub,
						email: user.email ?? null,
						name: user.name ?? user["cognito:username"] ?? null,
						image: user.picture ?? null,
					};
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "認証に失敗しました";
					throw new Error(errorMessage);
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }: { token: JWT; user?: User }) {
			// 初回ログイン時
			if (user) {
				token.id = user.id ?? "";
				token.email = user.email ?? null;
				token.name = user.name ?? null;
				token.picture = user.image ?? null;
			}
			return token;
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			if (session.user && token) {
				session.user.id = token.id ?? "";
				session.user.email = token.email ?? null;
				session.user.name = token.name ?? null;
				session.user.image = token.picture ?? null;
			}
			return session;
		},
	},
	pages: {
		signIn: "/public/signin",
	},
	session: {
		strategy: "jwt" as const,
	},
	secret: env.AUTH_SECRET,
	cookies: {
		sessionToken: {
			name: STOCKBIT_SESSION_COOKIE,
			options: {
				httpOnly: true,
				sameSite: "lax" as const,
				path: "/",
				secure: process.env.NODE_ENV === "production",
			},
		},
	},
};

export default NextAuth(authOptions);

