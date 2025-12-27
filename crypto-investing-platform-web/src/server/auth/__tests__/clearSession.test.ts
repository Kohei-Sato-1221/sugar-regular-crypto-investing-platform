import { describe, it, expect, vi, beforeEach } from "vitest";

import {
	ID_TOKEN_COOKIE_KEY,
	ACCESS_TOKEN_COOKIE_KEY,
	REFRESH_TOKEN_COOKIE_KEY,
} from "~/const/auth";

// vi.hoisted()を使用してモック関数を先に定義
const { mockDelete, mockCookieStore } = vi.hoisted(() => {
	const mockDelete = vi.fn();
	const mockCookieStore = {
		set: vi.fn(),
		get: vi.fn(),
		delete: mockDelete,
	};
	return { mockDelete, mockCookieStore };
});

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => mockCookieStore),
}));

// clearSessionをインポート（モック設定後）
import { clearSession } from "../cognito";

describe("clearSession", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		mockDelete.mockClear();
	});

	it("正常系: すべてのCookieを削除", async () => {
		// Act
		await clearSession();

		// Assert
		expect(mockDelete).toHaveBeenCalledTimes(3);
		expect(mockDelete).toHaveBeenCalledWith(ID_TOKEN_COOKIE_KEY);
		expect(mockDelete).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE_KEY);
		expect(mockDelete).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_KEY);
	});
});
