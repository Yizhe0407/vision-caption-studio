import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { env } from "@/src/lib/env";
import { shouldUseSecureCookies } from "@/src/lib/auth-cookie";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ ok: false, error: "No refresh token." }, { status: 401 });
    }

    const tokens = await container.authController.refresh({ refreshToken });
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
      { status: 401 },
    );
  }
}
