import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { env } from "@/src/lib/env";
import { computeFileHashes } from "@/src/lib/hash";
import { extractImageMetadata } from "@/src/lib/metadata";
import { ensureMinioBucket, minioClient } from "@/src/infrastructure/storage/minio-client";
import { ImageRepository } from "@/src/repositories/image.repository";

type UploadImageInput = {
  userId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
};

export class ImageService {
  constructor(private readonly images: ImageRepository) {}

  async uploadImage(input: UploadImageInput) {
    const hashes = computeFileHashes(input.data);
    const metadata = await extractImageMetadata(input.data);
    const metadataJson = JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue;
    await ensureMinioBucket();
    const objectKey = `${hashes.sha256}-${randomUUID()}`;
    await minioClient.putObject(env.MINIO_BUCKET, objectKey, input.data, input.data.length, {
      "Content-Type": input.mimeType,
    });

    const image = await this.images.create({
      uploadedBy: { connect: { id: input.userId } },
      originalFilename: input.fileName,
      mimeType: input.mimeType,
      fileSize: BigInt(input.data.length),
      width: metadata.width,
      height: metadata.height,
      md5: hashes.md5,
      sha256: hashes.sha256,
      storageBucket: env.MINIO_BUCKET,
      storageObjectKey: objectKey,
      metadata: metadataJson,
    });

    return { image };
  }
}
