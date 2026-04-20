import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuthUser();
    const logs = await container.aiRequestRepository.listRecent(100);
    return NextResponse.json({ ok: true, logs });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}
