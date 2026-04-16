import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuthUser();
    const body = (await req.json()) as { name?: string; content?: string };
    const { id } = await params;
    const template = await container.promptTemplateController.update(
      { id, name: body.name, content: body.content },
      userId,
    );
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = /unauthorized/i.test(message) ? 401 : /forbidden/i.test(message) ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { userId } = await requireAuthUser();
    const { id } = await params;
    await container.promptTemplateController.remove({ id }, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = /unauthorized/i.test(message) ? 401 : /forbidden/i.test(message) ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
