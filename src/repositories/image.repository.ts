import { prisma } from "@/src/infrastructure/orm/prisma";
import type { Prisma } from "@prisma/client";

export class ImageRepository {
  async findById(id: string) {
    return prisma.image.findUnique({
      where: { id },
      include: {
        captions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async findAccessibleById(id: string, userId: string) {
    return prisma.image.findFirst({
      where: {
        id,
        OR: [
          { uploadedById: userId },
          { jobs: { some: { userId } } },
        ],
      },
      include: {
        captions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.ImageCreateInput) {
    return prisma.image.create({
      data,
    });
  }

  async deleteById(id: string) {
    return prisma.image.delete({
      where: { id },
    });
  }
}
