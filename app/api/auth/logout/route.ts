import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { container } from "@/src/di/container";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
      await container.authController.logout({ refreshToken });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
