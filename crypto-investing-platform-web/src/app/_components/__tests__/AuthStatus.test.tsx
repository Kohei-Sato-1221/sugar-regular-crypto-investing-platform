import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";

import { AuthStatus } from "../AuthStatus";
import { userAtom } from "~/store/user";

/**
 * テスト用のJotaiプロバイダー
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

describe("AuthStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("ログイン済みの場合、ユーザー名が表示される", () => {
			const mockUser = {
				id: "user-123",
				name: "テストユーザー",
				email: "test@example.com",
			};

			render(
				<TestProvider initialUser={mockUser}>
					<AuthStatus />
				</TestProvider>,
			);

			expect(screen.getByText(/Logged in as テストユーザー/i)).toBeInTheDocument();
		});

		it("ログイン済みでnameが空の場合、emailが表示される", () => {
			const mockUser = {
				id: "user-456",
				name: "",
				email: "test@example.com",
			};

			render(
				<TestProvider initialUser={mockUser}>
					<AuthStatus />
				</TestProvider>,
			);

			expect(screen.getByText(/Logged in as test@example.com/i)).toBeInTheDocument();
		});

		it("ログイン済みの場合、Sign outボタンが表示される", () => {
			const mockUser = {
				id: "user-789",
				name: "Test User",
				email: "test@test.com",
			};

			render(
				<TestProvider initialUser={mockUser}>
					<AuthStatus />
				</TestProvider>,
			);

			expect(screen.getByRole("button", { name: /Sign out/i })).toBeInTheDocument();
		});

		it("未ログインの場合、Sign inリンクが表示される", () => {
			render(
				<TestProvider initialUser={null}>
					<AuthStatus />
				</TestProvider>,
			);

			expect(screen.getByRole("link", { name: /Sign in/i })).toBeInTheDocument();
		});

		it("未ログインの場合、Logged inメッセージが表示されない", () => {
			render(
				<TestProvider initialUser={null}>
					<AuthStatus />
				</TestProvider>,
			);

			expect(screen.queryByText(/Logged in as/i)).not.toBeInTheDocument();
		});
	});
});

