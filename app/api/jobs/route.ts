import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const jobs = await container.jobController.list({ userId: user.userId });
    return NextResponse.json({ ok: true, jobs });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}
