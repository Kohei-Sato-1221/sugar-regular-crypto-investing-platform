import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

const handler = async (req: NextRequest) => {
	const response = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
		onError:
			env.NODE_ENV === "development"
				? ({ path, error }) => {
						console.error(
							`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
						);
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
