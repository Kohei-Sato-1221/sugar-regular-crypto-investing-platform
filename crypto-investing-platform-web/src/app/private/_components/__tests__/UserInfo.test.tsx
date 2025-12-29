import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { userAtom } from "~/store/user";
import { UserInfo } from "../UserInfo";

/**
 * テスト用のJotaiプロバイダー
 * atomに初期値を設定してレンダリング
 */
function TestProvider({
	children,
	initialUser,
}: {
	children: ReactNode;
	initialUser: { id: string; name: string; email: string | null } | null;
}) {
	return (
		<Provider>
			<HydrateAtoms initialUser={initialUser}>{children}</HydrateAtoms>
		</Provider>
	);
}

function HydrateAtoms({
	children,
	initialUser,
}: {
	children: ReactNode;
	initialUser: { id: string; name: string; email: string | null } | null;
}) {
	useHydrateAtoms([[userAtom, initialUser]]);
	return <>{children}</>;
}

describe("UserInfo", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("ユーザー情報が表示される", () => {
			const mockUser = {
				id: "user-123",
				name: "テストユーザー",
				email: "test@example.com",
			};

			render(
				<TestProvider initialUser={mockUser}>
					<UserInfo />
				</TestProvider>,
			);

			expect(screen.getByText("ユーザー情報")).toBeInTheDocument();
			expect(screen.getByText("user-123")).toBeInTheDocument();
			expect(screen.getByText("テストユーザー")).toBeInTheDocument();
			expect(screen.getByText("test@example.com")).toBeInTheDocument();
		});

		it("メールアドレスがnullの場合、メール欄が表示されない", () => {
			const mockUser = {
				id: "user-456",
				name: "メールなしユーザー",
				email: null,
			};

			render(
				<TestProvider initialUser={mockUser}>
					<UserInfo />
				</TestProvider>,
			);

			expect(screen.getByText("user-456")).toBeInTheDocument();
			expect(screen.getByText("メールなしユーザー")).toBeInTheDocument();
			// Email: というラベルが表示されないことを確認
			expect(screen.queryByText("Email:")).not.toBeInTheDocument();
		});

		it("IDラベルが正しく表示される", () => {
			const mockUser = {
				id: "test-id",
				name: "Test",
				email: null,
			};

			render(
				<TestProvider initialUser={mockUser}>
					<UserInfo />
				</TestProvider>,
			);

			expect(screen.getByText("ID:")).toBeInTheDocument();
		});

		it("Nameラベルが正しく表示される", () => {
			const mockUser = {
				id: "test-id",
				name: "Test Name",
				email: null,
			};

			render(
				<TestProvider initialUser={mockUser}>
					<UserInfo />
				</TestProvider>,
			);

			expect(screen.getByText("Name:")).toBeInTheDocument();
		});
	});

	describe("異常系", () => {
		it("ユーザー情報がnullの場合、エラーメッセージが表示される", () => {
			render(
				<TestProvider initialUser={null}>
					<UserInfo />
				</TestProvider>,
			);

			expect(screen.getByText("ユーザー情報が取得できませんでした")).toBeInTheDocument();
		});
	});
});
