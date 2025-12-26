import { describe, it, expect, vi, beforeEach } from "vitest";

import { createCallerFactory } from "~/server/api/trpc";
import { postRouter } from "../post";
import { db } from "~/server/db";

// auth関数をモック
vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

import { auth } from "~/server/auth";

describe("postRouter", () => {
	const createCaller = createCallerFactory(postRouter);

	beforeEach(() => {
		vi.clearAllMocks();
		// auth関数のデフォルトの戻り値を設定
		if (typeof auth === "function" && "mockResolvedValue" in auth) {
			(auth as any).mockResolvedValue(null);
		}
	});

	describe("hello", () => {
		const testCases = [
			{
				name: "正常系: テキストを返す",
				input: {
					text: "world",
				},
				expected: async (result: any) => {
					expect(result.greeting).toBe("Hello world");
				},
			},
			{
				name: "正常系: 空文字列を返す",
				input: {
					text: "",
				},
				expected: async (result: any) => {
					expect(result.greeting).toBe("Hello ");
				},
			},
			{
				name: "正常系: 日本語のテキストを返す",
				input: {
					text: "世界",
				},
				expected: async (result: any) => {
					expect(result.greeting).toBe("Hello 世界");
				},
			},
		];

		testCases.forEach((testCase) => {
			it(testCase.name, async () => {
				// Arrange
				const caller = createCaller({
					headers: new Headers(),
					db,
					session: null,
				});

				// Act
				const result = await caller.hello(testCase.input);

				// Assert
				if ("expected" in testCase && testCase.expected) {
					await testCase.expected(result);
				}
			});
		});
	});

	describe("create", () => {
		const testCases = [
			{
				name: "正常系: postを作成",
				input: {
					name: "Test Post",
				},
				setup: async () => {
					// テスト用のUserを作成
					const user = await db.user.create({
						data: {
							id: `test-user-${Date.now()}`,
							email: `test-${Date.now()}@example.com`,
							name: "Test User",
						},
					});

					const mockUser = {
						id: user.id,
						email: user.email ?? null,
						name: user.name ?? null,
					};
					(auth as any).mockResolvedValue({
						user: mockUser,
					});
					return { mockUser, user };
				},
				expected: async (result: any) => {
					expect(result).toHaveProperty("id");
					expect(result).toHaveProperty("name", "Test Post");
					expect(result).toHaveProperty("createdAt");
					expect(result).toHaveProperty("updatedAt");
					expect(result).toHaveProperty("createdById");
				},
				cleanup: async (result: any, { user }: any) => {
					// 作成したpostを削除
					if (result?.id) {
						await db.post.delete({
							where: { id: result.id },
						});
					}
					// 作成したuserを削除
					if (user?.id) {
						await db.user.delete({
							where: { id: user.id },
						});
					}
				},
			},
			{
				name: "異常系: 認証なし（UNAUTHORIZED）",
				input: {
					name: "Test Post",
				},
				setup: async () => {
					(auth as any).mockResolvedValue(null);
					return {};
				},
				shouldThrow: true,
				expectedError: {
					code: "UNAUTHORIZED",
				},
			},
			{
				name: "異常系: バリデーションエラー（nameが空）",
				input: {
					name: "",
				},
				setup: async () => {
					const mockUser = {
						id: "user-123",
						email: "test@example.com",
						name: "Test User",
					};
					(auth as any).mockResolvedValue({
						user: mockUser,
					});
					return { mockUser };
				},
				shouldThrow: true,
			},
		];

		testCases.forEach((testCase) => {
			it(testCase.name, async () => {
				// Arrange
				const setupResult = await testCase.setup();
				const mockUser = "mockUser" in setupResult ? (setupResult as { mockUser: { id: string; email: string | null; name: string | null } }).mockUser : null;
				const caller = createCaller({
					headers: new Headers(),
					db,
					session: mockUser
						? {
								user: mockUser as { id: string; email: string | null; name: string | null; image: string | null },
						  }
						: null,
				});

				// Act & Assert
				if ("shouldThrow" in testCase && testCase.shouldThrow) {
					const promise = caller.create(testCase.input);
					await expect(promise).rejects.toThrow();

					if ("expectedError" in testCase && testCase.expectedError) {
						await expect(promise).rejects.toMatchObject(testCase.expectedError);
					}
				} else {
					const result = await caller.create(testCase.input);
					if ("expected" in testCase && testCase.expected) {
						await testCase.expected(result);
					}
					if ("cleanup" in testCase && testCase.cleanup) {
						await testCase.cleanup(result, setupResult);
					}
				}
			});
		});
	});

	describe("getLatest", () => {
		const testCases = [
			{
				name: "正常系: 最新のpostを取得",
				setup: async () => {
					// テスト用のUserを作成
					const user = await db.user.create({
						data: {
							id: `test-user-${Date.now()}`,
							email: `test-${Date.now()}@example.com`,
							name: "Test User",
						},
					});

					const mockUser = {
						id: user.id,
						email: user.email ?? null,
						name: user.name ?? null,
					};
					(auth as any).mockResolvedValue({
						user: mockUser,
					});

					// テスト用のpostを作成
					const post = await db.post.create({
						data: {
							name: "Latest Post",
							createdBy: { connect: { id: user.id } },
						},
					});

					return { mockUser, post, user };
				},
				expected: async (result: any, { post }: any) => {
					expect(result).not.toBeNull();
					expect(result?.id).toBe(post.id);
					expect(result?.name).toBe("Latest Post");
				},
				cleanup: async (_result: any, { post, user }: any) => {
					// 作成したpostを削除
					if (post?.id) {
						await db.post.delete({
							where: { id: post.id },
						});
					}
					// 作成したuserを削除
					if (user?.id) {
						await db.user.delete({
							where: { id: user.id },
						});
					}
				},
			},
			{
				name: "正常系: postがない場合はnullを返す",
				setup: async () => {
					// テスト用のUserを作成（postなし）
					const user = await db.user.create({
						data: {
							id: `test-user-no-posts-${Date.now()}`,
							email: `noposts-${Date.now()}@example.com`,
							name: "No Posts User",
						},
					});

					const mockUser = {
						id: user.id,
						email: user.email ?? null,
						name: user.name ?? null,
					};
					(auth as any).mockResolvedValue({
						user: mockUser,
					});

					return { mockUser, user };
				},
				cleanup: async (_result: any, { user }: any) => {
					// 作成したuserを削除
					if (user?.id) {
						await db.user.delete({
							where: { id: user.id },
						});
					}
				},
				expected: async (result: any) => {
					expect(result).toBeNull();
				},
			},
			{
				name: "異常系: 認証なし（UNAUTHORIZED）",
				setup: async () => {
					(auth as any).mockResolvedValue(null);
					return {};
				},
				shouldThrow: true,
				expectedError: {
					code: "UNAUTHORIZED",
				},
			},
		];

		testCases.forEach((testCase) => {
			it(testCase.name, async () => {
				// Arrange
				const setupResult = await testCase.setup();
				const mockUser = "mockUser" in setupResult ? (setupResult as { mockUser: { id: string; email: string | null; name: string | null } }).mockUser : null;
				const caller = createCaller({
					headers: new Headers(),
					db,
					session: mockUser
						? {
								user: mockUser as { id: string; email: string | null; name: string | null; image: string | null },
						  }
						: null,
				});

				// Act & Assert
				if ("shouldThrow" in testCase && testCase.shouldThrow) {
					const promise = caller.getLatest();
					await expect(promise).rejects.toThrow();

					if ("expectedError" in testCase && testCase.expectedError) {
						await expect(promise).rejects.toMatchObject(testCase.expectedError);
					}
				} else {
					const result = await caller.getLatest();
					if ("expected" in testCase && testCase.expected) {
						await testCase.expected(result, setupResult);
					}
					if ("cleanup" in testCase && testCase.cleanup) {
						await testCase.cleanup(result, setupResult);
					}
				}
			});
		});
	});

	describe("getSecretMessage", () => {
		const testCases = [
			{
				name: "正常系: シークレットメッセージを返す",
				setup: () => {
					const mockUser = {
						id: "user-123",
						email: "test@example.com",
						name: "Test User",
					};
					(auth as any).mockResolvedValue({
						user: mockUser,
					});
					return { mockUser };
				},
				expected: async (result: any) => {
					expect(result).toBe("you can now see this secret message!");
				},
			},
			{
				name: "異常系: 認証なし（UNAUTHORIZED）",
				setup: () => {
					(auth as any).mockResolvedValue(null);
					return {};
				},
				shouldThrow: true,
				expectedError: {
					code: "UNAUTHORIZED",
				},
			},
		];

		testCases.forEach((testCase) => {
			it(testCase.name, async () => {
				// Arrange
				const setupResult = testCase.setup();
				const mockUser = "mockUser" in setupResult && setupResult.mockUser
					? (setupResult as { mockUser: { id: string; email: string | null; name: string | null } }).mockUser
					: null;
				const caller = createCaller({
					headers: new Headers(),
					db,
					session: mockUser
						? {
								user: mockUser as { id: string; email: string | null; name: string | null; image: string | null },
						  }
						: null,
				});

				// Act & Assert
				if ("shouldThrow" in testCase && testCase.shouldThrow) {
					const promise = caller.getSecretMessage();
					await expect(promise).rejects.toThrow();

					if ("expectedError" in testCase && testCase.expectedError) {
						await expect(promise).rejects.toMatchObject(testCase.expectedError);
					}
				} else {
					const result = await caller.getSecretMessage();
					if ("expected" in testCase && testCase.expected) {
						await testCase.expected(result);
					}
				}
			});
		});
	});
});

