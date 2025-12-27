import { type NextRequest, NextResponse } from "next/server";
import { decodeIdToken, decodeAccessToken } from "~/server/auth/token-utils";
import { decryptTokenEdge } from "~/server/auth/crypto-utils-edge";
import { ACCESS_TOKEN_COOKIE_KEY, ID_TOKEN_COOKIE_KEY } from "./const/auth";

// ミドルウェアでID Tokenを検証する簡易関数
async function verifySession(request: NextRequest): Promise<boolean> {
	const encryptedIdToken = request.cookies.get(ID_TOKEN_COOKIE_KEY)?.value;
	const encryptedAccessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_KEY)?.value;

	if (!encryptedIdToken || !encryptedAccessToken) {
		return false;
	}

	try {
		// 暗号化されたトークンを復号化
		const idToken = await decryptTokenEdge(encryptedIdToken);
		const accessToken = await decryptTokenEdge(encryptedAccessToken);

		if (!idToken || !accessToken) {
			return false;
		}

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

/**
 * セキュリティヘッダーを追加
 */
function addSecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
	const headers = new Headers(response.headers);

	// Content Security Policy (CSP)
	// インラインスクリプトやevalを制限し、XSS攻撃を防ぐ
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js開発環境で必要
		"style-src 'self' 'unsafe-inline'", // Tailwind CSSで必要
		"img-src 'self' data: https:",
		"font-src 'self' data:",
		"connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com", // Cognito API用
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"upgrade-insecure-requests",
	].join("; ");
	headers.set("Content-Security-Policy", csp);

	// X-Frame-Options: クリックジャッキング攻撃を防ぐ
	headers.set("X-Frame-Options", "DENY");

	// X-Content-Type-Options: MIMEタイプスニッフィングを防ぐ
	headers.set("X-Content-Type-Options", "nosniff");

	// X-XSS-Protection: 古いブラウザ向けのXSS保護（非推奨だが互換性のため）
	headers.set("X-XSS-Protection", "1; mode=block");

	// Strict-Transport-Security (HSTS): HTTPSを強制
	if (request.nextUrl.protocol === "https:") {
		headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains; preload",
		);
	}

	// Referrer-Policy: リファラー情報の送信を制御
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	// Permissions-Policy: ブラウザ機能へのアクセスを制限
	headers.set(
		"Permissions-Policy",
		"geolocation=(), microphone=(), camera=(), payment=()",
	);

	return new NextResponse(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

/**
 * CSRF対策: Origin/Refererヘッダーをチェック
 */
function validateCSRF(request: NextRequest): boolean {
	// GETリクエストはCSRFチェックをスキップ
	if (request.method === "GET" || request.method === "HEAD") {
		return true;
	}

	const origin = request.headers.get("origin");
	const referer = request.headers.get("referer");
	const host = request.headers.get("host");

	if (!host) {
		return false;
	}

	// 同一オリジンリクエストの場合は許可
	if (origin) {
		try {
			const originUrl = new URL(origin);
			if (originUrl.host === host) {
				return true;
			}
		} catch {
			// 無効なOriginヘッダー
			return false;
		}
	}

	// Refererヘッダーをチェック
	if (referer) {
		try {
			const refererUrl = new URL(referer);
			if (refererUrl.host === host) {
				return true;
			}
		} catch {
			// 無効なRefererヘッダー
			return false;
		}
	}

	// OriginもRefererもない場合は拒否
	return false;
}

export async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// tRPCエンドポイントに対するCSRFチェック
	if (pathname.startsWith("/api/trpc")) {
		if (!validateCSRF(req)) {
			return new NextResponse("CSRF validation failed", { status: 403 });
		}
	}

	// /privateルートを保護（認証が必要）
	if (pathname.startsWith("/private")) {
		const isAuthenticated = await verifySession(req);
		
		if (!isAuthenticated) {
			// 認証されていない場合はサインインページにリダイレクト
			const signInUrl = new URL("/public/signin", req.url);
			signInUrl.searchParams.set("callbackUrl", pathname);
			const response = NextResponse.redirect(signInUrl);
			return addSecurityHeaders(response, req);
		}
	}

	// レスポンスを作成
	let response: NextResponse;
	if (
		pathname.startsWith("/public") ||
		pathname.startsWith("/api/auth")
	) {
		response = NextResponse.next();
	} else {
		response = NextResponse.next();
	}

	// セキュリティヘッダーを追加
	return addSecurityHeaders(response, req);
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
