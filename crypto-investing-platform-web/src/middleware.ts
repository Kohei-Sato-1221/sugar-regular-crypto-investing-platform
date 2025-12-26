import { type NextRequest, NextResponse } from "next/server";
import { getSessionTokenFromCookies, verifyAndDecodeSessionToken } from "~/server/auth/token-utils";

/**
 * middleware用のセッション確認関数
 * /private/page.tsxと同じロジックを使用
 * 
 * 注意: Edge Runtimeで実行されるため、authOptionsをインポートできません。
 * 環境変数から直接AUTH_SECRETを取得します。
 */
async function verifySession(request: NextRequest): Promise<boolean> {
	try {
		// NextAuth V4のJWTトークンは`next-auth.session-token`という名前のCookieに保存される
		// 本番環境では`__Secure-next-auth.session-token`や`__Host-next-auth.session-token`になる可能性もある
		const sessionToken = getSessionTokenFromCookies((name) => request.cookies.get(name));

		// Edge RuntimeではauthOptionsをインポートできないため、環境変数から直接取得
		const authSecret = process.env.AUTH_SECRET;
		if (!sessionToken || !authSecret) {
			return false;
		}

		const { isValid } = await verifyAndDecodeSessionToken(
			sessionToken,
			authSecret,
		);

		return isValid;
	} catch (error) {
		console.error("Failed to verify session in middleware:", error);
		return false;
	}
}

/**
 * middleware
 * /privateルートの認証チェックを実行
 */
export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// /privateルートを保護（認証が必要）
	if (pathname.startsWith("/private")) {
		const isAuthenticated = await verifySession(req);
		
		if (!isAuthenticated) {
			// 認証されていない場合はサインインページにリダイレクト
			const signInUrl = new URL("/public/signin", req.url);
			signInUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(signInUrl);
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - /api/auth (認証API routes)
		 * - /public (認証不要のページ)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - files with extensions (e.g., .png, .jpg, etc.)
		 */
		"/((?!api/auth|public|_next/static|_next/image|.*\\..*).*)",
	],
};
