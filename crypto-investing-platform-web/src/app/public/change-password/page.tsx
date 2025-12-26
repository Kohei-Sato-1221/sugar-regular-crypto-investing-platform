"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function ChangePasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const session = searchParams.get("session");
	const username = searchParams.get("username");
	const callbackUrl = searchParams.get("callbackUrl") ?? "/private";

	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		newPassword: "",
		confirmPassword: "",
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		// パスワードの一致確認
		if (formData.newPassword !== formData.confirmPassword) {
			setError("新しいパスワードと確認用パスワードが一致しません。");
			return;
		}

		// パスワードの長さチェック
		if (formData.newPassword.length < 8) {
			setError("パスワードは8文字以上である必要があります。");
			return;
		}

		if (!session) {
			setError("セッション情報が無効です。再度ログインしてください。");
			return;
		}

		startTransition(async () => {
			try {
				const response = await fetch("/api/auth/change-password", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						session: session,
						newPassword: formData.newPassword,
						username: username,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					setError(data.error || "パスワード変更に失敗しました。");
					return;
				}

				// パスワード変更成功時はcallbackUrlにリダイレクト
				router.push(callbackUrl);
				router.refresh();
			} catch (err) {
				setError("予期しないエラーが発生しました。");
				console.error("Change password error:", err);
			}
		});
	};

	if (!session) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 px-4">
				<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
					<div>
						<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
							エラー
						</h2>
						<p className="mt-2 text-center text-sm text-gray-600">
							セッション情報が無効です。再度ログインしてください。
						</p>
					</div>
					<div>
						<button
							onClick={() => router.push("/public/signin")}
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							ログイン画面に戻る
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 px-4">
			<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
						パスワード変更
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						初回ログインのため、新しいパスワードを設定してください
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
								htmlFor="newPassword"
								className="block text-sm font-medium text-gray-700"
							>
								新しいパスワード
							</label>
							<input
								id="newPassword"
								name="newPassword"
								type="password"
								autoComplete="new-password"
								required
								value={formData.newPassword}
								onChange={(e) =>
									setFormData({ ...formData, newPassword: e.target.value })
								}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								placeholder="8文字以上"
								disabled={isPending}
								minLength={8}
							/>
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-gray-700"
							>
								新しいパスワード（確認）
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								required
								value={formData.confirmPassword}
								onChange={(e) =>
									setFormData({ ...formData, confirmPassword: e.target.value })
								}
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								placeholder="同じパスワードを入力"
								disabled={isPending}
								minLength={8}
							/>
						</div>
					</div>

					<div className="text-xs text-gray-500">
						<p>パスワード要件:</p>
						<ul className="list-disc list-inside mt-1 space-y-1">
							<li>8文字以上</li>
							<li>大文字、小文字、数字、記号を含むことを推奨</li>
						</ul>
					</div>

					<div>
						<button
							type="submit"
							disabled={isPending}
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isPending ? "パスワード変更中..." : "パスワードを変更"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

