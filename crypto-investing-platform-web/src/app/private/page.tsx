import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { SignOutButton } from "./_components/sign-out-button";

export default async function PrivatePage() {
	const session = await auth();

	// 未認証の場合はログインページにリダイレクト
	if (!session) {
		redirect("/public/signin");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
			<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
				<div>
					<h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
						プライベートページ
					</h1>
					<p className="mt-2 text-center text-sm text-gray-600">
						このページは認証が必要です
					</p>
					{session.user && (
						<p className="mt-4 text-center text-sm text-gray-500">
							ログイン中: {session.user.name || session.user.email}
						</p>
					)}
				</div>
				<div className="mt-6">
					<SignOutButton />
				</div>
			</div>
		</div>
	);
}
