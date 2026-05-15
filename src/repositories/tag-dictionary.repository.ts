import { prisma } from "@/src/infrastructure/orm/prisma";

export class TagDictionaryRepository {
  async listByUser(userId: string) {
    return prisma.userTagDictionaryEntry.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { value: "asc" }],
    });
  }

  async findById(id: string) {
    return prisma.userTagDictionaryEntry.findUnique({ where: { id } });
  }

  async create(userId: string, category: string, value: string, isDefault = false) {
    return prisma.userTagDictionaryEntry.create({
      data: { userId, category, value: value.trim().toLowerCase(), isDefault },
    });
  }

  async delete(id: string) {
    return prisma.userTagDictionaryEntry.delete({ where: { id } });
  }

  async countByUser(userId: string) {
    return prisma.userTagDictionaryEntry.count({ where: { userId } });
  }
}
