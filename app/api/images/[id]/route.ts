import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const image = await container.imageController.detail({ id, userId: user.userId });
    return NextResponse.json({ ok: true, image });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const payload = (await req.json()) as { caption?: string; tags?: string[] };
    await container.imageController.updateManual({
      id,
      userId: user.userId,
      caption: payload.caption,
      tags: payload.tags ?? [],
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    await container.imageController.remove({ id, userId: user.userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
