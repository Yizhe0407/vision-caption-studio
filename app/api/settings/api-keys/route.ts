import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuthUser();
    const settings = await container.providerCredentialController.getSettings({ userId: user.userId });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuthUser();
    const payload = (await req.json()) as {
      provider?: string;
      apiKey?: string;
      preferredProvider?: string;
      preferredModel?: string;
      preferredPromptTemplateId?: string;
    };
    await container.providerCredentialController.updateSetting({
      userId: user.userId,
      provider: payload.provider,
      apiKey: payload.apiKey,
      preferredProvider: payload.preferredProvider,
      preferredModel: payload.preferredModel,
      preferredPromptTemplateId: payload.preferredPromptTemplateId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
