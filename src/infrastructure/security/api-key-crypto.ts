import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/src/lib/env";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  return createHash("sha256").update(env.API_KEY_ENCRYPTION_SECRET).digest();
}

export function encryptApiKey(raw: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(raw, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptApiKeyWithFlag(payload: string) {
  try {
    const data = Buffer.from(payload, "base64");
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    return {
      value: Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8"),
      encrypted: true,
    };
  } catch {
    return {
      value: payload,
      encrypted: false,
    };
  }
}

export function decryptApiKey(payload: string) {
  return decryptApiKeyWithFlag(payload).value;
}
