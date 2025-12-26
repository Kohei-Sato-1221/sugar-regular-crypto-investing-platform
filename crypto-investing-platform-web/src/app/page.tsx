import Link from "next/link";

import { auth } from "~/server/auth";

export default async function Home() {
	const session = await auth();

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
					Crypto Investing Platform
				</h1>

				<div className="flex flex-col items-center justify-center gap-4">
					<p className="text-center text-2xl text-white">
						{session && <span>ログイン中: {session.user?.name}</span>}
						{!session && <span>ログインしてください</span>}
					</p>
					<Link
						className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
						href={session ? "/api/auth/signout" : "/public/signin"}
					>
						{session ? "ログアウト" : "ログイン"}
					</Link>
				</div>
			</div>
		</main>
	);
}
