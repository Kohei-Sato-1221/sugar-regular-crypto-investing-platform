import { render, screen } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userAtom } from "~/store/user";
import { GlobalProvider } from "../GlobalProvider";

/**
 * テスト用のコンシューマーコンポーネント
 * Jotaiのatomからユーザー情報を取得して表示
 */
function UserConsumer() {
	const user = useAtomValue(userAtom);
	return (
		<div>
			<span data-testid="user-id">{user?.id ?? "null"}</span>
			<span data-testid="user-name">{user?.name ?? "null"}</span>
			<span data-testid="user-email">{user?.email ?? "null"}</span>
		</div>
	);
}

describe("GlobalProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("ユーザー情報がJotaiにハイドレートされる", () => {
			const mockUser = {
				id: "user-123",
				name: "テストユーザー",
				email: "test@example.com",
			};

			render(
				<GlobalProvider user={mockUser}>
					<UserConsumer />
				</GlobalProvider>,
			);

			expect(screen.getByTestId("user-id")).toHaveTextContent("user-123");
			expect(screen.getByTestId("user-name")).toHaveTextContent("テストユーザー");
			expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
		});

		it("emailがnullでも正しくハイドレートされる", () => {
			const mockUser = {
				id: "user-456",
				name: "メールなしユーザー",
				email: null,
			};

			render(
				<GlobalProvider user={mockUser}>
					<UserConsumer />
				</GlobalProvider>,
			);

			expect(screen.getByTestId("user-id")).toHaveTextContent("user-456");
			expect(screen.getByTestId("user-name")).toHaveTextContent("メールなしユーザー");
			expect(screen.getByTestId("user-email")).toHaveTextContent("null");
		});

		it("子コンポーネントが正しくレンダリングされる", () => {
			const mockUser = {
				id: "user-789",
				name: "Test User",
				email: "test@test.com",
			};

			render(
				<GlobalProvider user={mockUser}>
					<div data-testid="child-component">Child Content</div>
				</GlobalProvider>,
			);

			expect(screen.getByTestId("child-component")).toBeInTheDocument();
			expect(screen.getByText("Child Content")).toBeInTheDocument();
		});
	});

	describe("異常系", () => {
		it("ユーザーがnullの場合、atomがnullに設定される", () => {
			render(
				<GlobalProvider user={null}>
					<UserConsumer />
				</GlobalProvider>,
			);

			expect(screen.getByTestId("user-id")).toHaveTextContent("null");
			expect(screen.getByTestId("user-name")).toHaveTextContent("null");
			expect(screen.getByTestId("user-email")).toHaveTextContent("null");
		});
	});
});
