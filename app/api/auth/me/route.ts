import { NextResponse } from "next/server";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthUser();
    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}
