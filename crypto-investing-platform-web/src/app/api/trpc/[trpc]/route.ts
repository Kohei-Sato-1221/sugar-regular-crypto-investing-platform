import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
	return createTRPCContext({
		headers: req.headers,
	});
};

/**
 * CSRF対策: Origin/Refererヘッダーをチェック
 * middleware.tsでもチェックしているが、二重チェックでより安全に
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

const handler = async (req: NextRequest) => {
	// CSRFチェック（middleware.tsでもチェックしているが、二重チェック）
	if (!validateCSRF(req)) {
		return new NextResponse("CSRF validation failed", { status: 403 });
	}

	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error }) => {
						// biome-ignore lint/suspicious/noConsole: 開発時のデバッグ用
						console.error(`[tRPC Error] ${path}:`, error.message);
					}
				: undefined,
	});

	// レスポンスボディを取得
	const responseData = await response.text();

	// NextResponseでラップして、Next.jsのcookies()で設定されたCookieを含める
	// Next.jsのcookies()は内部的にレスポンスヘッダーを管理しているが、
	// tRPCのfetchRequestHandlerが新しいResponseオブジェクトを作成するため、
	// NextResponseを使うことで、Next.jsが自動的にCookieを追加する
	const nextResponse = new NextResponse(responseData, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});

	return nextResponse;
};

export { handler as GET, handler as POST };
