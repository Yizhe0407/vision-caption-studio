import { NextResponse } from "next/server";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";
import { env } from "@/src/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireAuthUser();
    const formData = await req.formData();
    const providerRaw = formData.get("provider");
    const modelRaw = formData.get("model");
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "No files uploaded." }, { status: 400 });
    }

    const payloadFiles: Array<{ name: string; type: string; buffer: Buffer }> = [];
    for (const file of files) {
      if (file.size > env.MAX_UPLOAD_FILE_SIZE_BYTES) {
        throw new Error(
          `File too large: ${file.name}. Max size is ${Math.floor(env.MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024))}MB.`,
        );
      }

      payloadFiles.push({
        name: file.name,
        type: file.type || "application/octet-stream",
        buffer: Buffer.from(await file.arrayBuffer()),
      });
    }

    const result = await container.uploadController.batchUpload({
      userId: user.userId,
      provider: typeof providerRaw === "string" ? providerRaw : undefined,
      model: typeof modelRaw === "string" ? modelRaw : undefined,
      files: payloadFiles,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
