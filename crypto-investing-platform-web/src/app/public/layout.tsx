/**
 * Publicレイアウト
 * 認証不要のページ用
 * 
 * 注意: Next.jsのAppRouterでは、<html>と<body>タグは
 * ルートレイアウト（src/app/layout.tsx）でのみ使用できます。
 */
export default function PublicLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <>{children}</>;
}
