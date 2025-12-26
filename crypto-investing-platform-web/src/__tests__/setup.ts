import "@testing-library/jest-dom";
import { vi } from "vitest";

// テスト環境変数を設定
process.env.NODE_ENV = "test";
// 実際のDB接続情報を使用（docker-compose.ymlの設定に合わせる）
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://ragus:investingPassWork12345@localhost:6543/investing_platform_db?schema=public";

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

