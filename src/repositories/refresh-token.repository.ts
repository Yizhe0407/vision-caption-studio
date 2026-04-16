import { createHash } from "node:crypto";
import { prisma } from "@/src/infrastructure/orm/prisma";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class RefreshTokenRepository {
  async create(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: tokenHash(token),
        expiresAt,
      },
    });
  }

  async revoke(token: string) {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash: tokenHash(token),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async consumeValid(token: string) {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash: tokenHash(token),
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
