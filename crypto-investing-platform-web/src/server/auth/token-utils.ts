/**
 * Edge Runtime対応のJWTデコード関数
 * Node.js環境ではBufferを使用、Edge Runtimeではatobを使用
 */
export function decodeIdToken(idToken: string) {
	try {
		const parts = idToken.split(".");
		if (parts.length < 2 || !parts[1]) {
			return null;
		}

		const base64Url = parts[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		
		// Node.js環境ではBufferを使用、それ以外（Edge Runtime）ではatobを使用
		let jsonPayload: string;
		// Node.js環境ではBufferを使用（テスト環境でも確実に動作するように）
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
			jsonPayload = Buffer.from(base64, "base64").toString("utf8");
		} else if (typeof atob !== "undefined") {
			// Edge Runtime対応: atobを使用
			jsonPayload = decodeURIComponent(
				atob(base64)
					.split("")
					.map((c) => {
						return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
					})
					.join(""),
			);
		} else {
			return null;
		}

		return JSON.parse(jsonPayload) as {
			sub: string;
			email?: string;
			name?: string;
			picture?: string;
			"cognito:username"?: string;
			exp?: number;
			[key: string]: unknown;
		};
	} catch (error) {
		// エラー時はnullを返す（エラーログは出さない）
		return null;
	}
}


/**
 * Edge Runtime対応のAccessTokenデコード関数
 * Node.js環境ではBufferを使用、Edge Runtimeではatobを使用
 */
export function decodeAccessToken(accessToken: string) {
	try {
		const parts = accessToken.split(".");
		if (parts.length < 2 || !parts[1]) {
			return null;
		}

		const base64Url = parts[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		
		// Node.js環境ではBufferを使用、それ以外（Edge Runtime）ではatobを使用
		let jsonPayload: string;
		// Node.js環境ではBufferを使用（テスト環境でも確実に動作するように）
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
			jsonPayload = Buffer.from(base64, "base64").toString("utf8");
		} else if (typeof atob !== "undefined") {
			// Edge Runtime対応: atobを使用
			jsonPayload = decodeURIComponent(
				atob(base64)
					.split("")
					.map((c) => {
						return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
					})
					.join(""),
			);
		} else {
			return null;
		}

		return JSON.parse(jsonPayload) as {
			sub: string;
			scope?: string;
			client_id?: string;
			username?: string;
			exp?: number;
			iat?: number;
			auth_time?: number;
			[key: string]: unknown;
		};
	} catch {
		return null;
	}
}
