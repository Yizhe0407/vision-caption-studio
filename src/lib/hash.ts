import { createHash } from "node:crypto";

export function computeFileHashes(buffer: Buffer) {
  const md5 = createHash("md5").update(buffer).digest("hex");
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  return { md5, sha256 };
}
