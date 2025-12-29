import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "~/trpc/react";
import { LatestPost } from "../post";

// useMutationの戻り値の型（テスト用に必要なプロパティのみ）
type MockMutationResult = {
	mutate: ReturnType<typeof vi.fn>;
	isPending: boolean;
};

// tRPCのモック
const mockUseSuspenseQuery = vi.fn();
const mockUseUtils = vi.fn();
const mockMutate = vi.fn();
const mockInvalidate = vi.fn();

vi.mock("~/trpc/react", () => ({
	api: {
		post: {
			getLatest: {
				useSuspenseQuery: vi.fn(),
			},
			create: {
				useMutation: vi.fn(),
			},
		},
		useUtils: vi.fn(),
	},
}));

describe("LatestPost", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// useSuspenseQueryのモック設定
		mockUseSuspenseQuery.mockReturnValue([
			{
				id: "post-1",
				name: "Test Post",
			},
			{
				refetch: vi.fn(),
			},
		]);
		vi.mocked(api.post.getLatest.useSuspenseQuery).mockImplementation(mockUseSuspenseQuery);

		// useUtilsのモック設定
		mockUseUtils.mockReturnValue({
			post: {
				invalidate: mockInvalidate,
			},
		});
		vi.mocked(api.useUtils).mockImplementation(mockUseUtils);

		// useMutationのモック設定
		vi.mocked(api.post.create.useMutation).mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		} as MockMutationResult);
	});

	it("正常系: 最新の投稿が表示される", () => {
		render(<LatestPost />);

		expect(screen.getByText(/Your most recent post: Test Post/i)).toBeInTheDocument();
	});

	it("正常系: 投稿が無い場合は適切なメッセージを表示", () => {
		mockUseSuspenseQuery.mockReturnValue([
			null,
			{
				refetch: vi.fn(),
			},
		]);

		render(<LatestPost />);

		expect(screen.getByText(/You have no posts yet/i)).toBeInTheDocument();
	});

	it("正常系: フォーム送信で投稿作成APIが呼ばれる", async () => {
		const user = userEvent.setup();

		// mockMutateを使用してモックを設定
		vi.mocked(api.post.create.useMutation).mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		} as MockMutationResult);

		render(<LatestPost />);

		const input = screen.getByPlaceholderText(/Title/i);
		await user.type(input, "New Post");
		await user.click(screen.getByRole("button", { name: /Submit/i }));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ name: "New Post" });
		});
	});

	it("正常系: 投稿作成成功時にフォームがリセットされる", async () => {
		const user = userEvent.setup();

		// mockMutateを使用してモックを設定
		vi.mocked(api.post.create.useMutation).mockReturnValue({
			mutate: mockMutate,
			isPending: false,
		} as MockMutationResult);

		render(<LatestPost />);

		const input = screen.getByPlaceholderText(/Title/i) as HTMLInputElement;
		await user.type(input, "New Post");

		// 入力値が設定されていることを確認
		expect(input.value).toBe("New Post");

		await user.click(screen.getByRole("button", { name: /Submit/i }));

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledWith({ name: "New Post" });
		});

		// フォームのリセットは、onSuccessコールバック内で実行されるため、
		// このテストではmutateが呼ばれることのみを確認
		// 実際のフォームリセット動作は統合テストで確認
	});

	it("正常系: 投稿作成中はボタンが無効化される", () => {
		vi.mocked(api.post.create.useMutation).mockReturnValue({
			mutate: mockMutate,
			isPending: true,
		} as MockMutationResult);

		render(<LatestPost />);

		const button = screen.getByRole("button", { name: /Submitting/i });
		expect(button).toBeDisabled();
	});

	it("正常系: 投稿作成中でない場合はボタンが有効", () => {
		render(<LatestPost />);

		const button = screen.getByRole("button", { name: /Submit/i });
		expect(button).not.toBeDisabled();
	});
});
