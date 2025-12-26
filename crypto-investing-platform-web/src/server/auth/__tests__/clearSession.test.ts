import { describe, it, expect, vi, beforeEach } from "vitest";

import { clearSession } from "../cognito";
import {
	ID_TOKEN_COOKIE_KEY,
	ACCESS_TOKEN_COOKIE_KEY,
	REFRESH_TOKEN_COOKIE_KEY,
} from "~/const/auth";

// Next.js cookiesをモック
const mockDelete = vi.fn();
const mockCookieStore = {
	set: vi.fn(),
	get: vi.fn(),
	delete: mockDelete,
};

vi.mock("next/headers", () => ({
	cookies: vi.fn(() => mockCookieStore),
}));

describe("clearSession", () => {
	beforeEach(() => {
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

