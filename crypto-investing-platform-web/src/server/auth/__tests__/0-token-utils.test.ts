import { describe, expect, it } from "vitest";

import { decodeAccessToken, decodeIdToken } from "../token-utils";

type IdTokenResult = ReturnType<typeof decodeIdToken>;
type AccessTokenResult = ReturnType<typeof decodeAccessToken>;

describe("token-utils", () => {
	describe("decodeIdToken", () => {
		const testCases: Array<{
			name: string;
			input: string;
			expected: (result: IdTokenResult) => void;
		}> = [
			{
				name: "正常系: 有効なIdTokenをデコード",
				input: (() => {
					const header = { alg: "HS256", typ: "JWT" };
					const payload = {
						sub: "user-123",
						email: "test@example.com",
						name: "Test User",
						"cognito:username": "test@example.com",
						picture: "https://example.com/avatar.jpg",
						exp: Math.floor(Date.now() / 1000) + 3600,
					};
					const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
					const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
					return `${encodedHeader}.${encodedPayload}.mock-signature`;
				})(),
				expected: (result: IdTokenResult) => {
					expect(result).not.toBeNull();
					expect(result?.sub).toBe("user-123");
					expect(result?.email).toBe("test@example.com");
					expect(result?.name).toBe("Test User");
					expect(result?.["cognito:username"]).toBe("test@example.com");
					expect(result?.picture).toBe("https://example.com/avatar.jpg");
					expect(result?.exp).toBeTypeOf("number");
				},
			},
			{
				name: "正常系: 最小限の情報のIdTokenをデコード",
				input: (() => {
					const header = { alg: "HS256", typ: "JWT" };
					const payload = {
						sub: "user-456",
					};
					const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
					const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
					return `${encodedHeader}.${encodedPayload}.mock-signature`;
				})(),
				expected: (result: IdTokenResult) => {
					expect(result).not.toBeNull();
					expect(result?.sub).toBe("user-456");
				},
			},
			{
				name: "異常系: 無効な形式のトークン（ドットが不足）",
				input: "invalid-token",
				expected: (result: IdTokenResult) => {
					expect(result).toBeNull();
				},
			},
			{
				name: "異常系: 空文字列",
				input: "",
				expected: (result: IdTokenResult) => {
					expect(result).toBeNull();
				},
			},
			{
				name: "異常系: 無効なBase64URL形式",
				input: "header.invalid-base64.signature",
				expected: (result: IdTokenResult) => {
					expect(result).toBeNull();
				},
			},
		];

		testCases.forEach((testCase) => {
			it(testCase.name, () => {
				// Act
				const result = decodeIdToken(testCase.input);

				// Assert
				testCase.expected(result);
			});
		});
	});

	describe("decodeAccessToken", () => {
		const testCases: Array<{
			name: string;
			input: string;
			expected: (result: AccessTokenResult) => void;
		}> = [
			{
				name: "正常系: 有効なAccessTokenをデコード",
				input: (() => {
					const header = { alg: "HS256", typ: "JWT" };
					const payload = {
						sub: "user-123",
						scope: "aws.cognito.signin.user.admin",
						client_id: "test-client-id",
						username: "test@example.com",
						exp: Math.floor(Date.now() / 1000) + 3600,
						iat: Math.floor(Date.now() / 1000),
						auth_time: Math.floor(Date.now() / 1000),
					};
					const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
					const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
					return `${encodedHeader}.${encodedPayload}.mock-signature`;
				})(),
				expected: (result: AccessTokenResult) => {
					expect(result).not.toBeNull();
					expect(result?.sub).toBe("user-123");
					expect(result?.scope).toBe("aws.cognito.signin.user.admin");
					expect(result?.client_id).toBe("test-client-id");
					expect(result?.username).toBe("test@example.com");
					expect(result?.exp).toBeTypeOf("number");
					expect(result?.iat).toBeTypeOf("number");
					expect(result?.auth_time).toBeTypeOf("number");
				},
			},
			{
				name: "正常系: 最小限の情報のAccessTokenをデコード",
				input: (() => {
					const header = { alg: "HS256", typ: "JWT" };
					const payload = {
						sub: "user-456",
					};
					const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
					const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
					return `${encodedHeader}.${encodedPayload}.mock-signature`;
				})(),
				expected: (result: AccessTokenResult) => {
					expect(result).not.toBeNull();
					expect(result?.sub).toBe("user-456");
				},
			},
			{
				name: "異常系: 無効な形式のトークン（ドットが不足）",
				input: "invalid-token",
				expected: (result: AccessTokenResult) => {
					expect(result).toBeNull();
				},
			},
			{
				name: "異常系: 空文字列",
				input: "",
				expected: (result: AccessTokenResult) => {
					expect(result).toBeNull();
				},
			},
			{
				name: "異常系: 無効なBase64URL形式",
				input: "header.invalid-base64.signature",
				expected: (result: AccessTokenResult) => {
					expect(result).toBeNull();
				},
			},
		];

		testCases.forEach((testCase) => {
			it(testCase.name, () => {
				// Act
				const result = decodeAccessToken(testCase.input);

				// Assert
				testCase.expected(result);
			});
		});
	});
});
