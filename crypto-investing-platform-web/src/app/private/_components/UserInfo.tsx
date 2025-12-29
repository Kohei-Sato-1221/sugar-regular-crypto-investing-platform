"use client";

import { useAtomValue } from "jotai";

import { userAtom } from "~/store/user";

/**
 * Jotaiからユーザー情報を取得して表示するClient Component
 * ルートレイアウトでGlobalUserProviderによりハイドレートされたデータを使用
 */
export function UserInfo() {
	const user = useAtomValue(userAtom);

	if (!user) {
		return (
			<div className="rounded-lg bg-white/10 p-6 text-center">
				<p className="text-gray-300">ユーザー情報が取得できませんでした</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg bg-white/10 p-6">
			<h2 className="mb-4 font-bold text-2xl">ユーザー情報</h2>
			<div className="space-y-2">
				<p>
					<span className="font-semibold text-gray-300">ID:</span> {user.id}
				</p>
				<p>
					<span className="font-semibold text-gray-300">Name:</span> {user.name}
				</p>
				{user.email && (
					<p>
						<span className="font-semibold text-gray-300">Email:</span> {user.email}
					</p>
				)}
			</div>
		</div>
	);
}
