import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "node", // デフォルトはnode（バックエンドテスト用）
		setupFiles: ["./src/__tests__/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		env: {
			NODE_ENV: "test",
		},
		// .envファイルを自動的に読み込む（Next.jsの通常の動作と同じ）
		// envPrefixを空配列にすることで、すべての環境変数（プレフィックスなしも含む）を読み込む
		envDir: ".",
		envPrefix: [],
		fileParallelism: false,
		sequence: {
			shuffle: false,
		},
		// 環境をファイルパスで判定（フロントエンドテストはjsdomを使用）
		environmentMatchGlobs: [
			["src/app/**/*.{test,spec}.{ts,tsx}", "jsdom"],
			["src/providers/**/*.{test,spec}.{ts,tsx}", "jsdom"],
		],
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
});
