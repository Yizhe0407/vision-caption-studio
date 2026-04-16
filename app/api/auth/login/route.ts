import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { env } from "@/src/lib/env";
import { shouldUseSecureCookies } from "@/src/lib/auth-cookie";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const tokens = await container.authController.login(payload);
    const response = NextResponse.json({ ok: true });
    const secure = shouldUseSecureCookies(req);
    response.cookies.set("access_token", tokens.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: env.JWT_ACCESS_EXPIRES_IN_SEC,
      path: "/",
    });
    response.cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: env.JWT_REFRESH_EXPIRES_IN_SEC,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
