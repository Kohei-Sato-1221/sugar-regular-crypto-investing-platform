import { type NextRequest, NextResponse } from "next/server";
import { decodeIdToken, decodeAccessToken } from "~/server/auth/token-utils";
import { ACCESS_TOKEN_COOKIE_KEY, ID_TOKEN_COOKIE_KEY } from "./const/auth";

// ミドルウェアでID Tokenを検証する簡易関数
async function verifySession(request: NextRequest): Promise<boolean> {
	const idToken = request.cookies.get(ID_TOKEN_COOKIE_KEY)?.value;
	const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_KEY)?.value;

	if (!idToken || !accessToken) {
		return false;
	}

	try {
		const now = Date.now();

		// ID Tokenの検証
		const decodedIdToken = decodeIdToken(idToken);
		if (!decodedIdToken) {
			return false;
		}
		// ID Tokenの有効期限をチェック
		if (decodedIdToken.exp && decodedIdToken.exp * 1000 < now) {
			return false;
		}

		// Access Tokenの検証
		const decodedAccessToken = decodeAccessToken(accessToken);
		if (!decodedAccessToken) {
			return false;
		}

		// Access Tokenの有効期限をチェック
		if (decodedAccessToken.exp && decodedAccessToken.exp * 1000 < now) {
			return false;
		}

		return true;
	} catch {
		return false;
	}
}

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

	// /publicルートと/api/authルートは常に許可（認証不要）
	if (
		pathname.startsWith("/public") ||
		pathname.startsWith("/api/auth")
	) {
		return NextResponse.next();
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
