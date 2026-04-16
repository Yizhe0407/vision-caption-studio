import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { container } from "@/src/di/container";
import { requireAuthUser } from "@/src/infrastructure/auth/request-auth";
import { minioClient } from "@/src/infrastructure/storage/minio-client";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireAuthUser();
    const { id } = await params;
    const fullImage = await container.imageRepository.findAccessibleById(id, user.userId);
    if (!fullImage) {
      throw new Error("Image not found.");
    }

    const objectStream = await minioClient.getObject(
      fullImage.storageBucket,
      fullImage.storageObjectKey,
    );
    const webStream = Readable.toWeb(objectStream) as unknown as ReadableStream<Uint8Array>;
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": fullImage.mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
