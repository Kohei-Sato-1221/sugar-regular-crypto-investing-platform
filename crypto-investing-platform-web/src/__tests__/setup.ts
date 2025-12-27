import "@testing-library/jest-dom";
import { vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// .envファイルを読み込む（Node.js標準機能を使用、dotenvパッケージは使用しない）
const envPath = resolve(process.cwd(), ".env");
try {
	const envFile = readFileSync(envPath, "utf-8");
	const envLines = envFile.split("\n");
	for (const line of envLines) {
		const trimmedLine = line.trim();
		// 空行やコメント行をスキップ
		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}
		// KEY=VALUE形式を解析
		const equalIndex = trimmedLine.indexOf("=");
		if (equalIndex > 0) {
			const key = trimmedLine.substring(0, equalIndex).trim();
			let value = trimmedLine.substring(equalIndex + 1).trim();
			// 引用符を削除
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			// 既に設定されていない場合のみ設定（環境変数の優先順位を保持）
			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	}
} catch (error) {
	// .envファイルが存在しない場合は無視（環境変数が既に設定されている可能性がある）
}

// 実際のDB接続情報を使用（docker-compose.ymlの設定に合わせる）
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://ragus:investingPassWork12345@localhost:6543/investing_platform_db?schema=public";

// AUTH_SECRETは.envファイルから読み込まれる必要がある（必須）
if (!process.env.AUTH_SECRET) {
	throw new Error(
		"AUTH_SECRET環境変数が設定されていません。.envファイルにAUTH_SECRETを設定してください。",
	);
}

// Node.js環境でatobが存在しない場合のpolyfill
if (typeof globalThis.atob === "undefined") {
	globalThis.atob = (str: string) => {
		return Buffer.from(str, "base64").toString("binary");
	};
}

// Next.js Router のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
	useSearchParams: () => ({
		get: vi.fn(),
		has: vi.fn(),
		getAll: vi.fn(),
	}),
	usePathname: () => "/",
}));

