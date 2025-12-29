import { UserInfo } from "./_components/UserInfo";

export default function PrivatePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 text-white">
			<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
				<div className="text-center">
					<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						Root Private Page
					</h1>
				</div>

				{/* Jotaiからユーザー情報を取得して表示 */}
				<UserInfo />
			</div>
		</main>
	);
}
