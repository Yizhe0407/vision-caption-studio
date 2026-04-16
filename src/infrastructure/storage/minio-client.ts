import { Client } from "minio";
import { env } from "@/src/lib/env";

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

let bucketReadyPromise: Promise<void> | undefined;

export async function ensureMinioBucket() {
  if (!bucketReadyPromise) {
    bucketReadyPromise = (async () => {
      const exists = await minioClient.bucketExists(env.MINIO_BUCKET);
      if (!exists) {
        await minioClient.makeBucket(env.MINIO_BUCKET);
      }
    })();
  }

  await bucketReadyPromise;
}
