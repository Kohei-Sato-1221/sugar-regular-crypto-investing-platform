import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

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
		fileParallelism: false,
		sequence: {
			shuffle: false,
		},
		// 環境をファイルパスで判定（フロントエンドテストはjsdomを使用）
		environmentMatchGlobs: [
			["src/app/**/*.{test,spec}.{ts,tsx}", "jsdom"],
		],
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
		},
	},
});

