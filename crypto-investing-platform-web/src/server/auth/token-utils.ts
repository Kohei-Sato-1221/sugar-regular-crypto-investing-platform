/**
 * JWTトークンのデコードユーティリティ
 * 注意: これは署名検証を行わないデコードです
 */
import { STOCKBIT_SESSION_COOKIE } from "~/const/auth";

export interface DecodedIdToken {
	sub: string;
	email?: string;
	"cognito:username"?: string;
	name?: string;
	picture?: string;
	exp?: number;
	[key: string]: unknown;
}

export interface DecodedAccessToken {
	sub: string;
	exp?: number;
	[key: string]: unknown;
}

/**
 * JWTトークンをデコード（署名検証なし）
 */
export function decodeIdToken(token: string): DecodedIdToken | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3 || !parts[1]) {
			return null;
		}

		// Payload部分をデコード
		const payload = parts[1];
		const decoded = Buffer.from(payload, "base64url").toString("utf-8");
		const parsed = JSON.parse(decoded) as DecodedIdToken;

		return parsed;
	} catch (error) {
		console.error("Failed to decode ID token:", error);
		return null;
	}
}

/**
 * Access Tokenをデコード（署名検証なし）
 */
export function decodeAccessToken(token: string): DecodedAccessToken | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3 || !parts[1]) {
			return null;
		}

		// Payload部分をデコード
		const payload = parts[1];
		const decoded = Buffer.from(payload, "base64url").toString("utf-8");
		const parsed = JSON.parse(decoded) as DecodedAccessToken;

		return parsed;
	} catch (error) {
		console.error("Failed to decode Access token:", error);
		return null;
	}
}

/**
 * NextAuthのセッションCookie名を取得
 * 通常、Secure、Hostの3つのバリエーションを返す
 */
export function getSessionCookieNames(): {
	normal: string;
	secure: string;
	host: string;
} {
	return {
		normal: STOCKBIT_SESSION_COOKIE,
		secure: `__Secure-${STOCKBIT_SESSION_COOKIE}`,
		host: `__Host-${STOCKBIT_SESSION_COOKIE}`,
	};
}

/**
 * Cookieストアからセッショントークンを取得
 * 通常、Secure、Hostの順で試行
 */
export function getSessionTokenFromCookies(
	getCookie: (name: string) => { value: string } | undefined,
): string | null {
	const cookieNames = getSessionCookieNames();
	
	let sessionToken = getCookie(cookieNames.normal)?.value;
	if (!sessionToken) {
		sessionToken = getCookie(cookieNames.secure)?.value;
	}
	if (!sessionToken) {
		sessionToken = getCookie(cookieNames.host)?.value;
	}
	
	return sessionToken ?? null;
}

/**
 * セッショントークンを検証してペイロードを取得
 * verifySessionとauthの共通ロジック
 */
export async function verifyAndDecodeSessionToken(
	sessionToken: string,
	secret: string,
): Promise<{ payload: Record<string, unknown> | null; isValid: boolean }> {
	try {
		const { hkdf } = await import("@panva/hkdf");
		const { jwtDecrypt } = await import("jose");

		const key = await hkdf(
			"sha256",
			secret,
			"", // saltはcookie名（空文字でOK）
			"NextAuth.js Generated Encryption Key",
			32
		);

		const { payload } = await jwtDecrypt(sessionToken, key);

		if (!payload) {
			return { payload: null, isValid: false };
		}

		// トークンの有効期限をチェック
		if (payload.exp && typeof payload.exp === "number") {
			const now = Math.floor(Date.now() / 1000);
			if (payload.exp < now) {
				return { payload: null, isValid: false };
			}
		}

		return { payload, isValid: true };
	} catch (error) {
		console.error("Failed to verify and decode session token:", error);
		return { payload: null, isValid: false };
	}
}
