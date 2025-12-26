"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		await signOut({ redirect: false });
		router.push("/public/signin");
		router.refresh();
	};

	return (
		<button
			onClick={handleSignOut}
			className="group relative flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
		>
			ログアウト
		</button>
	);
}

