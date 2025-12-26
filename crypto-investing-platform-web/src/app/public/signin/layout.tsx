import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function SignInLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	// 既にログインしている場合は/privateにリダイレクト
	if (session) {
		redirect("/private");
	}

	return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}

