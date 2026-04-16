import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuthUser();
    const templates = await container.promptTemplateController.list();
    return NextResponse.json({ ok: true, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = /unauthorized/i.test(message) ? 401 : /forbidden/i.test(message) ? 403 : 400;
    return NextResponse.json(
      { ok: false, error: message },
      { status },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAuthUser();
    const body = (await req.json()) as { baseTemplateId?: string; content?: string; mode?: "blank" | "copy" };
    const template = await container.promptTemplateController.create({
      baseTemplateId: body.baseTemplateId,
      content: body.content,
      mode: body.mode,
    });
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = /unauthorized/i.test(message) ? 401 : /forbidden/i.test(message) ? 403 : 400;
    return NextResponse.json(
      { ok: false, error: message },
      { status },
    );
  }
}
