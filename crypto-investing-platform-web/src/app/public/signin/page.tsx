"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { api } from "~/trpc/react";

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	// callbackUrlが/signinを含む場合は/privateにフォールバック（リダイレクトループ防止）
	const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/private";
	const callbackUrl =
		rawCallbackUrl.includes("/signin") || rawCallbackUrl.startsWith("/signin")
			? "/private"
			: rawCallbackUrl;

	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	const signInMutation = api.auth.signIn.useMutation();
	const _utils = api.useUtils();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			try {
				const result = await signInMutation.mutateAsync({
					username: formData.username,
					password: formData.password,
				});

				// パスワード変更が必要な場合
				if (result.requiresPasswordChange && result.challenge?.session) {
					const changePasswordUrl = new URL("/public/change-password", window.location.origin);
					changePasswordUrl.searchParams.set("session", result.challenge.session);
					if (result.challenge.username) {
						changePasswordUrl.searchParams.set("username", result.challenge.username);
					}
					changePasswordUrl.searchParams.set("callbackUrl", callbackUrl);
					router.push(changePasswordUrl.toString());
					return;
				}

				// ログイン成功時はcallbackUrlにリダイレクト
				router.push(callbackUrl);
				router.refresh();
			} catch (err) {
				const error = err as { message?: string };
				setError(error.message || "ログインに失敗しました。");
			}
		});
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 px-4">
			<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
				<div>
					<h2 className="mt-6 text-center font-bold text-3xl text-gray-900 tracking-tight">
						ログイン
					</h2>
					<p className="mt-2 text-center text-gray-600 text-sm">
						アカウントにサインインしてください
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<p className="font-medium text-red-800 text-sm">{error}</p>
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label className="block font-medium text-gray-700 text-sm" htmlFor="username">
								メールアドレス
							</label>
							<input
								autoComplete="email"
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								disabled={signInMutation.isPending || isPending}
								id="username"
								name="username"
								onChange={(e) => setFormData({ ...formData, username: e.target.value })}
								placeholder="email@example.com"
								required
								type="email"
								value={formData.username}
							/>
						</div>

						<div>
							<label className="block font-medium text-gray-700 text-sm" htmlFor="password">
								パスワード
							</label>
							<input
								autoComplete="current-password"
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								disabled={signInMutation.isPending || isPending}
								id="password"
								name="password"
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								required
								type="password"
								value={formData.password}
							/>
						</div>
					</div>

					<div>
						<button
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={signInMutation.isPending}
							type="submit"
						>
							{signInMutation.isPending ? "ログイン中..." : "ログイン"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
