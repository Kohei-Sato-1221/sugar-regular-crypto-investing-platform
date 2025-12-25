// Server Component - サーバー側でレンダリングされる情報を表示
// 'use client'がないのでServer Component

export function ServerInfo() {
	const serverTime = new Date().toLocaleString("ja-JP");
	const serverEnv = process.env.NODE_ENV;

	return (
		<div className="rounded-lg bg-white/5 p-4 backdrop-blur">
			<h3 className="mb-2 font-semibold text-lg">Server Info</h3>
			<div className="flex flex-col gap-1 text-sm text-gray-300">
				<p>
					<span className="font-semibold">Server Time:</span> {serverTime}
				</p>
				<p>
					<span className="font-semibold">Environment:</span> {serverEnv}
				</p>
				<p className="text-xs text-gray-400">
					This component is rendered on the server
				</p>
			</div>
		</div>
	);
}

