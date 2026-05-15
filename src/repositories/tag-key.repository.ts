import { prisma } from "@/src/infrastructure/orm/prisma";

export class TagKeyRepository {
  async listByUser(userId: string) {
    return prisma.userTagKey.findMany({
      where: { userId },
      orderBy: { key: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.userTagKey.findUnique({ where: { id } });
  }

  async create(userId: string, key: string, isDefault = false) {
    return prisma.userTagKey.create({
      data: { userId, key: key.trim().toLowerCase(), isDefault },
    });
  }

  async delete(id: string) {
    return prisma.userTagKey.delete({ where: { id } });
  }

  async countByUser(userId: string) {
    return prisma.userTagKey.count({ where: { userId } });
  }

  async getKeysForUser(userId: string): Promise<string[]> {
    const rows = await this.listByUser(userId);
    return rows.map((r) => r.key);
  }
}
