import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { shouldUseSecureCookies } from "@/src/lib/auth-cookie";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
      await container.authController.logout({ refreshToken });
    }

    const response = NextResponse.json({ ok: true });
    const secure = shouldUseSecureCookies(req);
    response.cookies.set("access_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: 0,
      path: "/",
    });
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: 0,
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
