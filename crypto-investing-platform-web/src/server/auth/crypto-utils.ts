import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { env } from "~/env";

/**
 * AUTH_SECRETから暗号化キーを生成
 * PBKDF2を使用して32バイトのキーを生成
 */
function getEncryptionKey(): Buffer {
	const salt = "auth-secret-salt"; // 固定のソルト（AUTH_SECRETが変わればキーも変わる）
	const key = pbkdf2Sync(env.AUTH_SECRET, salt, 100000, 32, "sha256");
	return key;
}

/**
 * トークンを暗号化してBase64エンコードされた文字列を返す
 * AES-256-GCMを使用
 * Node.js環境専用（Edge Runtimeでは使用不可）
 */
export function encryptToken(token: string): string {
	try {
		const key = getEncryptionKey();
		const iv = randomBytes(16); // 初期化ベクトル（16バイト）
		const cipher = createCipheriv("aes-256-gcm", key, iv);

		let encrypted = cipher.update(token, "utf8");
		encrypted = Buffer.concat([encrypted, cipher.final()]);

		const authTag = cipher.getAuthTag(); // GCM認証タグ（16バイト）

		// IV + 認証タグ + 暗号化データを結合してBase64エンコード
		const combined = Buffer.concat([iv, authTag, encrypted]);
		return combined.toString("base64");
	} catch (_error) {
		throw new Error("トークンの暗号化に失敗しました");
	}
}

/**
 * Base64エンコードされた暗号化トークンを復号化
 * AES-256-GCMを使用
 */
export function decryptToken(encryptedToken: string): string | null {
	try {
		const key = getEncryptionKey();
		const combined = Buffer.from(encryptedToken, "base64");

		// 最小サイズチェック（IV: 16バイト + AuthTag: 16バイト = 32バイト）
		if (combined.length < 32) {
			return null;
		}

		const iv = combined.subarray(0, 16);
		const authTag = combined.subarray(16, 32);
		const encrypted = combined.subarray(32);

		const decipher = createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encrypted);
		decrypted = Buffer.concat([decrypted, decipher.final()]);

		return decrypted.toString("utf8");
	} catch (_error) {
		return null;
	}
}
