import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function PrivateLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	// 未認証の場合はログインページにリダイレクト
	if (!session) {
		redirect("/public/signin");
	}

	return <>{children}</>;
}
