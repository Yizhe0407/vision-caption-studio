import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const keys = await container.tagKeyController.getKeys({ userId: user.userId });
    return NextResponse.json({ ok: true, keys });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuthUser();
    const payload = (await req.json()) as { key?: string };
    const entry = await container.tagKeyController.addKey({
      userId: user.userId,
      key: payload.key,
    });
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
