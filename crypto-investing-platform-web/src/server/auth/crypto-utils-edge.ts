/**
 * Edge Runtime用の暗号化・復号化ユーティリティ
 * Web Crypto APIを使用（Node.jsのcryptoモジュールは使用しない）
 */

/**
 * Edge Runtime用: AUTH_SECRETから暗号化キーを生成（Web Crypto API使用）
 */
async function getEncryptionKeyEdge(): Promise<CryptoKey> {
	const authSecret = process.env.AUTH_SECRET;
	if (!authSecret) {
		throw new Error("AUTH_SECRET環境変数が設定されていません");
	}

	const salt = "auth-secret-salt";
	const encoder = new TextEncoder();

	// Web Crypto APIでPBKDF2を使用してキーを生成
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(authSecret),
		"PBKDF2",
		false,
		["deriveBits", "deriveKey"],
	);

	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: encoder.encode(salt),
			iterations: 100000,
			hash: "SHA-256",
		},
		keyMaterial,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"],
	);

	return key;
}

/**
 * Edge Runtime用: Base64エンコードされた暗号化トークンを復号化（Web Crypto API使用）
 */
export async function decryptTokenEdge(encryptedToken: string): Promise<string | null> {
	try {
		const key = await getEncryptionKeyEdge();
		const combined = Uint8Array.from(atob(encryptedToken), (c) => c.charCodeAt(0));

		// 最小サイズチェック（IV: 16バイト + AuthTag: 16バイト = 32バイト）
		if (combined.length < 32) {
			return null;
		}

		const iv = combined.subarray(0, 16);
		const authTag = combined.subarray(16, 32);
		const encrypted = combined.subarray(32);

		// GCMモードでは、認証タグは暗号化データの最後に結合される必要がある
		const encryptedWithTag = new Uint8Array(encrypted.length + 16);
		encryptedWithTag.set(encrypted);
		encryptedWithTag.set(authTag, encrypted.length);

		const decrypted = await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: iv,
				tagLength: 128, // 16バイト = 128ビット
			},
			key,
			encryptedWithTag,
		);

		const decoder = new TextDecoder();
		return decoder.decode(decrypted);
	} catch (error) {
		console.error("Token decryption failed (Edge):", error);
		return null;
	}
}

