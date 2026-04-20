import { prisma } from "@/src/infrastructure/orm/prisma";
import { Prisma } from "@prisma/client";
import type { AIProviderType, UserRole } from "@prisma/client";

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findPublicById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(email: string, passwordHash: string) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
  }

  async createWithRole(email: string, passwordHash: string, role: UserRole) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
      },
    });
  }

  async createWithAutoRole(email: string, passwordHash: string, defaultTemplateContent: string) {
    return prisma.$transaction(
      async (tx) => {
        const userCount = await tx.user.count();
        const role: UserRole = userCount === 0 ? "ADMIN" : "USER";

        return tx.user.create({
          data: {
            email,
            passwordHash,
            role,
            ownedPromptTemplates: {
              create: {
                name: "default-caption",
                version: 1,
                taskType: "CAPTION",
                content: defaultTemplateContent,
                isActive: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async countAll() {
    return prisma.user.count();
  }

  async countByRole(role: UserRole) {
    return prisma.user.count({ where: { role } });
  }

  async listAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: "asc" }, { email: "asc" }],
    });
  }

  async updateRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePreferredProvider(userId: string, provider: AIProviderType) {
    return prisma.user.update({
      where: { id: userId },
      data: { preferredProvider: provider },
    });
  }

  async updatePreferences(
    userId: string,
    input: {
      preferredProvider: AIProviderType;
      preferredPromptTemplateId?: string;
    },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        preferredProvider: input.preferredProvider,
        preferredPromptTemplateId: input.preferredPromptTemplateId ?? null,
      },
    });
  }
}
