"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	// callbackUrlが/signinを含む場合は/privateにフォールバック（リダイレクトループ防止）
	const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/private";
	const callbackUrl =
		rawCallbackUrl.includes("/signin") || rawCallbackUrl.startsWith("/signin")
			? "/private"
			: rawCallbackUrl;
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			try {
				const response = await fetch("/api/auth/signin", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username: formData.username,
						password: formData.password,
					}),
				});

				const data = await response.json();

				console.log("Sign in response:", {
					ok: response.ok,
					status: response.status,
					data: data,
				});

				if (!response.ok) {
					setError(data.error || "ログインに失敗しました。");
					return;
				}

				// パスワード変更が必要な場合
				if (data.requiresPasswordChange && data.challenge) {
					console.log("Redirecting to change password page:", {
						session: data.challenge.session,
						username: data.challenge.username,
					});
					const changePasswordUrl = new URL("/change-password", window.location.origin);
					changePasswordUrl.searchParams.set("session", data.challenge.session);
					if (data.challenge.username) {
						changePasswordUrl.searchParams.set("username", data.challenge.username);
					}
					changePasswordUrl.searchParams.set("callbackUrl", callbackUrl);
					router.push(changePasswordUrl.toString());
					return;
				}

				// ログイン成功時はcallbackUrlにリダイレクト
				console.log("Login successful, redirecting to:", callbackUrl);
				router.push(callbackUrl);
				router.refresh();
			} catch (err) {
				setError("予期しないエラーが発生しました。");
				console.error("Sign in error:", err);
			}
		});
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 px-4">
			<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
						ログイン
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						アカウントにサインインしてください
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<p className="text-sm font-medium text-red-800">{error}</p>
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-700"
							>
								メールアドレス
							</label>
							<input
								id="username"
								name="username"
								type="email"
								autoComplete="email"
								required
								value={formData.username}
								onChange={(e) =>
									setFormData({ ...formData, username: e.target.value })
								}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								placeholder="email@example.com"
								disabled={isPending}
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								パスワード
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								disabled={isPending}
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isPending}
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isPending ? "ログイン中..." : "ログイン"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
