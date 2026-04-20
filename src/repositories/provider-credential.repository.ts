import type { AIProviderType } from "@prisma/client";
import { prisma } from "@/src/infrastructure/orm/prisma";

export class ProviderCredentialRepository {
  async upsert(userId: string, provider: AIProviderType, apiKey: string, preferredModel?: string | null) {
    return prisma.userProviderCredential.upsert({
      where: { userId_provider: { userId, provider } },
      update: {
        apiKey,
        ...(preferredModel !== undefined ? { preferredModel: preferredModel || null } : {}),
      },
      create: { userId, provider, apiKey, preferredModel: preferredModel || null },
    });
  }

  async updateModel(userId: string, provider: AIProviderType, preferredModel: string | null) {
    return prisma.userProviderCredential.update({
      where: { userId_provider: { userId, provider } },
      data: { preferredModel: preferredModel || null },
    });
  }

  async findByUserIdAndProvider(userId: string, provider: AIProviderType) {
    return prisma.userProviderCredential.findUnique({
      where: { userId_provider: { userId, provider } },
    });
  }

  async listByUserId(userId: string) {
    return prisma.userProviderCredential.findMany({
      where: { userId },
      orderBy: { provider: "asc" },
    });
  }
}
