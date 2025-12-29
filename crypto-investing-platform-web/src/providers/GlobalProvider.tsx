"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";

import { type User, userAtom } from "~/store/user";

type Props = {
	user: User;
	children: ReactNode;
};

/**
 * Jotaiにユーザー情報をハイドレートする内部コンポーネント
 */
function HydrateAtoms({ user, children }: Props) {
	// デバッグログ（開発環境のみ）
	if (process.env.NODE_ENV === "development") {
		console.log("[GlobalProvider] Hydrating user:", JSON.stringify(user, null, 2));
	}

	useHydrateAtoms([[userAtom, user]]);
	return <>{children}</>;
}

/**
 * グローバルプロバイダー
 * アプリ全体でJotaiの状態管理を有効にし、ユーザー情報をハイドレートする
 */
export function GlobalProvider({ user, children }: Props) {
	return (
		<Provider>
			<HydrateAtoms user={user}>{children}</HydrateAtoms>
		</Provider>
	);
}
