"use client";

import { useAtomValue } from "jotai";
import Link from "next/link";

import { userAtom } from "~/store/user";

/**
 * 認証状態を表示するClient Component
 * Jotaiからユーザー情報を取得してログイン状態を表示
 */
export function AuthStatus() {
	const user = useAtomValue(userAtom);

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex flex-col items-center justify-center gap-4">
				<p className="text-center text-2xl text-white">
					{user && <span>Logged in as {user.name || user.email}</span>}
				</p>
				{user ? (
					<form action="/api/auth/signout" method="POST">
						<button
							className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
							type="submit"
						>
							Sign out
						</button>
					</form>
				) : (
					<Link
						className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
						href="/public/signin"
					>
						Sign in
					</Link>
				)}
			</div>
		</div>
	);
}
