"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export default function ChangePasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const session = searchParams.get("session");
	const username = searchParams.get("username");
	const callbackUrl = searchParams.get("callbackUrl") ?? "/private";

	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		newPassword: "",
		confirmPassword: "",
	});

	const changePasswordMutation = api.auth.changePassword.useMutation({
		onSuccess: () => {
			// パスワード変更成功時はcallbackUrlにリダイレクト
			router.push(callbackUrl);
			router.refresh();
		},
		onError: (error) => {
			setError(error.message || "パスワード変更に失敗しました。");
		},
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

		changePasswordMutation.mutate({
			session: session,
			newPassword: formData.newPassword,
			username: username ?? undefined,
		});
	};

	if (!session) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 px-4">
				<div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
					<div>
						<h2 className="mt-6 text-center font-bold text-3xl text-gray-900 tracking-tight">
							エラー
						</h2>
						<p className="mt-2 text-center text-gray-600 text-sm">
							セッション情報が無効です。再度ログインしてください。
						</p>
					</div>
					<div>
						<button
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							onClick={() => router.push("/public/signin")}
							type="button"
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
					<h2 className="mt-6 text-center font-bold text-3xl text-gray-900 tracking-tight">
						パスワード変更
					</h2>
					<p className="mt-2 text-center text-gray-600 text-sm">
						初回ログインのため、新しいパスワードを設定してください
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
							<label className="block font-medium text-gray-700 text-sm" htmlFor="newPassword">
								新しいパスワード
							</label>
							<input
								autoComplete="new-password"
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								disabled={changePasswordMutation.isPending}
								id="newPassword"
								minLength={8}
								name="newPassword"
								onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
								placeholder="8文字以上"
								required
								type="password"
								value={formData.newPassword}
							/>
						</div>

						<div>
							<label className="block font-medium text-gray-700 text-sm" htmlFor="confirmPassword">
								新しいパスワード（確認）
							</label>
							<input
								autoComplete="new-password"
								className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
								disabled={changePasswordMutation.isPending}
								id="confirmPassword"
								minLength={8}
								name="confirmPassword"
								onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
								placeholder="同じパスワードを入力"
								required
								type="password"
								value={formData.confirmPassword}
							/>
						</div>
					</div>

					<div className="text-gray-500 text-xs">
						<p>パスワード要件:</p>
						<ul className="mt-1 list-inside list-disc space-y-1">
							<li>8文字以上</li>
							<li>大文字、小文字、数字、記号を含むことを推奨</li>
						</ul>
					</div>

					<div>
						<button
							className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={changePasswordMutation.isPending}
							type="submit"
						>
							{changePasswordMutation.isPending ? "パスワード変更中..." : "パスワードを変更"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
