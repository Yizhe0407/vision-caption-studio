import type { AIProviderType } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

export class ProviderCredentialRepository {
  async upsert(userId: string, provider: AIProviderType, apiKey: string) {
    return prisma.userProviderCredential.upsert({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      update: {
        apiKey,
      },
      create: {
        userId,
        provider,
        apiKey,
      },
    });
  }

  async findByUserIdAndProvider(userId: string, provider: AIProviderType) {
    return prisma.userProviderCredential.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
  }

  async listByUserId(userId: string) {
    return prisma.userProviderCredential.findMany({
      where: { userId },
      orderBy: { provider: "asc" },
    });
  }
}
