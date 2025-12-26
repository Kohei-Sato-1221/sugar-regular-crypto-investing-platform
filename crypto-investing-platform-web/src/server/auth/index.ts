/**
 * NextAuth V4用のラッパー
 * AppRouterで使用するためのセッション取得ラッパー
 * 
 * 注意: NextAuth V4はPageRouter向けに設計されているため、
 * AppRouterでは制限があります。JWTトークンを直接デコードします。
 */
import { cookies } from "next/headers";
import { authOptions } from "../../../pages/api/auth/[...nextauth]";
import { getSessionTokenFromCookies, verifyAndDecodeSessionToken } from "./token-utils";

/**
 * サーバーサイドでセッションを取得
 * AppRouter（RSC）で使用
 * 
 * NextAuth V4では、AppRouterでgetServerSessionを使うのは難しいため、
 * JWTトークンを直接Cookieから読み取ってデコードします。
 * 
 * NextAuth V4はJWE（JSON Web Encryption）を使用してトークンを暗号化しています。
 */
export async function auth() {
	try {
		const cookieStore = await cookies();
		
		// NextAuth V4のJWTトークンは`next-auth.session-token`という名前のCookieに保存される
		// 本番環境では`__Secure-next-auth.session-token`や`__Host-next-auth.session-token`になる可能性もある
		const sessionToken = getSessionTokenFromCookies((name) => cookieStore.get(name));

		if (!sessionToken || !authOptions.secret) {
			return null;
		}

		const { payload, isValid } = await verifyAndDecodeSessionToken(
			sessionToken,
			authOptions.secret,
		);

		if (!isValid || !payload) {
			return null;
		}

		// トークンからセッション情報を構築
		return {
			user: {
				id: (payload.id as string | undefined) ?? "",
				email: (payload.email as string | null | undefined) ?? null,
				name: (payload.name as string | null | undefined) ?? null,
				image: (payload.picture as string | null | undefined) ?? null,
			},
			expires: payload.exp && typeof payload.exp === "number" 
				? new Date(payload.exp * 1000).toISOString() 
				: null,
		};
	} catch (error) {
		console.error("Failed to get session:", error);
		return null;
	}
}

/**
 * NextAuth V4のsignIn/signOutはクライアントサイドのみ
 * これらはpages/signin.tsxで直接next-auth/reactから使用
 */
export { signIn, signOut } from "next-auth/react";
