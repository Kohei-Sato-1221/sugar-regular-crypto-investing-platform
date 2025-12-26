/**
 * Edge Runtime対応のJWTデコード関数
 * Bufferを使わずにatobを使用
 */
export function decodeIdToken(idToken: string) {
	try {
		const parts = idToken.split(".");
		if (parts.length < 2 || !parts[1]) {
			return null;
		}

		const base64Url = parts[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		
		// Edge Runtime対応: atobを使用
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join(""),
		);

		return JSON.parse(jsonPayload) as {
			sub: string;
			email?: string;
			name?: string;
			picture?: string;
			"cognito:username"?: string;
			exp?: number;
			[key: string]: unknown;
		};
	} catch {
		return null;
	}
}


/**
 * Edge Runtime対応のAccessTokenデコード関数
 * Bufferを使わずにatobを使用
 */
export function decodeAccessToken(accessToken: string) {
	try {
		const parts = accessToken.split(".");
		if (parts.length < 2 || !parts[1]) {
			return null;
		}

		const base64Url = parts[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		
		// Edge Runtime対応: atobを使用
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join(""),
		);

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
