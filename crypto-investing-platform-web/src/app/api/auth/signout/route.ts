import { NextResponse } from "next/server";

import { clearSession } from "~/server/auth/cognito";

export async function POST() {
	await clearSession();
	return NextResponse.json({ success: true });
}

